import React, { useId, useState, useEffect, useMemo, useCallback } from 'react';
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
  HelpCircle, Info, ChevronDown, Sparkles, Brain, Network,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const InfoTip: React.FC<{ text: string }> = ({ text }) => (
  <Tooltip delayDuration={200}>
    <TooltipTrigger asChild>
      <button type="button" className="inline-flex p-1.5 -m-1.5 rounded-md hover:bg-muted/50 transition-colors" aria-label="Info">
        <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground" />
      </button>
    </TooltipTrigger>
    <TooltipContent side="bottom" align="center" sideOffset={4} className="max-w-[280px] text-xs leading-relaxed z-50">
      {text}
    </TooltipContent>
  </Tooltip>
);

const PageSkeleton: React.FC = () => (
  <DashboardLayout pageTitle="AI Coach">
    <div className="flex flex-col gap-4 h-[calc(100vh-7rem)]">
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="flex gap-4 flex-1">
        <Skeleton className="flex-1 rounded-2xl" />
        <Skeleton className="w-[380px] rounded-2xl" />
      </div>
    </div>
  </DashboardLayout>
);

// ---- Collapsible section ----
const CollapsibleSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, defaultOpen = false, badge, children }) => {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="w-full flex items-center justify-between py-2 group rounded-md focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {badge}
        </div>
        <ChevronDown className={cn(
          'h-4 w-4 text-muted-foreground transition-transform duration-200',
          open && 'rotate-180',
        )} />
      </button>
      {open && (
        <div id={id} className="animate-in fade-in-0 slide-in-from-top-1 duration-200 pb-1">
          {children}
        </div>
      )}
    </div>
  );
};

// ---- NLQ section (visible only when chat is empty) ----
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
      <h2
        id="nlq-section-title"
        className="text-sm font-semibold text-foreground"
      >
        {t('aiCoach.nlq.sectionTitle', "Demandez à l'IA")}
      </h2>
      <p className="text-xs text-muted-foreground mt-0.5 mb-3">
        {t('aiCoach.nlq.sectionSubtitle', 'Suggestions pour démarrer')}
      </p>
      <NlqQuickPrompts onSelect={onSelect} disabled={disabled} />
    </section>
  );
};

// ---- Main page ----

