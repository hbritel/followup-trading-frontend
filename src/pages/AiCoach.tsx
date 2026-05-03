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
  MessageSquare, Sun, Moon,
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
        <Skeleton className="w-16 rounded-2xl" />
        <Skeleton className="flex-1 rounded-2xl" />
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
// Mode definitions
// ──────────────────────────────────────────────────────────────────────
type ModeKey =
  | 'chat'
  | 'briefing'
  | 'debrief'
  | 'goals'
  | 'skills'
  | 'rules'
  | 'vision'
  | 'autoPlaybook'
  | 'activity'
  | 'psychology';

type ModeColor = 'primary' | 'amber' | 'blue' | 'sky' | 'fuchsia' | 'emerald' | 'violet' | 'rose';

const COLOR_RING: Record<ModeColor, string> = {
  primary: 'bg-primary/15 text-primary',
  amber: 'bg-amber-500/15 text-amber-500',
  blue: 'bg-blue-500/15 text-blue-500',
  sky: 'bg-sky-500/15 text-sky-500',
  fuchsia: 'bg-fuchsia-500/15 text-fuchsia-500',
  emerald: 'bg-emerald-500/15 text-emerald-500',
  violet: 'bg-violet-500/15 text-violet-500',
  rose: 'bg-rose-500/15 text-rose-500',
};

const COLOR_ACTIVE_BAR: Record<ModeColor, string> = {
  primary: 'bg-primary',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  sky: 'bg-sky-500',
  fuchsia: 'bg-fuchsia-500',
  emerald: 'bg-emerald-500',
  violet: 'bg-violet-500',
  rose: 'bg-rose-500',
};

interface ModeDef {
  key: ModeKey;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  defaultLabel: string;
  color: ModeColor;
}

interface ModeGroup {
  groupKey: string;
  modes: ModeDef[];
}

const MODE_GROUPS: ModeGroup[] = [
  {
    groupKey: 'conversation',
    modes: [
      { key: 'chat', icon: MessageSquare, labelKey: 'ai.tabChat', defaultLabel: 'Chat', color: 'primary' },
    ],
  },
  {
    groupKey: 'daily',
    modes: [
      { key: 'briefing', icon: Sun, labelKey: 'ai.morningBriefing', defaultLabel: 'Briefing', color: 'amber' },
      { key: 'debrief', icon: Moon, labelKey: 'ai.sessionDebrief', defaultLabel: 'Debrief', color: 'blue' },
    ],
  },
  {
    groupKey: 'progress',
    modes: [
      { key: 'goals', icon: Target, labelKey: 'aiCoach.smartGoals.sectionTitle', defaultLabel: 'Goals', color: 'sky' },
      { key: 'skills', icon: Trophy, labelKey: 'aiCoach.skillTree.sectionTitle', defaultLabel: 'Skills', color: 'amber' },
      { key: 'rules', icon: Scale, labelKey: 'counterfactual.rulesShort', defaultLabel: 'Rules', color: 'rose' },
    ],
  },
  {
    groupKey: 'tools',
    modes: [
      { key: 'vision', icon: ImageIcon, labelKey: 'visionAnalysis.sectionTitle', defaultLabel: 'Vision', color: 'fuchsia' },
      { key: 'autoPlaybook', icon: Sparkles, labelKey: 'autoPlaybook.sectionTitle', defaultLabel: 'Auto-Playbook', color: 'emerald' },
    ],
  },
  {
    groupKey: 'insights',
    modes: [
      { key: 'activity', icon: ActivityIcon, labelKey: 'ai.activity', defaultLabel: 'Activity', color: 'blue' },
      { key: 'psychology', icon: Brain, labelKey: 'ai.psychology', defaultLabel: 'Psychology', color: 'violet' },
    ],
  },
];

// Flat mode index for easy lookup.
const MODE_INDEX: Record<ModeKey, ModeDef> = MODE_GROUPS
  .flatMap((g) => g.modes)
  .reduce((acc, m) => {
    acc[m.key] = m;
    return acc;
  }, {} as Record<ModeKey, ModeDef>);

// ──────────────────────────────────────────────────────────────────────
// Vertical rail item — used on desktop (md+).
// ──────────────────────────────────────────────────────────────────────
interface RailItemProps {
  mode: ModeDef;
  active: boolean;
  onClick: () => void;
}

