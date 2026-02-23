import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  PercentIcon,
  TrendingUp
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  progressValue?: number;
  progressColor?: string;
}

const StatCard = ({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  className,
  progressValue,
  progressColor = 'bg-primary'
}: StatCardProps) => {
  return (
    <Card className={cn(
      "overflow-hidden animate-fade-in group hover:border-primary/30 hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(var(--primary),0.15)] transition-all duration-300 hover:-translate-y-1",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-5 pb-2">
        <div className="min-w-0 flex-1">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider truncate">
            {title}
          </CardTitle>
        </div>
        {icon && (
          <div className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-primary shadow-sm dark:shadow-[0_0_10px_rgba(var(--primary),0.2)] group-hover:text-primary-foreground group-hover:bg-primary/90 dark:group-hover:bg-primary/20 dark:group-hover:text-white dark:group-hover:border-primary/20 transition-all duration-300 shrink-0 ml-2">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-1">
        <div className="flex items-baseline gap-2 sm:gap-3 min-w-0">
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground text-glow truncate min-w-0">{value}</div>
          {trend && trendValue && (
            <div className={cn(
              "flex items-center text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full backdrop-blur-sm border whitespace-nowrap shrink-0",
              trend === 'up' && "text-profit bg-profit/10 border-profit/20",
              trend === 'down' && "text-loss bg-loss/10 border-loss/20",
              trend === 'neutral' && "text-muted-foreground bg-muted/10 border-muted/20"
            )}>
              {trend === 'up' && <ArrowUpRight className="h-3 w-3 mr-0.5" />}
              {trend === 'down' && <ArrowDownRight className="h-3 w-3 mr-0.5" />}
              {trendValue}
            </div>
          )}
        </div>

        {description && (
          <CardDescription className="text-xs font-medium mt-2 text-muted-foreground">
            {description}
          </CardDescription>
        )}

        {progressValue !== undefined && (
          <div className="mt-4 relative h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
             <div
               className={cn("absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out", progressColor)}
               style={{ width: `${progressValue}%`, boxShadow: `0 0 10px var(--${progressColor.replace('bg-', '')})` }}
             />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import { AnalyticsDashboard } from '@/services/trade.service';

const TradingStats = ({ analytics }: { analytics?: AnalyticsDashboard }) => {
  if (!analytics) return null;

  const { winRate, totalProfitLoss, bestTrade, worstTrade } = analytics;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <StatCard
        title="Win Rate"
        value={`${winRate.toFixed(2)}%`}
        description="All trades"
        icon={<PercentIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
        trend={winRate >= 50 ? "up" : "down"}
        progressValue={winRate}
        progressColor={winRate >= 50 ? "bg-profit" : "bg-loss"}
      />

      <StatCard
        title="Total P&L"
        value={`$${totalProfitLoss.toFixed(2)}`}
        description="Realized profit & loss"
        icon={<DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
        trend={totalProfitLoss >= 0 ? "up" : "down"}
        progressValue={100}
        progressColor={totalProfitLoss >= 0 ? "bg-profit" : "bg-loss"}
      />

      <StatCard
        title="Best Trade"
        value={`$${bestTrade.toFixed(2)}`}
        description="Highest single profit"
        icon={<ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
        trend={bestTrade >= 0 ? "up" : "down"}
        progressValue={bestTrade > 0 ? 100 : 0}
        progressColor="bg-profit"
      />

      <StatCard
        title="Worst Trade"
        value={`$${worstTrade.toFixed(2)}`}
        description="Lowest single loss"
        icon={<ArrowDownRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
        trend={worstTrade < 0 ? "down" : "up"}
        progressValue={worstTrade < 0 ? 100 : 0}
        progressColor="bg-loss"
      />
    </div>
  );
};

export default TradingStats;
