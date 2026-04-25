import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, CircleAlert, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StripeConnectCard from './StripeConnectCard';
import MentorPricingCard from './MentorPricingCard';
import StudentPricingTable from './StudentPricingTable';
import MentorSubscriptionsList from './MentorSubscriptionsList';
import {
  useConnectStatus,
  useDefaultPricing,
  useMentorSubscriptions,
} from '@/hooks/useMentor';

const STORAGE_KEY = 'mentor.section.monetization.open';

const currencySymbol: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };

const formatAmount = (cents: number, currency: string) => {
  const sym = currencySymbol[currency] ?? '';
  return `${sym}${(cents / 100).toFixed(0)}`;
};

const MonetizationSection: React.FC = () => {
  const { t } = useTranslation();
  // Default open; persisted to localStorage so /harden survives page refresh.
  const [open, setOpen] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === null ? true : v === '1';
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, open ? '1' : '0');
    } catch {
      /* noop */
    }
  }, [open]);

  const { data: status } = useConnectStatus();
  const { data: pricing } = useDefaultPricing();
  const { data: subscriptions = [] } = useMentorSubscriptions();
  const chargesEnabled = !!status?.chargesEnabled;

  const activeSubs = subscriptions.filter(
    (s) => s.status === 'ACTIVE' || s.status === 'TRIALING'
  ).length;
  const monthlyCents = pricing
    ? activeSubs * Math.round(pricing.monthlyAmount * 100)
    : 0;
  const showMrrChip = chargesEnabled && pricing && activeSubs > 0;
  const needsStripe = !chargesEnabled;
  const needsPricing = chargesEnabled && !pricing;

  return (
    <section
      aria-labelledby="monetization-heading"
      className="glass-card rounded-2xl p-5 space-y-5"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Wallet className="w-4 h-4 text-primary" aria-hidden="true" />
          <h2 id="monetization-heading" className="text-base font-semibold">
            {t('mentor.monetization.title', 'Monetization')}
          </h2>

          {showMrrChip && (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
              title={t('mentor.monetization.mrrTitle', 'Estimated monthly recurring revenue')}
            >
              <span className="tabular-nums">
                {formatAmount(monthlyCents, pricing.currency)}
              </span>
              <span className="opacity-70 font-medium">/mo</span>
              <span className="opacity-50">·</span>
              <span className="tabular-nums">
                {t('mentor.monetization.activeCount', '{{n}} active', { n: activeSubs })}
              </span>
            </span>
          )}

          {needsStripe && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <CircleAlert className="w-3 h-3" aria-hidden="true" />
              {t('mentor.monetization.connectStripe', 'Connect Stripe')}
            </span>
          )}

          {needsPricing && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
              {t('mentor.monetization.setPricing', 'Set pricing')}
            </span>
          )}

          {chargesEnabled && pricing && activeSubs === 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/40">
              {t('mentor.monetization.zeroSubs', 'Ready · 0 subscribers')}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="monetization-body"
          className="gap-1"
        >
          {open ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          {open ? t('common.collapse', 'Collapse') : t('common.expand', 'Expand')}
        </Button>
      </div>

      {open && (
        <div id="monetization-body" className="space-y-5">
          <StripeConnectCard />

          <MentorPricingCard chargesEnabled={chargesEnabled} />

          <div className="rounded-2xl border border-border/50 p-5 bg-muted/10">
            <h3 className="text-base font-semibold mb-1">
              {t(
                'mentor.monetization.studentOverrides',
                'Per-student overrides'
              )}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {t(
                'mentor.monetization.studentOverridesDesc',
                'Give specific students a custom price or free access.'
              )}
            </p>
            <StudentPricingTable defaultPricing={pricing ?? null} />
          </div>

          <div className="rounded-2xl border border-border/50 p-5 bg-muted/10">
            <h3 className="text-base font-semibold mb-3">
              {t(
                'mentor.monetization.subscriptions',
                'Active subscriptions'
              )}
            </h3>
            <MentorSubscriptionsList />
          </div>
        </div>
      )}
    </section>
  );
};

export default MonetizationSection;
