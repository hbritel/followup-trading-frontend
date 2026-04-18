import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useDisclaimer } from '@/hooks/useDisclaimer';
import DisclaimerModal from '@/components/ai-coach/DisclaimerModal';
import TiltGauge from '@/components/ai-coach/TiltGauge';
import BriefingCard from '@/components/ai-coach/BriefingCard';
import BehavioralAlertsList from '@/components/ai-coach/BehavioralAlertsList';
import SessionDebriefCard from '@/components/ai-coach/SessionDebriefCard';
import PsychologyCorrelation from '@/components/ai-coach/PsychologyCorrelation';
import CoachStreak from '@/components/ai-coach/CoachStreak';
import ScoreHistory from '@/components/ai-coach/ScoreHistory';
import AccountSelector from '@/components/dashboard/AccountSelector';
import { useAccountFilter } from '@/hooks/useAccountFilter';
import CoachChat from '@/components/ai/CoachChat';
import CoachTour from '@/components/ai-coach/CoachTour';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  Brain, MessageSquare, LayoutDashboard, Sun, Moon, Sparkles,
  HelpCircle, Info, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const InfoTip: React.FC<{ text: string }> = ({ text }) => (
  <Tooltip delayDuration={200}>
    <TooltipTrigger asChild>
      <button type="button" className="inline-flex">
        <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors" />
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
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-2 group"
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
        <div className="animate-in fade-in-0 slide-in-from-top-1 duration-200 pb-1">
          {children}
        </div>
      )}
    </div>
  );
};

// ---- Main page ----

const AiCoach: React.FC = () => {
  const { t } = useTranslation();
  const { data: disclaimerStatus, isLoading: disclaimerLoading } = useDisclaimer();
  const [mobileTab, setMobileTab] = useState<'chat' | 'coach'>('coach');
  const [tourOpen, setTourOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('all');
  const { accountId } = useAccountFilter(selectedAccount);

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
      {/* Block 1: Status at a glance (Tilt + Streak) */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('ai.tiltScore', 'Tilt Score')}
            </h3>
            <InfoTip text={t('ai.tiltScoreInfo', 'Measures emotional/impulsive trading risk (0-100). GREEN (0-30) = calm, YELLOW (31-60) = monitor, ORANGE (61-80) = caution, RED (81+) = stop trading.')} />
          </div>
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
        </div>
        <div className="flex justify-center mb-3">
          <TiltGauge accountId={accountId} compact={false} enableRealtime={false} />
        </div>
        <div className="border-t border-border/30 my-3" />
        <CoachStreak />
      </div>

      {/* Block 2: Daily Workflow (Briefing + Debrief inline) */}
      <div className="glass-card rounded-2xl p-4 space-y-1">
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

      {/* Block 3: Session Scores */}
      <ScoreHistory />

      {/* Block 4: Behavioral Alerts */}
      <BehavioralAlertsList accountId={accountId} enableRealtime={false} />

      {/* Block 5: Psychology Correlation */}
      <PsychologyCorrelation />

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground/40 text-center px-4 pb-2">
        {t('ai.disclaimer', 'AI-generated insights are for informational purposes only. Not financial advice.')}
      </p>
    </div>
  ), [accountId, t]);

  if (disclaimerLoading) return <PageSkeleton />;
  if (!disclaimerStatus?.accepted) return <DisclaimerModal />;

  return (
    <DashboardLayout pageTitle="AI Coach">
      <div className="flex flex-col h-[calc(100vh-7rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
              <Brain className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t('ai.coachTitle', 'AI Trading Coach')}</h1>
              <p className="text-xs text-muted-foreground">{t('ai.coachSubtitle', 'Your personal trading mentor')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AccountSelector
              value={selectedAccount}
              onChange={setSelectedAccount}
              className="w-44 hidden lg:flex"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTourOpen(true)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title={t('ai.tourHelp', 'How it works')}
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
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
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
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
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
            <CoachChat className="h-full" />
          ) : (
            <div className="h-full overflow-y-auto">
              {coachingPanel}
            </div>
          )}
        </div>

        {/* Desktop: fixed-ratio flex layout (resizable panels disabled to eliminate flickering) */}
        <div className="hidden lg:flex flex-1 min-h-0 gap-3">
          <div className="flex-1 min-w-0">
            <CoachChat className="h-full" />
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
