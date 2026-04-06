import React from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface UsageLimitIndicatorProps {
  used: number;
  max: number;
  label?: string;
  className?: string;
  showBar?: boolean;
}

/**
 * Shows "X / Y" usage with optional progress bar and color coding.
 * - Green: < 70%
 * - Amber: 70-99%
 * - Red: 100% (at limit)
 */
const UsageLimitIndicator: React.FC<UsageLimitIndicatorProps> = ({
  used,
  max,
  label,
  className,
  showBar = false,
}) => {
  const { t } = useTranslation();
  const isUnlimited = max >= 2147483647; // Integer.MAX_VALUE
  const pct = isUnlimited ? 0 : max === 0 ? 100 : Math.min((used / max) * 100, 100);
  const atLimit = !isUnlimited && used >= max;

  const colorClass = atLimit
    ? 'text-red-400'
    : pct >= 70
      ? 'text-amber-400'
      : 'text-muted-foreground';

  const barColorClass = atLimit
    ? 'bg-red-500'
    : pct >= 70
      ? 'bg-amber-500'
      : 'bg-primary';

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-1.5 text-xs">
        {label && <span className="text-muted-foreground">{label}</span>}
        <span className={cn('font-medium tabular-nums', colorClass)}>
          {used} / {isUnlimited ? '\u221e' : max}
        </span>
        {atLimit && (
          <span className="text-[10px] text-red-400 font-medium">
            ({t('subscription.limitReached', 'Limit reached')})
          </span>
        )}
      </div>
      {showBar && !isUnlimited && (
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-300', barColorClass)}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default UsageLimitIndicator;
