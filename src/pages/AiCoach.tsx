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
  Wrench, X, MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PageSkeleton: React.FC = () => (
  <DashboardLayout pageTitle="AI Coach">
    <div className="flex flex-col gap-3 h-[calc(100vh-7rem)]">
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-10 w-full rounded-xl" />
      <Skeleton className="flex-1 rounded-2xl" />
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
// Chip — quick action button used above the chat
// ──────────────────────────────────────────────────────────────────────
type ChipColor = 'amber' | 'blue' | 'sky' | 'fuchsia' | 'emerald' | 'violet' | 'rose';

const CHIP_TINTS: Record<ChipColor, string> = {
  amber: 'border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300',
  blue: 'border-blue-500/30 hover:bg-blue-500/10 text-blue-700 dark:text-blue-300',
  sky: 'border-sky-500/30 hover:bg-sky-500/10 text-sky-700 dark:text-sky-300',
  fuchsia: 'border-fuchsia-500/30 hover:bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300',
  emerald: 'border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  violet: 'border-violet-500/30 hover:bg-violet-500/10 text-violet-700 dark:text-violet-300',
  rose: 'border-rose-500/30 hover:bg-rose-500/10 text-rose-700 dark:text-rose-300',
};

const Chip: React.FC<{
  icon: React.ReactNode;
  label: string;
  color: ChipColor;
  onClick: () => void;
  active?: boolean;
}> = ({ icon, label, color, onClick, active }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-card/40 backdrop-blur-sm',
      'text-xs font-medium whitespace-nowrap transition-all duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
      'min-h-[36px]',
      CHIP_TINTS[color],
      active && 'ring-2 ring-primary/30 bg-primary/5',
    )}
  >
    {icon}
    <span>{label}</span>
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

  // Panel metadata (titles + icons). The actual content is rendered inside
  // the sheet body switch below so we do not pay the render cost when the
  // sheet is closed.
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
      icon: <Scale className="h-4 w-4 text-amber-400" />,
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

  // The body of the active sheet — only rendered when openPanel matches.
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

  // ── Quick action chips above the chat ────────────────────────────────
  const quickChips = (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-thin">
      <Chip
        icon={<Sun className="h-3.5 w-3.5" />}
        label={t('ai.morningBriefing', 'Briefing')}
        color="amber"
        onClick={() => open('briefing')}
        active={openPanel === 'briefing'}
      />
      <Chip
        icon={<Moon className="h-3.5 w-3.5" />}
        label={t('ai.sessionDebrief', 'Debrief')}
        color="blue"
        onClick={() => open('debrief')}
        active={openPanel === 'debrief'}
      />
      <Chip
        icon={<Target className="h-3.5 w-3.5" />}
        label={t('aiCoach.smartGoals.sectionTitle', 'Goals')}
        color="sky"
        onClick={() => open('goals')}
        active={openPanel === 'goals'}
      />
      <Chip
        icon={<Trophy className="h-3.5 w-3.5" />}
        label={t('aiCoach.skillTree.sectionTitle', 'Skills')}
        color="amber"
        onClick={() => open('skills')}
        active={openPanel === 'skills'}
      />
      <Chip
        icon={<Scale className="h-3.5 w-3.5" />}
        label={t('counterfactual.rulesShort', 'Rules')}
        color="amber"
        onClick={() => open('rules')}
        active={openPanel === 'rules'}
      />
    </div>
  );

  // ── Tilt pill in header — compact at-a-glance score ──────────────────
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

  // ── Tools dropdown — secondary AI features ───────────────────────────
  const toolsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          aria-label={t('aiCoach.tools', 'AI tools')}
        >
          <Wrench className="h-4 w-4" />
          <span className="hidden sm:inline">{t('aiCoach.tools', 'Tools')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {t('aiCoach.toolsLabel', 'AI Tools')}
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => open('vision')}>
          <ImageIcon className="mr-2 h-4 w-4 text-fuchsia-400" />
          {t('visionAnalysis.sectionTitle', 'Chart Analyzer')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => open('autoPlaybook')}>
          <Sparkles className="mr-2 h-4 w-4 text-emerald-400" />
          {t('autoPlaybook.sectionTitle', 'Auto-Playbook')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {t('aiCoach.analyticsLabel', 'Analytics')}
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => open('activity')}>
          <ActivityIcon className="mr-2 h-4 w-4 text-blue-400" />
          {t('ai.activity', 'Activity & alerts')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => open('psychology')}>
          <Brain className="mr-2 h-4 w-4 text-violet-400" />
          {t('ai.psychology', 'Psychology')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

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
            <div className="hidden lg:flex">
              <CoachStreakCompact />
            </div>
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
            {toolsMenu}
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

        {/* Mobile: account + tilt + multi-agent in a compact secondary row */}
        <div className="md:hidden flex items-center gap-2 flex-shrink-0">
          {tiltPill}
          <AccountSelector
            value={selectedAccount}
            onChange={setSelectedAccount}
            className="flex-1"
          />
        </div>

        {/* Quick action chips */}
        <div className="flex-shrink-0">{quickChips}</div>

        {/* Chat — center stage, full width */}
        <main className="flex-1 min-h-0 flex flex-col">
          {!useMultiAgent && isChatEmpty && (
            <NlqIntroSection
              onSelect={handlePromptSelect}
              disabled={introGenerating || pendingPrompt !== null}
            />
          )}
          <div className="flex-1 min-h-0 mx-auto w-full max-w-5xl">
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
        </main>

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

// ──────────────────────────────────────────────────────────────────────
// CoachStreakCompact — header pill shape that mirrors CoachStreak data
// without occupying a hero block. Falls back to a thin rendering of the
// existing CoachStreak component, scoped for the header bar.
// ──────────────────────────────────────────────────────────────────────
const CoachStreakCompact: React.FC = () => (
  <div className="hidden lg:flex items-center rounded-full border border-border/50 bg-card/40 px-2 py-0.5 max-w-[180px]">
    <div className="text-[11px] leading-tight">
      <CoachStreak />
    </div>
  </div>
);

export default AiCoach;
