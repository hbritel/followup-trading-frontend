import React from 'react';
import { cn } from '@/lib/utils';

type GaugeType = 'profit' | 'drawdown' | 'daily-loss';

interface ComplianceGaugeProps {
  label: string;
  current: number;
  limit: number;
  type: GaugeType;
  className?: string;
}

const TYPE_CONFIG: Record<
  GaugeType,
  {
    trackColor: string;
    indicatorColor: string;
    dangerThreshold: number;
    dangerColor: string;
  }
> = {
  profit: {
    trackColor: 'bg-green-500/10',
    indicatorColor: 'bg-green-500',
    dangerThreshold: 100,
    dangerColor: 'bg-green-500',
  },
  drawdown: {
    trackColor: 'bg-red-500/10',
    indicatorColor: 'bg-amber-500',
    dangerThreshold: 80,
    dangerColor: 'bg-red-500',
  },
  'daily-loss': {
    trackColor: 'bg-orange-500/10',
    indicatorColor: 'bg-orange-400',
    dangerThreshold: 80,
    dangerColor: 'bg-red-500',
  },
};

const formatValue = (value: number, type: GaugeType): string => {
  if (type === 'profit') {
    return `+${value.toFixed(2)}%`;
  }
  return `${value.toFixed(2)}%`;
};

const ComplianceGauge: React.FC<ComplianceGaugeProps> = ({
  label,
  current,
  limit,
  type,
  className,
}) => {
  const config = TYPE_CONFIG[type];

  const rawPct = limit > 0 ? Math.abs(current) / Math.abs(limit) : 0;
  const progressPct = Math.min(rawPct * 100, 100);

  const isInDanger = progressPct >= config.dangerThreshold;
  const indicatorClass = isInDanger ? config.dangerColor : config.indicatorColor;

  const isOverLimit = progressPct >= 100;

  const tooltipText =
    type === 'profit'
      ? `Progress: ${current.toFixed(2)}% of ${limit.toFixed(2)}% target (${progressPct.toFixed(1)}% complete)`
      : `Used: ${Math.abs(current).toFixed(2)}% of ${Math.abs(limit).toFixed(2)}% limit (${progressPct.toFixed(1)}% consumed)`;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span
            title={tooltipText}
            className={cn(
              'font-mono font-semibold tabular-nums cursor-help',
              type === 'profit' && 'text-green-400',
              type === 'drawdown' && (isInDanger ? 'text-red-400' : 'text-amber-400'),
              type === 'daily-loss' && (isInDanger ? 'text-red-400' : 'text-orange-400'),
            )}
          >
            {formatValue(Math.abs(current), type)}
          </span>
          <span className="text-muted-foreground text-xs">
            / {Math.abs(limit).toFixed(1)}%
          </span>
          {isOverLimit && type !== 'profit' && (
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide">
              Breached
            </span>
          )}
          {isOverLimit && type === 'profit' && (
            <span className="text-[10px] font-bold text-green-400 uppercase tracking-wide">
              Reached
            </span>
          )}
        </div>
      </div>

      {/* Custom progress bar */}
      <div
        className={cn('relative h-2 w-full overflow-hidden rounded-full', config.trackColor)}
        title={tooltipText}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            indicatorClass,
            isInDanger && type !== 'profit' && 'animate-pulse',
          )}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
};

export default ComplianceGauge;
