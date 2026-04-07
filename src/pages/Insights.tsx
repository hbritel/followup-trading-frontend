import React, { useMemo } from 'react';
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
import { Lightbulb, X, TrendingUp, AlertTriangle, Target, Award, BarChart3, Sparkles, RefreshCw, ExternalLink } from 'lucide-react';
import { useInsights, useDismissInsight } from '@/hooks/useInsights';
import { useWeeklyDigest, useGenerateWeeklyDigest } from '@/hooks/useWeeklyDigest';
import { useToast } from '@/hooks/use-toast';
import { useDefaultDatePreset } from '@/hooks/useDefaultDatePreset';
import { usePageFilter } from '@/contexts/page-filters-context';
import DashboardDateFilter, { computeDateRange } from '@/components/dashboard/DashboardDateFilter';
import AccountSelector from '@/components/dashboard/AccountSelector';
import { useAccountFilter } from '@/hooks/useAccountFilter';
import type { InsightResponseDto, InsightType, InsightSeverity } from '@/types/dto';

// ---- Insight card config ----

const insightTypeConfig: Record<InsightType, { color: string; icon: React.ElementType; badgeClass: string }> = {
  PATTERN: { color: 'text-blue-500', icon: BarChart3, badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  STREAK: { color: 'text-green-500', icon: TrendingUp, badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  RISK_WARNING: { color: 'text-red-500', icon: AlertTriangle, badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  IMPROVEMENT: { color: 'text-purple-500', icon: Target, badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  MILESTONE: { color: 'text-amber-500', icon: Award, badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' },
  AI_DIGEST: { color: 'text-amber-400', icon: Sparkles, badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' },
};

const severityConfig: Record<InsightSeverity, { label: string; className: string }> = {
  INFO: { label: 'Info', className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300' },
  WARNING: { label: 'Warning', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' },
  CRITICAL: { label: 'Critical', className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
};

const insightTypeLabel = (type: InsightType, t: (key: string) => string): string => {
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

// ---- Insights page ----

const Insights = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // AI Insights data
  const { data: insights, isLoading, isError: insightsError, refetch: refetchInsights } = useInsights();
  const dismissInsight = useDismissInsight();
  const { toast } = useToast();
  const { data: digest, isLoading: digestLoading, isError: digestError } = useWeeklyDigest();
  const generateDigest = useGenerateWeeklyDigest();

  const [selectedAccountId, setSelectedAccountId] = usePageFilter('insights', 'accountId', 'all');
  const { accountIds } = useAccountFilter(selectedAccountId);
  const [datePreset, setDatePreset] = useDefaultDatePreset('insights');
  const [customStart, setCustomStart] = usePageFilter<Date | null>('insights', 'customStart', null);
  const [customEnd, setCustomEnd] = usePageFilter<Date | null>('insights', 'customEnd', null);

  const toISODate = (d: Date): string => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const { startDate, endDate } = useMemo(() => {
    if (datePreset === 'custom') {
      return {
        startDate: customStart ? toISODate(customStart) : undefined,
        endDate: customEnd ? toISODate(customEnd) : undefined,
      };
    }
    return computeDateRange(datePreset);
  }, [datePreset, customStart, customEnd]);

  const activeInsights = useMemo(() => insights?.filter((i) => !i.dismissed) ?? [], [insights]);

  const handleDismiss = (id: string) => {
    dismissInsight.mutate(id, {
      onError: () => {
        toast({
          title: t('common.error'),
          description: t('insights.dismissFailed'),
          variant: 'destructive',
        });
      },
    });
  };

  // ---- Render helpers ----

  const handleViewRelatedTrades = (tradeIds: string[]) => {
    navigate('/trades', { state: { filterTradeIds: tradeIds } });
  };

  const renderInsightCard = (insight: InsightResponseDto) => {
    const config = insightTypeConfig[insight.type] ?? insightTypeConfig.PATTERN;
    const IconComponent = config.icon;
    const severity = severityConfig[insight.severity] ?? severityConfig.INFO;
    const hasTrades = insight.relatedTradeIds?.length > 0;
    const isCritical = insight.severity === 'CRITICAL';

    return (
      <Card
        key={insight.id}
        className={`glass-card rounded-2xl relative ${isCritical ? 'border-red-500/40 dark:border-red-500/30' : ''}`}
      >
        {isCritical && (
          <div className="absolute inset-0 rounded-2xl bg-red-500/5 pointer-events-none" />
        )}
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <IconComponent className={`h-5 w-5 shrink-0 ${config.color}`} />
              <CardTitle className="text-base truncate text-gradient-primary">{insight.title}</CardTitle>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${severity.className}`}>
                    {severity.label}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Severity: {severity.label}</p>
                </TooltipContent>
              </Tooltip>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.badgeClass}`}>
                {insightTypeLabel(insight.type, t)}
              </span>
              {insight.actionable && (
                <Badge variant="outline" className="text-xs">
                  {t('insights.actionable')}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono tabular-nums">
              <span>
                <span className="label-caps mr-1">{t('insights.confidence')}:</span>
                {Math.round(insight.confidence * 100)}%
              </span>
              <span>
                <span className="label-caps mr-1">{t('insights.generatedAt')}:</span>
                {new Date(insight.generatedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {hasTrades && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewRelatedTrades(insight.relatedTradeIds)}
                  className="h-7 px-2.5 text-xs gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  {t('insights.viewTrades', `View ${insight.relatedTradeIds.length} trades`, { count: insight.relatedTradeIds.length })}
                </Button>
              )}
              {!insight.dismissed && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDismiss(insight.id)}
                  disabled={dismissInsight.isPending}
                  className="h-7 px-2 text-xs"
                >
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

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-48" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-3" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-1">{t('insights.noInsights')}</h3>
      <p className="text-muted-foreground">{t('insights.noInsightsDescription')}</p>
    </div>
  );

  const renderDigestContent = () => {
    if (digestError) {
      return (
        <div className="text-center py-10">
          <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            {t('ai.unavailable', 'AI features unavailable')}
          </h3>
          <p className="text-xs text-muted-foreground/70">
            {t('ai.unavailableDescription', 'The AI service is not enabled on this server. Contact your administrator to enable it.')}
          </p>
        </div>
      );
    }
    if (digestLoading) {
      return (
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      );
    }
    if (digest) {
      return (
        <Card className="glass-card rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-gradient-primary">
                {t('ai.digest', 'Weekly Digest')}
              </CardTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono tabular-nums">
                <span>
                  <span className="label-caps mr-1">Week:</span>
                  {new Date(digest.weekStart).toLocaleDateString()} &ndash; {new Date(digest.weekEnd).toLocaleDateString()}
                </span>
                <span>
                  <span className="label-caps mr-1">Generated:</span>
                  {new Date(digest.generatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {digest.content}
            </p>
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="text-center py-12">
        <Sparkles className="h-12 w-12 text-amber-400/40 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-1">{t('ai.noDigest', 'No digest yet')}</h3>
        <p className="text-muted-foreground text-sm mb-4">
          {t('ai.noDigestDescription', 'Generate your first weekly trading digest to get AI-powered insights.')}
        </p>
        <Button
          onClick={() => generateDigest.mutate()}
          disabled={generateDigest.isPending}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {t('ai.generateDigest', 'Generate Digest')}
        </Button>
      </div>
    );
  };

  const renderInsightsContent = () => {
    if (isLoading) return <PageSkeleton variant="cards" cardCount={3} />;
    if (insightsError) return (
      <PageError
        title="Failed to load insights"
        message="Could not fetch your trading insights. Please try again."
        onRetry={refetchInsights}
      />
    );
    if (activeInsights.length === 0) return renderEmptyState();
    return <div className="space-y-4">{activeInsights.map(renderInsightCard)}</div>;
  };

  return (
    <DashboardLayout pageTitle={t('pages.insights')}>
      <PageTransition className="max-w-screen-2xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Insights & Analysis</h1>
              <p className="text-muted-foreground mt-2">
                Deep dive into your trading performance and discover actionable patterns.
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

          {/* KPI Summary Strip — always visible above tabs */}
          <KpiStrip activeInsightCount={activeInsights.length} />

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

          {/* ---- Tab 1: Performance (Monthly P&L + Strategy Comparison) ---- */}
          <TabsContent value="performance" className="space-y-6">
            <PerformanceMetrics startDate={startDate} endDate={endDate} accountIds={accountIds} />
          </TabsContent>

          {/* ---- Tab 2: AI Insights + Weekly Digest ---- */}
          <TabsContent value="ai" className="space-y-6">
            {/* AI Insight cards — patterns and risk warnings are advanced */}
            <section aria-label={t('insights.aiInsights', 'AI Insights')}>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-gradient-primary">{t('insights.aiInsights', 'AI Insights')}</h2>
                {activeInsights.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {activeInsights.length}
                  </Badge>
                )}
              </div>
              <PlanGatedSection requiredPlan="PRO" feature="AI Insights — patterns and risk warnings">
                {renderInsightsContent()}
              </PlanGatedSection>
            </section>

            {/* Weekly Digest */}
            <PlanGatedSection requiredPlan="PRO" feature="AI Digest">
              <section aria-label={t('ai.digest', 'Weekly Digest')} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gradient-primary flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-400" />
                      {t('ai.digest', 'Weekly Digest')}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t('ai.digestDescription', 'AI-generated summary of your trading week')}
                    </p>
                  </div>
                  <Button
                    onClick={() => generateDigest.mutate()}
                    disabled={generateDigest.isPending || digestError}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${generateDigest.isPending ? 'animate-spin' : ''}`} />
                    {t('ai.generateDigest', 'Generate Digest')}
                  </Button>
                </div>

                {renderDigestContent()}
              </section>
            </PlanGatedSection>
          </TabsContent>
        </Tabs>
      </PageTransition>
    </DashboardLayout>
  );
};

export default Insights;
