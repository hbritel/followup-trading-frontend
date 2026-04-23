import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StripeConnectCard from './StripeConnectCard';
import MentorPricingCard from './MentorPricingCard';
import StudentPricingTable from './StudentPricingTable';
import MentorSubscriptionsList from './MentorSubscriptionsList';
import {
  useConnectStatus,
  useDefaultPricing,
} from '@/hooks/useMentor';

const MonetizationSection: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const { data: status } = useConnectStatus();
  const { data: pricing } = useDefaultPricing();
  const chargesEnabled = !!status?.chargesEnabled;

  return (
    <section
      aria-labelledby="monetization-heading"
      className="glass-card rounded-2xl p-5 space-y-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" aria-hidden="true" />
          <h2 id="monetization-heading" className="text-base font-semibold">
            {t('mentor.monetization.title', 'Monetization')}
          </h2>
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
