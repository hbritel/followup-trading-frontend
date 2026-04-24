import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMentorInstance, useSetCancellationPolicy } from '@/hooks/useMentor';
import type { MentorCancellationPolicy } from '@/types/dto';

interface PolicyOption {
  value: MentorCancellationPolicy;
  labelKey: string;
  labelFallback: string;
  descKey: string;
  descFallback: string;
}

const POLICY_OPTIONS: PolicyOption[] = [
  {
    value: 'PLATFORM_DEFAULT',
    labelKey: 'mentor.trust.cancellationPolicy.PLATFORM_DEFAULT',
    labelFallback: 'Platform default',
    descKey: 'mentor.settings.cancellationPolicy.PLATFORM_DEFAULT.desc',
    descFallback: 'Follow the standard FollowUp Trading cancellation policy.',
  },
  {
    value: 'FLEXIBLE_7D',
    labelKey: 'mentor.trust.cancellationPolicy.FLEXIBLE_7D',
    labelFallback: '7-day refund',
    descKey: 'mentor.settings.cancellationPolicy.FLEXIBLE_7D.desc',
    descFallback: 'Students can request a full refund within 7 days of subscribing.',
  },
  {
    value: 'FLEXIBLE_14D',
    labelKey: 'mentor.trust.cancellationPolicy.FLEXIBLE_14D',
    labelFallback: '14-day refund',
    descKey: 'mentor.settings.cancellationPolicy.FLEXIBLE_14D.desc',
    descFallback: 'Students can request a full refund within 14 days of subscribing.',
  },
  {
    value: 'STRICT_NONE',
    labelKey: 'mentor.trust.cancellationPolicy.STRICT_NONE',
    labelFallback: 'No refunds',
    descKey: 'mentor.settings.cancellationPolicy.STRICT_NONE.desc',
    descFallback:
      'No refunds are issued. Students will see this clearly before subscribing.',
  },
];

const CancellationPolicySelector: React.FC = () => {
  const { t } = useTranslation();
  const { data: instance, isLoading } = useMentorInstance();
  const setPolicy = useSetCancellationPolicy();

  const currentPolicy =
    (instance as { cancellationPolicy?: MentorCancellationPolicy })
      ?.cancellationPolicy ?? 'PLATFORM_DEFAULT';

  const [selected, setSelected] = useState<MentorCancellationPolicy>(currentPolicy);
  const isDirty = selected !== currentPolicy;

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">
          {t('mentor.settings.cancellationPolicy.title', 'Cancellation policy')}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t(
            'mentor.settings.cancellationPolicy.description',
            'Choose the refund policy that applies to your subscriptions.'
          )}
        </p>
      </div>

      <RadioGroup
        value={selected}
        onValueChange={(v) => setSelected(v as MentorCancellationPolicy)}
        className="space-y-2"
      >
        {POLICY_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            htmlFor={`policy-${opt.value}`}
            className={[
              'flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all duration-150',
              selected === opt.value
                ? 'border-primary/50 bg-primary/5 shadow-sm'
                : 'border-border/50 bg-background/40 hover:border-border',
            ].join(' ')}
          >
            <RadioGroupItem
              value={opt.value}
              id={`policy-${opt.value}`}
              className="mt-0.5 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium leading-none">
                {t(opt.labelKey, opt.labelFallback)}
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {t(opt.descKey, opt.descFallback)}
              </p>
            </div>
          </label>
        ))}
      </RadioGroup>

      {isDirty && (
        <Button
          size="sm"
          onClick={() => setPolicy.mutate(selected)}
          disabled={setPolicy.isPending}
          className="gap-2"
        >
          {setPolicy.isPending && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}
          {t('common.save', 'Save')}
        </Button>
      )}
    </div>
  );
};

export default CancellationPolicySelector;
