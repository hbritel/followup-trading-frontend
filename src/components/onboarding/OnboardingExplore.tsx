import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart2, Sparkles, Bell, Trophy } from 'lucide-react';

interface FeatureCard {
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
  href: string;
  color: string;
}

interface OnboardingExploreProps {
  onComplete: () => void;
}

const SparkleParticle: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div
    className="absolute w-1.5 h-1.5 rounded-full bg-amber-400/70 pointer-events-none"
    style={style}
  />
);

const OnboardingExplore: React.FC<OnboardingExploreProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [particles, setParticles] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);

  useEffect(() => {
    const generated = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `ambient-drift ${3 + Math.random() * 4}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 2}s`,
        opacity: 0.4 + Math.random() * 0.6,
      },
    }));
    setParticles(generated);
  }, []);

  const features: FeatureCard[] = [
    {
      icon: <BarChart2 className="w-5 h-5" />,
      titleKey: 'onboarding.featureDashboard',
      descKey: 'onboarding.featureDashboardDesc',
      href: '/dashboard',
      color: 'text-violet-400 bg-violet-500/10',
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      titleKey: 'onboarding.featureAiCoach',
      descKey: 'onboarding.featureAiCoachDesc',
      href: '/insights',
      color: 'text-amber-400 bg-amber-500/10',
    },
    {
      icon: <Bell className="w-5 h-5" />,
      titleKey: 'onboarding.featureAlerts',
      descKey: 'onboarding.featureAlertsDesc',
      href: '/alerts',
      color: 'text-blue-400 bg-blue-500/10',
    },
    {
      icon: <Trophy className="w-5 h-5" />,
      titleKey: 'onboarding.featureAchievements',
      descKey: 'onboarding.featureAchievementsDesc',
      href: '/badges',
      color: 'text-emerald-400 bg-emerald-500/10',
    },
  ];

  const handleNavigate = (href: string) => {
    onComplete();
    navigate(href);
  };

  return (
    <div className="flex flex-col space-y-6 relative overflow-hidden">
      {/* Sparkle particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <SparkleParticle key={p.id} style={p.style} />
        ))}
      </div>

      {/* Header */}
      <div className="text-center space-y-3 relative z-10">
        <div className="text-3xl mb-2">🎉</div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gradient-gold">
          {t('onboarding.allSet')}
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          {t('onboarding.allSetDesc')}
        </p>
      </div>

      {/* Feature cards grid */}
      <div className="grid grid-cols-2 gap-3 relative z-10">
        {features.map((feature) => (
          <button
            key={feature.href}
            onClick={() => handleNavigate(feature.href)}
            className="glass-card rounded-2xl p-4 flex flex-col gap-3 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)] cursor-pointer"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${feature.color}`}>
              {feature.icon}
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{t(feature.titleKey)}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {t(feature.descKey)}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* CTA */}
      <div className="relative z-10">
        <Button
          onClick={onComplete}
          size="lg"
          className="w-full text-base font-semibold"
        >
          {t('onboarding.goToDashboard')}
        </Button>
      </div>
    </div>
  );
};

export default OnboardingExplore;
