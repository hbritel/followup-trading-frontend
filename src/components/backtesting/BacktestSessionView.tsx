import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import {
  ArrowLeft, TrendingUp, TrendingDown, BarChart3, Activity,
  DollarSign, Percent, Save, Loader2, CheckCircle, CandlestickChart, Play,
  ArrowUpRight, ArrowDownRight, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import BacktestChart, { type ChartTradeLine } from './BacktestChart';
import PlaybackControls from './PlaybackControls';
import TradingPanel, { type SimulatedTrade } from './TradingPanel';
import { useMarketHistory } from '@/hooks/useMarketHistory';
import { useSaveBacktestState } from '@/hooks/useBacktests';
import BacktestSessionSummary from './BacktestSessionSummary';
import type { BacktestResponseDto, BacktestSessionState, OhlcvCandleDto } from '@/types/dto';

interface BacktestSessionViewProps {
  session: BacktestResponseDto;
  onBack: () => void;
}

const TIMEFRAMES = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1H' },
  { value: '1d', label: '1D' },
  { value: '1wk', label: '1W' },
];

const BacktestSessionView: React.FC<BacktestSessionViewProps> = ({ session, onBack }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const saveStateMutation = useSaveBacktestState();

  // Restore saved state if available
  const savedState = useMemo<BacktestSessionState | null>(() => {
    if (!session.sessionState) return null;
    try { return JSON.parse(session.sessionState); } catch { return null; }
  }, [session.sessionState]);

  const [timeframe, setTimeframe] = useState(savedState?.timeframe ?? session.timeframe ?? '1d');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // Context period before session start — adapts to timeframe to stay within Yahoo limits
  const contextStartDate = useMemo(() => {
    const d = new Date(session.startDate);
    switch (timeframe) {
      case '1m':  d.setDate(d.getDate() - 2); break;    // 2 days context (total max 7)
      case '5m':  d.setDate(d.getDate() - 2); break;    // 2 days context
      case '15m': d.setDate(d.getDate() - 14); break;   // 2 weeks context (total max 58)
      case '30m': d.setDate(d.getDate() - 14); break;   // 2 weeks context
      case '1h':  d.setMonth(d.getMonth() - 3); break;  // 3 months context
      case '1d':  d.setFullYear(d.getFullYear() - 1); break;
      case '1wk': d.setFullYear(d.getFullYear() - 2); break;
      default:    d.setMonth(d.getMonth() - 1); break;
    }
    return d.toISOString().split('T')[0];
  }, [session.startDate, timeframe]);

  const { data: marketData, isLoading: chartLoading } = useMarketHistory(
    session.symbol, timeframe, contextStartDate, session.endDate
  );
  const allCandles = marketData.candles;

  // Split: context candles (visible from start) + session candles (revealed progressively)
  const { contextCandles, sessionCandles } = useMemo(() => {
    const startTs = new Date(session.startDate).getTime() / 1000;
    const ctx: OhlcvCandleDto[] = [];
    const sess: OhlcvCandleDto[] = [];
    for (const c of allCandles) {
      if (c.timestamp < startTs) ctx.push(c);
      else sess.push(c);
    }
    return { contextCandles: ctx, sessionCandles: sess };
  }, [allCandles, session.startDate]);

  // Playback state — restore from saved state
  const [currentIndex, setCurrentIndex] = useState(savedState?.currentIndex ?? 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Trades state — restore from saved state
  const [trades, setTrades] = useState<SimulatedTrade[]>(savedState?.trades ?? []);
  const initialCapital = session.initialCapital ?? 10000;
  const [quickLotSizeInput, setQuickLotSizeInput] = useState(savedState?.quickLotSize ?? '0.01');
  const quickLotSize = Number(quickLotSizeInput);
  const isLotSizeValid = !Number.isNaN(quickLotSize) && quickLotSize > 0;

  // Mark unsaved when state changes
  const prevIndexRef = useRef(currentIndex);
  const prevTradesLenRef = useRef(trades.length);
  useEffect(() => {
    if (currentIndex !== prevIndexRef.current || trades.length !== prevTradesLenRef.current) {
      setHasUnsavedChanges(true);
      prevIndexRef.current = currentIndex;
      prevTradesLenRef.current = trades.length;
    }
  }, [currentIndex, trades.length]);

  // Build current state for saving
  const buildSessionState = useCallback((): string => {
    const state: BacktestSessionState = {
      currentIndex,
      timeframe,
      trades,
      quickLotSize: quickLotSizeInput,
    };
    return JSON.stringify(state);
  }, [currentIndex, timeframe, trades, quickLotSizeInput]);

  // Save handler
  const handleSave = useCallback(() => {
    const status = currentIndex > 0 ? 'ONGOING' : 'NOT_STARTED';
    saveStateMutation.mutate(
      { id: session.id, data: { sessionState: buildSessionState(), status } },
      {
        onSuccess: () => {
          setHasUnsavedChanges(false);
          toast({ title: t('backtesting.sessionSaved'), description: t('backtesting.sessionSavedDescription') });
        },
        onError: () => {
          toast({ title: t('common.error'), description: t('backtesting.sessionSaveFailed'), variant: 'destructive' });
        },
      }
    );
  }, [session.id, buildSessionState, currentIndex, saveStateMutation, toast, t]);

  // Finish session handler
  const handleFinish = useCallback(() => {
    saveStateMutation.mutate(
      { id: session.id, data: { sessionState: buildSessionState(), status: 'FINISHED' } },
      {
        onSuccess: () => {
          setHasUnsavedChanges(false);
          toast({ title: t('backtesting.sessionFinished'), description: t('backtesting.sessionFinishedDescription') });
          onBack();
        },
      }
    );
  }, [session.id, buildSessionState, saveStateMutation, toast, t, onBack]);

  // Auto-save on browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Intercept back button with unsaved changes
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowLeaveDialog(true);
    } else {
      onBack();
    }
  }, [hasUnsavedChanges, onBack]);

  // Visible candles = context + revealed session candles
  const visibleCandles = useMemo(
    () => [...contextCandles, ...sessionCandles.slice(0, currentIndex)],
    [contextCandles, sessionCandles, currentIndex]
  );

  const currentPrice = visibleCandles.length > 0 ? visibleCandles[visibleCandles.length - 1].close : null;

  // Check open trades for SL/TP hits on each candle advance
  useEffect(() => {
    if (currentPrice === null || visibleCandles.length === 0) return;
    const candle = visibleCandles[visibleCandles.length - 1];
    setTrades(prev => prev.map(trade => {
      if (trade.status !== 'OPEN') return trade;
      const contractSize = trade.entryPrice > 100 ? 100 : 100000;
      const calcPnl = (exitPrice: number) => {
        const diff = trade.direction === 'LONG' ? exitPrice - trade.entryPrice : trade.entryPrice - exitPrice;
        return diff * trade.lotSize * contractSize;
      };
      if (trade.direction === 'LONG') {
        if (candle.low <= trade.stopLoss)
          return { ...trade, status: 'CLOSED_SL' as const, exitPrice: trade.stopLoss, exitTime: candle.timestamp, pnl: calcPnl(trade.stopLoss) };
        if (candle.high >= trade.takeProfit)
          return { ...trade, status: 'CLOSED_TP' as const, exitPrice: trade.takeProfit, exitTime: candle.timestamp, pnl: calcPnl(trade.takeProfit) };
      } else {
        if (candle.high >= trade.stopLoss)
          return { ...trade, status: 'CLOSED_SL' as const, exitPrice: trade.stopLoss, exitTime: candle.timestamp, pnl: calcPnl(trade.stopLoss) };
        if (candle.low <= trade.takeProfit)
          return { ...trade, status: 'CLOSED_TP' as const, exitPrice: trade.takeProfit, exitTime: candle.timestamp, pnl: calcPnl(trade.takeProfit) };
      }
      return trade;
    }));
  }, [currentIndex]);

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= sessionCandles.length) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, 1000 / speed);
    }
    return () => { if (playIntervalRef.current) clearInterval(playIntervalRef.current); };
  }, [isPlaying, speed, sessionCandles.length]);

  // KPIs — must be before callbacks that reference balance
  const closedTrades = trades.filter(t => t.status !== 'OPEN');
  const openTrades = trades.filter(t => t.status === 'OPEN');
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const balance = initialCapital + totalPnl;
  const wins = closedTrades.filter(t => (t.pnl ?? 0) > 0);
  const losses = closedTrades.filter(t => (t.pnl ?? 0) < 0);
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
  const maxDrawdown = useMemo(() => {
    let peak = initialCapital, maxDD = 0, running = initialCapital;
    for (const t of closedTrades) { running += t.pnl ?? 0; if (running > peak) peak = running; const dd = peak - running; if (dd > maxDD) maxDD = dd; }
    return maxDD;
  }, [closedTrades, initialCapital]);
  const unrealizedPnl = useMemo(() => {
    if (currentPrice === null) return 0;
    return openTrades.reduce((sum, t) => {
      // Contract size: gold/commodities = 100, forex = 100,000
      const contractSize = t.entryPrice > 100 ? 100 : 100000;
      const diff = t.direction === 'LONG' ? currentPrice - t.entryPrice : t.entryPrice - currentPrice;
      return sum + (diff * t.lotSize * contractSize);
    }, 0);
  }, [openTrades, currentPrice]);

  const handlePlaceTrade = useCallback((tradeData: Omit<SimulatedTrade, 'id' | 'status'>) => {
    const trade: SimulatedTrade = {
      ...tradeData,
      id: `sim-${Date.now()}`,
      status: 'OPEN',
      entryTime: visibleCandles.length > 0 ? visibleCandles[visibleCandles.length - 1].timestamp : 0,
    };
    setTrades(prev => [...prev, trade]);
  }, [visibleCandles]);

  // Quick buy/sell at market with configured lot size
  const handleQuickTrade = useCallback((dir: 'LONG' | 'SHORT') => {
    if (!currentPrice || !isLotSizeValid) return;
    const pipVal = currentPrice > 100 ? 0.01 : 0.0001;
    const slPips = 50;
    const tpPips = 100;
    const slDist = slPips * pipVal;
    const tpDist = tpPips * pipVal;
    const riskAmt = quickLotSize * slPips * 10;
    const trade: SimulatedTrade = {
      id: `sim-${Date.now()}`,
      direction: dir,
      entryPrice: currentPrice,
      stopLoss: dir === 'LONG' ? currentPrice - slDist : currentPrice + slDist,
      takeProfit: dir === 'LONG' ? currentPrice + tpDist : currentPrice - tpDist,
      lotSize: quickLotSize,
      riskPercent: balance > 0 ? (riskAmt / balance) * 100 : 0,
      riskAmount: Math.round(riskAmt * 100) / 100,
      rrRatio: 2,
      entryTime: visibleCandles.length > 0 ? visibleCandles[visibleCandles.length - 1].timestamp : 0,
      status: 'OPEN',
    };
    setTrades(prev => [...prev, trade]);
  }, [currentPrice, balance, visibleCandles, quickLotSize, isLotSizeValid]);

  // Drag SL/TP on chart
  const handleDragSL = useCallback((tradeId: string, newPrice: number) => {
    setTrades(prev => prev.map(t => {
      if (t.id !== tradeId || t.status !== 'OPEN') return t;
      const pipVal = t.entryPrice > 100 ? 0.01 : 0.0001;
      const newSlPips = Math.abs(t.entryPrice - newPrice) / pipVal;
      const newRR = newSlPips > 0 ? (Math.abs(t.takeProfit - t.entryPrice) / pipVal) / newSlPips : t.rrRatio;
      return { ...t, stopLoss: newPrice, rrRatio: Math.round(newRR * 100) / 100 };
    }));
  }, []);

  const handleDragTP = useCallback((tradeId: string, newPrice: number) => {
    setTrades(prev => prev.map(t => {
      if (t.id !== tradeId || t.status !== 'OPEN') return t;
      const pipVal = t.entryPrice > 100 ? 0.01 : 0.0001;
      const slPips = Math.abs(t.entryPrice - t.stopLoss) / pipVal;
      const newTpPips = Math.abs(newPrice - t.entryPrice) / pipVal;
      const newRR = slPips > 0 ? newTpPips / slPips : t.rrRatio;
      return { ...t, takeProfit: newPrice, rrRatio: Math.round(newRR * 100) / 100 };
    }));
  }, []);

  const priceDecimals = (currentPrice ?? 0) > 100 ? 2 : 5;

  // Map trades to chart lines
  const chartTrades: ChartTradeLine[] = useMemo(() => trades.map(t => ({
    id: t.id,
    direction: t.direction,
    entryPrice: t.entryPrice,
    stopLoss: t.stopLoss,
    takeProfit: t.takeProfit,
    lotSize: t.lotSize,
    entryTime: t.entryTime,
    status: t.status,
  })), [trades]);

  const isFinished = session.status === 'FINISHED';

  return (
    <div className="space-y-4">
      {/* #5: Header with better hierarchy + #10: Larger unsaved badge */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {session.icon && <span className="text-2xl">{session.icon}</span>}
                <h2 className="text-2xl font-bold">{session.name}</h2>
                {session.symbol && <Badge variant="outline" className="font-mono text-sm">{session.symbol}</Badge>}
                <Badge variant="secondary" className="text-xs">${initialCapital.toLocaleString()}</Badge>
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30 animate-pulse">
                    <Save className="h-3 w-3 mr-1" />
                    {t('backtesting.unsaved')}
                  </Badge>
                )}
                {isFinished && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500 text-xs py-1 px-3">
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    {t('backtesting.sessionFinished')}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{session.startDate} → {session.endDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isFinished && (
              <>
                <Button variant="outline" size="sm" onClick={handleSave} disabled={!hasUnsavedChanges || saveStateMutation.isPending}>
                  {saveStateMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                  {t('backtesting.save')}
                </Button>
                <Button size="sm" variant="default" onClick={handleFinish} disabled={saveStateMutation.isPending}>
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  {t('backtesting.finish')}
                </Button>
              </>
            )}
          </div>
        </div>
        {/* #11: Timeframe selector with better active indicator */}
        <div className="flex items-center gap-1 rounded-xl border bg-card/50 p-1 w-fit">
          {TIMEFRAMES.map(tf => (
            <Button
              key={tf.value}
              variant={timeframe === tf.value ? 'default' : 'ghost'}
              size="sm"
              className={cn('h-8 px-3 text-xs font-mono', timeframe === tf.value && 'shadow-sm')}
              onClick={() => { setTimeframe(tf.value); setCurrentIndex(0); setIsPlaying(false); }}
            >
              {tf.label}
            </Button>
          ))}
        </div>
      </div>

      {/* #12: Separator between header and content */}
      <div className="border-t border-border/50" />

      {/* Main content — full width, no side panel */}
      <div className="space-y-3">
          {/* #1: Chart with proper empty state */}
          {chartLoading ? (
            <Skeleton className="w-full h-[500px] rounded-xl" />
          ) : visibleCandles.length > 0 ? (
            <BacktestChart data={visibleCandles} trades={chartTrades} height={500} preserveScale onDragSL={handleDragSL} onDragTP={handleDragTP} />
          ) : (
            <Card className="glass-card rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center gap-4 py-24">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  <CandlestickChart className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium">{t('backtesting.noChartData')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('backtesting.advancePlayback')}</p>
                </div>
                {!isFinished && (
                  <Button variant="outline" size="sm" onClick={() => setCurrentIndex(p => Math.min(p + 1, sessionCandles.length))}>
                    <Play className="h-4 w-4 mr-1.5" />
                    {t('backtesting.stepForward')}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Trade bar — compact: SELL | lots | BUY | ⚙ settings — hidden when finished */}
          {currentPrice && !isFinished && (
            <div className="flex items-center justify-center gap-3 rounded-xl border bg-card/50 px-4 py-2.5">
              <Button
                size="sm"
                className="h-10 px-5 bg-red-600 hover:bg-red-700 active:bg-red-800 font-bold font-mono text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => handleQuickTrade('SHORT')}
                disabled={!isLotSizeValid}
              >
                <span className="mr-2">{currentPrice.toFixed(priceDecimals)}</span>
                SELL
              </Button>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">Lots</p>
                <input
                  type="text"
                  inputMode="decimal"
                  value={quickLotSizeInput}
                  onChange={(e) => setQuickLotSizeInput(e.target.value)}
                  className={cn(
                    'w-20 h-8 text-center text-sm font-mono font-bold bg-muted/50 border rounded-lg transition-colors',
                    !isLotSizeValid && quickLotSizeInput !== '' && 'border-red-500 ring-1 ring-red-500'
                  )}
                />
              </div>
              <Button
                size="sm"
                className="h-10 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 font-bold font-mono text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => handleQuickTrade('LONG')}
                disabled={!isLotSizeValid}
              >
                <span className="mr-2">{currentPrice.toFixed(priceDecimals)}</span>
                BUY
              </Button>
              {/* Settings button → opens trading panel sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[340px] sm:w-[380px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{t('backtesting.command')}</SheetTitle>
                    <SheetDescription>{t('backtesting.commandDescription')}</SheetDescription>
                  </SheetHeader>
                  <div className="mt-4">
                    <TradingPanel currentPrice={currentPrice} balance={balance} onPlaceTrade={handlePlaceTrade} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}

          {/* Playback */}
          <PlaybackControls
            currentIndex={currentIndex} totalCandles={sessionCandles.length}
            isPlaying={isPlaying} speed={speed}
            onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
            onStepForward={() => setCurrentIndex(p => Math.min(p + 1, sessionCandles.length))}
            onStepBack={() => setCurrentIndex(p => Math.max(p - 1, 0))}
            onSeek={setCurrentIndex} onSpeedChange={setSpeed}
          />

          {/* #6: KPI strip with hierarchy — Balance and P&L larger */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {/* Balance — spans 1 col but taller */}
            <Card className="glass-card rounded-xl md:col-span-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider">{t('backtesting.balance')}</span>
                </div>
                {/* #2: Arrow icon for colorblind accessibility */}
                <p className={cn('text-lg font-bold font-mono tabular-nums flex items-center gap-1', balance >= initialCapital ? 'text-green-500' : 'text-red-500')}>
                  {balance >= initialCapital ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  ${balance.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            {/* Net Profit — also prominent */}
            <Card className="glass-card rounded-xl md:col-span-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider">{t('backtesting.netProfit')}</span>
                </div>
                <p className={cn('text-lg font-bold font-mono tabular-nums flex items-center gap-1', totalPnl >= 0 ? 'text-green-500' : 'text-red-500')}>
                  {totalPnl >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  ${totalPnl.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            {/* Smaller KPIs */}
            {[
              { icon: <Percent className="h-3.5 w-3.5" />, label: t('backtesting.winRate'), value: `${winRate.toFixed(1)}%` },
              { icon: <BarChart3 className="h-3.5 w-3.5" />, label: t('backtesting.trades'), value: `${wins.length}W / ${losses.length}L` },
              { icon: <TrendingDown className="h-3.5 w-3.5" />, label: t('backtesting.maxDrawdown'), value: `$${maxDrawdown.toFixed(2)}`, color: 'text-red-500' },
              { icon: <Activity className="h-3.5 w-3.5" />, label: t('backtesting.unrealizedPnl'), value: `$${unrealizedPnl.toFixed(2)}`, color: unrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500' },
            ].map(kpi => (
              <Card key={kpi.label} className="glass-card rounded-xl">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                    {kpi.icon}
                    <span className="text-[10px] uppercase tracking-wider">{kpi.label}</span>
                  </div>
                  <p className={cn('text-sm font-bold font-mono tabular-nums', kpi.color ?? '')}>{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* #7: Trade history with readable font size */}
          {trades.length > 0 && (
            <Card className="glass-card rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('backtesting.tradeHistory')} ({trades.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">#</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">{t('backtesting.direction')}</th>
                        <th className="text-right px-3 py-2.5 font-medium text-muted-foreground text-xs">{t('backtesting.entry')}</th>
                        <th className="text-right px-3 py-2.5 font-medium text-muted-foreground text-xs">SL</th>
                        <th className="text-right px-3 py-2.5 font-medium text-muted-foreground text-xs">TP</th>
                        <th className="text-right px-3 py-2.5 font-medium text-muted-foreground text-xs">{t('backtesting.lots')}</th>
                        <th className="text-center px-3 py-2.5 font-medium text-muted-foreground text-xs">R:R</th>
                        <th className="text-left px-3 py-2.5 font-medium text-muted-foreground text-xs">{t('common.status')}</th>
                        <th className="text-right px-3 py-2.5 font-medium text-muted-foreground text-xs">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((trade, i) => (
                        <tr key={trade.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-2.5">
                            <Badge variant="secondary" className={cn('text-xs', trade.direction === 'LONG' ? 'text-green-500' : 'text-red-500')}>
                              {trade.direction}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono">{trade.entryPrice.toFixed(priceDecimals)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-red-400">{trade.stopLoss.toFixed(priceDecimals)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-green-400">{trade.takeProfit.toFixed(priceDecimals)}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{trade.lotSize.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-center font-mono">1:{trade.rrRatio.toFixed(1)}</td>
                          <td className="px-3 py-2.5">
                            <Badge variant={trade.status === 'OPEN' ? 'default' : trade.status === 'CLOSED_TP' ? 'secondary' : 'destructive'} className="text-xs">
                              {trade.status === 'OPEN' ? 'Open' : trade.status === 'CLOSED_TP' ? 'TP' : 'SL'}
                            </Badge>
                          </td>
                          {/* #2: Arrow icons on P&L for colorblind */}
                          <td className={cn('px-3 py-2.5 text-right font-mono font-medium', (trade.pnl ?? 0) >= 0 ? 'text-green-500' : 'text-red-500')}>
                            <span className="inline-flex items-center gap-0.5">
                              {trade.pnl != null && ((trade.pnl >= 0) ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />)}
                              {trade.pnl != null ? `$${trade.pnl.toFixed(2)}` : '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session Summary — shown when FINISHED */}
          {isFinished && trades.length > 0 && (
            <BacktestSessionSummary
              trades={trades}
              initialCapital={initialCapital}
              symbol={session.symbol ?? ''}
            />
          )}
      </div>

      {/* Unsaved changes dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('backtesting.unsavedChanges')}</AlertDialogTitle>
            <AlertDialogDescription>{t('backtesting.unsavedChangesDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { setShowLeaveDialog(false); onBack(); }}
            >
              {t('backtesting.leaveWithoutSaving')}
            </AlertDialogAction>
            <AlertDialogAction onClick={() => {
              handleSave();
              setShowLeaveDialog(false);
              setTimeout(() => onBack(), 500);
            }}>
              <Save className="h-4 w-4 mr-1.5" />
              {t('backtesting.saveAndLeave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BacktestSessionView;
