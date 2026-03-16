import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSubscription, useCreatePortal } from '@/hooks/useSubscription';
import type { UsageDto } from '@/types/dto';

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  TRIALING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PAST_DUE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  CANCELED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

interface UsageBarProps {
  label: string;
  current: number;
  max: number;
  suffix?: string;
}

const UsageBar: React.FC<UsageBarProps> = ({ label, current, max, suffix = '' }) => {
  const { t } = useTranslation();
  const isUnlimited = max === -1 || max === 0;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((current / max) * 100));

  const indicatorClass = cn(
    pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500',
  );

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {isUnlimited
            ? `${current} / ${t('subscription.unlimited')}`
            : `${current}${suffix} / ${max}${suffix}`}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={pct}
          className="h-2"
          indicatorClassName={indicatorClass}
        />
      )}
    </div>
  );
};

const buildUsageBars = (usage: UsageDto, t: (key: string) => string) => [
  {
    label: t('subscription.features.brokerConnections'),
    current: usage.connections.current,
    max: usage.connections.max,
  },
  {
    label: t('subscription.features.tradesStored'),
    current: usage.trades.current,
    max: usage.trades.max,
  },
  {
    label: `${t('subscription.features.aiCoach')} (${t('common.today')})`,
    current: usage.aiMessages.today,
    max: usage.aiMessages.max,
  },
  {
    label: t('subscription.features.alerts'),
    current: usage.alerts.current,
    max: usage.alerts.max,
  },
  {
    label: `${t('subscription.features.reports')} (${t('common.thisMonth')})`,
    current: usage.reports.thisMonth,
    max: usage.reports.max,
  },
];

const UsageDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: subscription, isLoading } = useSubscription();
  const createPortal = useCreatePortal();

  const handleManageBilling = () => {
    createPortal.mutate({ returnUrl: window.location.href });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t('common.noDataAvailable')}
        </CardContent>
      </Card>
    );
  }

  const usageBars = buildUsageBars(subscription.usage, t);

  return (
    <div className="space-y-6">
      {/* Current plan summary */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                {t(`subscription.${subscription.plan.toLowerCase()}`) || subscription.plan}
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full border',
                    STATUS_BADGE[subscription.status] ?? 'bg-secondary text-secondary-foreground',
                  )}
                >
                  {subscription.status}
                </span>
              </CardTitle>
              <CardDescription className="mt-1">
                {subscription.billingInterval && (
                  <>
                    {subscription.billingInterval === 'ANNUAL'
                      ? t('subscription.billedAnnually')
                      : t('subscription.monthly')}
                  </>
                )}
                {subscription.currentPeriodEnd && (
                  <span className="ml-2 text-xs">
                    · Renews{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                )}
                {subscription.cancelAtPeriodEnd && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Cancels at period end
                  </Badge>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {subscription.plan !== 'FREE' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageBilling}
                  disabled={createPortal.isPending}
                >
                  {createPortal.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  {t('subscription.manageBilling')}
                </Button>
              )}
              <Button size="sm" onClick={() => navigate('/pricing')}>
                <TrendingUp className="h-4 w-4 mr-2" />
                {t('subscription.upgrade')}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Usage bars */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">{t('subscription.usage')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {usageBars.map((bar) => (
            <UsageBar key={bar.label} {...bar} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageDashboard;
