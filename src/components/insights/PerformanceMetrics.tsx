import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useMonthlyPerformance } from '@/hooks/useTimeMetrics';
import { useStrategyStats } from '@/hooks/useStrategies';

// ---- Chart theme constants ----
const CHART_COLORS = {
  profit: '#22c55e',
  loss: '#ef4444',
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  tertiary: '#f59e0b',
  grid: 'rgba(255,255,255,0.06)',
  axis: '#94a3b8',
  tooltipBg: '#1e293b',
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CustomTooltipStyle = {
  backgroundColor: CHART_COLORS.tooltipBg,
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#f1f5f9',
  fontSize: '12px',
};

interface PerformanceMetricsProps {
  startDate?: string;
  endDate?: string;
  accountIds?: string[];
}

const ChartSkeleton = () => (
  <div className="h-[300px] flex items-center justify-center">
    <Skeleton className="w-full h-full rounded-xl" />
  </div>
);

const NoData: React.FC<{ message: string }> = ({ message }) => (
  <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
    {message}
  </div>
);

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ startDate, endDate, accountIds }) => {
  const { t } = useTranslation();

  const { data: monthly, isLoading: monthlyLoading } = useMonthlyPerformance(startDate, endDate, accountIds);
  const { data: strategyStats, isLoading: strategyLoading } = useStrategyStats();

  const noDataMsg = t('insights.noData', 'No data for selected period');

  const monthlyChartData = useMemo(() => {
    if (!monthly) return [];
    return monthly.map((m) => ({
      label: `${MONTH_NAMES[m.month - 1]} ${m.year !== new Date().getFullYear() ? m.year : ''}`.trim(),
      pnl: Number(m.profitLoss.toFixed(2)),
      winRate: Number((m.winRate * 100).toFixed(1)),
      trades: m.totalTrades,
    }));
  }, [monthly]);

  const strategyChartData = useMemo(() => {
    if (!strategyStats) return [];
    return strategyStats
      .filter((s) => s.tradeCount > 0)
      .map((s) => ({
        name: s.strategyName.length > 12 ? s.strategyName.slice(0, 12) + '\u2026' : s.strategyName,
        winRate: Number((s.winRate * 100).toFixed(1)),
        profitFactor: Number(s.profitFactor.toFixed(2)),
        expectancy: Number(s.expectancy.toFixed(2)),
        trades: s.tradeCount,
      }));
  }, [strategyStats]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <h2 className="text-xl font-bold">{t('insights.performanceAnalysis', 'Performance Analysis')}</h2>
      </div>

      {/* Monthly P&L */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle>{t('insights.monthlyPerformance', 'Monthly P&L')}</CardTitle>
          <CardDescription>{t('insights.monthlyPerformanceDescription', 'Net profit/loss per calendar month')}</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyLoading ? <ChartSkeleton /> : monthlyChartData.length === 0 ? <NoData message={noDataMsg} /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="label" tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} />
                <YAxis tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} width={60} tickFormatter={(v) => `$${v}`} />
                <RechartsTooltip contentStyle={CustomTooltipStyle} formatter={(value: number) => [`$${value.toFixed(2)}`, t('insights.pnl', 'P&L')]} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]} name={t('insights.pnl', 'P&L')}>
                  {monthlyChartData.map((entry, index) => (
                    <Cell key={`pnl-${index}`} fill={entry.pnl >= 0 ? CHART_COLORS.profit : CHART_COLORS.loss} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Win Rate Trend */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle>{t('insights.winRateTrend', 'Win Rate Trend')}</CardTitle>
          <CardDescription>{t('insights.winRateTrendDescription', 'Win rate (%) per month over the selected period')}</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyLoading ? <ChartSkeleton /> : monthlyChartData.length === 0 ? <NoData message={noDataMsg} /> : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="winRateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="label" tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} />
                <YAxis tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <RechartsTooltip contentStyle={CustomTooltipStyle} formatter={(value: number) => [`${value.toFixed(1)}%`, t('insights.winRate', 'Win Rate')]} />
                <Area type="monotone" dataKey="winRate" stroke={CHART_COLORS.primary} strokeWidth={2} fill="url(#winRateGradient)" name={t('insights.winRate', 'Win Rate')} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Strategy Comparison */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle>{t('insights.strategyPerformance', 'Strategy Comparison')}</CardTitle>
          <CardDescription>{t('insights.strategyPerformanceDescription', 'Win rate, profit factor, and expectancy by strategy')}</CardDescription>
        </CardHeader>
        <CardContent>
          {strategyLoading ? <ChartSkeleton /> : strategyChartData.length === 0 ? (
            <NoData message={t('insights.noStrategies', 'No strategy data available')} />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={strategyChartData} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis type="number" tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} />
                <RechartsTooltip contentStyle={CustomTooltipStyle} />
                <Legend wrapperStyle={{ color: CHART_COLORS.axis, fontSize: 11 }} />
                <Bar dataKey="winRate" name={t('insights.winRate', 'Win Rate %')} fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
                <Bar dataKey="profitFactor" name={t('insights.profitFactor', 'Profit Factor')} fill={CHART_COLORS.secondary} radius={[0, 4, 4, 0]} />
                <Bar dataKey="expectancy" name={t('insights.expectancy', 'Expectancy')} fill={CHART_COLORS.tertiary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMetrics;
