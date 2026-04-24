import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { MentorCancellationPolicy } from '@/types/dto';

interface CancellationPolicyChipProps {
  policy: MentorCancellationPolicy;
  className?: string;
}

const CHIP_STYLES: Record<MentorCancellationPolicy, string> = {
  PLATFORM_DEFAULT:
    'bg-muted/60 text-muted-foreground border-border/40',
  STRICT_NONE:
    'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25',
  FLEXIBLE_7D:
    'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
  FLEXIBLE_14D:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
};

const FALLBACKS: Record<MentorCancellationPolicy, string> = {
  PLATFORM_DEFAULT: 'Default policy',
  STRICT_NONE: 'No refunds',
  FLEXIBLE_7D: '7-day refund',
  FLEXIBLE_14D: '14-day refund',
};

const CancellationPolicyChip: React.FC<CancellationPolicyChipProps> = ({
  policy,
  className,
}) => {
  const { t } = useTranslation();

  if (!policy || !(policy in FALLBACKS)) {
    return null;
  }

  const label = t(`mentor.trust.cancellationPolicy.${policy}`, FALLBACKS[policy]);

  return (
    <span
      className={cn(
        'inline-flex items-center text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border',
        CHIP_STYLES[policy],
        className
      )}
    >
      {label}
    </span>
  );
};

export default CancellationPolicyChip;
