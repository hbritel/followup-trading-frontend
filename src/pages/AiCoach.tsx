import React, { useState, useEffect, useCallback } from 'react';
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
  HelpCircle, Info, Sparkles, Brain, Network, MessageSquare,
  LayoutDashboard, Image as ImageIcon, Target, Trophy, Scale,
  Sun, Moon, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';

// ──────────────────────────────────────────────────────────────────────
// Heavy tool definitions — open in a side Sheet so they don't compete with
// chat or the always-on widgets. Light tools (Activity / Psychology /
// Auto-Playbook) live inline in the right rail because their content is
// too sparse to fill a full canvas.
// ──────────────────────────────────────────────────────────────────────

type ToolKey = 'briefing' | 'debrief' | 'goals' | 'skills' | 'rules' | 'vision';

interface ToolDef {
  key: ToolKey;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  hoverBg: string;
  labelKey: string;
  defaultLabel: string;
  descKey: string;
  defaultDesc: string;
}

const TOOLS: ToolDef[] = [
  {
    key: 'briefing',
    icon: Sun,
    iconClass: 'text-amber-500',
    hoverBg: 'group-hover:bg-amber-500/10',
    labelKey: 'ai.morningBriefing',
    defaultLabel: 'Briefing',
    descKey: 'aiCoach.cockpit.briefingDesc',
    defaultDesc: 'Plan du jour',
  },
  {
    key: 'debrief',
    icon: Moon,
    iconClass: 'text-blue-400',
    hoverBg: 'group-hover:bg-blue-500/10',
    labelKey: 'ai.sessionDebrief',
    defaultLabel: 'Debrief',
    descKey: 'aiCoach.cockpit.debriefDesc',
    defaultDesc: 'Bilan session',
  },
  {
    key: 'goals',
    icon: Target,
    iconClass: 'text-sky-400',
    hoverBg: 'group-hover:bg-sky-500/10',
    labelKey: 'aiCoach.smartGoals.sectionTitle',
    defaultLabel: 'Smart Goals',
    descKey: 'aiCoach.cockpit.goalsDesc',
    defaultDesc: 'Objectifs SMART',
  },
  {
    key: 'skills',
    icon: Trophy,
    iconClass: 'text-amber-400',
    hoverBg: 'group-hover:bg-amber-500/10',
    labelKey: 'aiCoach.skillTree.sectionTitle',
    defaultLabel: 'Skill Tree',
    descKey: 'aiCoach.cockpit.skillsDesc',
    defaultDesc: 'Progression',
  },
  {
    key: 'rules',
    icon: Scale,
    iconClass: 'text-rose-400',
    hoverBg: 'group-hover:bg-rose-500/10',
    labelKey: 'counterfactual.rulesShort',
    defaultLabel: 'Rules',
    descKey: 'aiCoach.cockpit.rulesDesc',
    defaultDesc: 'What-if compliance',
  },
  {
    key: 'vision',
    icon: ImageIcon,
    iconClass: 'text-fuchsia-400',
    hoverBg: 'group-hover:bg-fuchsia-500/10',
    labelKey: 'visionAnalysis.sectionTitle',
    defaultLabel: 'Chart Analyzer',
    descKey: 'aiCoach.cockpit.visionDesc',
    defaultDesc: 'Analyse image',
  },
];

const TOOL_INDEX: Record<ToolKey, ToolDef> = TOOLS.reduce((acc, tool) => {
  acc[tool.key] = tool;
  return acc;
}, {} as Record<ToolKey, ToolDef>);

// ──────────────────────────────────────────────────────────────────────
// Skeleton — preserves the cockpit's split shape during disclaimer load.
// ──────────────────────────────────────────────────────────────────────
const PageSkeleton: React.FC = () => (
  <DashboardLayout pageTitle="AI Coach">
    <div className="flex flex-col gap-4 h-[calc(100vh-7rem)]">
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="flex gap-4 flex-1 min-h-0">
        <Skeleton className="flex-1 rounded-2xl" />
        <Skeleton className="hidden lg:block w-[360px] rounded-2xl" />
      </div>
    </div>
  </DashboardLayout>
);

