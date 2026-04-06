
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Calendar, Hash, DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BacktestChart, { type StaticPriceLine, type StaticMarker } from '@/components/backtesting/BacktestChart';
import TradeReplaySelector, { type TradeReplayFilters } from '@/components/tradereplay/TradeReplaySelector';
import { useTradeReplay } from '@/hooks/useTradeReplay';
import { useMarketHistory } from '@/hooks/useMarketHistory';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import PlanBadge from '@/components/subscription/PlanBadge';

// Timeframes: PRO gets 1h, 4h, 1d — ELITE gets all (including 1m, 5m, 15m, 1w)
const TIMEFRAMES: { value: string; label: string; requiredPlan: 'PRO' | 'ELITE' }[] = [
  { value: '1m',  label: '1m',  requiredPlan: 'ELITE' },
  { value: '5m',  label: '5m',  requiredPlan: 'ELITE' },
  { value: '15m', label: '15m', requiredPlan: 'ELITE' },
  { value: '1h',  label: '1H',  requiredPlan: 'PRO' },
  { value: '1d',  label: '1D',  requiredPlan: 'PRO' },
  { value: '1wk', label: '1W',  requiredPlan: 'ELITE' },
];

const TradeReplay = () => {
  const { t } = useTranslation();
  const { hasPlan } = useFeatureFlags();
  const [searchParams] = useSearchParams();
  const initialTradeId = searchParams.get('tradeId');
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(initialTradeId);
  const { data: replayData, isLoading, isError } = useTradeReplay(selectedTradeId);

  // Filter state lifted from TradeReplaySelector so it persists across trade views
  const [filters, setFilters] = useState<TradeReplayFilters>({
    search: '',
    page: 1,
    pageSize: 20,
    datePreset: 'all',
    customStart: null,
    customEnd: null,
    selectedAccountId: 'all',
    direction: 'all',
  });

  // Timeframe selector — default from backend, user can override
  const [customTimeframe, setCustomTimeframe] = useState<string | null>(null);
  const activeTimeframe = customTimeframe ?? replayData?.interval ?? '15m';

  // Fetch candles with custom timeframe (separate from the replay data)
  const fromDate = replayData ? new Date(replayData.entryDate).toISOString().split('T')[0] : null;
  const toDate = replayData ? new Date(replayData.exitDate).toISOString().split('T')[0] : null;
  const { data: customCandles, isLoading: candlesLoading } = useMarketHistory(
    customTimeframe ? replayData?.symbol ?? null : null, // only fetch when user changes TF
    customTimeframe ?? '15m',
    fromDate,
    toDate
  );

  // Use custom candles if user changed TF, otherwise use replay data candles
  const displayCandles = customTimeframe ? (customCandles?.candles ?? []) : (replayData?.candles ?? []);
  const isChartLoading = isLoading || (customTimeframe && candlesLoading);

  // Static price lines: Entry, Exit, SL, TP
  const staticLines: StaticPriceLine[] = useMemo(() => {
    if (!replayData) return [];
    return [
      { price: replayData.entryPrice, color: replayData.direction === 'LONG' ? '#22c55e' : '#ef4444', title: 'Entry', lineStyle: 1 },
      { price: replayData.exitPrice, color: '#6366f1', title: 'Exit', lineStyle: 1 },
      ...(replayData.stopLoss ? [{ price: replayData.stopLoss, color: '#ef4444', title: 'SL', lineStyle: 2 }] : []),
      ...(replayData.takeProfit ? [{ price: replayData.takeProfit, color: '#22c55e', title: 'TP', lineStyle: 2 }] : []),
    ];
  }, [replayData]);

  // Entry/Exit markers on candles
  const staticMarkers: StaticMarker[] = useMemo(() => {
    if (!replayData) return [];
    const entryTs = Math.floor(new Date(replayData.entryDate).getTime() / 1000);
    const exitTs = Math.floor(new Date(replayData.exitDate).getTime() / 1000);
    const isLong = replayData.direction === 'LONG';
    const dec = replayData.entryPrice > 100 ? 2 : 5;
    return [
      {
        time: entryTs,
        position: isLong ? 'belowBar' as const : 'aboveBar' as const,
        color: isLong ? '#22c55e' : '#ef4444',
        shape: isLong ? 'arrowUp' as const : 'arrowDown' as const,
        text: `Entry ${replayData.entryPrice.toFixed(dec)}`,
      },
      {
        time: exitTs,
        position: isLong ? 'aboveBar' as const : 'belowBar' as const,
        color: '#6366f1',
        shape: 'circle' as const,
        text: `Exit ${replayData.exitPrice.toFixed(dec)}`,
      },
    ];
  }, [replayData]);

  // Visible range centered on entry→exit with 20% padding on each side
  const chartVisibleRange = useMemo(() => {
    if (!replayData) return undefined;
    const entryTs = Math.floor(new Date(replayData.entryDate).getTime() / 1000);
    const exitTs = Math.floor(new Date(replayData.exitDate).getTime() / 1000);
    const duration = Math.max(exitTs - entryTs, 60); // at least 60s
    const padding = Math.max(Math.floor(duration * 0.3), 300); // at least 5 min padding
    return { from: entryTs - padding, to: exitTs + padding };
  }, [replayData]);

  const formatDisplayDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  const tradeDuration = replayData ? (() => {
    const ms = new Date(replayData.exitDate).getTime() - new Date(replayData.entryDate).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours < 24) return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
  })() : '';

  return (
    <DashboardLayout pageTitle={t('pages.tradeReplay')}>
      <PageTransition className="space-y-6">
        {selectedTradeId && replayData ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => { setSelectedTradeId(null); setCustomTimeframe(null); }}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-2xl font-bold">{replayData.symbol}</h2>
                      <Badge variant={replayData.direction === 'LONG' ? 'default' : 'destructive'} className="text-xs">
                        {replayData.direction}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {formatDisplayDate(replayData.entryDate)} → {formatDisplayDate(replayData.exitDate)}
                      <span className="mx-2">|</span>
                      <span className="font-mono">{tradeDuration}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeframe selector */}
              <TooltipProvider>
                <div className="flex items-center gap-1 rounded-xl border bg-card/50 p-1 w-fit">
                  {TIMEFRAMES.map(tf => {
                    const accessible = hasPlan(tf.requiredPlan);
                    const isActive = activeTimeframe === tf.value;
                    return (
                      <Tooltip key={tf.value} delayDuration={200}>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <Button
                              variant={isActive ? 'default' : 'ghost'}
                              size="sm"
                              disabled={!accessible}
                              className={cn(
                                'h-8 px-3 text-xs font-mono relative',
                                isActive && 'shadow-sm',
                                !accessible && 'opacity-50 cursor-not-allowed',
                              )}
                              onClick={() => accessible && setCustomTimeframe(tf.value === replayData.interval ? null : tf.value)}
                            >
                              {tf.label}
                              {!accessible && (
                                <span className="absolute -top-1.5 -right-1 text-[8px] font-bold text-amber-400 leading-none">
                                  E
                                </span>
                              )}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!accessible && (
                          <TooltipContent side="bottom">
                            <div className="flex items-center gap-1.5">
                              <PlanBadge plan={tf.requiredPlan} size="sm" />
                              <span className="text-xs">required</span>
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
            </div>

            {/* Chart */}
            {isChartLoading ? (
              <Skeleton className="w-full h-[500px] rounded-xl" />
            ) : displayCandles.length > 0 ? (
              <BacktestChart data={displayCandles} staticLines={staticLines} staticMarkers={staticMarkers} visibleRange={chartVisibleRange} height={500} preserveScale={false} />
            ) : (
              <Card className="glass-card rounded-2xl">
                <CardContent className="flex items-center justify-center py-20 text-muted-foreground">
                  {t('tradeReplay.noChartData')}
                </CardContent>
              </Card>
            )}

            {/* Trade details */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card className="glass-card rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">{t('tradeReplay.entryPrice')}</span>
                  </div>
                  <p className="text-lg font-bold font-mono tabular-nums">
                    {replayData.entryPrice.toFixed(replayData.entryPrice > 100 ? 2 : 5)}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">{t('tradeReplay.exitPrice')}</span>
                  </div>
                  <p className="text-lg font-bold font-mono tabular-nums">
                    {replayData.exitPrice.toFixed(replayData.exitPrice > 100 ? 2 : 5)}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Hash className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">{t('tradeReplay.quantity')}</span>
                  </div>
                  <p className="text-lg font-bold font-mono tabular-nums">{replayData.quantity}</p>
                </CardContent>
              </Card>
              <Card className="glass-card rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">P&L</span>
                  </div>
                  <p className={cn('text-lg font-bold font-mono tabular-nums flex items-center gap-1', replayData.profitLoss >= 0 ? 'text-green-500' : 'text-red-500')}>
                    {replayData.profitLoss >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    ${Math.abs(replayData.profitLoss).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">{t('tradeReplay.duration')}</span>
                  </div>
                  <p className="text-lg font-bold font-mono tabular-nums">{tradeDuration}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold text-gradient">{t('tradeReplay.title')}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t('tradeReplay.subtitle')}</p>
            </div>

            {isLoading && selectedTradeId && (
              <div className="space-y-4">
                <Skeleton className="h-[500px] rounded-xl" />
                <div className="grid grid-cols-5 gap-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
              </div>
            )}

            {isError && (
              <Card className="glass-card rounded-2xl">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <p className="font-medium text-destructive">{t('tradeReplay.error')}</p>
                  <Button variant="outline" onClick={() => setSelectedTradeId(null)}>{t('common.retry')}</Button>
                </CardContent>
              </Card>
            )}

            {!isLoading && <TradeReplaySelector onSelectTrade={setSelectedTradeId} filters={filters} onFiltersChange={setFilters} />}
          </>
        )}
      </PageTransition>
    </DashboardLayout>
  );
};

export default TradeReplay;
