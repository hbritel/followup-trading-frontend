import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface UpgradePromptProps {
  feature: string;
  currentPlan?: string;
  requiredPlan: 'STARTER' | 'PRO' | 'ELITE' | 'TEAM';
  className?: string;
}

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  PRO: 'Pro',
  ELITE: 'Elite',
  TEAM: 'Team',
};

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  requiredPlan,
  className,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const planLabel = PLAN_LABELS[requiredPlan] ?? requiredPlan;
  const isElite = requiredPlan === 'ELITE';
  const isTeam = requiredPlan === 'TEAM';
  const isStarter = requiredPlan === 'STARTER';

  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-6 flex flex-col items-center text-center gap-4',
        isTeam
          ? 'border-fuchsia-500/30 shadow-[0_0_20px_rgba(217,70,239,0.08)]'
          : isElite
            ? 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
            : isStarter
              ? 'border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.08)]'
              : 'border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.08)]',
        className,
      )}
    >
      <div
        className={cn(
          'h-12 w-12 rounded-full flex items-center justify-center',
          isTeam
            ? 'bg-fuchsia-500/10'
            : isElite
              ? 'bg-amber-500/10'
              : isStarter
                ? 'bg-blue-500/10'
                : 'bg-primary/10',
        )}
      >
        <Lock
          className={cn(
            'h-5 w-5',
            isTeam
              ? 'text-fuchsia-400'
              : isElite
                ? 'text-amber-400'
                : isStarter
                  ? 'text-blue-400'
                  : 'text-primary',
          )}
        />
      </div>

      <div className="space-y-1">
        <p className="font-semibold text-sm">{t('subscription.limitReached')}</p>
        <p className="text-sm text-muted-foreground">
          {t('subscription.upgradeRequired')}{' '}
          <span
            className={cn(
              'font-semibold',
              isTeam
                ? 'text-fuchsia-400'
                : isElite
                  ? 'text-amber-400'
                  : isStarter
                    ? 'text-blue-400'
                    : 'text-primary',
            )}
          >
            {planLabel}
          </span>{' '}
          — <span className="text-muted-foreground">{feature}</span>
        </p>
      </div>

      <Button
        size="sm"
        className={cn(
          isTeam &&
            'bg-gradient-to-r from-fuchsia-500 to-fuchsia-400 text-white hover:from-fuchsia-600 hover:to-fuchsia-500 border-0',
          isElite &&
            'bg-gradient-to-r from-amber-500 to-amber-400 text-white hover:from-amber-600 hover:to-amber-500 border-0',
          isStarter &&
            'bg-blue-500 text-white hover:bg-blue-600 border-0',
        )}
        variant={isTeam || isElite || isStarter ? 'outline' : 'default'}
        onClick={() => navigate('/pricing')}
      >
        {t('subscription.upgrade')} to {planLabel}
        <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};

export default UpgradePrompt;
