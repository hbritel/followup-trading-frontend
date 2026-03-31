import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useDayOfWeekPerformance, useHourOfDayPerformance } from '@/hooks/useTimeMetrics';

// ---- Chart theme constants ----
const CHART_COLORS = {
  profit: '#22c55e',
  loss: '#ef4444',
  primary: '#3b82f6',
  grid: 'rgba(255,255,255,0.06)',
  axis: '#94a3b8',
  tooltipBg: '#1e293b',
};

const CustomTooltipStyle = {
  backgroundColor: CHART_COLORS.tooltipBg,
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#f1f5f9',
  fontSize: '12px',
};

interface TradingPatternsProps {
  startDate?: string;
  endDate?: string;
}

const ChartSkeleton = () => (
  <div className="h-[300px] flex items-center justify-center">
    <Skeleton className="w-full h-full rounded-xl" />
  </div>
);

const TradingPatterns: React.FC<TradingPatternsProps> = ({ startDate, endDate }) => {
  const { t } = useTranslation();

  const { data: hourData, isLoading: hourLoading } = useHourOfDayPerformance(startDate, endDate);
  const { data: dayData, isLoading: dayLoading } = useDayOfWeekPerformance(startDate, endDate);

  // Hour-of-day diverging bar chart data — positive pnl right (green), negative left (red)
  const hourChartData = useMemo(() => {
    if (!hourData) return [];
    return hourData.map((h) => ({
      label: h.timeLabel,
      profit: h.totalPnl >= 0 ? h.totalPnl : 0,
      loss: h.totalPnl < 0 ? h.totalPnl : 0,
      totalPnl: h.totalPnl,
      wins: h.wins,
      losses: h.losses,
      winRate: h.wins + h.losses > 0 ? ((h.wins / (h.wins + h.losses)) * 100).toFixed(1) : '0',
    }));
  }, [hourData]);

  // Day-of-week table/chart data
  const dayChartData = useMemo(() => {
    if (!dayData) return [];
    return [...dayData]
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
      .map((d) => ({
        day: d.dayName,
        totalPnl: Number(d.totalPnl.toFixed(2)),
        wins: d.wins,
        losses: d.losses,
        totalTrades: d.wins + d.losses,
        winRate:
          d.wins + d.losses > 0 ? Number(((d.wins / (d.wins + d.losses)) * 100).toFixed(1)) : 0,
      }));
  }, [dayData]);

  return (
    <div className="space-y-6">
      {/* Hour-of-day diverging bar chart */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle>{t('insights.timeOfDayAnalysis', 'Hour of Day Performance')}</CardTitle>
          <CardDescription>
            {t(
              'insights.timeOfDayAnalysisDescription',
              'Net P&L by hour of day — green bars are profitable hours, red bars are losing hours',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hourLoading ? (
            <ChartSkeleton />
          ) : hourChartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
              {t('insights.noData', 'No data for selected period')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300} aria-label="Hour of day P&L diverging bar chart">
              <BarChart data={hourChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="label" tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={CustomTooltipStyle}
                  formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
                  labelFormatter={(label) => `${t('insights.timeOfDay', 'Hour')}: ${label}`}
                />
                <Bar dataKey="profit" name={t('insights.profit', 'Profit')} fill={CHART_COLORS.profit} radius={[4, 4, 0, 0]} stackId="pnl" />
                <Bar dataKey="loss" name={t('insights.loss', 'Loss')} fill={CHART_COLORS.loss} radius={[0, 0, 4, 4]} stackId="pnl" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Day-of-week P&L bar chart + table */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle>{t('insights.dayOfWeekAnalysis', 'Day of Week Performance')}</CardTitle>
          <CardDescription>
            {t('insights.dayOfWeekAnalysisDescription', 'Net P&L and win rate by day of the trading week')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {dayLoading ? (
            <ChartSkeleton />
          ) : dayChartData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
              {t('insights.noData', 'No data for selected period')}
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={240} aria-label="Day of week P&L bar chart">
                <BarChart data={dayChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis dataKey="day" tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} />
                  <YAxis tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={CustomTooltipStyle}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, t('insights.pnl', 'P&L')]}
                  />
                  <Bar dataKey="totalPnl" name={t('insights.pnl', 'P&L')} radius={[4, 4, 0, 0]}>
                    {dayChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.totalPnl >= 0 ? CHART_COLORS.profit : CHART_COLORS.loss} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('insights.dayOfWeek', 'Day')}</TableHead>
                    <TableHead className="text-right">{t('insights.winRate', 'Win Rate')}</TableHead>
                    <TableHead className="text-right">{t('insights.pnl', 'Net P&L')}</TableHead>
                    <TableHead className="text-right">{t('insights.totalTrades', 'Trades')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dayChartData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.day}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        <span className={item.winRate >= 50 ? 'text-green-500' : 'text-red-500'} aria-label={`${item.winRate}% ${item.winRate >= 50 ? 'above' : 'below'} 50%`}>
                          {item.winRate >= 50 ? '▲' : '▼'} {item.winRate}%
                        </span>
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono tabular-nums ${item.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}
                        aria-label={`${item.totalPnl >= 0 ? 'profit' : 'loss'} $${Math.abs(item.totalPnl)}`}
                      >
                        {item.totalPnl >= 0 ? '▲' : '▼'} ${Math.abs(item.totalPnl).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{item.totalTrades}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TradingPatterns;
