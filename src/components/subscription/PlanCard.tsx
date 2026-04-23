import React from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { PlanDto } from '@/types/dto';
import { PLAN_FEATURES } from '@/lib/planFeatures';

interface PlanCardProps {
  plan: PlanDto;
  currentPlan?: string;
  billingInterval: 'MONTHLY' | 'ANNUAL';
  onSelect: (plan: PlanDto) => void;
  isLoading?: boolean;
}


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
  const isTeam = plan.name === 'TEAM';
  const isStarter = plan.name === 'STARTER';
  const isCurrent = currentPlan === plan.name;
  const monthlyPrice = (plan as PlanDto & { monthlyPrice?: number }).monthlyPrice ?? plan.monthlyPriceUsd;
  const annualPrice = (plan as PlanDto & { annualPrice?: number }).annualPrice ?? plan.annualMonthlyPriceUsd;
  const price = billingInterval === 'ANNUAL' ? annualPrice : monthlyPrice;
  const features = PLAN_FEATURES[plan.name] ?? [];

  const cardClasses = cn(
    'glass-card rounded-2xl p-7 xl:p-8 relative flex flex-col gap-6 transition-all duration-300',
    isPro && 'border-primary/50 shadow-[0_0_30px_hsl(var(--primary)/0.15)]',
    isElite && 'border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.1)]',
    isTeam && 'border-fuchsia-500/50 shadow-[0_0_30px_rgba(217,70,239,0.12)]',
    isStarter && 'border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.08)]',
  );

  const getButtonLabel = () => {
    if (isCurrent) return t('subscription.currentPlan');
    if (plan.name === 'FREE') return t('subscription.free');
    return t('subscription.upgradeTo', { plan: plan.displayName, defaultValue: `Upgrade to ${plan.displayName}` });
  };

  const getButtonVariant = (): 'default' | 'outline' | 'secondary' => {
    if (isCurrent) return 'outline';
    if (isPro) return 'default';
    return 'outline';
  };

  return (
    <div className={cardClasses}>
      {/* Badges — reserve space even when empty so price aligns across cards */}
      <div className="flex items-start justify-between gap-2 flex-wrap min-h-[28px]">
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
              {f.detailKey && (
                <span className="text-muted-foreground ml-1">
                  ({t(`subscription.details.${f.detailKey}`, f.detailParams ?? {})})
                </span>
              )}
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
