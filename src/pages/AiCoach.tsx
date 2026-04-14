import React, { useState, useEffect } from 'react';
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
import InlineChat from '@/components/ai/InlineChat';
import CoachTour from '@/components/ai-coach/CoachTour';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Brain, MessageSquare, LayoutDashboard, Sun, Moon, Sparkles, Heart, HelpCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';


const InfoTip: React.FC<{ text: string }> = ({ text }) => (
  <Tooltip delayDuration={200}>
    <TooltipTrigger asChild>
      <button type="button" className="inline-flex">
        <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors" />
      </button>
    </TooltipTrigger>
    <TooltipContent side="left" align="start" className="max-w-[250px] text-xs leading-relaxed">
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

const AiCoach: React.FC = () => {
  const { t } = useTranslation();
  const { data: disclaimerStatus, isLoading: disclaimerLoading } = useDisclaimer();
  const [mobileTab, setMobileTab] = useState<'chat' | 'coach'>('chat');
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [emotionOpen, setEmotionOpen] = useState(false);
  const [debriefOpen, setDebriefOpen] = useState(false);
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

  if (disclaimerLoading) return <PageSkeleton />;
  if (!disclaimerStatus?.accepted) return <DisclaimerModal />;

  return (
    <DashboardLayout pageTitle="AI Coach">
      <div className="flex flex-col h-[calc(100vh-7rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
              <Brain className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {t('ai.coachTitle', 'AI Trading Coach')}
              </h1>
              <p className="text-xs text-muted-foreground">
                {t('ai.coachSubtitle', 'Your personal trading mentor')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
        </div>

        {/* Main content: Chat (left) + Coaching Panel (right) */}
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Chat Area — hero */}
          <div
            className={cn(
              'flex-1 min-w-0',
              mobileTab !== 'chat' && 'hidden lg:flex lg:flex-col',
            )}
          >
            <InlineChat className="h-full" />
          </div>

          {/* Coaching Panel — right sidebar */}
          <div
            className={cn(
              'w-full lg:w-[380px] flex-shrink-0 overflow-y-auto space-y-4',
              mobileTab !== 'coach' && 'hidden lg:block',
            )}
          >
            {/* Account filter */}
            <AccountSelector
              value={selectedAccount}
              onChange={setSelectedAccount}
              className="w-full"
            />

            {/* Tilt Score — prominent */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('ai.tiltScore', 'Tilt Score')}
                  </h3>
                  <InfoTip text={t('ai.tiltScoreInfo', 'Measures emotional/impulsive trading risk (0-100). Based on 6 factors: consecutive losses, trade frequency spikes, position size escalation, time between losses, session drawdown, and off-hours trading. GREEN (0-30) = calm, YELLOW (31-60) = monitor, ORANGE (61-80) = caution, RED (81+) = stop trading.')} />
                </div>
                <Sparkles className="h-4 w-4 text-amber-400" />
              </div>
              <div className="flex justify-center">
                <TiltGauge accountId={accountId} compact={false} />
              </div>
            </div>

            {/* Coaching Streak */}
            <CoachStreak />

            {/* Daily Workflow — 3 steps */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {t('ai.dailyWorkflow', 'Daily Workflow')}
              </h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setBriefingOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/50 transition-colors text-left group"
                >
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Sun className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {t('ai.morningBriefing', 'Morning Briefing')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('ai.briefingDesc', 'AI analysis before you trade')}
                    </p>
                  </div>
                  <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    View →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setEmotionOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/50 transition-colors text-left group"
                >
                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {t('ai.logEmotion', 'Log Emotion')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('ai.emotionDesc', 'Track your trading mindset')}
                    </p>
                  </div>
                  <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Now →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDebriefOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/50 transition-colors text-left group"
                >
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Moon className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {t('ai.sessionDebrief', 'Session Debrief')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('ai.debriefDesc', 'Review your trading session')}
                    </p>
                  </div>
                  <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    View →
                  </span>
                </button>
              </div>
            </div>

            {/* Session Score History */}
            <ScoreHistory />

            {/* Behavioral Alerts — compact */}
            <BehavioralAlertsList accountId={accountId} />

            {/* Psychology Correlation */}
            <PsychologyCorrelation />

            {/* Disclaimer — small at bottom */}
            <p className="text-[10px] text-muted-foreground/50 text-center px-4 pb-2">
              {t(
                'ai.disclaimer',
                'AI-generated insights are for informational purposes only. Not financial advice.',
              )}
            </p>
          </div>
        </div>

        {/* Briefing Sheet */}
        <Sheet open={briefingOpen} onOpenChange={setBriefingOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-amber-400" />
                {t('ai.morningBriefing', 'Morning Briefing')}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <BriefingCard accountId={accountId} />
            </div>
          </SheetContent>
        </Sheet>

        {/* Emotion Sheet — guides user to log emotions on recent trades */}
        <Sheet open={emotionOpen} onOpenChange={setEmotionOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-purple-400" />
                {t('ai.logEmotion', 'Log Emotion')}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('ai.emotionGuide', 'Emotions are logged per trade to correlate your mindset with outcomes. Open any trade from the Trades page and use the Psychology tab to log how you felt.')}
              </p>
              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                <p className="text-xs font-medium text-purple-400 mb-2">
                  {t('ai.emotionHowTo', 'How to log emotions')}
                </p>
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>{t('ai.emotionStep1', 'Go to the Trades page')}</li>
                  <li>{t('ai.emotionStep2', 'Click on any trade to open details')}</li>
                  <li>{t('ai.emotionStep3', 'Scroll to the Psychology section')}</li>
                  <li>{t('ai.emotionStep4', 'Select your emotion and save')}</li>
                </ol>
              </div>
              <div className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEmotionOpen(false);
                    window.location.href = '/trades';
                  }}
                >
                  {t('ai.goToTrades', 'Go to Trades')} →
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Debrief Sheet */}
        <Sheet open={debriefOpen} onOpenChange={setDebriefOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-blue-400" />
                {t('ai.sessionDebrief', 'Session Debrief')}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <SessionDebriefCard accountId={accountId} />
            </div>
          </SheetContent>
        </Sheet>

        {/* Onboarding Tour */}
        <CoachTour open={tourOpen} onClose={() => setTourOpen(false)} />
      </div>
    </DashboardLayout>
  );
};

export default AiCoach;
