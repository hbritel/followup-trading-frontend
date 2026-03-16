import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import PlanCard from '@/components/subscription/PlanCard';
import { useSubscription, usePlans, useCreateCheckout } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/auth-context';
import type { PlanDto } from '@/types/dto';

// Static fallback plans when not authenticated or API unavailable
const STATIC_PLANS: PlanDto[] = [
  {
    name: 'FREE',
    displayName: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [],
    limits: {},
  },
  {
    name: 'PRO',
    displayName: 'Pro',
    monthlyPrice: 9.99,
    annualPrice: 7.99,
    features: [],
    limits: {},
  },
  {
    name: 'ENTERPRISE',
    displayName: 'Enterprise',
    monthlyPrice: 29.99,
    annualPrice: 23.99,
    features: [],
    limits: {},
  },
];

const Pricing: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const { data: subscription } = useSubscription();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const createCheckout = useCreateCheckout();

  const displayPlans = plans ?? STATIC_PLANS;
  const currentPlan = subscription?.plan ?? null;

  const handleSelectPlan = (plan: PlanDto) => {
    if (plan.name === 'FREE') {
      if (!isAuthenticated) {
        navigate('/auth/signup');
      }
      return;
    }

    if (!isAuthenticated) {
      navigate('/auth/signup');
      return;
    }

    setLoadingPlan(plan.name);
    createCheckout.mutate(
      {
        plan: plan.name,
        interval: billingInterval,
        successUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/pricing`,
      },
      {
        onSettled: () => setLoadingPlan(null),
      },
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="ambient-blob ambient-blob-primary w-96 h-96 top-20 -left-24 opacity-60" />
        <div className="ambient-blob ambient-blob-gold w-80 h-80 top-40 right-10 opacity-40" />
        <div className="ambient-blob ambient-blob-secondary w-64 h-64 bottom-20 left-1/2 opacity-30" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-16 sm:py-24">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            <span className="text-gradient-primary">{t('subscription.choosePlan')}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Trade smarter with professional analytics, AI coaching, and real-time broker sync.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 mt-6 glass-card rounded-full px-4 py-2">
            <button
              className={cn(
                'text-sm font-medium px-4 py-1.5 rounded-full transition-colors',
                billingInterval === 'MONTHLY'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setBillingInterval('MONTHLY')}
            >
              {t('subscription.monthly')}
            </button>
            <button
              className={cn(
                'text-sm font-medium px-4 py-1.5 rounded-full transition-colors flex items-center gap-2',
                billingInterval === 'ANNUAL'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setBillingInterval('ANNUAL')}
            >
              {t('subscription.annual')}
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-semibold">
                {t('subscription.save')}
              </span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        {plansLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayPlans.map((plan) => (
              <PlanCard
                key={plan.name}
                plan={plan}
                currentPlan={currentPlan ?? undefined}
                billingInterval={billingInterval}
                onSelect={handleSelectPlan}
                isLoading={loadingPlan === plan.name}
              />
            ))}
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-sm text-muted-foreground mt-10">
          Prices exclude applicable taxes. Cancel anytime.{' '}
          {isAuthenticated && (
            <button
              className="underline hover:text-foreground transition-colors"
              onClick={() => navigate('/settings')}
            >
              Go to Settings
            </button>
          )}
        </p>
      </div>
    </div>
  );
};

export default Pricing;
