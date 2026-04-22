
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Calendar, Hash, DollarSign, Lock, Search, ArrowUp, ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
// TODO(tradeview-license): request a TradingView Advanced Charts license.
// Advanced Charts is free for approved trading/journaling platforms and would
// give us native timezone handling, full indicator support, and a pixel-perfect
// replay UX. Backend datafeed can reuse `MarketDataService`. Track at
// https://www.tradingview.com/advanced-charts/ and docs/TODO.md.
import BacktestChart, { type StaticPriceLine, type StaticMarker, type TradePriceOverlay } from '@/components/backtesting/BacktestChart';
import TradeReplaySelector, { type TradeReplayFilters } from '@/components/tradereplay/TradeReplaySelector';
import DashboardDateFilter from '@/components/dashboard/DashboardDateFilter';
import AccountSelector from '@/components/dashboard/AccountSelector';
import { useTradeReplay } from '@/hooks/useTradeReplay';
import { useMarketHistory } from '@/hooks/useMarketHistory';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import PlanBadge from '@/components/subscription/PlanBadge';
import { useToast } from '@/hooks/use-toast';
import { utcToChartLocal } from '@/lib/chart/timezone';

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
  const { toast } = useToast();
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

  // Timeframe selector — default from backend, user can override.
  const [customTimeframe, setCustomTimeframe] = useState<string | null>(null);
  const activeTimeframe = customTimeframe ?? replayData?.interval ?? '15m';

  // Decide whether we need to fetch candles on the client. We always fetch when:
  //   1. the user picked a timeframe different from the server default, OR
  //   2. the server returned 0 candles (e.g., Yahoo 15m for an intraday trade today).
  // Otherwise we reuse the candles already embedded in the replay response.
  const serverCandles = replayData?.candles ?? [];
  const needsClientFetch = customTimeframe !== null
    || (replayData != null && serverCandles.length === 0);
  const fromDate = replayData ? new Date(replayData.entryDate).toISOString().split('T')[0] : null;
  const toDate = replayData ? new Date(replayData.exitDate).toISOString().split('T')[0] : null;
  const { data: customCandles, isLoading: candlesLoading } = useMarketHistory(
    needsClientFetch ? replayData?.symbol ?? null : null,
    activeTimeframe,
    fromDate,
    toDate,
  );

  // Chart displays client-fetched candles whenever the client fetch fired; fall
  // back to the server-embedded list only when no client fetch is in flight.
  const rawCandles = needsClientFetch ? (customCandles?.candles ?? []) : serverCandles;
  // Shift UTC timestamps so the chart axis aligns with the user's local wall-
  // clock (lightweight-charts renders `Time` as UTC). See lib/chart/timezone.ts.
  const displayCandles = useMemo(
    () => rawCandles.map((c) => ({ ...c, timestamp: utcToChartLocal(c.timestamp) })),
    [rawCandles],
  );
  const isChartLoading = isLoading || (needsClientFetch && candlesLoading);

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

  // Entry/Exit text labels rendered as bar-anchored markers. The arrow/circle
  // shapes themselves are not drawn — precise (time, price) dots are drawn by
  // the trade overlay below (see `tradeOverlay`) so the labels only provide the
  // price text. Keeping arrow/circle invisible avoids the "exit dot above the
  // bar" artefact when broker execution price differs from the market candle.
  const staticMarkers: StaticMarker[] = useMemo(() => {
    if (!replayData) return [];
    const entryTs = utcToChartLocal(Math.floor(new Date(replayData.entryDate).getTime() / 1000));
    const exitTs = utcToChartLocal(Math.floor(new Date(replayData.exitDate).getTime() / 1000));
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

  // Price-anchored overlay: dashed line connecting entry → exit at the actual
  // execution prices. Green when profitable, red otherwise.
  const tradeOverlay: TradePriceOverlay | undefined = useMemo(() => {
    if (!replayData) return undefined;
    const entryTs = utcToChartLocal(Math.floor(new Date(replayData.entryDate).getTime() / 1000));
    const exitTs = utcToChartLocal(Math.floor(new Date(replayData.exitDate).getTime() / 1000));
    return {
      entryTime: entryTs,
      entryPrice: replayData.entryPrice,
      exitTime: exitTs,
      exitPrice: replayData.exitPrice,
      color: replayData.profitLoss >= 0 ? '#22c55e' : '#ef4444',
    };
  }, [replayData]);

  // Visible range centered on entry→exit with 20% padding on each side
  const chartVisibleRange = useMemo(() => {
    if (!replayData) return undefined;
    const entryTs = utcToChartLocal(Math.floor(new Date(replayData.entryDate).getTime() / 1000));
    const exitTs = utcToChartLocal(Math.floor(new Date(replayData.exitDate).getTime() / 1000));
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
                              className={cn(
                                'h-8 px-3 text-xs font-mono relative flex flex-col items-center gap-0',
                                isActive && 'shadow-sm',
                                !accessible && 'opacity-70 cursor-not-allowed',
                              )}
                              onClick={() => {
                                if (!accessible) {
                                  toast({
                                    title: `Upgrade to ${tf.requiredPlan} to unlock this timeframe`,
                                    description: `The ${tf.label} timeframe requires the ${tf.requiredPlan} plan.`,
                                    variant: 'destructive',
                                  });
                                  return;
                                }
                                setCustomTimeframe(tf.value === replayData.interval ? null : tf.value);
                              }}
                            >
                              <span className="flex items-center gap-1">
                                {!accessible && <Lock className="h-3 w-3 text-amber-400" />}
                                {tf.label}
                              </span>
                              {!accessible && (
                                <span className="hidden sm:block text-[8px] font-bold text-amber-400 leading-none">
                                  {tf.requiredPlan}
                                </span>
                              )}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!accessible && (
                          <TooltipContent side="bottom">
                            <div className="flex items-center gap-1.5">
                              <PlanBadge plan={tf.requiredPlan} size="sm" />
                              <span className="text-xs">required — click to upgrade</span>
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
              <BacktestChart data={displayCandles} staticLines={staticLines} staticMarkers={staticMarkers} tradeOverlay={tradeOverlay} visibleRange={chartVisibleRange} height={500} preserveScale={false} />
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
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('tradeReplay.title')}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t('tradeReplay.subtitle')}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <DashboardDateFilter
                  preset={filters.datePreset}
                  onPresetChange={(p) => {
                    if (p !== 'custom') {
                      setFilters((prev) => ({
                        ...prev,
                        datePreset: p,
                        customStart: null,
                        customEnd: null,
                        page: 1,
                      }));
                    }
                  }}
                  customStart={filters.customStart}
                  customEnd={filters.customEnd}
                  onCustomStartChange={(d) =>
                    setFilters((prev) => ({
                      ...prev,
                      customStart: d,
                      datePreset: d ? 'custom' : prev.datePreset,
                      page: 1,
                    }))
                  }
                  onCustomEndChange={(d) =>
                    setFilters((prev) => ({
                      ...prev,
                      customEnd: d,
                      datePreset: d ? 'custom' : prev.datePreset,
                      page: 1,
                    }))
                  }
                />
                <AccountSelector
                  value={filters.selectedAccountId}
                  onChange={(v) => setFilters((prev) => ({ ...prev, selectedAccountId: v, page: 1 }))}
                  className="w-48"
                />
                <Select
                  value={filters.direction}
                  onValueChange={(v) => setFilters((prev) => ({ ...prev, direction: v, page: 1 }))}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('trades.allTypes', 'All Directions')}</SelectItem>
                    <SelectItem value="LONG">
                      <span className="flex items-center gap-1.5">
                        <ArrowUp className="h-3.5 w-3.5 text-green-500" />
                        Long
                      </span>
                    </SelectItem>
                    <SelectItem value="SHORT">
                      <span className="flex items-center gap-1.5">
                        <ArrowDown className="h-3.5 w-3.5 text-red-500" />
                        Short
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={t('tradeReplay.searchTrades')}
                    className="pl-8 rounded-xl"
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
                  />
                </div>
              </div>
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
