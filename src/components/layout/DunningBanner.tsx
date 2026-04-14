import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSubscription, useCreatePortal } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const DunningBanner: React.FC = () => {
  const { t } = useTranslation();
  const { data: subscription } = useSubscription();
  const createPortal = useCreatePortal();

  const dunningStep = subscription?.dunningStep;
  if (!dunningStep) return null;

  const isUrgent = dunningStep >= 2;

  const daysRemaining = (() => {
    if (!subscription?.gracePeriodEndsAt) return 0;
    const end = new Date(subscription.gracePeriodEndsAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  })();

  const handleUpdatePayment = () => {
    createPortal.mutate({ returnUrl: window.location.href });
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium',
        isUrgent
          ? 'bg-destructive/15 text-destructive border-b border-destructive/25'
          : 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-b border-yellow-500/25',
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="truncate">
          {isUrgent
            ? t('billing.dunningUrgent', { days: daysRemaining })
            : t('billing.dunningWarning')}
        </span>
      </div>

      <Button
        variant={isUrgent ? 'destructive' : 'outline'}
        size="sm"
        className="shrink-0"
        onClick={handleUpdatePayment}
        disabled={createPortal.isPending}
      >
        {createPortal.isPending ? t('common.loading') : t('billing.updatePayment')}
      </Button>
    </div>
  );
};

export default DunningBanner;