// ──────────────────────────────────────────────────────────────────────
// NLQ section — visible only when chat is empty. Lives inside the chat
// column so it doesn't push the rail down.
// ──────────────────────────────────────────────────────────────────────
const NlqIntroSection: React.FC<{
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}> = ({ onSelect, disabled }) => {
  const { t } = useTranslation();
  return (
    <section
      aria-labelledby="nlq-section-title"
      className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-background p-4 mb-3 flex-shrink-0"
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
// Tilt + Streak hero — top of the right rail. Always visible. Largest
// visual weight in the rail because it's the most-monitored signal.
// ──────────────────────────────────────────────────────────────────────
const TiltStreakHero: React.FC<{ accountId?: string | null }> = ({ accountId }) => {
  const { t } = useTranslation();
  return (
    <section
      aria-labelledby="tilt-hero-title"
      className="relative overflow-hidden rounded-2xl border border-border/40 p-5 bg-gradient-to-br from-card via-card to-emerald-500/5 shadow-lg"
    >
      <header className="flex items-center justify-between mb-3">
        <h2
          id="tilt-hero-title"
          className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
        >
          {t('ai.tiltScore', 'Tilt Score')}
        </h2>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex p-1.5 -m-1.5 rounded-md hover:bg-muted/50 transition-colors"
              aria-label={t('ai.tiltScoreInfo', 'Tilt info')}
            >
              <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            align="end"
            sideOffset={4}
            className="max-w-[280px] text-xs leading-relaxed z-50"
          >
            {t('ai.tiltScoreInfo', 'Measures emotional/impulsive trading risk (0-100). GREEN (0-30) = calm, YELLOW (31-60) = monitor, ORANGE (61-80) = caution, RED (81+) = stop trading.')}
          </TooltipContent>
        </Tooltip>
      </header>
      <div className="flex justify-center mb-4">
        <TiltGauge accountId={accountId} compact={false} enableRealtime={false} />
      </div>
      <div className="border-t border-border/20 pt-3">
        <CoachStreak />
      </div>
    </section>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Tool launcher button — fits into a 2-col grid in the rail. Click opens
// the matching tool in a right-side Sheet.
// ──────────────────────────────────────────────────────────────────────
interface ToolLauncherProps {
  tool: ToolDef;
  onClick: () => void;
}

const ToolLauncher: React.FC<ToolLauncherProps> = ({ tool, onClick }) => {
  const { t } = useTranslation();
  const Icon = tool.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t(tool.labelKey, tool.defaultLabel)}
      className={cn(
        'group relative flex flex-col items-start gap-1.5 rounded-xl border border-border/40',
        'bg-card/40 hover:bg-card/70 hover:border-border/70 p-3 text-left transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
      )}
    >
      <span
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted/30 transition-colors',
          tool.hoverBg,
        )}
      >
        <Icon className={cn('h-4 w-4', tool.iconClass)} />
      </span>
      <div className="min-w-0 w-full pr-4">
        <div className="text-xs font-semibold text-foreground truncate">
          {t(tool.labelKey, tool.defaultLabel)}
        </div>
        <div className="text-[10px] text-muted-foreground truncate">
          {t(tool.descKey, tool.defaultDesc)}
        </div>
      </div>
      <ArrowRight
        aria-hidden="true"
        className="absolute top-3 right-3 h-3.5 w-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
      />
    </button>
  );
};

// ──────────────────────────────────────────────────────────────────────
// Light widget shell — keeps Auto-Playbook / Psychology visually aligned
// with the rest of the rail without forcing them into the heavy-tool
// Sheet treatment.
// ──────────────────────────────────────────────────────────────────────
const LightWidget: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <section className="rounded-2xl border border-border/40 bg-card/40 p-4 space-y-3">
    <header className="flex items-center gap-2">
      {icon}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h2>
    </header>
    <div>{children}</div>
  </section>
);

// ──────────────────────────────────────────────────────────────────────
// Main page — Cockpit Layout
// Left (~62%): chat (centerpiece, always-visible)
// Right (~38%): persistent rail — tilt+streak hero, tool launchers, light
// widgets stacked. Heavy tools open as right-side Sheet.
// ──────────────────────────────────────────────────────────────────────

