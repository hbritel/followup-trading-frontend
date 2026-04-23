import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, CreditCard, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useConnectStatus,
  useStartConnectOnboarding,
} from '@/hooks/useMentor';

const StripeConnectCard: React.FC = () => {
  const { t } = useTranslation();
  const { data: status, isLoading, refetch, isRefetching } = useConnectStatus();
  const onboard = useStartConnectOnboarding();

  const handleOnboard = () => {
    onboard.mutate(undefined, {
      onSuccess: (data) => {
        if (data?.url) {
          window.location.href = data.url;
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-muted/20 p-5 h-28 animate-pulse" />
    );
  }

  const isReady = !!status?.chargesEnabled;
  const inProgress = !!status?.detailsSubmitted && !status?.chargesEnabled;
  const notStarted = !status?.accountId || !status?.detailsSubmitted;

  return (
    <div
      className={[
        'rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4',
        isReady
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-border/50 bg-muted/20',
      ].join(' ')}
    >
      <div
        className={[
          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
          isReady ? 'bg-emerald-500/15 text-emerald-500' : 'bg-primary/10 text-primary',
        ].join(' ')}
      >
        {isReady ? (
          <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
        ) : (
          <CreditCard className="w-6 h-6" aria-hidden="true" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {isReady && (
          <>
            <h3 className="text-base font-semibold text-emerald-700 dark:text-emerald-400">
              {t('mentor.monetization.stripeReady', 'Stripe ready')}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t(
                'mentor.monetization.stripeReadyDesc',
                'You can charge students. Manage payouts and tax settings on your Stripe dashboard.'
              )}
            </p>
          </>
        )}
        {inProgress && (
          <>
            <h3 className="text-base font-semibold">
              {t('mentor.monetization.stripeInProgress', 'Stripe onboarding in progress')}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t(
                'mentor.monetization.stripeInProgressDesc',
                'Stripe is still verifying your account. Refresh to check the latest status.'
              )}
            </p>
          </>
        )}
        {notStarted && (
          <>
            <h3 className="text-base font-semibold">
              {t('mentor.monetization.stripeConnectTitle', 'Connect Stripe to charge students')}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t(
                'mentor.monetization.stripeConnectDesc',
                'Payouts go directly to your bank. We take a small platform fee.'
              )}
            </p>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2 shrink-0">
        {isReady ? (
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              {t('mentor.monetization.manageStripe', 'Manage on Stripe')}
            </a>
          </Button>
        ) : inProgress ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-1.5"
          >
            {isRefetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {t('mentor.monetization.refreshStatus', 'Refresh status')}
          </Button>
        ) : (
          <Button
            onClick={handleOnboard}
            disabled={onboard.isPending}
            className="gap-1.5"
          >
            {onboard.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('mentor.monetization.onboardStripe', 'Onboard with Stripe')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default StripeConnectCard;