const RailItem: React.FC<RailItemProps> = ({ mode, active, onClick }) => {
  const { t } = useTranslation();
  const Icon = mode.icon;
  const label = t(mode.labelKey, mode.defaultLabel);

  return (
    <Tooltip delayDuration={120}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-pressed={active}
          aria-label={label}
          className={cn(
            'relative inline-flex h-11 w-11 items-center justify-center rounded-xl',
            'transition-all duration-150 ease-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
            active
              ? COLOR_RING[mode.color]
              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
          )}
        >
          {/* Vertical active bar — matches the mode's colour */}
          {active && (
            <span
              aria-hidden="true"
              className={cn(
                'absolute -left-2 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full',
                COLOR_ACTIVE_BAR[mode.color],
              )}
            />
          )}
          <Icon className="h-5 w-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={6} className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Horizontal tab item — mobile (< md). Same data, different chrome.
// ──────────────────────────────────────────────────────────────────────
const TabItem: React.FC<RailItemProps> = ({ mode, active, onClick }) => {
  const { t } = useTranslation();
  const Icon = mode.icon;
  const label = t(mode.labelKey, mode.defaultLabel);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex flex-shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full',
        'border text-xs font-medium whitespace-nowrap transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        'min-h-[36px]',
        active
          ? cn('border-transparent', COLOR_RING[mode.color])
          : 'border-border/50 text-muted-foreground hover:bg-muted/30',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────────────────────

const AiCoach: React.FC = () => {
  const { t } = useTranslation();
  const { data: disclaimerStatus, isLoading: disclaimerLoading } = useDisclaimer();
  const [tourOpen, setTourOpen] = useState(false);
  const [tiltSheetOpen, setTiltSheetOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('all');
  const { hasPlan } = useFeatureFlags();
  const multiAgentAllowed = hasPlan('PRO');
  const [useMultiAgent, setUseMultiAgent] = useState(false);

  useEffect(() => {
    if (!multiAgentAllowed && useMultiAgent) {
      setUseMultiAgent(false);
    }
  }, [multiAgentAllowed, useMultiAgent]);

  const { accountId } = useAccountFilter(selectedAccount);

  // Active mode — defaults to Chat. Persisted in sessionStorage so navigating
  // away and back keeps the user on the panel they were exploring.
  const [activeMode, setActiveMode] = useState<ModeKey>(() => {
    if (typeof window === 'undefined') return 'chat';
    const stored = sessionStorage.getItem('ai-coach-active-mode');
    return (stored as ModeKey) || 'chat';
  });

  const switchMode = useCallback((next: ModeKey) => {
    setActiveMode(next);
    try {
      sessionStorage.setItem('ai-coach-active-mode', next);
    } catch { /* no-op when storage is full or disabled */ }
  }, []);

  // Read-only view of the chat thread for empty-state detection (NLQ intro).
  const { messages: introMessages, isGenerating: introGenerating } = useCoachChat();
  const isChatEmpty = introMessages.length === 0;

  // NLQ pending prompt forwarding.
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const handlePromptSelect = useCallback((prompt: string) => {
    if (introGenerating) return;
    setPendingPrompt(prompt);
    if (activeMode !== 'chat') switchMode('chat');
  }, [introGenerating, activeMode, switchMode]);
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

  // Body of the active mode — chat is always mounted (preserves SSE state),
  // other modes are rendered lazily so we don't pay the mount cost up front.
  const renderModeBody = useCallback((key: ModeKey): React.ReactNode => {
    switch (key) {
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

  const activeDef = MODE_INDEX[activeMode];
  const ActiveIcon = activeDef.icon;

  // Tilt pill in header — quick read; click opens detailed Sheet.
  const tiltPill = (
    <button
      type="button"
      onClick={() => setTiltSheetOpen(true)}
      className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/40 hover:bg-card/70 px-2.5 py-1 transition-colors"
      aria-label={t('ai.openTilt', 'Open tilt details')}
    >
      <TiltGauge accountId={accountId} variant="compact" enableRealtime={false} />
    </button>
  );

  // ── Vertical rail (desktop) ──────────────────────────────────────────
  const verticalRail = (
    <nav
      aria-label={t('aiCoach.navLabel', 'AI workspaces')}
      className="hidden md:flex flex-col items-center py-3 gap-1 w-16 flex-shrink-0 border-r border-border/40 bg-card/30"
    >
      {MODE_GROUPS.map((group, gIdx) => (
        <React.Fragment key={group.groupKey}>
          {gIdx > 0 && (
            <div className="h-px w-7 my-1 bg-border/50" aria-hidden="true" />
          )}
          {group.modes.map((mode) => (
            <RailItem
              key={mode.key}
              mode={mode}
              active={activeMode === mode.key}
              onClick={() => switchMode(mode.key)}
            />
          ))}
        </React.Fragment>
      ))}
    </nav>
  );

  // ── Horizontal tab bar (mobile) ──────────────────────────────────────
  const horizontalTabs = (
    <div
      className="md:hidden flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 flex-shrink-0 scrollbar-thin"
      role="tablist"
      aria-label={t('aiCoach.navLabel', 'AI workspaces')}
    >
      {MODE_GROUPS.flatMap((g) => g.modes).map((mode) => (
        <TabItem
          key={mode.key}
          mode={mode}
          active={activeMode === mode.key}
          onClick={() => switchMode(mode.key)}
        />
      ))}
    </div>
  );

  // ── Header bar above everything ──────────────────────────────────────
  const header = (
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
  );

  // Mobile secondary row (tilt + account) since they are hidden in the main header on small screens.
  const mobileSecondaryRow = (
    <div className="md:hidden flex items-center gap-2 flex-shrink-0">
      {tiltPill}
      <AccountSelector
        value={selectedAccount}
        onChange={setSelectedAccount}
        className="flex-1"
      />
    </div>
  );

  // ── Active panel (chat is always mounted; non-chat = card chrome) ────
  // Chat must stay mounted across mode switches so the SSE stream + token
  // buffer are not lost when the user pops into a tool and comes back.
  const chatHidden = activeMode !== 'chat';

  const chatPanel = (
    <div
      className={cn(
        'flex-1 min-h-0 flex flex-col',
        chatHidden && 'hidden',
      )}
      aria-hidden={chatHidden}
    >
      {!useMultiAgent && isChatEmpty && (
        <NlqIntroSection
          onSelect={handlePromptSelect}
          disabled={introGenerating || pendingPrompt !== null}
        />
      )}
      <div className="flex-1 min-h-0 mx-auto w-full max-w-4xl">
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
    </div>
  );

  const toolPanel = activeMode !== 'chat' && (
    <article
      className="flex-1 min-h-0 flex flex-col rounded-2xl border border-border/40 bg-card/30 overflow-hidden"
      aria-labelledby="active-mode-title"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border/40 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-lg',
              COLOR_RING[activeDef.color],
            )}
          >
            <ActiveIcon className="h-4 w-4" />
          </span>
          <h2 id="active-mode-title" className="text-sm font-semibold truncate">
            {t(activeDef.labelKey, activeDef.defaultLabel)}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => switchMode('chat')}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground rounded-md px-2 py-1 hover:bg-muted/40"
          aria-label={t('aiCoach.backToChat', 'Back to chat')}
        >
          <X className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t('aiCoach.backToChat', 'Back to chat')}</span>
        </button>
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto p-4 mx-auto w-full max-w-4xl">
        {renderModeBody(activeMode)}
      </div>
    </article>
  );

  return (
    <DashboardLayout pageTitle="AI Coach">
      <div className="flex flex-col h-[calc(100vh-7rem)] gap-3">
        {header}
        {mobileSecondaryRow}
        {horizontalTabs}

        {/* Body — vertical rail + active panel */}
        <div className="flex-1 min-h-0 flex md:gap-3">
          {verticalRail}
          {chatPanel}
          {toolPanel}
        </div>

        {/* Tilt details sheet — opened by clicking the tilt pill */}
        <Sheet open={tiltSheetOpen} onOpenChange={setTiltSheetOpen}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-md overflow-y-auto p-0"
          >
            <SheetHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <ActivityIcon className="h-4 w-4 text-emerald-400" />
                  <SheetTitle className="text-base truncate">
                    {t('ai.tiltScore', 'Tilt & Streak')}
                  </SheetTitle>
                </div>
                <button
                  type="button"
                  onClick={() => setTiltSheetOpen(false)}
                  className="rounded-md p-1 -m-1 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  aria-label={t('common.close', 'Close')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SheetDescription className="text-xs leading-relaxed">
                {t('ai.tiltScoreInfo', 'Measures emotional/impulsive trading risk (0-100). GREEN (0-30) = calm, YELLOW (31-60) = monitor, ORANGE (61-80) = caution, RED (81+) = stop trading.')}
              </SheetDescription>
            </SheetHeader>
            <div className="px-5 py-4 space-y-4">
              <div className="flex justify-center">
                <TiltGauge accountId={accountId} compact={false} enableRealtime={false} />
              </div>
              <div className="border-t border-border/30 pt-4">
                <CoachStreak />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Onboarding tour */}
        <CoachTour open={tourOpen} onClose={() => setTourOpen(false)} />
      </div>
    </DashboardLayout>
  );
};

export default AiCoach;
