import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Tag, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMentorCohorts } from '@/hooks/useMentor';
import {
  useCohortPolicies,
  useCohortPricing,
  useUpsertCohortPolicy,
  useUpsertCohortPricing,
  useDeleteCohortPolicy,
  useDeleteCohortPricing,
} from '@/hooks/useMentorCohortOverrides';
import type { MentorCancellationPolicy } from '@/types/dto';

const POLICY_OPTIONS: MentorCancellationPolicy[] = [
  'PLATFORM_DEFAULT',
  'STRICT_NONE',
  'FLEXIBLE_7D',
  'FLEXIBLE_14D',
];

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP'];

const DEFAULT_COHORT_COLOR = '#6366f1';

/**
 * MentorCohortOverridesPanel — surfaces in the Compliance tab. Lets the
 * mentor override cancellation policy and subscription pricing on a per-
 * cohort basis. When no override exists, the instance default applies.
 */
const MentorCohortOverridesPanel: React.FC = () => {
  const { t } = useTranslation();
  const { data: cohorts = [] } = useMentorCohorts();
  const { data: policies = [] } = useCohortPolicies();
  const { data: pricing = [] } = useCohortPricing();
  const upsertPolicy = useUpsertCohortPolicy();
  const upsertPricing = useUpsertCohortPricing();
  const deletePolicy = useDeleteCohortPolicy();
  const deletePricing = useDeleteCohortPricing();

  const policyByCohort = useMemo(
    () => new Map(policies.map((p) => [p.cohortId, p])),
    [policies],
  );
  const pricingByCohort = useMemo(
    () => new Map(pricing.map((p) => [p.cohortId, p])),
    [pricing],
  );

  if (cohorts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/50 p-6 text-center">
        <p className="text-sm font-medium">
          {t('mentor.cohortOverrides.emptyTitle', 'No cohorts to override')}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t(
            'mentor.cohortOverrides.emptyDesc',
            'Create cohorts on the Overview tab to start setting per-cohort policies and pricing.',
          )}
        </p>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="cohort-overrides-heading"
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary" aria-hidden="true" />
        <h2 id="cohort-overrides-heading" className="text-base font-semibold">
          {t('mentor.cohortOverrides.title', 'Per-cohort overrides')}
        </h2>
      </div>
      <p className="text-xs text-muted-foreground max-w-2xl">
        {t(
          'mentor.cohortOverrides.intro',
          'Each row shows one cohort. Cancellation policy and subscription pricing fall back to your instance defaults when no override is set.',
        )}
      </p>

      <div className="space-y-3">
        {cohorts.map((cohort) => (
          <CohortOverrideRow
            key={cohort.id}
            cohort={cohort}
            policy={policyByCohort.get(cohort.id) ?? null}
            pricing={pricingByCohort.get(cohort.id) ?? null}
            onPolicySave={(p) =>
              upsertPolicy.mutate({ cohortId: cohort.id, cancellationPolicy: p })
            }
            onPolicyDelete={() => deletePolicy.mutate(cohort.id)}
            onPricingSave={(amount, currency) =>
              upsertPricing.mutate({
                cohortId: cohort.id,
                monthlyAmount: amount,
                currency,
              })
            }
            onPricingDelete={() => deletePricing.mutate(cohort.id)}
            policyPending={upsertPolicy.isPending || deletePolicy.isPending}
            pricingPending={upsertPricing.isPending || deletePricing.isPending}
          />
        ))}
      </div>
    </section>
  );
};

interface RowProps {
  cohort: { id: string; name: string; color: string | null; memberCount: number };
  policy: { cancellationPolicy: MentorCancellationPolicy } | null;
  pricing: { monthlyAmount: number; currency: string } | null;
  onPolicySave: (policy: string) => void;
  onPolicyDelete: () => void;
  onPricingSave: (monthlyAmount: number, currency: string) => void;
  onPricingDelete: () => void;
  policyPending: boolean;
  pricingPending: boolean;
}

const CohortOverrideRow: React.FC<RowProps> = ({
  cohort,
  policy,
  pricing,
  onPolicySave,
  onPolicyDelete,
  onPricingSave,
  onPricingDelete,
  policyPending,
  pricingPending,
}) => {
  const { t } = useTranslation();
  const [policyDraft, setPolicyDraft] = useState<string>(
    policy?.cancellationPolicy ?? '',
  );
  const [amountDraft, setAmountDraft] = useState<string>(
    pricing ? String(pricing.monthlyAmount) : '',
  );
  const [currencyDraft, setCurrencyDraft] = useState<string>(
    pricing?.currency ?? 'USD',
  );

  const policyDirty = policyDraft && policyDraft !== (policy?.cancellationPolicy ?? '');
  const amountNum = Number(amountDraft);
  const pricingValid = amountDraft !== '' && Number.isFinite(amountNum) && amountNum >= 0;
  const pricingDirty =
    pricingValid &&
    (amountNum !== (pricing?.monthlyAmount ?? -1) ||
      currencyDraft !== (pricing?.currency ?? 'USD'));

  return (
    <div className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: cohort.color ?? DEFAULT_COHORT_COLOR }}
          aria-hidden="true"
        />
        <p className="text-sm font-semibold">{cohort.name}</p>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          · {t('mentor.cohorts.memberCount', '{{n}} members', { n: cohort.memberCount })}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Cancellation policy column */}
        <div className="space-y-2 rounded-lg bg-background/40 p-3 border border-border/40">
          <Label className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            {t('mentor.cohortOverrides.policyLabel', 'Cancellation policy')}
          </Label>
          <Select value={policyDraft} onValueChange={setPolicyDraft}>
            <SelectTrigger>
              <SelectValue placeholder={t('mentor.cohortOverrides.policyPlaceholder', 'Use instance default')} />
            </SelectTrigger>
            <SelectContent>
              {POLICY_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p.replace(/_/g, ' ').toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-end gap-2">
            {policy && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs gap-1 text-muted-foreground hover:text-destructive"
                onClick={onPolicyDelete}
                disabled={policyPending}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('mentor.cohortOverrides.useDefault', 'Use default')}
              </Button>
            )}
            <Button
              size="sm"
              disabled={!policyDirty || policyPending}
              onClick={() => onPolicySave(policyDraft)}
            >
              {policyPending && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />}
              {t('common.save', 'Save')}
            </Button>
          </div>
        </div>

        {/* Pricing override column */}
        <div className="space-y-2 rounded-lg bg-background/40 p-3 border border-border/40">
          <Label className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            {t('mentor.cohortOverrides.pricingLabel', 'Monthly subscription override')}
          </Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={0}
              step={1}
              value={amountDraft}
              onChange={(e) => setAmountDraft(e.target.value)}
              placeholder="0"
              className="flex-1"
              aria-label={t('mentor.cohortOverrides.amountAria', 'Monthly amount')}
            />
            <Select value={currencyDraft} onValueChange={setCurrencyDraft}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-end gap-2">
            {pricing && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs gap-1 text-muted-foreground hover:text-destructive"
                onClick={onPricingDelete}
                disabled={pricingPending}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('mentor.cohortOverrides.useDefault', 'Use default')}
              </Button>
            )}
            <Button
              size="sm"
              disabled={!pricingDirty || pricingPending}
              onClick={() => onPricingSave(amountNum, currencyDraft)}
            >
              {pricingPending && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />}
              {t('common.save', 'Save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorCohortOverridesPanel;
