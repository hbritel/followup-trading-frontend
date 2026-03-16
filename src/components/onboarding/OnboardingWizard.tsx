import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompleteStep, useSkipOnboarding } from '@/hooks/useOnboarding';
import { useNavigate } from 'react-router-dom';

import OnboardingWelcome from './OnboardingWelcome';
import OnboardingConnectBroker from './OnboardingConnectBroker';
import OnboardingImportTrades from './OnboardingImportTrades';
import OnboardingExplore from './OnboardingExplore';

interface OnboardingWizardProps {
  onComplete: () => void;
}

type Direction = 'forward' | 'backward';

const STEPS = ['welcome', 'connect-broker', 'import-trades', 'explore'] as const;
type StepId = (typeof STEPS)[number];

const STEP_LABELS: Record<StepId, string> = {
  welcome: 'Welcome',
  'connect-broker': 'Connect',
  'import-trades': 'Import',
  explore: 'Explore',
};

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>('forward');
  const [animating, setAnimating] = useState(false);
  const [brokerChoice, setBrokerChoice] = useState<string | undefined>();

  const completeStep = useCompleteStep();
  const skipOnboarding = useSkipOnboarding();

  const currentStep = STEPS[currentIndex];
  const totalSteps = STEPS.length;

  const transitionTo = useCallback(
    (nextIndex: number, dir: Direction) => {
      if (animating) return;
      setAnimating(true);
      setDirection(dir);
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setAnimating(false);
      }, 300);
    },
    [animating]
  );

  const handleNext = useCallback(
    async (extra?: string) => {
      if (extra) setBrokerChoice(extra);

      // Mark step complete in backend (fire-and-forget, don't block UX)
      completeStep.mutate(currentStep);

      if (currentIndex < totalSteps - 1) {
        transitionTo(currentIndex + 1, 'forward');
      } else {
        onComplete();
        navigate('/dashboard');
      }
    },
    [currentStep, currentIndex, totalSteps, completeStep, transitionTo, onComplete, navigate]
  );

  const handleSkip = useCallback(async () => {
    await skipOnboarding.mutateAsync();
    onComplete();
    navigate('/dashboard');
  }, [skipOnboarding, onComplete, navigate]);

  const handleComplete = useCallback(async () => {
    completeStep.mutate(currentStep);
    onComplete();
    navigate('/dashboard');
  }, [currentStep, completeStep, onComplete, navigate]);

  const getSlideClasses = () => {
    if (!animating) return 'opacity-100 translate-x-0';
    if (direction === 'forward') return 'opacity-0 -translate-x-6';
    return 'opacity-0 translate-x-6';
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-xl overflow-auto">
      {/* Ambient blobs behind the wizard */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="ambient-blob ambient-blob-primary top-[-10%] left-[-5%] w-[45%] h-[45%]" />
        <div className="ambient-blob ambient-blob-gold bottom-[-10%] right-[-5%] w-[40%] h-[40%]" />
        <div className="ambient-blob ambient-blob-secondary top-[35%] left-[50%] w-[30%] h-[30%]" />
      </div>

      {/* Progress bar at top */}
      <div className="w-full px-4 pt-6 pb-2 flex justify-center">
        <div className="flex items-center gap-2 max-w-sm w-full">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <React.Fragment key={step}>
                {/* Step dot */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300',
                      isDone && 'bg-primary text-primary-foreground',
                      isCurrent && 'bg-primary/20 border-2 border-primary text-primary',
                      !isDone && !isCurrent && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-medium hidden sm:block',
                      isCurrent ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {STEP_LABELS[step]}
                  </span>
                </div>

                {/* Connector line */}
                {idx < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: idx < currentIndex ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step counter */}
      <div className="text-center pt-1 pb-4">
        <span className="text-xs text-muted-foreground">
          {t('onboarding.step')} {currentIndex + 1} {t('onboarding.of')} {totalSteps}
        </span>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-start justify-center px-4 pb-8">
        <div
          className={cn(
            'glass-card rounded-2xl p-6 sm:p-8 w-full max-w-lg transition-all duration-300',
            getSlideClasses()
          )}
        >
          {currentStep === 'welcome' && (
            <OnboardingWelcome onNext={handleNext} onSkip={handleSkip} />
          )}
          {currentStep === 'connect-broker' && (
            <OnboardingConnectBroker onNext={handleNext} onSkip={() => handleNext()} />
          )}
          {currentStep === 'import-trades' && (
            <OnboardingImportTrades
              onNext={handleNext}
              onSkip={() => handleNext()}
              brokerChoice={brokerChoice}
            />
          )}
          {currentStep === 'explore' && (
            <OnboardingExplore onComplete={handleComplete} />
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
