import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';

interface OnboardingWelcomeProps {
  onNext: () => void;
  onSkip: () => void;
}

const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({ onNext, onSkip }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center text-center space-y-8">
      {/* Animated logo */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
        <div className="relative w-20 h-20 rounded-2xl glass-card flex items-center justify-center border border-primary/30 shadow-[0_0_40px_hsl(var(--primary)/0.25)]">
          <TrendingUp className="w-10 h-10 text-primary" strokeWidth={1.5} />
        </div>
      </div>

      {/* Title */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-gradient-primary leading-tight">
          {t('onboarding.welcome')}
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto leading-relaxed">
          {t('onboarding.welcomeDesc')}
        </p>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
        {[
          { icon: '📊', label: 'Analytics' },
          { icon: '🤖', label: 'AI Coach' },
          { icon: '🎯', label: 'Alerts' },
        ].map((item) => (
          <div
            key={item.label}
            className="glass-card rounded-xl p-3 flex flex-col items-center gap-1.5 border border-white/[0.06]"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <Button onClick={onNext} size="lg" className="w-full text-base font-semibold">
          {t('onboarding.getStarted')}
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
        >
          {t('onboarding.skipAll')}
        </button>
      </div>
    </div>
  );
};

export default OnboardingWelcome;
