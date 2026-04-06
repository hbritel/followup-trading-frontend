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

const PLAN_FEATURES: Record<string, { key: string; included: boolean; detail?: string }[]> = {
  FREE: [
    { key: 'trades', included: true, detail: '100 trades' },
    { key: 'brokerAccount', included: true, detail: '1 account' },
    { key: 'sync', included: true, detail: 'Monthly sync' },
    { key: 'csvImport', included: true },
    { key: 'journal', included: true },
    { key: 'basicMetrics', included: true },
    { key: 'badges', included: true },
    { key: 'csvExport', included: false },
    { key: 'alerts', included: false },
    { key: 'aiCoach', included: false },
    { key: 'reports', included: false },
    { key: 'backtesting', included: false },
    { key: 'tradeReplay', included: false },
  ],
  STARTER: [
    { key: 'trades', included: true, detail: '1,500 trades' },
    { key: 'brokerAccounts', included: true, detail: '2 accounts' },
    { key: 'sync', included: true, detail: 'Weekly sync' },
    { key: 'csvImportExport', included: true },
    { key: 'journal', included: true, detail: 'With calendar' },
    { key: 'basicMetrics', included: true },
    { key: 'badges', included: true },
    { key: 'aiCoach', included: true, detail: '5 msg/day' },
    { key: 'alerts', included: true, detail: '5 price alerts' },
    { key: 'reports', included: true, detail: '3/month' },
    { key: 'marketFeed', included: true, detail: '1 source' },
    { key: 'economicCalendar', included: true },
    { key: 'backtesting', included: false },
    { key: 'tradeReplay', included: false },
  ],
  PRO: [
    { key: 'trades', included: true, detail: '15,000 trades' },
    { key: 'brokerAccounts', included: true, detail: '5 accounts' },
    { key: 'sync', included: true, detail: 'Daily sync' },
    { key: 'csvImportExport', included: true },
    { key: 'journal', included: true, detail: 'With calendar' },
    { key: 'advancedMetrics', included: true, detail: 'Sharpe, VaR...' },
    { key: 'liveWebSocket', included: true },
    { key: 'aiCoach', included: true, detail: '30 msg/day' },
    { key: 'alerts', included: true, detail: '25 alerts' },
    { key: 'reports', included: true, detail: '15/month, 12 types' },
    { key: 'backtesting', included: true, detail: '3 sessions' },
    { key: 'tradeReplay', included: true },
    { key: 'taxPreview', included: true },
    { key: 'publicProfile', included: true },
  ],
  ELITE: [
    { key: 'trades', included: true, detail: 'Unlimited' },
    { key: 'brokerAccounts', included: true, detail: 'Unlimited' },
    { key: 'sync', included: true, detail: 'Real-time sync' },
    { key: 'everything', included: true, detail: 'All PRO features' },
    { key: 'aiCoach', included: true, detail: '150 msg/day' },
    { key: 'alerts', included: true, detail: 'Unlimited, all types' },
    { key: 'reports', included: true, detail: 'Unlimited, 16 types' },
    { key: 'backtesting', included: true, detail: 'Unlimited sessions' },
    { key: 'fullTaxReport', included: true, detail: '14 jurisdictions' },
    { key: 'dedicatedSupport', included: true },
    { key: 'customRss', included: true },
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
  const isElite = plan.name === 'ELITE';
  const isStarter = plan.name === 'STARTER';
  const isCurrent = currentPlan === plan.name;
  const monthlyPrice = (plan as PlanDto & { monthlyPrice?: number }).monthlyPrice ?? plan.monthlyPriceUsd;
  const annualPrice = (plan as PlanDto & { annualPrice?: number }).annualPrice ?? plan.annualMonthlyPriceUsd;
  const price = billingInterval === 'ANNUAL' ? annualPrice : monthlyPrice;
  const features = PLAN_FEATURES[plan.name] ?? [];

  const cardClasses = cn(
    'glass-card rounded-2xl p-8 relative flex flex-col gap-6 transition-all duration-300',
    isPro && 'border-primary/50 shadow-[0_0_30px_hsl(var(--primary)/0.15)]',
    isElite && 'border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.1)]',
    isStarter && 'border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.08)]',
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
          {isStarter && (
            <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full self-start">
              {t('subscription.bestValue', 'Best Value')}
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
            isElite && 'text-gradient-gold',
            isStarter && 'text-blue-400',
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
                  ${monthlyPrice}
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
              {t(`subscription.features.${f.key}`, f.key)}
              {f.detail && <span className="text-muted-foreground ml-1">({f.detail})</span>}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        className={cn(
          'w-full mt-auto',
          isElite &&
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
