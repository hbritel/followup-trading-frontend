import React from 'react';
import { useTiltScore } from '@/hooks/useTiltScore';
import { cn } from '@/lib/utils';

interface TiltGaugeProps {
  compact?: boolean;
  accountId?: string;
}

const getColor = (score: number): string => {
  if (score <= 30) return 'text-green-500';
  if (score <= 60) return 'text-yellow-500';
  if (score <= 80) return 'text-orange-500';
  return 'text-red-500';
};

const getStrokeColor = (score: number): string => {
  if (score <= 30) return '#22c55e';
  if (score <= 60) return '#eab308';
  if (score <= 80) return '#f97316';
  return '#ef4444';
};

const TiltGauge: React.FC<TiltGaugeProps> = ({ compact = false, accountId }) => {
  const { data, isLoading } = useTiltScore(accountId);

  const score = data?.score ?? 0;
  const label = data?.thresholdLabel ?? 'GREEN';

  const size = compact ? 40 : 96;
  const strokeWidth = compact ? 3 : 7;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-muted/30 animate-pulse',
          compact ? 'w-10 h-10' : 'w-24 h-24'
        )}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
          {/* Score arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getStrokeColor(score)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        {/* Center score */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              'font-bold tabular-nums',
              compact ? 'text-xs' : 'text-xl',
              getColor(score)
            )}
          >
            {score}
          </span>
        </div>
      </div>
      {!compact && (
        <span
          className={cn(
            'text-xs font-semibold uppercase tracking-wider',
            getColor(score)
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default TiltGauge;
