import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import {
  useSymbolPerformance,
  useHeatmap,
  useSessionPerformance,
  useTradeFrequency,
  useRollingMetric,
} from '@/hooks/useInsightsMetrics';
import type { RollingMetric } from '@/types/dto';

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

const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
  FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
};

const CustomTooltipStyle = {
  backgroundColor: CHART_COLORS.tooltipBg,
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#f1f5f9',
  fontSize: '12px',
};

interface Props {
  startDate?: string;
  endDate?: string;
  accountId?: string;
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

const InfoTip = ({ text }: { text: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-xs">{text}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const DetailedPerformanceCharts: React.FC<Props> = ({ startDate, endDate, accountId }) => {
  const { t } = useTranslation();
  const [rollingMetric, setRollingMetric] = useState<RollingMetric>('WIN_RATE');

  const { data: symbolData, isLoading: symbolLoading } = useSymbolPerformance(startDate, endDate, accountId);
  const { data: heatmapData, isLoading: heatmapLoading } = useHeatmap(startDate, endDate, accountId);
  const { data: sessionData, isLoading: sessionLoading } = useSessionPerformance(startDate, endDate, accountId);
  const { data: frequencyData, isLoading: frequencyLoading } = useTradeFrequency(startDate, endDate, accountId);
  const { data: rollingData, isLoading: rollingLoading } = useRollingMetric(rollingMetric, 20, startDate, endDate, accountId);

  const noDataMsg = t('insights.noData', 'No data for selected period');

  const symbolChartData = useMemo(() => {
    if (!symbolData) return [];
    return [...symbolData]
      .sort((a, b) => b.totalPnl - a.totalPnl)
      .slice(0, 15)
      .map((s) => ({
        symbol: s.symbol,
        totalPnl: Number(s.totalPnl.toFixed(2)),
        winRate: Number((s.winRate * 100).toFixed(1)),
        trades: s.tradeCount,
        profitFactor: Number(s.profitFactor.toFixed(2)),
      }));
  }, [symbolData]);

  const sessionChartData = useMemo(() => {
    if (!sessionData) return [];
    return sessionData.map((s) => ({
      session: s.session.replace('_', ' '),
      winRate: Number((s.winRate * 100).toFixed(1)),
      totalPnl: Number(s.totalPnl.toFixed(2)),
      trades: s.tradeCount,
      profitFactor: Number(s.profitFactor.toFixed(2)),
    }));
  }, [sessionData]);

  const frequencyChartData = useMemo(() => {
    if (!frequencyData) return [];
    return frequencyData.map((f) => ({
      date: f.date,
      trades: f.tradeCount,
      pnl: Number(f.totalPnl.toFixed(2)),
    }));
  }, [frequencyData]);

  const rollingChartData = useMemo(() => {
    if (!rollingData) return [];
    return rollingData.map((r) => ({
      index: r.tradeIndex,
      value: Number(r.value.toFixed(4)),
      date: r.date,
    }));
  }, [rollingData]);

  const heatmapGrid = useMemo(() => {
    if (!heatmapData || heatmapData.length === 0) return null;
    const cells: Record<string, { pnl: number; winRate: number; trades: number }> = {};
    for (const c of heatmapData) {
      cells[`${c.dayOfWeek}-${c.hour}`] = {
        pnl: c.totalPnl,
        winRate: Number((c.winRate * 100).toFixed(0)),
        trades: c.tradeCount,
      };
    }
    return cells;
  }, [heatmapData]);

  const rollingMetricLabel = rollingMetric === 'WIN_RATE'
    ? t('insights.winRate', 'Win Rate')
    : rollingMetric === 'PROFIT_FACTOR'
      ? t('insights.profitFactor', 'Profit Factor')
      : t('insights.expectancy', 'Expectancy');

  const rollingFormat = (v: number) =>
    rollingMetric === 'WIN_RATE' ? `${(v * 100).toFixed(1)}%` : v.toFixed(2);

  return (
    <div className="space-y-6">
      {/* Symbol Performance */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">{t('insights.symbolPerformance', 'Performance by Symbol')}<InfoTip text={t('performance.symbolPerformanceTooltip')} /></CardTitle>
          <CardDescription>{t('insights.symbolPerformanceDescription', 'P&L and win rate for your most-traded instruments')}</CardDescription>
        </CardHeader>
        <CardContent>
          {symbolLoading ? <ChartSkeleton /> : symbolChartData.length === 0 ? <NoData message={noDataMsg} /> : (
            <ResponsiveContainer width="100%" height={Math.max(300, symbolChartData.length * 40)}>
              <BarChart data={symbolChartData} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis type="number" tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <YAxis dataKey="symbol" type="category" width={80} tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} />
                <RechartsTooltip
                  contentStyle={CustomTooltipStyle}
                  formatter={(value: number, name: string) => {
                    if (name === 'totalPnl') return [`$${value.toFixed(2)}`, 'P&L'];
                    return [`${value}%`, 'Win Rate'];
                  }}
                />
                <Legend wrapperStyle={{ color: CHART_COLORS.axis, fontSize: 11 }} />
                <Bar dataKey="totalPnl" name={t('insights.pnl', 'P&L')} radius={[0, 4, 4, 0]}>
                  {symbolChartData.map((entry, i) => (
                    <Cell key={`sym-${i}`} fill={entry.totalPnl >= 0 ? CHART_COLORS.profit : CHART_COLORS.loss} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Session Performance */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">{t('insights.sessionPerformance', 'Performance by Session')}<InfoTip text={t('performance.sessionPerformanceTooltip')} /></CardTitle>
          <CardDescription>{t('insights.sessionPerformanceDescription', 'Results across Asian, London, New York and overlap sessions')}</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionLoading ? <ChartSkeleton /> : sessionChartData.length === 0 ? <NoData message={noDataMsg} /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sessionChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="session" tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} />
                <YAxis yAxisId="pnl" tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <YAxis yAxisId="wr" orientation="right" tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <RechartsTooltip contentStyle={CustomTooltipStyle} />
                <Legend wrapperStyle={{ color: CHART_COLORS.axis, fontSize: 11 }} />
                <Bar yAxisId="pnl" dataKey="totalPnl" name={t('insights.pnl', 'P&L')} radius={[4, 4, 0, 0]}>
                  {sessionChartData.map((entry, i) => (
                    <Cell key={`ses-${i}`} fill={entry.totalPnl >= 0 ? CHART_COLORS.profit : CHART_COLORS.loss} />
                  ))}
                </Bar>
                <Line yAxisId="wr" type="monotone" dataKey="winRate" name={t('insights.winRate', 'Win Rate %')} stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ r: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Hour × Day Heatmap */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">{t('insights.heatmap', 'Trading Heatmap')}<InfoTip text={t('performance.heatmapTooltip')} /></CardTitle>
          <CardDescription>{t('insights.heatmapDescription', 'P&L by day of week and hour of day')}</CardDescription>
        </CardHeader>
        <CardContent>
          {heatmapLoading ? <ChartSkeleton /> : !heatmapGrid ? <NoData message={noDataMsg} /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="p-1 text-left text-muted-foreground font-medium"></th>
                    {Array.from({ length: 24 }, (_, h) => (
                      <th key={h} className="p-1 text-center text-muted-foreground font-medium w-8">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAY_NAMES.map((dayKey) => {
                    const fullDay = Object.keys(DAY_LABELS).find(
                      (k) => k.substring(0, 3) === dayKey
                    ) ?? dayKey;
                    return (
                      <tr key={dayKey}>
                        <td className="p-1 text-muted-foreground font-medium whitespace-nowrap">{DAY_LABELS[fullDay] ?? dayKey}</td>
                        {Array.from({ length: 24 }, (_, h) => {
                          const cell = heatmapGrid[`${fullDay}-${h}`];
                          if (!cell || cell.trades === 0) {
                            return <td key={h} className="p-1"><div className="w-6 h-6 rounded-sm bg-muted/20" /></td>;
                          }
                          const intensity = Math.min(Math.abs(cell.pnl) / 200, 1);
                          const bg = cell.pnl >= 0
                            ? `rgba(34,197,94,${0.15 + intensity * 0.65})`
                            : `rgba(239,68,68,${0.15 + intensity * 0.65})`;
                          return (
                            <td key={h} className="p-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="w-6 h-6 rounded-sm cursor-help" style={{ backgroundColor: bg }} />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    <p>{DAY_LABELS[fullDay]} {h}:00</p>
                                    <p>P&L: ${cell.pnl.toFixed(2)}</p>
                                    <p>Win: {cell.winRate}% ({cell.trades} trades)</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trade Frequency */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">{t('insights.tradeFrequency', 'Trade Frequency')}<InfoTip text={t('performance.tradeFrequencyTooltip')} /></CardTitle>
          <CardDescription>{t('insights.tradeFrequencyDescription', 'Daily trade count and P&L — spot overtrading patterns')}</CardDescription>
        </CardHeader>
        <CardContent>
          {frequencyLoading ? <ChartSkeleton /> : frequencyChartData.length === 0 ? <NoData message={noDataMsg} /> : (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="trades" type="number" name="Trades" tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} label={{ value: t('insights.tradesPerDay', 'Trades / Day'), position: 'insideBottom', offset: -2, fill: CHART_COLORS.axis, fontSize: 11 }} />
                <YAxis dataKey="pnl" type="number" name="P&L" tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <RechartsTooltip
                  contentStyle={CustomTooltipStyle}
                  formatter={(value: number, name: string) => {
                    if (name === 'P&L') return [`$${value.toFixed(2)}`, name];
                    return [value, name];
                  }}
                />
                <Scatter data={frequencyChartData} fill={CHART_COLORS.primary}>
                  {frequencyChartData.map((entry, i) => (
                    <Cell key={`freq-${i}`} fill={entry.pnl >= 0 ? CHART_COLORS.profit : CHART_COLORS.loss} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Rolling Metrics */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-1.5">{t('insights.rollingMetrics', 'Rolling Metrics')}<InfoTip text={t('performance.rollingMetricsTooltip')} /></CardTitle>
              <CardDescription>{t('insights.rollingMetricsDescription', '20-trade rolling window performance')}</CardDescription>
            </div>
            <Tabs value={rollingMetric} onValueChange={(v) => setRollingMetric(v as RollingMetric)}>
              <TabsList className="h-8">
                <TabsTrigger value="WIN_RATE" className="text-xs px-2 h-6">{t('insights.winRate', 'Win Rate')}</TabsTrigger>
                <TabsTrigger value="PROFIT_FACTOR" className="text-xs px-2 h-6">{t('insights.profitFactor', 'Profit Factor')}</TabsTrigger>
                <TabsTrigger value="EXPECTANCY" className="text-xs px-2 h-6">{t('insights.expectancy', 'Expectancy')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {rollingLoading ? <ChartSkeleton /> : rollingChartData.length === 0 ? <NoData message={noDataMsg} /> : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rollingChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="index" tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} label={{ value: t('insights.tradeNumber', 'Trade #'), position: 'insideBottom', offset: -2, fill: CHART_COLORS.axis, fontSize: 11 }} />
                <YAxis tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} tickFormatter={rollingFormat} />
                <RechartsTooltip
                  contentStyle={CustomTooltipStyle}
                  formatter={(value: number) => [rollingFormat(value), rollingMetricLabel]}
                  labelFormatter={(label) => `Trade #${label}`}
                />
                <Line type="monotone" dataKey="value" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} name={rollingMetricLabel} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailedPerformanceCharts;
