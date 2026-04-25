import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRightCircle, ChevronDown, ChevronUp, CircleAlert, Wallet } from 'lucide-react';
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
import { useLocalStorageState } from '@/hooks/useLocalStorageState';

const currencySymbol: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };

const formatAmount = (cents: number, currency: string) => {
  const sym = currencySymbol[currency] ?? '';
  return `${sym}${(cents / 100).toFixed(0)}`;
};

const MonetizationSection: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useLocalStorageState<boolean>(
    'mentor.section.monetization.open',
    true,
  );

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
        <div id="monetization-body" className="space-y-3">
          {/* Stripe Connect: when charges are enabled the onboarding card
              shrinks to a single-line "Connected" chip; expand only if the
              mentor needs to fix something. Pricing card stays always-visible
              because it's the daily-driver action. */}
          {chargesEnabled ? (
            <details className="group rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-3">
              <summary className="cursor-pointer flex items-center justify-between gap-3 list-none">
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  {t('mentor.monetization.stripeConnectedHeader', 'Stripe Connect — connected')}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" aria-hidden="true" />
              </summary>
              <div className="mt-3 pt-3 border-t border-emerald-500/20">
                <StripeConnectCard />
              </div>
            </details>
          ) : (
            <StripeConnectCard />
          )}

          <MentorPricingCard chargesEnabled={chargesEnabled} />

          {/* Cross-link to per-cohort pricing override (lives in the
              Compliance tab so the override stays close to the cancellation
              policy override on the same panel). Click switches the tab. */}
          <a
            href="#compliance"
            onClick={(e) => {
              e.preventDefault();
              if (typeof window !== 'undefined') {
                window.location.hash = 'compliance';
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ArrowRightCircle className="w-3.5 h-3.5" aria-hidden="true" />
            {t('mentor.monetization.cohortPricingLink', 'Per-cohort pricing overrides → Compliance')}
          </a>

          {/* Per-student overrides — collapsed by default, surfaces a count
              chip on the header so the mentor knows how many bespoke prices
              are active without expanding. */}
          <details className="group rounded-2xl border border-border/50 bg-muted/10 p-4">
            <summary className="cursor-pointer flex items-center justify-between gap-3 list-none">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">
                  {t('mentor.monetization.studentOverrides', 'Per-student overrides')}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t(
                    'mentor.monetization.studentOverridesDesc',
                    'Give specific students a custom price or free access.'
                  )}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform shrink-0" aria-hidden="true" />
            </summary>
            <div className="mt-3 pt-3 border-t border-border/40">
              <StudentPricingTable defaultPricing={pricing ?? null} />
            </div>
          </details>

          {/* Active subscriptions — collapsed by default, count badge on
              header. Most mentors check this 1-2× a week, not daily. */}
          <details className="group rounded-2xl border border-border/50 bg-muted/10 p-4">
            <summary className="cursor-pointer flex items-center justify-between gap-3 list-none">
              <h3 className="text-sm font-semibold inline-flex items-center gap-2">
                {t('mentor.monetization.subscriptions', 'Active subscriptions')}
                {activeSubs > 0 && (
                  <span className="inline-flex items-center text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25">
                    {activeSubs}
                  </span>
                )}
              </h3>
              <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform shrink-0" aria-hidden="true" />
            </summary>
            <div className="mt-3 pt-3 border-t border-border/40">
              <MentorSubscriptionsList />
            </div>
          </details>
        </div>
      )}
    </section>
  );
};

export default MonetizationSection;
