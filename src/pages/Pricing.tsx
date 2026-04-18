import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowLeft, Tag, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import PlanCard from '@/components/subscription/PlanCard';
import { useSubscription, usePlans, useCreateCheckout, useInvalidateSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/auth-context';
import { promoService, type PromoValidationResult } from '@/services/promo.service';
import { toast } from '@/hooks/use-toast';
import type { PlanDto } from '@/types/dto';

// Static fallback plans when not authenticated or API unavailable
const STATIC_PLANS = [
  {
    name: 'FREE',
    displayName: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyPriceUsd: 0,
    annualMonthlyPriceUsd: 0,
    features: [],
  },
  {
    name: 'STARTER',
    displayName: 'Starter',
    monthlyPrice: 9.99,
    annualPrice: 7.99,
    monthlyPriceUsd: 9.99,
    annualMonthlyPriceUsd: 7.99,
    features: [],
  },
  {
    name: 'PRO',
    displayName: 'Pro',
    monthlyPrice: 24.99,
    annualPrice: 19.99,
    monthlyPriceUsd: 24.99,
    annualMonthlyPriceUsd: 19.99,
    features: [],
  },
  {
    name: 'ELITE',
    displayName: 'Elite',
    monthlyPrice: 59.99,
    annualPrice: 47.99,
    monthlyPriceUsd: 59.99,
    annualMonthlyPriceUsd: 47.99,
    features: [],
  },
] as PlanDto[];

const Pricing: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Promo code state
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoApplying, setPromoApplying] = useState(false);
  const [promoValidation, setPromoValidation] = useState<PromoValidationResult | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoApplied, setPromoApplied] = useState(false);

  const { data: subscription } = useSubscription();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const createCheckout = useCreateCheckout();
  const invalidateSubscription = useInvalidateSubscription();

  const displayPlans = plans ?? STATIC_PLANS;
  const currentPlan = subscription?.plan ?? null;

  const handlePromoBlur = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setPromoValidating(true);
    setPromoError(null);
    setPromoValidation(null);
    try {
      const result = await promoService.validatePromo(code);
      if (result.valid) {
        setPromoValidation(result);
      } else {
        setPromoError(t('pricing.promoInvalid', 'This promo code is invalid or expired.'));
      }
    } catch {
      setPromoError(t('pricing.promoValidationFailed', 'Could not validate promo code.'));
    } finally {
      setPromoValidating(false);
    }
  };

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code || !isAuthenticated) return;
    setPromoApplying(true);
    setPromoError(null);
    try {
      await promoService.applyPromo(code);
      setPromoApplied(true);
      invalidateSubscription();
      toast({
        title: t('pricing.promoApplied', 'Promo applied!'),
        description: promoValidation?.name
          ? t('pricing.promoAppliedDescription', '{{name}} has been applied to your account.', { name: promoValidation.name })
          : t('pricing.promoAppliedSuccess', 'Your promo code has been successfully applied.'),
      });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('pricing.promoApplyFailed', 'Failed to apply promo code.');
      setPromoError(message);
      toast({ title: t('common.error', 'Error'), description: message, variant: 'destructive' });
    } finally {
      setPromoApplying(false);
    }
  };

  const promoDiscountLabel = (): string => {
    if (!promoValidation) return '';
    const { discountType, discountValue, name } = promoValidation;
    if (discountType === 'PERCENTAGE') return t('pricing.promoDiscountPct', '{{pct}}% off — {{name}}', { pct: discountValue, name });
    if (discountType === 'FIXED_AMOUNT') return t('pricing.promoDiscountFixed', '${{amount}} off — {{name}}', { amount: discountValue, name });
    if (discountType === 'PLAN_UPGRADE') return t('pricing.promoPlanUpgrade', 'Plan upgrade — {{name}}', { name });
    if (discountType === 'FEATURE_ACCESS') return t('pricing.promoFeatureAccess', 'Feature access — {{name}}', { name });
    return name;
  };

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

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 sm:py-24">
        {/* Back button */}
        {isAuthenticated && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.goBack', 'Go back')}
          </Button>
        )}

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Promo code section */}
        {isAuthenticated && !promoApplied && (
          <div className="mt-10 max-w-md mx-auto">
            <button
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
              onClick={() => setPromoExpanded(prev => !prev)}
            >
              <Tag className="h-4 w-4" />
              {t('pricing.havePromoCode', 'Have a promo code?')}
              {promoExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {promoExpanded && (
              <div className="mt-4 glass-card rounded-xl p-5 space-y-3">
                <p className="text-sm font-medium">{t('pricing.enterPromoCode', 'Enter your promo code')}</p>
                <div className="flex gap-2">
                  <Input
                    value={promoCode}
                    onChange={e => {
                      setPromoCode(e.target.value.toUpperCase());
                      setPromoValidation(null);
                      setPromoError(null);
                      setPromoApplied(false);
                    }}
                    onBlur={handlePromoBlur}
                    placeholder="SUMMER25"
                    className="font-mono uppercase tracking-widest"
                    disabled={promoApplying}
                  />
                  <Button
                    onClick={handleApplyPromo}
                    disabled={!promoCode.trim() || !promoValidation || promoApplying || promoApplied}
                  >
                    {promoApplying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t('pricing.applyPromo', 'Apply')
                    )}
                  </Button>
                </div>

                {/* Validation feedback */}
                {promoValidating && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t('pricing.validatingPromo', 'Validating...')}
                  </div>
                )}
                {promoValidation && !promoError && (
                  <div className="flex items-center gap-2 text-xs text-emerald-500">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {promoDiscountLabel()}
                  </div>
                )}
                {promoError && (
                  <div className="flex items-center gap-2 text-xs text-destructive">
                    <XCircle className="h-3.5 w-3.5" />
                    {promoError}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {promoApplied && (
          <div className="mt-10 max-w-md mx-auto flex items-center justify-center gap-2 text-sm text-emerald-500">
            <CheckCircle2 className="h-4 w-4" />
            {t('pricing.promoSuccessfullyApplied', 'Promo code applied successfully!')}
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