const AiCoach: React.FC = () => {
  const { t } = useTranslation();
  const { data: disclaimerStatus, isLoading: disclaimerLoading } = useDisclaimer();
  const [mobileTab, setMobileTab] = useState<'chat' | 'coach'>('coach');
  const [tourOpen, setTourOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('all');
  const { hasPlan } = useFeatureFlags();
  const multiAgentAllowed = hasPlan('PRO');
  const [useMultiAgent, setUseMultiAgent] = useState(false);
  // Force-disable multi-agent if the user is downgraded mid-session below PRO.
  useEffect(() => {
    if (!multiAgentAllowed && useMultiAgent) {
      setUseMultiAgent(false);
    }
  }, [multiAgentAllowed, useMultiAgent]);
  const { accountId } = useAccountFilter(selectedAccount);

  // Lightweight read-only view of the chat thread so we know whether to show
  // the NLQ intro section. We intentionally use a separate hook instance here:
  // only the messages list is read, and the parent never calls send() — that
  // is owned by the CoachChat component instance via pendingPrompt below.
  const { messages: introMessages, isGenerating: introGenerating } = useCoachChat();
  const isChatEmpty = introMessages.length === 0;

  // Pending NLQ prompt forwarded to CoachChat. CoachChat consumes it once and
  // we clear it via the onPromptConsumed callback so the same chip can be
  // re-clicked in a future empty state.
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

  // Shared coaching panel content — memoized so re-renders of AiCoach
  // (e.g. from account selector changes) don't recreate the subtree.
  // MUST be declared before any early return to respect Rules of Hooks.
  const coachingPanel = useMemo(() => (
    <div className="space-y-3">
      {/* Block 1: Tilt HERO — biggest visual weight */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 p-5 bg-gradient-to-br from-card via-card to-emerald-500/5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('ai.tiltScore', 'Tilt Score')}
            </h3>
            <InfoTip text={t('ai.tiltScoreInfo', 'Measures emotional/impulsive trading risk (0-100). GREEN (0-30) = calm, YELLOW (31-60) = monitor, ORANGE (61-80) = caution, RED (81+) = stop trading.')} />
          </div>
        </div>
        <div className="flex justify-center mb-4">
          <TiltGauge accountId={accountId} compact={false} enableRealtime={false} />
        </div>
        <div className="border-t border-border/20 pt-3">
          <CoachStreak />
        </div>
      </div>

      {/* Block 2: Daily Workflow (compact, accordions closed by default) */}
      <div className="rounded-2xl border border-border/40 bg-card/60 p-4 space-y-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {t('ai.dailyWorkflow', 'Daily Workflow')}
        </h3>
        <CollapsibleSection
          title={t('ai.morningBriefing', 'Morning Briefing')}
          icon={<Sun className="h-4 w-4 text-amber-400" />}
          defaultOpen={false}
        >
          <div className="mt-2">
            <BriefingCard accountId={accountId} />
          </div>
        </CollapsibleSection>
        <div className="border-t border-border/20" />
        <CollapsibleSection
          title={t('ai.sessionDebrief', 'Session Debrief')}
          icon={<Moon className="h-4 w-4 text-blue-400" />}
          defaultOpen={false}
        >
          <div className="mt-2">
            <SessionDebriefCard accountId={accountId} />
          </div>
        </CollapsibleSection>
      </div>

      {/* Block 3: Activity — ScoreHistory + BehavioralAlerts merged */}
      <ActivityCard accountId={accountId} />

      {/* Block 4: Psychology — collapsed/secondary */}
      <details className="rounded-2xl border border-border/40 bg-card/40 group">
        <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('ai.psychology', 'Psychologie')}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4">
          <PsychologyCorrelation />
        </div>
      </details>
    </div>
  ), [accountId, t]);

  if (disclaimerLoading) return <PageSkeleton />;
  if (!disclaimerStatus?.accepted) return <DisclaimerModal />;

  return (
    <DashboardLayout pageTitle="AI Coach">
      <div className="flex flex-col h-[calc(100vh-7rem)]">
        {/* Header — brand badge, disclaimer tooltip, account selector, help */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Brand badge — gradient + status dot */}
            <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-amber-500 grid place-items-center shadow-lg shadow-primary/20">
              <Sparkles className="h-5 w-5 text-white" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="motion-safe:absolute motion-safe:inline-flex motion-safe:h-full motion-safe:w-full motion-safe:animate-ping motion-safe:rounded-full motion-safe:bg-emerald-400 motion-safe:opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-background" />
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t('ai.coachTitle', 'Coach')}</h1>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex p-1 -m-1 rounded-md hover:bg-muted/50" aria-label={t('ai.disclaimerLabel', 'Disclaimer')}>
                      <Info className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
                    {t('ai.disclaimer', 'AI-generated insights are for informational purposes only. Not financial advice.')}
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t('ai.coachSubtitle', 'Patterns, behaviour and session debriefs from your own trades.')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {multiAgentAllowed && (
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <label
                    htmlFor="multi-agent-toggle"
                    className={cn(
                      'hidden lg:inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors',
                      useMultiAgent
                        ? 'border-primary/40 bg-primary/5 text-primary'
                        : 'border-border/50 text-muted-foreground hover:bg-muted/30',
                    )}
                  >
                    <Network className="h-3.5 w-3.5" />
                    {t('aiCoach.orchestration.useMultiAgent', 'Multi-agent mode (beta)')}
                    <Switch
                      id="multi-agent-toggle"
                      checked={useMultiAgent}
                      onCheckedChange={setUseMultiAgent}
                      aria-label={t('aiCoach.orchestration.useMultiAgent', 'Multi-agent mode (beta)')}
                    />
                  </label>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
                  {t(
                    'aiCoach.orchestration.useMultiAgentTooltip',
                    'Routes your question to specialised agents (risk, psychology, strategy, data, education) and synthesises their answers. PRO+ only.',
                  )}
                </TooltipContent>
              </Tooltip>
            )}
            <AccountSelector value={selectedAccount} onChange={setSelectedAccount} className="w-44 hidden lg:flex" />
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
        </div>

        {/* Mobile: Tab switcher */}
        <div className="lg:hidden mb-3 flex-shrink-0">
          <div className="flex gap-1 p-1 rounded-lg bg-muted/30 border border-border/50">
            <button
              type="button"
              onClick={() => setMobileTab('chat')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors',
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
              onClick={() => setMobileTab('coach')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors',
                mobileTab === 'coach'
                  ? 'bg-card border-border/50 shadow-sm text-foreground'
                  : 'text-muted-foreground hover:bg-muted/30',
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              {t('ai.tabCoach', 'Coach')}
            </button>
          </div>
          {/* Mobile account selector */}
          <div className="mt-2">
            <AccountSelector value={selectedAccount} onChange={setSelectedAccount} className="w-full" />
          </div>
        </div>

        {/* Mobile: stacked panels with tab switcher */}
        <div className="lg:hidden flex-1 min-h-0">
          {mobileTab === 'chat' ? (
            <div className="flex h-full flex-col">
              {!useMultiAgent && isChatEmpty && (
                <NlqIntroSection
                  onSelect={handlePromptSelect}
                  disabled={introGenerating || pendingPrompt !== null}
                />
              )}
              <div className="flex-1 min-h-0">
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
          ) : (
            <div className="h-full overflow-y-auto">
              {coachingPanel}
            </div>
          )}
        </div>

        {/* Desktop: fixed-ratio flex layout */}
        <div className="hidden lg:flex flex-1 min-h-0 gap-3">
          <div className="flex-1 min-w-0 flex flex-col">
            {!useMultiAgent && isChatEmpty && (
              <NlqIntroSection
                onSelect={handlePromptSelect}
                disabled={introGenerating || pendingPrompt !== null}
              />
            )}
            <div className="flex-1 min-h-0">
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
          <div className="w-[380px] flex-shrink-0 overflow-y-auto">
            {coachingPanel}
          </div>
        </div>

        {/* Onboarding Tour */}
        <CoachTour open={tourOpen} onClose={() => setTourOpen(false)} />
      </div>
    </DashboardLayout>
  );
};

export default AiCoach;