const AiCoach: React.FC = () => {
  const { t } = useTranslation();
  const { data: disclaimerStatus, isLoading: disclaimerLoading } = useDisclaimer();
  const [tourOpen, setTourOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'coach'>('chat');
  const [activeTool, setActiveTool] = useState<ToolKey | null>(null);
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
    if (mobileTab !== 'chat') setMobileTab('chat');
  }, [introGenerating, mobileTab]);
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

  const renderToolBody = useCallback((key: ToolKey): React.ReactNode => {
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
      default:
        return null;
    }
  }, [accountId]);

  if (disclaimerLoading) return <PageSkeleton />;
  if (!disclaimerStatus?.accepted) return <DisclaimerModal />;

  const activeToolDef = activeTool ? TOOL_INDEX[activeTool] : null;
  const ActiveToolIcon = activeToolDef?.icon;

  // ── Header ────────────────────────────────────────────────────────
  const header = (
    <header className="flex items-center justify-between gap-2 mb-4 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-amber-500 grid place-items-center shadow-lg shadow-primary/20 shrink-0">
          <Sparkles className="h-5 w-5 text-white" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            <span className="motion-safe:absolute motion-safe:inline-flex motion-safe:h-full motion-safe:w-full motion-safe:animate-ping motion-safe:rounded-full motion-safe:bg-emerald-400 motion-safe:opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-background" />
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
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
          <p className="hidden sm:block text-sm text-muted-foreground mt-0.5 truncate">
            {t('ai.coachSubtitle', 'Patterns, behaviour and session debriefs from your own trades.')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
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
          className="w-44 hidden lg:flex"
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

  // ── Chat column (used in both desktop and mobile) ─────────────────
  const chatColumn = (
    <div className="flex h-full min-h-0 flex-col">
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
  );

  // ── Right rail content ────────────────────────────────────────────
  const railContent = (
    <div className="space-y-3">
      <TiltStreakHero accountId={accountId} />

      <section
        aria-labelledby="tools-grid-title"
        className="rounded-2xl border border-border/40 bg-card/40 p-3"
      >
        <h2
          id="tools-grid-title"
          className="px-1 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
        >
          {t('aiCoach.cockpit.tools', 'Outils du coach')}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {TOOLS.map((tool) => (
            <ToolLauncher
              key={tool.key}
              tool={tool}
              onClick={() => setActiveTool(tool.key)}
            />
          ))}
        </div>
      </section>

      <ActivityCard accountId={accountId} />

      <LightWidget
        title={t('autoPlaybook.sectionTitle', 'Auto-Playbook')}
        icon={<Sparkles className="h-4 w-4 text-emerald-400" />}
      >
        <AutoPlaybookGenerator />
      </LightWidget>

      <LightWidget
        title={t('ai.psychology', 'Psychologie')}
        icon={<Brain className="h-4 w-4 text-violet-400" />}
      >
        <PsychologyCorrelation />
      </LightWidget>
    </div>
  );

  return (
    <DashboardLayout pageTitle="AI Coach">
      <div className="flex flex-col h-[calc(100vh-7rem)]">
        {header}

        {/* Mobile: tab switcher (chat / coach) keeps both surfaces accessible
            without crowding small viewports. */}
        <div className="lg:hidden mb-3 flex-shrink-0">
          <div className="flex gap-1 p-1 rounded-lg bg-muted/30 border border-border/50">
            <button
              type="button"
              onClick={() => setMobileTab('chat')}
              aria-pressed={mobileTab === 'chat'}
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
              aria-pressed={mobileTab === 'coach'}
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
          <div className="mt-2">
            <AccountSelector
              value={selectedAccount}
              onChange={setSelectedAccount}
              className="w-full"
            />
          </div>
        </div>

        {/* Mobile body — single column, switched by tab. */}
        <div className="lg:hidden flex-1 min-h-0">
          {mobileTab === 'chat' ? (
            chatColumn
          ) : (
            <div className="h-full overflow-y-auto pb-2">{railContent}</div>
          )}
        </div>

        {/* Desktop body — 2-col cockpit. Left = chat (62%), right = rail (38%). */}
        <div className="hidden lg:grid flex-1 min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          {chatColumn}
          <aside
            aria-label={t('aiCoach.cockpit.railLabel', 'Coach panel')}
            className="overflow-y-auto pr-1"
          >
            {railContent}
          </aside>
        </div>

        {/* Heavy-tool Sheet — opens from the right when a launcher is clicked.
            Chat stays mounted underneath, so SSE state survives. */}
        <Sheet
          open={activeTool !== null}
          onOpenChange={(open) => { if (!open) setActiveTool(null); }}
        >
          <SheetContent
            side="right"
            className="w-full sm:max-w-4xl p-0 flex flex-col"
          >
            {activeToolDef && ActiveToolIcon && (
              <>
                <SheetHeader className="border-b border-border/40 px-5 py-4 flex-shrink-0 space-y-1">
                  <SheetTitle className="flex items-center gap-2 text-base">
                    <span
                      className={cn(
                        'inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted/30',
                        activeToolDef.hoverBg.replace('group-hover:', ''),
                      )}
                    >
                      <ActiveToolIcon className={cn('h-4 w-4', activeToolDef.iconClass)} />
                    </span>
                    <span className="truncate">
                      {t(activeToolDef.labelKey, activeToolDef.defaultLabel)}
                    </span>
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    {t(activeToolDef.descKey, activeToolDef.defaultDesc)}
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-5">
                  {renderToolBody(activeToolDef.key)}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        <CoachTour open={tourOpen} onClose={() => setTourOpen(false)} />
      </div>
    </DashboardLayout>
  );
};

export default AiCoach;
