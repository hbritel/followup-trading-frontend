import React from 'react';
import { useTranslation } from 'react-i18next';
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
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DashboardSummary } from '@/services/metrics.service';

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
  isLoading?: boolean;
}

const StatItem = ({
  label,
  value,
  previousValue,
  changePercentage,
  trend,
  className,
  isLoading
}: StatItemProps) => {
  return (
    <div className={cn("flex flex-col min-w-0", className)}>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      {isLoading ? (
        <Skeleton className="h-6 w-16 mt-1" />
      ) : (
        <span className="text-base sm:text-lg font-bold mt-1 font-mono tracking-tight text-foreground dark:text-white truncate">{value}</span>
      )}
      {previousValue && !isLoading && (
        <span className="text-xs mt-1 text-muted-foreground">
          {previousValue}
        </span>
      )}
      {changePercentage && !isLoading && (
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

interface AccountSummaryProps {
  analytics?: AnalyticsDashboard;
  dashboardSummary?: DashboardSummary;
  metricsLoading?: boolean;
}

const AccountSummary = ({ analytics, dashboardSummary, metricsLoading = false }: AccountSummaryProps) => {
  const { t } = useTranslation();

  if (!analytics) return null;

  const {
    totalProfitLoss,
    totalTrades,
    winRate,
  } = analytics;

  const winLossRatio = analytics.winLossRatio ?? 0;

  // Extract real metrics from backend (with fallbacks)
  const sharpeRatio = dashboardSummary?.sharpeRatio;
  const maxDrawdownPercent = dashboardSummary?.drawdownMetrics?.maxDrawdownPercent;

  // Format Sharpe Ratio display
  const sharpeDisplay = sharpeRatio != null ? sharpeRatio.toFixed(2) : '-';
  const sharpeTrend: 'up' | 'down' | 'neutral' | undefined =
    sharpeRatio != null ? (sharpeRatio >= 1 ? 'up' : sharpeRatio >= 0 ? 'neutral' : 'down') : undefined;

  // Format Max Drawdown display
  const drawdownDisplay = maxDrawdownPercent != null ? `-${maxDrawdownPercent.toFixed(1)}%` : '-';
  // Lower drawdown is better, so a lower value is an "up" trend
  const drawdownTrend: 'up' | 'down' | 'neutral' | undefined =
    maxDrawdownPercent != null ? (maxDrawdownPercent <= 10 ? 'up' : maxDrawdownPercent <= 20 ? 'neutral' : 'down') : undefined;

  // Portfolio risk level derived from max drawdown (date-filtered)
  // Drawdown 0% = no risk, 50%+ = max risk on the scale
  const riskLevel = maxDrawdownPercent != null ? Math.min(Math.abs(maxDrawdownPercent), 100) : 0;
  const riskLabel = riskLevel <= 10 ? t('dashboard.lowRisk') : riskLevel <= 25 ? t('dashboard.mediumRisk') : t('dashboard.highRisk');

  // Performance label derived from Sharpe ratio
  const perfLabel = sharpeRatio != null
    ? (sharpeRatio >= 2 ? t('dashboard.excellent') : sharpeRatio >= 1 ? t('dashboard.aboveAverage') : sharpeRatio >= 0 ? t('dashboard.average') : t('dashboard.belowAverage'))
    : t('dashboard.calculating');

  const accountMetrics = [
    {
      title: t('dashboard.realizedPnl'),
      value: `${totalProfitLoss >= 0 ? '+' : ''}$${totalProfitLoss.toFixed(2)}`,
      icon: <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />,
      description: t('dashboard.totalRealizedDesc'),
    },
    {
      title: t('stats.totalTrades'),
      value: totalTrades,
      icon: <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />,
      description: t('dashboard.totalCombinedTrades'),
    },
    {
      title: t('stats.winRate'),
      value: `${winRate.toFixed(1)}%`,
      icon: <Percent className="h-4 w-4 sm:h-5 sm:w-5" />,
      description: t('dashboard.winningPercentage'),
    },
    {
      title: t('dashboard.wlRatio'),
      value: `${winLossRatio.toFixed(2)}:1`,
      icon: <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />,
      description: t('dashboard.wlRatioDesc'),
    }
  ];

  return (
      <Card className="glass-card animate-slide-up">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200/50 dark:border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold tracking-tight">{t('dashboard.accountSummary')}</CardTitle>
              <CardDescription className="text-muted-foreground">{t('dashboard.accountSummaryDesc')}</CardDescription>
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
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.riskAssessment')}</h3>
                  {metricsLoading ? (
                    <Skeleton className="h-7 w-24 mt-1" />
                  ) : (
                    <p className="text-lg sm:text-xl font-bold mt-1 text-foreground dark:text-white">{riskLabel}</p>
                  )}
                </div>
                <ShieldAlert className="h-5 w-5 text-primary animate-pulse-glow shrink-0" />
              </div>
              <div className="mt-4 sm:mt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">{t('dashboard.portfolioRiskLevel')}</span>
                  {metricsLoading ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="text-xs font-bold text-primary">{riskLevel.toFixed(0)}%</span>
                  )}
                </div>
                <Progress value={riskLevel} className="h-2 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/5" indicatorClassName="bg-primary/80 shadow-sm dark:shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
              </div>
            </div>

            <div className="p-4 sm:p-5 border border-slate-200/50 dark:border-white/5 rounded-xl bg-slate-50/50 dark:bg-white/5 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.performanceMetrics')}</h3>
                  {metricsLoading ? (
                    <Skeleton className="h-7 w-28 mt-1" />
                  ) : (
                    <p className="text-lg sm:text-xl font-bold mt-1 text-foreground dark:text-white">{perfLabel}</p>
                  )}
                </div>
                <LineChart className="h-5 w-5 text-profit shrink-0" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
                <StatItem
                  label={t('dashboard.sharpeRatio')}
                  value={sharpeDisplay}
                  isLoading={metricsLoading}
                  trend={sharpeTrend}
                />
                <StatItem
                  label={t('dashboard.maxDrawdown')}
                  value={drawdownDisplay}
                  isLoading={metricsLoading}
                  trend={drawdownTrend}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
  );
};

export const TradeStatistics = ({ analytics }: { analytics?: AnalyticsDashboard }) => {
  const { t } = useTranslation();
  if (!analytics) return null;

  const {
    winRate,
    winningTrades,
    bestTrade,
    worstTrade,
    longProfitLoss,
    shortProfitLoss,
    totalFees
  } = analytics;

  const winLossRatio = analytics.winLossRatio ?? 0;

  return (
    <Card className="glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200/50 dark:border-white/5">
        <CardTitle className="text-base sm:text-lg font-semibold tracking-tight">{t('dashboard.tradeStatistics')}</CardTitle>
        <CardDescription className="text-muted-foreground">{t('dashboard.kpi')}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 py-4 sm:py-6 pb-6 sm:pb-8">
        <div className="space-y-5 sm:space-y-6">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">{t('dashboard.winningTrades')}</span>
              <span className="text-sm font-bold text-profit dark:text-glow">{winRate.toFixed(1)}% ({winningTrades})</span>
            </div>
            <Progress value={winRate} className="h-2 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/5" indicatorClassName="bg-profit/80 shadow-sm dark:shadow-[0_0_10px_rgba(var(--profit),0.5)]" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">{t('dashboard.winLossRatio')}</span>
              <span className="text-sm font-bold text-foreground dark:text-white">{winLossRatio.toFixed(2)}:1</span>
            </div>
            <Progress value={Math.min(100, (winLossRatio / 5) * 100)} className="h-2 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/5" indicatorClassName="bg-primary/80 shadow-sm dark:shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">{t('dashboard.longPnl')}</span>
              <span className={cn("text-sm font-bold font-mono", longProfitLoss >= 0 ? "text-profit" : "text-loss")}>
                ${longProfitLoss.toFixed(2)}
              </span>
            </div>
            <Progress value={longProfitLoss > 0 ? 100 : 0} className="h-2 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/5" indicatorClassName={longProfitLoss >= 0 ? "bg-profit/80" : "bg-loss/80"} />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">{t('dashboard.shortPnl')}</span>
              <span className={cn("text-sm font-bold font-mono", shortProfitLoss >= 0 ? "text-profit" : "text-loss")}>
                ${shortProfitLoss.toFixed(2)}
              </span>
            </div>
            <Progress value={shortProfitLoss > 0 ? 100 : 0} className="h-2 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/5" indicatorClassName={shortProfitLoss >= 0 ? "bg-profit/80" : "bg-loss/80"} />
          </div>

          <div className="pt-4 flex justify-between border-t border-slate-200/50 dark:border-white/10 mt-2">
            <StatItem
              label={t('dashboard.bestTrade')}
              value={`$${bestTrade.toFixed(2)}`}
              trend={bestTrade >= 0 ? "up" : "down"}
            />
            <StatItem
              label={t('dashboard.worstTrade')}
              value={`$${worstTrade.toFixed(2)}`}
              trend={worstTrade >= 0 ? "up" : "down"}
              className="items-end text-right"
            />
          </div>

          <div className="pt-4 border-t border-slate-200/50 dark:border-white/10 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.totalFeesPaid')}</span>
              <span className="text-sm font-mono tracking-tight text-loss">
                ${totalFees.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountSummary;
