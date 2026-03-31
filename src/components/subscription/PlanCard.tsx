import React from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { PlanDto } from '@/types/dto';

interface PlanCardProps {
  plan: PlanDto;
  currentPlan?: string;
  billingInterval: 'MONTHLY' | 'ANNUAL';
  onSelect: (plan: PlanDto) => void;
  isLoading?: boolean;
}

const PLAN_FEATURES: Record<string, { key: string; included: boolean }[]> = {
  FREE: [
    { key: 'importCsv', included: true },
    { key: 'brokerConnections', included: false },
    { key: 'tradesStored', included: true },
    { key: 'analytics', included: true },
    { key: 'aiCoach', included: false },
    { key: 'alerts', included: false },
    { key: 'reports', included: false },
    { key: 'backtesting', included: false },
    { key: 'leaderboard', included: true },
    { key: 'publicProfile', included: false },
    { key: 'prioritySupport', included: false },
    { key: 'apiAccess', included: false },
  ],
  PRO: [
    { key: 'importCsv', included: true },
    { key: 'brokerConnections', included: true },
    { key: 'tradesStored', included: true },
    { key: 'analytics', included: true },
    { key: 'aiCoach', included: true },
    { key: 'alerts', included: true },
    { key: 'reports', included: true },
    { key: 'backtesting', included: true },
    { key: 'leaderboard', included: true },
    { key: 'publicProfile', included: true },
    { key: 'prioritySupport', included: false },
    { key: 'apiAccess', included: false },
  ],
  ENTERPRISE: [
    { key: 'importCsv', included: true },
    { key: 'brokerConnections', included: true },
    { key: 'tradesStored', included: true },
    { key: 'analytics', included: true },
    { key: 'aiCoach', included: true },
    { key: 'alerts', included: true },
    { key: 'reports', included: true },
    { key: 'backtesting', included: true },
    { key: 'leaderboard', included: true },
    { key: 'publicProfile', included: true },
    { key: 'prioritySupport', included: true },
    { key: 'apiAccess', included: true },
  ],
};

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  currentPlan,
  billingInterval,
  onSelect,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const isPro = plan.name === 'PRO';
  const isEnterprise = plan.name === 'ENTERPRISE';
  const isCurrent = currentPlan === plan.name;
  const price = billingInterval === 'ANNUAL' ? plan.annualPrice : plan.monthlyPrice;
  const features = PLAN_FEATURES[plan.name] ?? [];

  const cardClasses = cn(
    'glass-card rounded-2xl p-8 relative flex flex-col gap-6 transition-all duration-300',
    isPro && 'border-primary/50 shadow-[0_0_30px_hsl(var(--primary)/0.15)]',
    isEnterprise && 'border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.1)]',
  );

  const getButtonLabel = () => {
    if (isCurrent) return t('subscription.currentPlan');
    if (plan.name === 'FREE') return t('subscription.free');
    return `${t('subscription.upgrade')} to ${plan.displayName}`;
  };

  const getButtonVariant = (): 'default' | 'outline' | 'secondary' => {
    if (isCurrent) return 'outline';
    if (isPro) return 'default';
    return 'outline';
  };

  return (
    <div className={cardClasses}>
      {/* Badges */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex flex-col gap-2">
          {isPro && (
            <span className="bg-primary text-white text-xs px-3 py-1 rounded-full self-start">
              {t('subscription.mostPopular')}
            </span>
          )}
          {isCurrent && (
            <Badge variant="secondary" className="self-start">
              {t('subscription.currentPlan')}
            </Badge>
          )}
        </div>
      </div>

      {/* Plan name */}
      <div>
        <h3
          className={cn(
            'text-xl font-bold mb-1',
            isPro && 'text-gradient-primary',
            isEnterprise && 'text-gradient-gold',
          )}
        >
          {plan.displayName}
        </h3>

        {/* Price */}
        <div className="flex items-end gap-1 mt-3">
          {price === 0 ? (
            <span className="kpi-value text-5xl">$0</span>
          ) : (
            <>
              {billingInterval === 'ANNUAL' && (
                <span className="line-through text-muted-foreground text-lg self-end mb-1 mr-1">
                  ${plan.monthlyPrice}
                </span>
              )}
              <span className="kpi-value text-5xl">${price}</span>
            </>
          )}
          <span className="text-muted-foreground text-lg mb-1">{t('subscription.perMonth')}</span>
        </div>
        {billingInterval === 'ANNUAL' && price > 0 && (
          <p className="text-xs text-muted-foreground mt-1">{t('subscription.billedAnnually')}</p>
        )}
      </div>

      {/* Features list */}
      <ul className="space-y-3 flex-1">
        {features.map((f) => (
          <li key={f.key} className="flex items-center gap-2 text-sm">
            {f.included ? (
              <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            ) : (
              <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
            )}
            <span className={cn(!f.included && 'text-muted-foreground/60')}>
              {t(`subscription.features.${f.key}`)}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        className={cn(
          'w-full mt-auto',
          isEnterprise &&
            !isCurrent &&
            'bg-gradient-to-r from-amber-500 to-amber-400 text-white hover:from-amber-600 hover:to-amber-500 border-0',
        )}
        variant={getButtonVariant()}
        disabled={isCurrent || isLoading}
        onClick={() => !isCurrent && onSelect(plan)}
      >
        {isLoading ? t('common.loading') : getButtonLabel()}
      </Button>
    </div>
  );
};

export default PlanCard;
