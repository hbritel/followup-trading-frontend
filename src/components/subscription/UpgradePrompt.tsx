import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface UpgradePromptProps {
  feature: string;
  currentPlan?: string;
  requiredPlan: 'PRO' | 'ENTERPRISE';
  className?: string;
}

const PLAN_LABELS: Record<string, string> = {
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
};

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  requiredPlan,
  className,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const planLabel = PLAN_LABELS[requiredPlan] ?? requiredPlan;
  const isEnterprise = requiredPlan === 'ENTERPRISE';

  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-6 flex flex-col items-center text-center gap-4',
        isEnterprise
          ? 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
          : 'border-primary/30 shadow-[0_0_20px_rgba(139,92,246,0.08)]',
        className,
      )}
    >
      <div
        className={cn(
          'h-12 w-12 rounded-full flex items-center justify-center',
          isEnterprise ? 'bg-amber-500/10' : 'bg-primary/10',
        )}
      >
        <Lock
          className={cn('h-5 w-5', isEnterprise ? 'text-amber-400' : 'text-primary')}
        />
      </div>

      <div className="space-y-1">
        <p className="font-semibold text-sm">{t('subscription.limitReached')}</p>
        <p className="text-sm text-muted-foreground">
          {t('subscription.upgradeRequired')}{' '}
          <span
            className={cn(
              'font-semibold',
              isEnterprise ? 'text-amber-400' : 'text-primary',
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
          isEnterprise &&
            'bg-gradient-to-r from-amber-500 to-amber-400 text-white hover:from-amber-600 hover:to-amber-500 border-0',
        )}
        variant={isEnterprise ? 'outline' : 'default'}
        onClick={() => navigate('/pricing')}
      >
        {t('subscription.upgrade')} to {planLabel}
        <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};

export default UpgradePrompt;
