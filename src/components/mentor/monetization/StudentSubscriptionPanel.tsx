import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Loader2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useCancelMentorSubscription,
  useSubscribeToMentor,
} from '@/hooks/useMentor';

type Status = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE';

interface Props {
  status: Status;
  currentPeriodEnd: string | null;
}

export const PastDueBanner: React.FC = () => {
  const { t } = useTranslation();
  const subscribe = useSubscribeToMentor();

  const handleRetry = () => {
    subscribe.mutate(undefined, {
      onSuccess: (data) => {
        if (data?.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      },
    });
  };

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-200">
            {t('mentor.paywall.pastDueTitle', 'Payment past due')}
          </p>
          <p className="text-sm text-amber-700/90 dark:text-amber-200/80 mt-0.5">
            {t(
              'mentor.paywall.pastDueDesc',
              'Update your payment method to keep access to your mentor.'
            )}
          </p>
        </div>
      </div>
      <Button
        onClick={handleRetry}
        disabled={subscribe.isPending}
        className="gap-2 shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
      >
        {subscribe.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {t('mentor.paywall.updatePayment', 'Update payment method')}
      </Button>
    </div>
  );
};

const StudentSubscriptionPanel: React.FC<Props> = ({
  status,
  currentPeriodEnd,
}) => {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cancelMutation = useCancelMentorSubscription();

  const statusLabels: Record<Status, string> = {
    ACTIVE: t('mentor.paywall.statusActive', 'Active'),
    PAST_DUE: t('mentor.paywall.statusPastDue', 'Past due'),
    CANCELED: t('mentor.paywall.statusCanceled', 'Canceling'),
    INCOMPLETE: t('mentor.paywall.statusIncomplete', 'Incomplete'),
  };

  const statusStyle: Record<Status, string> = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    PAST_DUE: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    CANCELED: 'bg-muted text-muted-foreground border-border/40',
    INCOMPLETE: 'bg-muted text-muted-foreground border-border/40',
  };

  const handleCancel = () => {
    cancelMutation.mutate(undefined, {
      onSuccess: () => setConfirmOpen(false),
    });
  };

  const canCancel = status === 'ACTIVE';

  return (
    <section
      aria-labelledby="subscription-heading"
      className="glass-card rounded-2xl p-5 border border-border/50"
    >
      <div className="flex items-center gap-2 mb-3">
        <Receipt className="w-4 h-4 text-primary" aria-hidden="true" />
        <h2 id="subscription-heading" className="text-base font-semibold">
          {t('mentor.paywall.subscriptionTitle', 'Subscription')}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span
          className={[
            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border',
            statusStyle[status],
          ].join(' ')}
        >
          {statusLabels[status]}
        </span>
        {currentPeriodEnd && (
          <span className="text-muted-foreground">
            {status === 'CANCELED'
              ? t(
                  'mentor.paywall.accessUntil',
                  'Access until {{date}}',
                  {
                    date: new Date(currentPeriodEnd).toLocaleDateString(),
                  }
                )
              : t(
                  'mentor.paywall.nextRenewal',
                  'Next renewal: {{date}}',
                  {
                    date: new Date(currentPeriodEnd).toLocaleDateString(),
                  }
                )}
          </span>
        )}
      </div>

      {canCancel && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={() => setConfirmOpen(true)}
            className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
          >
            {t('mentor.paywall.cancelAtEnd', 'Cancel at period end')}
          </Button>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                'mentor.paywall.cancelTitle',
                'Cancel your subscription?'
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'mentor.paywall.cancelDesc',
                'You keep access until the end of your current billing period. No refund is issued.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.nevermind', 'Never mind')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('mentor.paywall.confirmCancel', 'Yes, cancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default StudentSubscriptionPanel;
