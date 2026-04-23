import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscribeToMentor } from '@/hooks/useMentor';
import type { MentorInstanceDto, MentorPricingDto } from '@/types/dto';

interface Props {
  instance: MentorInstanceDto;
  pricing?: MentorPricingDto | null;
}

const currencySymbol: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };

const MentorPaywallCard: React.FC<Props> = ({ instance, pricing }) => {
  const { t } = useTranslation();
  const subscribe = useSubscribeToMentor();

  const handleSubscribe = () => {
    subscribe.mutate(undefined, {
      onSuccess: (data) => {
        if (data?.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      },
    });
  };

  const priceLabel = pricing?.defaultPriceCents != null && pricing.currency
    ? `${currencySymbol[pricing.currency] ?? ''}${(
        pricing.defaultPriceCents / 100
      ).toFixed(2)} ${pricing.currency} / ${t(
        'mentor.monetization.month',
        'month'
      )}`
    : null;

  return (
    <div
      className="glass-card rounded-2xl p-6 sm:p-8 border border-border/50 flex flex-col items-center text-center gap-5"
      style={
        instance.primaryColor
          ? { boxShadow: `inset 3px 0 0 0 ${instance.primaryColor}` }
          : undefined
      }
    >
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Lock className="w-7 h-7 text-primary" aria-hidden="true" />
      </div>

      <div className="max-w-md">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
          {t('mentor.paywall.title', 'Subscribe to access {{brand}}', {
            brand: instance.brandName,
          })}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          {priceLabel
            ? t(
                'mentor.paywall.priceLine',
                '{{price}}. Cancel anytime.',
                { price: priceLabel }
              )
            : t(
                'mentor.paywall.genericLine',
                'Secure payment powered by Stripe. Cancel anytime.'
              )}
        </p>
      </div>

      <Button
        size="lg"
        onClick={handleSubscribe}
        disabled={subscribe.isPending}
        className="gap-2 min-w-48"
      >
        {subscribe.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {t('mentor.paywall.subscribeButton', 'Subscribe via Stripe')}
      </Button>

      <p className="text-[11px] text-muted-foreground max-w-xs">
        {t(
          'mentor.paywall.legalLine',
          'You will be redirected to Stripe to complete your subscription.'
        )}
      </p>
    </div>
  );
};

export default MentorPaywallCard;
