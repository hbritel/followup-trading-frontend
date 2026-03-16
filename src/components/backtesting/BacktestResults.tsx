
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FlaskConical } from 'lucide-react';
import { useBacktests } from '@/hooks/useBacktests';
import type { BacktestResponseDto } from '@/types/dto';

interface StatItem {
  key: string;
  name: string;
  value: string;
  highlight: boolean;
}

const formatCurrency = (value: number | null): string => {
  if (value == null) return '-';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPercent = (value: number | null): string => {
  if (value == null) return '-';
  return `${(value * 100).toFixed(1)}%`;
};

const formatDecimal = (value: number | null, decimals = 2): string => {
  if (value == null) return '-';
  return value.toFixed(decimals);
};

const formatInt = (value: number | null): string => {
  if (value == null) return '-';
  return String(value);
};

const buildStatistics = (backtest: BacktestResponseDto, t: (key: string) => string): StatItem[] => [
  { key: 'netProfit', name: t('backtesting.netProfit'), value: formatCurrency(backtest.totalPnl), highlight: true },
  { key: 'sharpeRatio', name: t('backtesting.sharpeRatio'), value: formatDecimal(backtest.sharpeRatio), highlight: true },
  { key: 'maxDrawdown', name: t('backtesting.maxDrawdown'), value: formatPercent(backtest.maxDrawdown), highlight: true },
  { key: 'winRate', name: t('backtesting.winRate'), value: formatPercent(backtest.winRate), highlight: true },
  { key: 'totalTrades', name: t('backtesting.totalTrades'), value: formatInt(backtest.totalTrades), highlight: false },
  { key: 'winningTrades', name: t('backtesting.winningTrades'), value: formatInt(backtest.winningTrades), highlight: false },
  { key: 'losingTrades', name: t('backtesting.losingTrades'), value: formatInt(backtest.losingTrades), highlight: false },
  { key: 'avgRMultiple', name: t('backtesting.averageRMultiple'), value: formatDecimal(backtest.averageRMultiple, 3), highlight: false },
  { key: 'mcP5', name: t('backtesting.monteCarloP5'), value: formatCurrency(backtest.monteCarloP5), highlight: false },
  { key: 'mcP50', name: t('backtesting.monteCarloP50'), value: formatCurrency(backtest.monteCarloP50), highlight: false },
  { key: 'mcP95', name: t('backtesting.monteCarloP95'), value: formatCurrency(backtest.monteCarloP95), highlight: false },
];

const BacktestResults = () => {
  const { t } = useTranslation();
  const { data: backtests, isLoading } = useBacktests();

  const latestCompleted = backtests?.find((b) => b.status === 'COMPLETED');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="p-4 pb-2">
                <Skeleton className="h-3 w-20" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!latestCompleted) {
    return (
      <div className="text-center py-12">
        <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-1">{t('backtesting.noResults')}</h3>
        <p className="text-muted-foreground">{t('backtesting.noResultsDescription')}</p>
      </div>
    );
  }

  const statistics = buildStatistics(latestCompleted, t);
  const highlightStats = statistics.filter((s) => s.highlight);
  const detailStats = statistics.filter((s) => !s.highlight);

  return (
    <div className="space-y-6">
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="text-gradient">{latestCompleted.name}</CardTitle>
          <CardDescription className="font-mono tabular-nums">
            {latestCompleted.startDate} — {latestCompleted.endDate}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {highlightStats.map((stat) => (
          <Card key={stat.key} className="glass-card rounded-2xl">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="label-caps">{stat.name}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className={`kpi-value text-2xl tabular-nums ${stat.value.startsWith('-') ? 'text-loss' : 'text-profit'}`}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="text-gradient">{t('backtesting.performanceStatistics')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {detailStats.map((stat) => (
              <div key={stat.key} className="flex justify-between items-center p-3 border border-border/40 rounded-xl bg-accent/5">
                <span className="label-caps">{stat.name}</span>
                <span className="font-mono tabular-nums font-medium">{stat.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BacktestResults;
