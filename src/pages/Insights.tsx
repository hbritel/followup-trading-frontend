import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PlanGatedSection from '@/components/subscription/PlanGatedSection';
import PageTransition from '@/components/ui/page-transition';
import PerformanceMetrics from '@/components/insights/PerformanceMetrics';
import KpiStrip from '@/components/insights/KpiStrip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PageSkeleton from '@/components/ui/page-skeleton';
import PageError from '@/components/ui/page-error';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  X, TrendingUp, AlertTriangle, Target, Award, BarChart3,
  Sparkles, ExternalLink, Loader2, ChevronLeft, ChevronRight, History,
  Calendar, Plus, CheckCircle2, ArrowLeft, Zap,
} from 'lucide-react';
import { useInsights, useDismissInsight } from '@/hooks/useInsights';
import { useWeeklyDigest, useGenerateWeeklyDigest, useDigestHistory } from '@/hooks/useWeeklyDigest';
import { useToast } from '@/hooks/use-toast';
import { useDefaultDatePreset } from '@/hooks/useDefaultDatePreset';
import { usePageFilter } from '@/contexts/page-filters-context';
import DashboardDateFilter, { computeDateRange } from '@/components/dashboard/DashboardDateFilter';
import AccountSelector from '@/components/dashboard/AccountSelector';
import { useAccountFilter } from '@/hooks/useAccountFilter';
import type { InsightResponseDto, InsightType, InsightSeverity } from '@/types/dto';

// ---- P0 FIX: Normalize single-line digest content ----
// Some LLMs generate everything on one line. This inserts \n before
// numbered headings, markdown headings, and bullet markers so the
// line-based parser can work.

