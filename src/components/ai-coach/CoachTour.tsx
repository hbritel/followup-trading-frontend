import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Brain,
  MessageSquare,
  Calendar,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoachTourProps {
  open: boolean;
  onClose: () => void;
}

const CoachTour: React.FC<CoachTourProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: Brain,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
      title: t('ai.tourWelcomeTitle', 'Your AI Trading Coach'),
      description: t(
        'ai.tourWelcomeDesc',
        "Get personalized trading insights, real-time coaching, and behavioral analysis powered by AI. Let's explore what your coach can do.",
      ),
    },
    {
      icon: MessageSquare,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
      title: t('ai.tourChatTitle', 'Ask Your Coach Anything'),
      description: t(
        'ai.tourChatDesc',
        'Ask questions about your trading patterns, get strategy advice, or analyze your recent performance. Your coach knows your trading history.',
      ),
    },
    {
      icon: Calendar,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10',
      title: t('ai.tourWorkflowTitle', 'Daily Trading Ritual'),
      description: t(
        'ai.tourWorkflowDesc',
        'Start each day with a Morning Briefing, log your emotions during trading, and end with a Session Debrief. Building this habit is key to improvement.',
      ),
    },
    {
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
      title: t('ai.tourTiltTitle', 'Stay in Control'),
      description: t(
        'ai.tourTiltDesc',
        "Your Tilt Score monitors your emotional state in real-time. Behavioral alerts warn you when you're overtrading, revenge trading, or breaking your rules.",
      ),
    },
    {
      icon: TrendingUp,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      title: t('ai.tourProgressTitle', 'Measure Your Growth'),
      description: t(
        'ai.tourProgressDesc',
        'Watch your session scores improve over time, build coaching streaks, and discover how your emotions correlate with your trading performance.',
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  const handleNext = () => {
    if (isLast) {
      onClose();
      setStep(0);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) setStep((s) => s - 1);
  };

  const handleClose = () => {
    onClose();
    setStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center py-4">
          {/* Icon */}
          <div
            className={cn(
              'h-16 w-16 rounded-2xl flex items-center justify-center mb-5',
              current.iconBg,
            )}
          >
            <current.icon className={cn('h-8 w-8', current.iconColor)} />
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold mb-2">{current.title}</h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
            {current.description}
          </p>

          {/* Step dots */}
          <div className="flex gap-1.5 mt-6">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-200',
                  i === step
                    ? 'w-6 bg-primary'
                    : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50',
                )}
              />
            ))}
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={isFirst}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('common.previous', 'Previous')}
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              {t('common.skip', 'Skip')}
            </Button>
            <Button size="sm" onClick={handleNext} className="gap-1">
              {isLast
                ? t('ai.tourGetStarted', 'Get Started')
                : t('common.next', 'Next')}
              {!isLast && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CoachTour;
