import React from 'react';
import {
  Calculator,
  CreditCard,
  DollarSign,
  LineChart,
  Percent,
  ShieldAlert
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Trade } from '@/components/trades/TradesTableWrapper';

const MetricCard = ({
  title,
  value,
  icon,
  description
}: {
  title: string,
  value: string | number,
  icon: React.ReactNode,
  description: string
}) => {
  return (
    <div className="flex flex-col p-4 sm:p-5 bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors group shadow-sm dark:shadow-none min-w-0">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="p-2 sm:p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm dark:shadow-[0_0_10px_rgba(var(--primary),0.1)] group-hover:shadow-md dark:group-hover:shadow-[0_0_15px_rgba(var(--primary),0.3)] group-hover:text-primary-foreground group-hover:bg-primary dark:group-hover:text-white dark:group-hover:bg-primary/30 transition-all duration-300 shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</h3>
          <p className="text-base sm:text-xl font-bold font-mono tracking-tight text-foreground dark:text-glow truncate">{value}</p>
        </div>
      </div>
      <p className="mt-2 sm:mt-3 text-xs text-muted-foreground">{description}</p>
    </div>
  );
};

interface StatItemProps {
  label: string;
  value: string | number;
  previousValue?: string | number;
  changePercentage?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

const StatItem = ({
  label,
  value,
  previousValue,
  changePercentage,
  trend,
  className
}: StatItemProps) => {
  return (
    <div className={cn("flex flex-col min-w-0", className)}>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-base sm:text-lg font-bold mt-1 font-mono tracking-tight text-foreground dark:text-white truncate">{value}</span>
      {previousValue && (
        <span className="text-xs mt-1 text-muted-foreground">
          Prev: {previousValue}
        </span>
      )}
      {changePercentage && (
        <span className={cn(
          "text-xs font-bold mt-1 px-1.5 py-0.5 rounded w-fit backdrop-blur-sm",
          trend === 'up' && "text-profit bg-profit/10 border border-profit/20",
          trend === 'down' && "text-loss bg-loss/10 border border-loss/20",
          !trend && "text-muted-foreground"
        )}>
          {trend === 'up' && '+'}
          {changePercentage}%
        </span>
      )}
    </div>
  );
};

import { AnalyticsDashboard } from '@/services/trade.service';

const AccountSummary = ({ analytics }: { analytics?: AnalyticsDashboard }) => {
  if (!analytics) return null;

  const {
    totalProfitLoss,
    totalTrades,
    winRate,
    winningTrades,
    losingTrades,
    bestTrade,
    worstTrade,
    longProfitLoss,
    shortProfitLoss,
    totalFees
  } = analytics;

  // Win/Loss Ratio
  const winLossRatio = losingTrades > 0 ? (winningTrades / losingTrades) : (winningTrades > 0 ? winningTrades : 0);

  const accountMetrics = [
    {
      title: 'Realized P&L',
      value: `${totalProfitLoss >= 0 ? '+' : ''}$${totalProfitLoss.toFixed(2)}`,
      icon: <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />,
      description: 'Total realized profit/loss',
    },
    {
      title: 'Total Trades',
      value: totalTrades,
      icon: <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />,
      description: 'Total combined trades',
    },
    {
      title: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      icon: <Percent className="h-4 w-4 sm:h-5 sm:w-5" />,
      description: 'Percentage of winning trades',
    },
    {
      title: 'W/L Ratio',
      value: `${winLossRatio.toFixed(2)}:1`,
      icon: <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />,
      description: 'Win to Loss sequence',
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <Card className="lg:col-span-2 glass-card animate-slide-up">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200/50 dark:border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold tracking-tight">Account Summary</CardTitle>
              <CardDescription className="text-muted-foreground">Overview of your trading account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {accountMetrics.map((metric, index) => (
              <MetricCard
                key={index}
                title={metric.title}
                value={metric.value}
                icon={metric.icon}
                description={metric.description}
              />
            ))}
          </div>

          <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-4 sm:p-5 border border-slate-200/50 dark:border-white/5 rounded-xl bg-slate-50/50 dark:bg-white/5 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Risk Assessment</h3>
                  <p className="text-lg sm:text-xl font-bold mt-1 text-foreground dark:text-white">Low Risk</p>
                </div>
                <ShieldAlert className="h-5 w-5 text-primary animate-pulse-glow shrink-0" />
              </div>
              <div className="mt-4 sm:mt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Portfolio Risk Level</span>
                  <span className="text-xs font-bold text-primary">15%</span>
                </div>
                <Progress value={15} className="h-2 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/5" indicatorClassName="bg-primary/80 shadow-sm dark:shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
              </div>
            </div>

            <div className="p-4 sm:p-5 border border-slate-200/50 dark:border-white/5 rounded-xl bg-slate-50/50 dark:bg-white/5 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Performance Metrics</h3>
                  <p className="text-lg sm:text-xl font-bold mt-1 text-foreground dark:text-white">Above Average</p>
                </div>
                <LineChart className="h-5 w-5 text-profit shrink-0" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
                <StatItem
                  label="Sharpe Ratio"
                  value="1.87"
                  previousValue="1.43"
                  changePercentage="30.8"
                  trend="up"
                />
                <StatItem
                  label="Max Drawdown"
                  value="-8.2%"
                  previousValue="-12.6%"
                  changePercentage="34.9"
                  trend="up"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:row-span-1 glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200/50 dark:border-white/5">
          <CardTitle className="text-base sm:text-lg font-semibold tracking-tight">Trade Statistics</CardTitle>
          <CardDescription className="text-muted-foreground">Key performance indicators</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 py-4 sm:py-6 pb-6 sm:pb-8">
          <div className="space-y-5 sm:space-y-6">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Winning Trades</span>
                <span className="text-sm font-bold text-profit dark:text-glow">{winRate.toFixed(1)}% ({winningTrades})</span>
              </div>
              <Progress value={winRate} className="h-2 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/5" indicatorClassName="bg-profit/80 shadow-sm dark:shadow-[0_0_10px_rgba(var(--profit),0.5)]" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Win/Loss Ratio</span>
                <span className="text-sm font-bold text-foreground dark:text-white">{winLossRatio.toFixed(2)}:1</span>
              </div>
              <Progress value={Math.min(100, (winLossRatio / 5) * 100)} className="h-2 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/5" indicatorClassName="bg-primary/80 shadow-sm dark:shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Long P&L</span>
                <span className={cn("text-sm font-bold font-mono", longProfitLoss >= 0 ? "text-profit" : "text-loss")}>
                  ${longProfitLoss.toFixed(2)}
                </span>
              </div>
              <Progress value={longProfitLoss > 0 ? 100 : 0} className="h-2 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/5" indicatorClassName={longProfitLoss >= 0 ? "bg-profit/80" : "bg-loss/80"} />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Short P&L</span>
                <span className={cn("text-sm font-bold font-mono", shortProfitLoss >= 0 ? "text-profit" : "text-loss")}>
                  ${shortProfitLoss.toFixed(2)}
                </span>
              </div>
              <Progress value={shortProfitLoss > 0 ? 100 : 0} className="h-2 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/5" indicatorClassName={shortProfitLoss >= 0 ? "bg-profit/80" : "bg-loss/80"} />
            </div>

            <div className="pt-4 flex justify-between border-t border-slate-200/50 dark:border-white/10 mt-2">
              <StatItem
                label="Best Trade"
                value={`$${bestTrade.toFixed(2)}`}
                trend={bestTrade >= 0 ? "up" : "down"}
              />
              <StatItem
                label="Worst Trade"
                value={`$${worstTrade.toFixed(2)}`}
                trend={worstTrade >= 0 ? "up" : "down"}
                className="items-end text-right"
              />
            </div>

            <div className="pt-4 border-t border-slate-200/50 dark:border-white/10 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Fees Paid</span>
                <span className="text-sm font-mono tracking-tight text-loss">
                  ${totalFees.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSummary;