const normalizeDigestContent = (raw: string): string => {
  if (!raw) return raw;
  // If the content already has multiple lines, leave it alone
  const lineCount = raw.split('\n').filter((l) => l.trim().length > 0).length;
  if (lineCount > 3) return raw;

  let text = raw;
  // Insert \n before numbered headings: "1. Title", "2. Title" etc.
  text = text.replace(/([.!?:*])\s+(\d+\.\s+[A-ZÀ-Ü])/g, '$1\n\n$2');
  // Insert \n before markdown headings: "## Title", "# Title"
  text = text.replace(/([.!?:*])\s+(#{1,3}\s+)/g, '$1\n\n$2');
  // Insert \n before bullet markers: "* Item" or "- Item" (but not inside words like "re-")
  text = text.replace(/([.!?:*])\s+([*\-•]\s+\*?\*?[A-ZÀ-Ü])/g, '$1\n$2');
  // Insert \n before "**Bold Title :" patterns that start a new conceptual item
  text = text.replace(/([.!?])\s+(\*\*[A-ZÀ-Ü])/g, '$1\n$2');
  // Insert \n before "---"
  text = text.replace(/\s+(---)\s+/g, '\n\n$1\n');

  return text;
};

// ---- Minimal markdown renderer ----

const parseInline = (text: string, keyPrefix: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<React.Fragment key={`${keyPrefix}-t-${lastIndex}`}>{text.slice(lastIndex, match.index)}</React.Fragment>);
    }
    if (match[2] !== undefined) {
      parts.push(<strong key={`${keyPrefix}-b-${match.index}`} className="font-semibold text-foreground/90">{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      parts.push(<em key={`${keyPrefix}-i-${match.index}`} className="italic">{match[3]}</em>);
    } else if (match[4] !== undefined) {
      parts.push(<code key={`${keyPrefix}-c-${match.index}`} className="rounded bg-foreground/[0.08] dark:bg-white/[0.12] px-1.5 py-0.5 font-mono text-xs">{match[4]}</code>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<React.Fragment key={`${keyPrefix}-te`}>{text.slice(lastIndex)}</React.Fragment>);
  }
  return parts;
};

const renderMarkdown = (text: string | null | undefined): React.ReactNode[] => {
  if (!text) return [];
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  lines.forEach((line, idx) => {
    const isBullet = /^[\s]*[-*•]\s/.test(line);
    const isHeading = /^#{1,6}\s/.test(line);
    const headingLevel = isHeading ? (line.match(/^(#+)/)?.[1].length ?? 1) : 0;
    let content = line;
    if (isBullet) content = line.replace(/^[\s]*[-*•]\s/, '');
    else if (isHeading) content = line.replace(/^#{1,6}\s/, '');
    const inline = parseInline(content, `md-${idx}`);
    if (isBullet) {
      nodes.push(<li key={`li-${idx}`} className="ml-4 list-disc text-sm leading-relaxed">{inline}</li>);
    } else if (isHeading && headingLevel <= 2) {
      nodes.push(<p key={`h-${idx}`} className="font-bold text-base mt-3 mb-1 text-foreground">{inline}</p>);
    } else if (isHeading) {
      nodes.push(<p key={`h-${idx}`} className="font-semibold text-sm mt-2 mb-0.5 text-foreground">{inline}</p>);
    } else if (line.trim() === '') {
      nodes.push(<div key={`br-${idx}`} className="h-2" />);
    } else {
      nodes.push(<span key={`s-${idx}`} className="text-sm leading-relaxed">{inline}</span>);
      if (idx < lines.length - 1) nodes.push(<br key={`bra-${idx}`} />);
    }
  });
  return nodes;
};

// ---- Digest section parser ----

interface DigestSection {
  title: string;
  rawLines: string[];
  type: 'metrics' | 'warning' | 'success' | 'neutral';
}

const classifySection = (title: string): DigestSection['type'] => {
  const lower = title.toLowerCase();
  if (lower.includes('clé') || lower.includes('key') || lower.includes('métrique') || lower.includes('metric') || lower.includes('performance')) {
    return 'metrics';
  }
  if (lower.includes('amélioration') || lower.includes('improvement') || lower.includes('action') || lower.includes('risque') || lower.includes('risk') || lower.includes('déséquilibre') || lower.includes('gestion') || lower.includes('tendance') || lower.includes('trend') || lower.includes('analyse')) {
    return 'warning';
  }
  if (lower.includes('force') || lower.includes('strength') || lower.includes('consolider') || lower.includes('positif') || lower.includes('positive')) {
    return 'success';
  }
  return 'neutral';
};

const parseDigestSections = (content: string): { sections: DigestSection[]; disclaimer: string | null; preamble: string | null } => {
  // P0: normalize before parsing
  const normalized = normalizeDigestContent(content);
  if (!normalized) return { sections: [], disclaimer: null, preamble: null };

  const lines = normalized.split('\n');
  const sections: DigestSection[] = [];
  let currentSection: DigestSection | null = null;
  let disclaimer: string | null = null;
  const preambleLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip visual separators (---) — they are used between preamble and body,
    // NOT only as disclaimer markers. Only treat as disclaimer if it's the
    // LAST --- in the content (after all sections).
    if (trimmed === '---') {
      continue;
    }

    // Detect disclaimer: italic text starting with known patterns at the end
    if (trimmed && (
      trimmed.startsWith('*This analysis') || trimmed.startsWith('_This analysis') ||
      trimmed.startsWith('*This is based') || trimmed.startsWith('*Les analyses') ||
      trimmed.startsWith('*Cette analyse') || trimmed.startsWith('*AI-generated') ||
      trimmed.startsWith('_AI-generated')
    )) {
      disclaimer = trimmed.replace(/^\*+|\*+$/g, '').replace(/^_+|_+$/g, '').trim();
      continue;
    }

    // Detect section headings:
    // - Numbered: "1. Title" or "#### 1. Title" — but NOT sub-items like "1. **Bold item:**"
    // - Markdown: "## Title", "### Title", "#### Title"
    // Strip leading # from lines like "#### 1. Points Clés"
    const stripped = trimmed.replace(/^#{1,6}\s+/, '');
    const numberedMatch = stripped.match(/^(\d+)\.\s+(.+)/);

    // A numbered line is a section heading ONLY if:
    //  - The text after the number starts with a plain letter (not **bold**)
    //  - OR it came from a markdown heading (#### 1. Title)
    const isNumberedHeading = numberedMatch &&
      (stripped !== trimmed || /^\d+\.\s+[A-ZÀ-Ü]/.test(stripped)) &&
      !numberedMatch[2].startsWith('**');

    const headingMatch = !isNumberedHeading ? trimmed.match(/^(#{1,6})\s+(.+)/) : null;

    if (isNumberedHeading || headingMatch) {
      const title = isNumberedHeading ? numberedMatch![2] : headingMatch![2];
      currentSection = { title, rawLines: [], type: classifySection(title) };
      sections.push(currentSection);
      continue;
    }

    if (!currentSection) {
      if (trimmed) preambleLines.push(trimmed);
      continue;
    }

    currentSection.rawLines.push(line);
  }

  for (const s of sections) {
    while (s.rawLines.length > 0 && s.rawLines.at(-1)!.trim() === '') {
      s.rawLines.pop();
    }
  }

  return {
    sections,
    disclaimer,
    preamble: preambleLines.length > 0 ? preambleLines.join('\n') : null,
  };
};

// ---- Section visual helpers ----

const sectionIcon = (type: DigestSection['type']) => {
  switch (type) {
    case 'metrics': return <BarChart3 className="h-4 w-4 text-sky-400" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    case 'success': return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    default: return <TrendingUp className="h-4 w-4 text-slate-400" />;
  }
};

const sectionBg = (type: DigestSection['type']) => {
  switch (type) {
    case 'metrics': return 'bg-sky-500/5 dark:bg-sky-400/5';
    case 'warning': return 'bg-amber-500/5 dark:bg-amber-400/5';
    case 'success': return 'bg-emerald-500/5 dark:bg-emerald-400/5';
    default: return 'bg-slate-500/5 dark:bg-slate-400/5';
  }
};

// ---- Insight card config (P3: simplified — icon encodes type, color encodes severity) ----

const insightTypeConfig: Record<InsightType, { icon: React.ElementType; badgeClass: string }> = {
  PATTERN: { icon: BarChart3, badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  STREAK: { icon: TrendingUp, badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  RISK_WARNING: { icon: AlertTriangle, badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  IMPROVEMENT: { icon: Target, badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  MILESTONE: { icon: Award, badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  AI_DIGEST: { icon: Sparkles, badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
};

// P3: severity encoded by card border color instead of separate badge
const severityBorder: Record<InsightSeverity, string> = {
  INFO: '',
  WARNING: 'border-amber-500/30 dark:border-amber-400/20',
  CRITICAL: 'border-red-500/40 dark:border-red-500/30',
};

const severityOverlay: Record<InsightSeverity, string | null> = {
  INFO: null,
  WARNING: null,
  CRITICAL: 'bg-red-500/5',
};

const insightTypeLabel = (type: InsightType, t: (key: string, opts?: Record<string, string>) => string): string => {
  const labelMap: Record<InsightType, string> = {
    PATTERN: t('insights.pattern'),
    STREAK: t('insights.streak'),
    RISK_WARNING: t('insights.riskWarning'),
    IMPROVEMENT: t('insights.improvement'),
    MILESTONE: t('insights.milestone'),
    AI_DIGEST: t('ai.digest', { defaultValue: 'AI Digest' }),
  };
  return labelMap[type] ?? type;
};

const isWeeklyDigest = (d: { weekStart: string; weekEnd: string }): boolean => {
  const start = new Date(d.weekStart);
  const end = new Date(d.weekEnd);
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 5 && diffDays <= 8;
};

type DigestData = { id: string; content: string; weekStart: string; weekEnd: string; generatedAt: string };

// ---- Insights page ----

const Insights = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: insights, isLoading, isError: insightsError, refetch: refetchInsights } = useInsights();
  const dismissInsight = useDismissInsight();
  const { toast } = useToast();
  const { data: digest, isLoading: digestLoading, isError: digestError } = useWeeklyDigest();
  const generateDigest = useGenerateWeeklyDigest();

  const [showHistory, setShowHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const HISTORY_PAGE_SIZE = 5;
  const { data: digestHistory, isLoading: historyLoading } = useDigestHistory(historyPage, HISTORY_PAGE_SIZE);

  const [selectedHistoryDigest, setSelectedHistoryDigest] = useState<DigestData | null>(null);

  const [selectedAccountId, setSelectedAccountId] = usePageFilter('insights', 'accountId', 'all');
  const { accountIds } = useAccountFilter(selectedAccountId);
  const [datePreset, setDatePreset] = useDefaultDatePreset('insights');
  const [customStart, setCustomStart] = usePageFilter<Date | null>('insights', 'customStart', null);
  const [customEnd, setCustomEnd] = usePageFilter<Date | null>('insights', 'customEnd', null);

  const resolvedAccountId = selectedAccountId && selectedAccountId !== 'all' && selectedAccountId !== 'all-real' && selectedAccountId !== 'all-demo'
    ? selectedAccountId
    : undefined;

  const toISODate = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const { startDate, endDate } = useMemo(() => {
    if (datePreset === 'custom') {
      return {
        startDate: customStart ? toISODate(customStart) : undefined,
        endDate: customEnd ? toISODate(customEnd) : undefined,
      };
    }
    return computeDateRange(datePreset);
  }, [datePreset, customStart, customEnd]);

  // Filter out AI_DIGEST from insight cards (shown in digest section)
  const activeInsights = useMemo(
    () => insights?.filter((i) => !i.dismissed && i.type !== 'AI_DIGEST') ?? [],
    [insights],
  );

  const handleDismiss = (id: string) => {
    dismissInsight.mutate(id, {
      onError: () => {
        toast({ title: t('common.error'), description: t('insights.dismissFailed'), variant: 'destructive' });
      },
    });
  };

  const handleGenerateDigest = () => {
    setSelectedHistoryDigest(null);
    generateDigest.mutate({ accountId: resolvedAccountId, startDate, endDate });
  };

  const handleViewRelatedTrades = (tradeIds: string[]) => {
    navigate('/trades', { state: { filterTradeIds: tradeIds } });
  };

  const displayedDigest: DigestData | null = selectedHistoryDigest ?? digest ?? null;

  // ---- Structured digest rendering ----

  const renderStructuredDigest = (d: DigestData) => {
    const { sections, disclaimer, preamble } = parseDigestSections(d.content);

    if (sections.length === 0) {
      return (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground leading-relaxed">
            {renderMarkdown(preamble || d.content)}
          </div>
          {disclaimer && (
            <p className="text-xs text-muted-foreground/40 italic pt-1">
              {t('ai.disclaimer', { defaultValue: disclaimer })}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {preamble && (
          <p className="text-xs text-muted-foreground/70 font-medium">{preamble}</p>
        )}

        {sections.map((section, idx) => (
          <div key={idx} className={`rounded-xl p-4 ${sectionBg(section.type)}`}>
            <div className="flex items-center gap-2 mb-2">
              {sectionIcon(section.type)}
              <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed">
              {renderMarkdown(section.rawLines.join('\n'))}
            </div>
          </div>
        ))}

        {disclaimer && (
          <p className="text-xs text-muted-foreground/40 italic pt-1">
            {t('ai.disclaimer', { defaultValue: disclaimer })}
          </p>
        )}
      </div>
    );
  };

  // ---- Digest main card ----

  const renderDigestMainCard = (d: DigestData, isFromHistory = false) => {
    const weekly = isWeeklyDigest(d);

    return (
      <div className="space-y-2">
        {isFromHistory && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedHistoryDigest(null)}
            className="gap-1.5 text-muted-foreground -ml-2 h-8"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('ai.latestAnalysis')}
          </Button>
        )}

        <Card
          className={`glass-card rounded-2xl transition-all duration-500 ${isFromHistory ? '' : 'animate-in fade-in-0 slide-in-from-bottom-3 zoom-in-[0.97]'}`}
          style={isFromHistory ? undefined : { animationDuration: '600ms', animationFillMode: 'both' }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${weekly ? 'bg-amber-500/10' : 'bg-sky-500/10'}`}>
                  {weekly
                    ? <Sparkles className="h-4 w-4 text-amber-400" />
                    : <BarChart3 className="h-4 w-4 text-sky-400" />
                  }
                </div>
                <div>
                  <CardTitle className="text-base text-foreground">
                    {weekly ? t('ai.digest') : t('ai.digestOnDemand')}
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal mt-0.5">
                    {weekly ? t('ai.historyWeekly') : t('ai.historyOnDemand')}
                  </Badge>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground font-mono tabular-nums space-y-0.5">
                <div className="flex items-center gap-1.5 justify-end">
                  <Calendar className="h-3 w-3" />
                  {new Date(d.weekStart).toLocaleDateString()} &ndash; {new Date(d.weekEnd).toLocaleDateString()}
                </div>
                <div>
                  {t('ai.generatedLabel')} : {new Date(d.generatedAt).toLocaleDateString()} {new Date(d.generatedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-5">
            {renderStructuredDigest(d)}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ---- Right sidebar ----

  const historyCount = digestHistory?.length ?? 0;

  const renderGeneratePanel = () => (
    <div className="space-y-4">
      <Card className="glass-card rounded-2xl">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('ai.generateNewAnalysis')}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('ai.digestDescription')}
            {(resolvedAccountId || startDate) && (
              <span className="block mt-1 text-amber-500 font-medium text-[11px]">
                {resolvedAccountId ? t('ai.filteredByAccount') : ''}{resolvedAccountId && startDate ? ' · ' : ''}{startDate ? t('ai.filteredByDate') : ''}
              </span>
            )}
          </p>
          <Button
            onClick={handleGenerateDigest}
            disabled={generateDigest.isPending || digestError}
            size="sm"
            className="w-full gap-2"
          >
            {generateDigest.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {t('ai.generateDigest')}
          </Button>
        </CardContent>
      </Card>

      {(digest || historyCount > 0) && (
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 space-y-3">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="flex items-center justify-between w-full"
            >
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <History className="h-4 w-4" />
                {t('ai.previousDigests')}
                {/* P2: show count badge for discoverability */}
                {historyCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-0.5">
                    {historyCount}
                  </Badge>
                )}
              </h3>
              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showHistory ? 'rotate-90' : ''}`} />
            </button>

            {showHistory && (
              <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                {historyLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-muted/30 space-y-1.5">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    ))}
                  </div>
                ) : digestHistory && digestHistory.length > 0 ? (
                  <>
                    {digestHistory.map((d) => {
                      const weekly = isWeeklyDigest(d);
                      const isActive = selectedHistoryDigest?.id === d.id;
                      return (
                        <button
                          key={d.id}
                          onClick={() => setSelectedHistoryDigest(d)}
                          className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-primary/10 ring-1 ring-primary/30'
                              : 'bg-muted/30 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            {weekly
                              ? <Sparkles className="h-3 w-3 text-amber-400" />
                              : <BarChart3 className="h-3 w-3 text-sky-400" />
                            }
                            <span className="text-xs font-medium text-foreground">
                              {weekly ? t('ai.historyWeekly') : t('ai.historyOnDemand')}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono tabular-nums">
                            {new Date(d.weekStart).toLocaleDateString()} &ndash; {new Date(d.weekEnd).toLocaleDateString()}
                          </p>
                          <p className="text-[11px] text-muted-foreground/60 mt-0.5 line-clamp-2">
                            {d.content.replace(/[#*_]/g, '').slice(0, 100)}...
                          </p>
                        </button>
                      );
                    })}
                    <div className="flex items-center justify-center gap-1 pt-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6"
                        onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                        disabled={historyPage === 0 || historyLoading}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-[11px] text-muted-foreground tabular-nums px-1">
                        {historyPage + 1}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6"
                        onClick={() => setHistoryPage((p) => p + 1)}
                        disabled={!digestHistory || digestHistory.length < HISTORY_PAGE_SIZE || historyLoading}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    {t('ai.noPreviousDigests')}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  // ---- Digest content area ----

  const renderDigestContent = () => {
    if (digestError) {
      return (
        <div className="text-center py-10">
          <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-muted-foreground mb-1">{t('ai.unavailable')}</h3>
          <p className="text-xs text-muted-foreground/70">{t('ai.unavailableDescription')}</p>
        </div>
      );
    }

    if (generateDigest.isPending) {
      return (
        <Card className="glass-card rounded-2xl overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <Sparkles className="h-6 w-6 text-amber-400 animate-pulse" />
                <div className="absolute inset-0 animate-ping">
                  <Sparkles className="h-6 w-6 text-amber-400/30" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground animate-pulse">{t('ai.generating')}</p>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400/60" />
              <span className="text-xs text-muted-foreground/60">{t('ai.generatingHint')}</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (digestLoading) {
      return (
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      );
    }

    if (displayedDigest) {
      return renderDigestMainCard(displayedDigest, selectedHistoryDigest !== null);
    }

    return (
      <div className="text-center py-16">
        <Sparkles className="h-12 w-12 text-amber-400/30 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-1">{t('ai.noDigest')}</h3>
        <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">{t('ai.noDigestDescription')}</p>
        <Button onClick={handleGenerateDigest} disabled={generateDigest.isPending} className="gap-2">
          <Sparkles className="h-4 w-4" />
          {t('ai.generateDigest')}
        </Button>
      </div>
    );
  };

  // ---- Insight cards (P3: simplified badges) ----

  const renderInsightCard = (insight: InsightResponseDto) => {
    const config = insightTypeConfig[insight.type] ?? insightTypeConfig.PATTERN;
    const IconComponent = config.icon;
    const hasTrades = insight.relatedTradeIds?.length > 0;
    const borderClass = severityBorder[insight.severity] ?? '';
    const overlayClass = severityOverlay[insight.severity];

    return (
      <Card
        key={insight.id}
        className={`glass-card rounded-2xl relative ${borderClass}`}
      >
        {overlayClass && (
          <div className={`absolute inset-0 rounded-2xl ${overlayClass} pointer-events-none`} />
        )}
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <IconComponent className="h-5 w-5 shrink-0 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold truncate text-foreground">{insight.title}</CardTitle>
              {/* P3: actionable shown as small lightning icon instead of badge */}
              {insight.actionable && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Zap className="h-3.5 w-3.5 shrink-0 text-amber-400 fill-amber-400/30" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">{t('insights.actionable')}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            {/* P3: single type badge — severity encoded by card border */}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${config.badgeClass}`}>
              {insightTypeLabel(insight.type, t)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-sm text-muted-foreground mb-3 leading-relaxed">{renderMarkdown(insight.description)}</div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground/60 font-mono tabular-nums">
              {Math.round(insight.confidence * 100)}% &middot; {new Date(insight.generatedAt).toLocaleDateString()}
            </span>
            <div className="flex items-center gap-1.5">
              {hasTrades && (
                <Button size="sm" variant="outline" onClick={() => handleViewRelatedTrades(insight.relatedTradeIds)} className="h-7 px-2.5 text-xs gap-1">
                  <ExternalLink className="h-3 w-3" />
                  {t('insights.viewTrades', { count: insight.relatedTradeIds.length, defaultValue: `View ${insight.relatedTradeIds.length} trades` })}
                </Button>
              )}
              {!insight.dismissed && (
                <Button size="sm" variant="ghost" onClick={() => handleDismiss(insight.id)} disabled={dismissInsight.isPending} className="h-7 px-2 text-xs">
                  <X className="h-3 w-3 mr-1" />
                  {t('insights.dismiss')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // P1: Insights section — only show when there are active insights
  const renderInsightsSection = () => {
    if (isLoading) return (
      <section aria-label={t('insights.patternsAndAlerts')}>
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">{t('insights.patternsAndAlerts', 'Patterns & Alerts')}</h2>
        </div>
        <PageSkeleton variant="cards" cardCount={2} />
      </section>
    );

    if (insightsError) return (
      <section aria-label={t('insights.patternsAndAlerts')}>
        <PageError title="Failed to load insights" message="Could not fetch your trading insights." onRetry={refetchInsights} />
      </section>
    );

    // P1: hide section entirely when empty — no confusing empty placeholder
    if (activeInsights.length === 0) return null;

    return (
      <section aria-label={t('insights.patternsAndAlerts')}>
        <div className="flex items-center gap-2 mb-1">
          <Target className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">{t('insights.patternsAndAlerts', 'Patterns & Alerts')}</h2>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-0.5">
            {activeInsights.length}
          </Badge>
        </div>
        {/* P1: subtitle explaining what this section is */}
        <p className="text-xs text-muted-foreground mb-4 ml-7">
          {t('insights.patternsDescription', 'Recurring patterns and risk signals detected in your trading data.')}
        </p>
        <PlanGatedSection requiredPlan="PRO" feature="AI Insights">
          <div className="space-y-3">{activeInsights.map(renderInsightCard)}</div>
        </PlanGatedSection>
      </section>
    );
  };

  // ---- Main render ----

  return (
    <DashboardLayout pageTitle={t('pages.insights')}>
      <PageTransition className="max-w-screen-2xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('pages.insightsTitle', 'Insights & Analysis')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('pages.insightsDescription', 'Deep dive into your trading performance and discover actionable patterns.')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DashboardDateFilter
              preset={datePreset}
              onPresetChange={setDatePreset}
              customStart={customStart}
              customEnd={customEnd}
              onCustomStartChange={setCustomStart}
              onCustomEndChange={setCustomEnd}
            />
            <AccountSelector
              value={selectedAccountId}
              onChange={setSelectedAccountId}
              className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>

        <KpiStrip
          activeInsightCount={activeInsights.length}
          startDate={startDate}
          endDate={endDate}
          accountId={accountIds}
        />

        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="performance" className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              {t('insights.performance', 'Performance')}
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              {t('insights.aiInsights', 'AI Insights')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            <PerformanceMetrics startDate={startDate} endDate={endDate} accountIds={accountIds} />
          </TabsContent>

          <TabsContent value="ai" className="space-y-8">
            {/* AI Digest section */}
            <PlanGatedSection requiredPlan="PRO" feature="AI Digest">
              <section aria-label={t('ai.latestAnalysis')}>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                    {selectedHistoryDigest ? t('ai.previousDigests') : t('ai.latestAnalysis')}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{t('ai.digestDescription')}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
                  <div className="min-w-0">{renderDigestContent()}</div>
                  <div className="hidden lg:block">{renderGeneratePanel()}</div>
                </div>
                <div className="lg:hidden mt-4">{renderGeneratePanel()}</div>
              </section>
            </PlanGatedSection>

            {/* P1: Patterns & Alerts — only shown when populated */}
            {renderInsightsSection()}
          </TabsContent>
        </Tabs>
      </PageTransition>
    </DashboardLayout>
  );
};

export default Insights;
