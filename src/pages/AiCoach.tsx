import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useDisclaimer } from '@/hooks/useDisclaimer';
import DisclaimerModal from '@/components/ai-coach/DisclaimerModal';
import TiltGauge from '@/components/ai-coach/TiltGauge';
import BriefingCard from '@/components/ai-coach/BriefingCard';
import SessionDebriefCard from '@/components/ai-coach/SessionDebriefCard';
import PsychologyCorrelation from '@/components/ai-coach/PsychologyCorrelation';
import CoachStreak from '@/components/ai-coach/CoachStreak';
import NlqQuickPrompts from '@/components/ai-coach/NlqQuickPrompts';
import ActivityCard from '@/components/ai-coach/ActivityCard';
import ChartAnalyzer from '@/components/ai-coach/ChartAnalyzer';
import AutoPlaybookGenerator from '@/components/ai-coach/AutoPlaybookGenerator';
import SmartGoalsCard from '@/components/ai-coach/SmartGoalsCard';
import SkillTreeCard from '@/components/ai-coach/SkillTreeCard';
import CounterfactualRulesPanel from '@/components/ai-coach/CounterfactualRulesPanel';
import AccountSelector from '@/components/dashboard/AccountSelector';
import { useAccountFilter } from '@/hooks/useAccountFilter';
import CoachChat from '@/components/ai/CoachChat';
import AgentChatPanel from '@/components/ai-coach/AgentChatPanel';
import CoachTour from '@/components/ai-coach/CoachTour';
import { useCoachChat } from '@/hooks/useCoachChat';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  MessageSquare, LayoutDashboard, Sun, Moon,
  HelpCircle, Info, Sparkles, Brain, Network,
  Image as ImageIcon, Target, Trophy, Scale, Activity as ActivityIcon,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';

const PageSkeleton: React.FC = () => (
  <DashboardLayout pageTitle="AI Coach">
    <div className="flex flex-col gap-3 h-[calc(100vh-7rem)]">
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="flex gap-3 flex-1 min-h-0">
        <Skeleton className="flex-1 rounded-2xl" />
        <Skeleton className="w-[420px] rounded-2xl" />
      </div>
    </div>
  </DashboardLayout>
);

// ──────────────────────────────────────────────────────────────────────
// NLQ section (visible only when chat is empty)
// ──────────────────────────────────────────────────────────────────────
const NlqIntroSection: React.FC<{
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}> = ({ onSelect, disabled }) => {
  const { t } = useTranslation();
  return (
    <section
      aria-labelledby="nlq-section-title"
      className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-background p-4 mb-3"
    >
      <h2 id="nlq-section-title" className="text-sm font-semibold text-foreground">
        {t('aiCoach.nlq.sectionTitle', "Demandez à l'IA")}
      </h2>
      <p className="text-xs text-muted-foreground mt-0.5 mb-3">
        {t('aiCoach.nlq.sectionSubtitle', 'Suggestions pour démarrer')}
      </p>
      <NlqQuickPrompts onSelect={onSelect} disabled={disabled} />
    </section>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Tile colour palette — each colour scoped to one tool category so the
// bento grid scans like a coloured legend at a glance.
// ──────────────────────────────────────────────────────────────────────
type TileColor = 'amber' | 'blue' | 'sky' | 'fuchsia' | 'emerald' | 'violet' | 'rose';

const TILE_TINTS: Record<TileColor, string> = {
  amber: 'from-amber-500/15 to-amber-500/0 border-amber-500/30 hover:border-amber-500/60',
  blue: 'from-blue-500/15 to-blue-500/0 border-blue-500/30 hover:border-blue-500/60',
  sky: 'from-sky-500/15 to-sky-500/0 border-sky-500/30 hover:border-sky-500/60',
  fuchsia: 'from-fuchsia-500/15 to-fuchsia-500/0 border-fuchsia-500/30 hover:border-fuchsia-500/60',
  emerald: 'from-emerald-500/15 to-emerald-500/0 border-emerald-500/30 hover:border-emerald-500/60',
  violet: 'from-violet-500/15 to-violet-500/0 border-violet-500/30 hover:border-violet-500/60',
  rose: 'from-rose-500/15 to-rose-500/0 border-rose-500/30 hover:border-rose-500/60',
};

const ICON_TINTS: Record<TileColor, string> = {
  amber: 'text-amber-500',
  blue: 'text-blue-500',
  sky: 'text-sky-500',
  fuchsia: 'text-fuchsia-500',
  emerald: 'text-emerald-500',
  violet: 'text-violet-500',
  rose: 'text-rose-500',
};

// ──────────────────────────────────────────────────────────────────────
// Tile — bento card. Square-ish, colour-tinted, hover/focus rings.
// ──────────────────────────────────────────────────────────────────────
interface TileProps {
  icon: React.ReactNode;
  label: string;
  hint: string;
  color: TileColor;
  onClick: () => void;
  active?: boolean;
}

const Tile: React.FC<TileProps> = ({ icon, label, hint, color, onClick, active }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      'group relative flex flex-col items-start justify-between text-left',
      'rounded-2xl border bg-gradient-to-br p-3 sm:p-4',
      'min-h-[96px] sm:min-h-[112px]',
      'transition-all duration-200 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
      'hover:-translate-y-0.5 hover:shadow-lg',
      TILE_TINTS[color],
      active && 'ring-2 ring-primary/40 -translate-y-0.5 shadow-lg',
    )}
  >
    <div className={cn(
      'inline-flex h-8 w-8 items-center justify-center rounded-lg bg-background/60 border border-border/40',
      ICON_TINTS[color],
    )}>
      {icon}
    </div>
    <div className="mt-2 w-full min-w-0">
      <div className="text-sm font-semibold text-foreground truncate">{label}</div>
      <div className="text-[11px] text-muted-foreground truncate mt-0.5">{hint}</div>
    </div>
  </button>
);

