import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, TrendingUp, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSubscription, useCreatePortal } from '@/hooks/useSubscription';
import type { UsageDto } from '@/types/dto';
import UsageLimitIndicator from '@/components/subscription/UsageLimitIndicator';

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

const PLAN_SYNC_LABEL: Record<string, string> = {
  FREE: 'Monthly sync',
  STARTER: 'Weekly sync',
  PRO: 'Daily sync',
  ELITE: 'Real-time sync',
};

const buildUsageBars = (usage: UsageDto, t: (key: string) => string) => [
  {
    label: t('subscription.features.brokerConnections'),
    current: usage.connectionsUsed ?? 0,
    max: usage.connectionsMax ?? 0,
  },
  {
    label: t('subscription.features.tradesStored'),
    current: usage.tradesUsed ?? 0,
    max: usage.tradesMax ?? 0,
  },
  {
    label: t('subscription.features.strategies'),
    current: usage.strategiesUsed ?? 0,
    max: usage.strategiesMax ?? 0,
  },
  {
    label: t('subscription.features.tags'),
    current: usage.tagsUsed ?? 0,
    max: usage.tagsMax ?? 0,
  },
  {
    label: t('subscription.features.watchlists'),
    current: usage.watchlistsUsed ?? 0,
    max: usage.watchlistsMax ?? 0,
  },
  {
    label: `${t('subscription.features.aiCoach')} (${t('common.today')})`,
    current: usage.aiMessagesToday ?? 0,
    max: usage.aiMessagesMax ?? 0,
  },
  {
    label: t('subscription.features.alerts'),
    current: usage.alertsUsed ?? 0,
    max: usage.alertsMax ?? 0,
  },
  {
    label: `${t('subscription.features.reports')} (${t('common.thisMonth')})`,
    current: usage.reportsThisMonth ?? 0,
    max: usage.reportsMax ?? 0,
  },
];

const UsageDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: subscription, isLoading } = useSubscription();
  const createPortal = useCreatePortal();

  const handleManageBilling = () => {
    createPortal.mutate(
      { returnUrl: window.location.href },
      { onError: () => navigate('/account-management?tab=subscription') },
    );
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
              <Button size="sm" onClick={() => navigate('/account-management?tab=subscription')}>
                <TrendingUp className="h-4 w-4 mr-2" />
                {t('subscription.upgrade')}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Sync frequency info */}
      <Card className="glass-card">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-sm">
            <RefreshCw className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{t('subscription.brokerSyncFrequency', 'Broker sync frequency')}:</span>
            <span className="font-medium">{PLAN_SYNC_LABEL[subscription.plan] ?? PLAN_SYNC_LABEL.FREE}</span>
          </div>
        </CardContent>
      </Card>

      {/* Usage bars */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">{t('subscription.usage')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {usageBars.map((bar) => (
            <div key={bar.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{bar.label}</span>
              </div>
              <UsageLimitIndicator
                used={bar.current}
                max={bar.max}
                showBar
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageDashboard;
