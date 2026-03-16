import React from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  sparklineData?: number[];
  className?: string;
  iconClassName?: string;
  animationDelay?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  sparklineData,
  className,
  iconClassName,
  animationDelay,
}) => {
  const isPositive = change !== undefined && change >= 0;
  const isNegative = change !== undefined && change < 0;

  const sparklineColor = change === undefined
    ? 'hsl(var(--primary))'
    : isPositive
    ? 'hsl(var(--profit))'
    : 'hsl(var(--loss))';

  const sparklinePoints = sparklineData
    ? sparklineData.map((v, i) => ({ v, i }))
    : [];

  return (
    <div
      className={cn('glass-card rounded-2xl p-5 flex flex-col gap-3 animate-fade-in', className)}
      style={animationDelay ? { animationDelay } : undefined}
    >
      {/* Header row: label + icon */}
      <div className="flex items-center justify-between">
        <span className="label-caps text-muted-foreground">{title}</span>
        <div
          className={cn(
            'p-2 rounded-xl border border-white/[0.08] bg-white/[0.04]',
            'dark:shadow-[0_0_12px_rgba(139,92,246,0.18)]',
            iconClassName,
          )}
        >
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>

      {/* Value row */}
      <div className="flex items-end justify-between gap-2">
        <span className="kpi-value text-3xl text-foreground dark:text-white">
          {value}
        </span>

        {change !== undefined && (
          <span
            className={cn(
              'text-xs font-semibold font-mono px-2 py-0.5 rounded-full border whitespace-nowrap mb-0.5',
              isPositive && 'text-profit bg-profit/10 border-profit/20',
              isNegative && 'text-loss bg-loss/10 border-loss/20',
              !isPositive && !isNegative && 'text-muted-foreground bg-muted/10 border-muted/20',
            )}
          >
            {isPositive ? '+' : ''}{change.toFixed(1)}%
          </span>
        )}
      </div>

      {/* Sparkline */}
      {sparklinePoints.length > 1 && (
        <div className="h-[52px] w-full -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklinePoints} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id={`kpi-grad-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={sparklineColor} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={sparklineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={sparklineColor}
                strokeWidth={1.5}
                dot={false}
                fill={`url(#kpi-grad-${title.replace(/\s/g, '')})`}
                fillOpacity={1}
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default KpiCard;