// ──────────────────────────────────────────────────────────────────────
// Sheet keys + panel definitions
// ──────────────────────────────────────────────────────────────────────
type PanelKey =
  | 'tilt'
  | 'briefing'
  | 'debrief'
  | 'goals'
  | 'skills'
  | 'rules'
  | 'vision'
  | 'autoPlaybook'
  | 'activity'
  | 'psychology';

interface PanelDef {
  titleKey: string;
  defaultTitle: string;
  descriptionKey?: string;
  defaultDescription?: string;
  icon: React.ReactNode;
}

// ──────────────────────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────────────────────

const AiCoach: React.FC = () => {
  const { t } = useTranslation();
  const { data: disclaimerStatus, isLoading: disclaimerLoading } = useDisclaimer();
  const [tourOpen, setTourOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [mobileTab, setMobileTab] = useState<'chat' | 'tools'>('chat');
  const { hasPlan } = useFeatureFlags();
  const multiAgentAllowed = hasPlan('PRO');
  const [useMultiAgent, setUseMultiAgent] = useState(false);

  useEffect(() => {
    if (!multiAgentAllowed && useMultiAgent) {
      setUseMultiAgent(false);
    }
  }, [multiAgentAllowed, useMultiAgent]);

  const { accountId } = useAccountFilter(selectedAccount);

  // Read-only view of the chat thread for empty-state detection.
  const { messages: introMessages, isGenerating: introGenerating } = useCoachChat();
  const isChatEmpty = introMessages.length === 0;

  // NLQ pending prompt forwarding.
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const handlePromptSelect = useCallback((prompt: string) => {
    if (introGenerating) return;
    setPendingPrompt(prompt);
  }, [introGenerating]);
  const handlePromptConsumed = useCallback(() => {
    setPendingPrompt(null);
  }, []);

  useEffect(() => {
    const seen = localStorage.getItem('ai-coach-tour-seen');
    if (!seen && disclaimerStatus?.accepted) {
      setTourOpen(true);
      localStorage.setItem('ai-coach-tour-seen', 'true');
    }
  }, [disclaimerStatus?.accepted]);

  // Active drawer panel — controls which side sheet is open.
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);
  const open = useCallback((key: PanelKey) => setOpenPanel(key), []);
  const close = useCallback(() => setOpenPanel(null), []);

  // Panel metadata. Body rendering deferred to renderPanelBody so unopened
  // panels do not pay the mount cost.
  const panelDefs: Record<PanelKey, PanelDef> = useMemo(() => ({
    tilt: {
      titleKey: 'ai.tiltScore',
      defaultTitle: 'Tilt & Streak',
      descriptionKey: 'ai.tiltScoreInfo',
      defaultDescription:
        'Measures emotional/impulsive trading risk (0-100). GREEN (0-30) = calm, YELLOW (31-60) = monitor, ORANGE (61-80) = caution, RED (81+) = stop trading.',
      icon: <ActivityIcon className="h-4 w-4 text-emerald-400" />,
    },
    briefing: {
      titleKey: 'ai.morningBriefing',
      defaultTitle: 'Morning Briefing',
      icon: <Sun className="h-4 w-4 text-amber-400" />,
    },
    debrief: {
      titleKey: 'ai.sessionDebrief',
      defaultTitle: 'Session Debrief',
      icon: <Moon className="h-4 w-4 text-blue-400" />,
    },
    goals: {
      titleKey: 'aiCoach.smartGoals.sectionTitle',
      defaultTitle: 'Smart Goals',
      icon: <Target className="h-4 w-4 text-sky-400" />,
    },
    skills: {
      titleKey: 'aiCoach.skillTree.sectionTitle',
      defaultTitle: 'Skill Tree',
      icon: <Trophy className="h-4 w-4 text-amber-400" />,
    },
    rules: {
      titleKey: 'counterfactual.rulesSectionTitle',
      defaultTitle: 'Rules — what-if compliance',
      icon: <Scale className="h-4 w-4 text-rose-400" />,
    },
    vision: {
      titleKey: 'visionAnalysis.sectionTitle',
      defaultTitle: 'Chart Analyzer',
      icon: <ImageIcon className="h-4 w-4 text-fuchsia-400" />,
    },
    autoPlaybook: {
      titleKey: 'autoPlaybook.sectionTitle',
      defaultTitle: 'Auto-Playbook Generator',
      icon: <Sparkles className="h-4 w-4 text-emerald-400" />,
    },
    activity: {
      titleKey: 'ai.activity',
      defaultTitle: 'Activity & alerts',
      icon: <ActivityIcon className="h-4 w-4 text-blue-400" />,
    },
    psychology: {
      titleKey: 'ai.psychology',
      defaultTitle: 'Psychology',
      icon: <Brain className="h-4 w-4 text-violet-400" />,
    },
  }), []);

  // Lazy panel body — only rendered when its sheet is open.
  const renderPanelBody = useCallback((key: PanelKey): React.ReactNode => {
    switch (key) {
      case 'tilt':
        return (
          <div className="space-y-4">
            <div className="flex justify-center">
              <TiltGauge accountId={accountId} compact={false} enableRealtime={false} />
            </div>
            <div className="border-t border-border/30 pt-4">
              <CoachStreak />
            </div>
          </div>
        );
      case 'briefing':
        return <BriefingCard accountId={accountId} />;
      case 'debrief':
        return <SessionDebriefCard accountId={accountId} />;
      case 'goals':
        return <SmartGoalsCard />;
      case 'skills':
        return <SkillTreeCard />;
      case 'rules':
        return <CounterfactualRulesPanel />;
      case 'vision':
        return <ChartAnalyzer />;
      case 'autoPlaybook':
        return <AutoPlaybookGenerator />;
      case 'activity':
        return <ActivityCard accountId={accountId} />;
      case 'psychology':
        return <PsychologyCorrelation />;
      default:
        return null;
    }
  }, [accountId]);

  if (disclaimerLoading) return <PageSkeleton />;
  if (!disclaimerStatus?.accepted) return <DisclaimerModal />;

  const activeDef = openPanel ? panelDefs[openPanel] : null;

  // ── Tilt pill in header ─────────────────────────────────────────────
  const tiltPill = (
    <button
      type="button"
      onClick={() => open('tilt')}
      className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/40 hover:bg-card/70 px-2.5 py-1 transition-colors group"
      aria-label={t('ai.openTilt', 'Open tilt details')}
    >
      <TiltGauge accountId={accountId} variant="compact" enableRealtime={false} />
    </button>
  );

  // ── Bento tile grid ─────────────────────────────────────────────────
  const bento = (
    <div className="grid grid-cols-2 auto-rows-fr gap-2 sm:gap-2.5">
      <Tile
        icon={<Sun className="h-4 w-4" />}
        label={t('ai.morningBriefing', 'Briefing')}
        hint={t('aiCoach.tile.briefing', "Today's market preparation")}
        color="amber"
        active={openPanel === 'briefing'}
        onClick={() => open('briefing')}
      />
      <Tile
        icon={<Moon className="h-4 w-4" />}
        label={t('ai.sessionDebrief', 'Debrief')}
        hint={t('aiCoach.tile.debrief', 'Session score & review')}
        color="blue"
        active={openPanel === 'debrief'}
        onClick={() => open('debrief')}
      />
      <Tile
        icon={<Target className="h-4 w-4" />}
        label={t('aiCoach.smartGoals.sectionTitle', 'Smart Goals')}
        hint={t('aiCoach.tile.goals', 'Weekly stretch targets')}
        color="sky"
        active={openPanel === 'goals'}
        onClick={() => open('goals')}
      />
      <Tile
        icon={<Trophy className="h-4 w-4" />}
        label={t('aiCoach.skillTree.sectionTitle', 'Skill Tree')}
        hint={t('aiCoach.tile.skills', 'Milestones unlocked')}
        color="amber"
        active={openPanel === 'skills'}
        onClick={() => open('skills')}
      />
      <Tile
        icon={<Scale className="h-4 w-4" />}
        label={t('counterfactual.rulesShort', 'Rules')}
        hint={t('aiCoach.tile.rules', 'What-if compliance gap')}
        color="rose"
        active={openPanel === 'rules'}
        onClick={() => open('rules')}
      />
      <Tile
        icon={<ImageIcon className="h-4 w-4" />}
        label={t('visionAnalysis.sectionTitle', 'Chart Analyzer')}
        hint={t('aiCoach.tile.vision', 'Analyse a screenshot')}
        color="fuchsia"
        active={openPanel === 'vision'}
        onClick={() => open('vision')}
      />
      <Tile
        icon={<Sparkles className="h-4 w-4" />}
        label={t('autoPlaybook.sectionTitle', 'Auto-Playbook')}
        hint={t('aiCoach.tile.autoPlaybook', 'Generate from your wins')}
        color="emerald"
        active={openPanel === 'autoPlaybook'}
        onClick={() => open('autoPlaybook')}
      />
      <Tile
        icon={<ActivityIcon className="h-4 w-4" />}
        label={t('ai.activity', 'Activity')}
        hint={t('aiCoach.tile.activity', 'Behavioural alerts')}
        color="violet"
        active={openPanel === 'activity'}
        onClick={() => open('activity')}
      />
    </div>
  );

  // Secondary access link for Psychology (less frequent than the 8 main tiles).
  const psychologyLink = (
    <button
      type="button"
      onClick={() => open('psychology')}
      className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg border border-dashed border-border/60 hover:border-border transition-colors"
    >
      <Brain className="h-3.5 w-3.5 text-violet-400" />
      <span>{t('ai.psychologyOpen', 'Open psychology insights')}</span>
    </button>
  );

  // ──────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout pageTitle="AI Coach">
      <div className="flex flex-col h-[calc(100vh-7rem)] gap-3">
        {/* Header — compact, status-rich, action-rich */}
        <header className="flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-10 w-10 rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-amber-500 grid place-items-center shadow-lg shadow-primary/20 shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="motion-safe:absolute motion-safe:inline-flex motion-safe:h-full motion-safe:w-full motion-safe:animate-ping motion-safe:rounded-full motion-safe:bg-emerald-400 motion-safe:opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-background" />
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">
                  {t('ai.coachTitle', 'Coach')}
                </h1>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex p-1 -m-1 rounded-md hover:bg-muted/50"
                      aria-label={t('ai.disclaimerLabel', 'Disclaimer')}
                    >
                      <Info className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
                    {t('ai.disclaimer', 'AI-generated insights are for informational purposes only. Not financial advice.')}
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="hidden sm:block text-xs text-muted-foreground truncate">
                {t('ai.coachSubtitle', 'Patterns, behaviour and session debriefs from your own trades.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="hidden md:flex">{tiltPill}</div>
            {multiAgentAllowed && (
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <label
                    htmlFor="multi-agent-toggle"
                    className={cn(
                      'hidden xl:inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors',
                      useMultiAgent
                        ? 'border-primary/40 bg-primary/5 text-primary'
                        : 'border-border/50 text-muted-foreground hover:bg-muted/30',
                    )}
                  >
                    <Network className="h-3.5 w-3.5" />
                    {t('aiCoach.orchestration.useMultiAgent', 'Multi-agent')}
                    <Switch
                      id="multi-agent-toggle"
                      checked={useMultiAgent}
                      onCheckedChange={setUseMultiAgent}
                      aria-label={t('aiCoach.orchestration.useMultiAgent', 'Multi-agent')}
                    />
                  </label>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
                  {t('aiCoach.orchestration.useMultiAgentTooltip',
                    'Routes your question to specialised agents and synthesises their answers. PRO+ only.')}
                </TooltipContent>
              </Tooltip>
            )}
            <AccountSelector
              value={selectedAccount}
              onChange={setSelectedAccount}
              className="w-36 lg:w-44 hidden md:flex"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTourOpen(true)}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              title={t('ai.tourHelp', 'How it works')}
              aria-label={t('ai.tourHelp', 'How it works')}
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Mobile: compact secondary row + tab switcher */}
        <div className="md:hidden flex items-center gap-2 flex-shrink-0">
          {tiltPill}
          <AccountSelector
            value={selectedAccount}
            onChange={setSelectedAccount}
            className="flex-1"
          />
        </div>
        <div className="md:hidden flex-shrink-0">
          <div className="flex gap-1 p-1 rounded-lg bg-muted/30 border border-border/50">
            <button
              type="button"
              onClick={() => setMobileTab('chat')}
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors',
                mobileTab === 'chat'
                  ? 'bg-card border-border/50 shadow-sm text-foreground'
                  : 'text-muted-foreground hover:bg-muted/30',
              )}
            >
              <MessageSquare className="h-4 w-4" />
              {t('ai.tabChat', 'Chat')}
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('tools')}
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors',
                mobileTab === 'tools'
                  ? 'bg-card border-border/50 shadow-sm text-foreground'
                  : 'text-muted-foreground hover:bg-muted/30',
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              {t('ai.tabTools', 'Tools')}
            </button>
          </div>
        </div>

        {/* Body — desktop: chat ⇄ bento ; mobile: tabbed surface */}
        <div className="flex-1 min-h-0 flex md:gap-3 lg:gap-4">
          {/* Chat zone */}
          <section
            className={cn(
              'flex-1 min-h-0 flex-col',
              'md:flex',
              mobileTab === 'chat' ? 'flex' : 'hidden md:flex',
            )}
            aria-label={t('aiCoach.chatZone', 'Chat with your coach')}
          >
            {!useMultiAgent && isChatEmpty && (
              <NlqIntroSection
                onSelect={handlePromptSelect}
                disabled={introGenerating || pendingPrompt !== null}
              />
            )}
            <div className="flex-1 min-h-0 mx-auto w-full max-w-3xl">
              {useMultiAgent ? (
                <AgentChatPanel className="h-full" />
              ) : (
                <CoachChat
                  className="h-full"
                  pendingPrompt={pendingPrompt}
                  onPromptConsumed={handlePromptConsumed}
                />
              )}
            </div>
          </section>

          {/* Bento zone — desktop right column, mobile = tools tab */}
          <aside
            className={cn(
              'min-h-0 overflow-y-auto pr-1',
              'md:flex md:flex-col md:w-[360px] lg:w-[420px] xl:w-[460px] flex-shrink-0',
              mobileTab === 'tools' ? 'flex flex-col w-full' : 'hidden md:flex',
            )}
            aria-label={t('aiCoach.toolsZone', 'AI tools')}
          >
            {bento}
            {psychologyLink}
          </aside>
        </div>

        {/* Side sheet — single, multiplexes all panels */}
        <Sheet open={openPanel !== null} onOpenChange={(v) => !v && close()}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl overflow-y-auto p-0"
          >
            {activeDef && (
              <>
                <SheetHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {activeDef.icon}
                      <SheetTitle className="text-base truncate">
                        {t(activeDef.titleKey, activeDef.defaultTitle)}
                      </SheetTitle>
                    </div>
                    <button
                      type="button"
                      onClick={close}
                      className="rounded-md p-1 -m-1 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      aria-label={t('common.close', 'Close')}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {activeDef.descriptionKey && activeDef.defaultDescription && (
                    <SheetDescription className="text-xs leading-relaxed">
                      {t(activeDef.descriptionKey, activeDef.defaultDescription)}
                    </SheetDescription>
                  )}
                </SheetHeader>
                <div className="px-5 py-4">
                  {openPanel && renderPanelBody(openPanel)}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Onboarding Tour */}
        <CoachTour open={tourOpen} onClose={() => setTourOpen(false)} />
      </div>
    </DashboardLayout>
  );
};

export default AiCoach;
