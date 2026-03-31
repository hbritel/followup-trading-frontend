import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, TrendingDown, Target, BarChart3, Activity, Clock,
  ArrowUpRight, ArrowDownRight, Percent, DollarSign, Sparkles,
  Trophy, AlertTriangle, Zap, Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimulatedTrade } from './TradingPanel';

interface BacktestSessionSummaryProps {
  trades: SimulatedTrade[];
  initialCapital: number;
  symbol: string;
}

const BacktestSessionSummary: React.FC<BacktestSessionSummaryProps> = ({
  trades,
  initialCapital,
  symbol,
}) => {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const closed = trades.filter(t => t.status !== 'OPEN');
    if (closed.length === 0) return null;

    const wins = closed.filter(t => (t.pnl ?? 0) > 0);
    const losses = closed.filter(t => (t.pnl ?? 0) < 0);
    const breakeven = closed.filter(t => (t.pnl ?? 0) === 0);

    const longs = closed.filter(t => t.direction === 'LONG');
    const shorts = closed.filter(t => t.direction === 'SHORT');
    const longWins = longs.filter(t => (t.pnl ?? 0) > 0);
    const shortWins = shorts.filter(t => (t.pnl ?? 0) > 0);

    const totalPnl = closed.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
    const pnlPercent = initialCapital > 0 ? (totalPnl / initialCapital) * 100 : 0;
    const winRate = (wins.length / closed.length) * 100;
    const longWinRate = longs.length > 0 ? (longWins.length / longs.length) * 100 : 0;
    const shortWinRate = shorts.length > 0 ? (shortWins.length / shorts.length) * 100 : 0;

    const winPnls = wins.map(t => t.pnl ?? 0);
    const lossPnls = losses.map(t => Math.abs(t.pnl ?? 0));

    const avgWin = winPnls.length > 0 ? winPnls.reduce((a, b) => a + b, 0) / winPnls.length : 0;
    const avgLoss = lossPnls.length > 0 ? lossPnls.reduce((a, b) => a + b, 0) / lossPnls.length : 0;
    const avgWinLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;

    const largestWin = winPnls.length > 0 ? Math.max(...winPnls) : 0;
    const largestLoss = lossPnls.length > 0 ? Math.max(...lossPnls) : 0;

    // Profit Factor
    const grossProfit = winPnls.reduce((a, b) => a + b, 0);
    const grossLoss = lossPnls.reduce((a, b) => a + b, 0);
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    // Expectancy (avg P&L per trade)
    const expectancy = totalPnl / closed.length;

    // Max drawdown
    let peak = initialCapital, maxDD = 0, maxDDPercent = 0, running = initialCapital;
    for (const t of closed) {
      running += t.pnl ?? 0;
      if (running > peak) peak = running;
      const dd = peak - running;
      if (dd > maxDD) {
        maxDD = dd;
        maxDDPercent = peak > 0 ? (dd / peak) * 100 : 0;
      }
    }

    // Consecutive wins/losses
    let maxConsWins = 0, maxConsLosses = 0, curWins = 0, curLosses = 0;
    for (const t of closed) {
      if ((t.pnl ?? 0) > 0) { curWins++; curLosses = 0; maxConsWins = Math.max(maxConsWins, curWins); }
      else if ((t.pnl ?? 0) < 0) { curLosses++; curWins = 0; maxConsLosses = Math.max(maxConsLosses, curLosses); }
      else { curWins = 0; curLosses = 0; }
    }

    // Avg trade duration (for trades with both entry and exit times)
    const tradesWithDuration = closed.filter(t => t.entryTime && t.exitTime);
    const avgDuration = tradesWithDuration.length > 0
      ? tradesWithDuration.reduce((sum, t) => sum + ((t.exitTime! - t.entryTime) * 1000), 0) / tradesWithDuration.length
      : 0;
    const winDuration = tradesWithDuration.filter(t => (t.pnl ?? 0) > 0);
    const lossDuration = tradesWithDuration.filter(t => (t.pnl ?? 0) < 0);
    const avgWinDuration = winDuration.length > 0
      ? winDuration.reduce((sum, t) => sum + ((t.exitTime! - t.entryTime) * 1000), 0) / winDuration.length : 0;
    const avgLossDuration = lossDuration.length > 0
      ? lossDuration.reduce((sum, t) => sum + ((t.exitTime! - t.entryTime) * 1000), 0) / lossDuration.length : 0;

    // Avg R:R realized
    const avgRR = closed.reduce((sum, t) => sum + (t.rrRatio ?? 0), 0) / closed.length;

    // Equity curve points
    const equityPoints: { index: number; equity: number }[] = [{ index: 0, equity: initialCapital }];
    let eq = initialCapital;
    closed.forEach((t, i) => { eq += t.pnl ?? 0; equityPoints.push({ index: i + 1, equity: eq }); });

    // Best & worst trade
    const bestTrade = wins.length > 0 ? wins.reduce((best, t) => (t.pnl ?? 0) > (best.pnl ?? 0) ? t : best) : null;
    const worstTrade = losses.length > 0 ? losses.reduce((worst, t) => (t.pnl ?? 0) < (worst.pnl ?? 0) ? t : worst) : null;

    return {
      totalTrades: closed.length,
      wins: wins.length,
      losses: losses.length,
      breakeven: breakeven.length,
      longs: longs.length,
      shorts: shorts.length,
      longWinRate,
      shortWinRate,
      totalPnl,
      pnlPercent,
      winRate,
      avgWin,
      avgLoss,
      avgWinLossRatio,
      largestWin,
      largestLoss,
      profitFactor,
      expectancy,
      maxDD,
      maxDDPercent,
      maxConsWins,
      maxConsLosses,
      avgDuration,
      avgWinDuration,
      avgLossDuration,
      avgRR,
      equityPoints,
      finalBalance: initialCapital + totalPnl,
      bestTrade,
      worstTrade,
    };
  }, [trades, initialCapital]);

  if (!stats) {
    return (
      <Card className="glass-card rounded-2xl">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">{t('backtesting.summary.noTrades')}</p>
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (ms: number) => {
    if (ms <= 0) return '-';
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours < 24) return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
  };

  const dec = (stats.bestTrade?.entryPrice ?? 0) > 100 ? 2 : 5;

  // Mini equity curve SVG
  const equityMin = Math.min(...stats.equityPoints.map(p => p.equity));
  const equityMax = Math.max(...stats.equityPoints.map(p => p.equity));
  const eqRange = equityMax - equityMin || 1;
  const svgW = 280;
  const svgH = 60;
  const eqPathPoints = stats.equityPoints.map((p, i) => {
    const x = stats.equityPoints.length > 1 ? (i / (stats.equityPoints.length - 1)) * svgW : svgW / 2;
    const y = svgH - ((p.equity - equityMin) / eqRange) * (svgH - 4) - 2;
    return `${x},${y}`;
  });
  const eqPath = `M${eqPathPoints.join(' L')}`;
  const eqFillPath = `${eqPath} L${svgW},${svgH} L0,${svgH} Z`;
  const eqColor = stats.totalPnl >= 0 ? '#22c55e' : '#ef4444';

  return (
    <div className="space-y-4">
      {/* Section title */}
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">{t('backtesting.summary.title')}</h3>
      </div>

      {/* Top KPIs — 4 prominent cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Net P&L */}
        <Card className="glass-card rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">{t('backtesting.summary.netPnl')}</span>
            </div>
            <p className={cn('text-xl font-bold font-mono tabular-nums flex items-center gap-1', stats.totalPnl >= 0 ? 'text-green-500' : 'text-red-500')}>
              {stats.totalPnl >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              ${Math.abs(stats.totalPnl).toFixed(2)}
            </p>
            <p className={cn('text-xs font-mono mt-0.5', stats.pnlPercent >= 0 ? 'text-green-500/70' : 'text-red-500/70')}>
              {stats.pnlPercent >= 0 ? '+' : ''}{stats.pnlPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card className="glass-card rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">{t('backtesting.winRate')}</span>
            </div>
            <p className={cn('text-xl font-bold font-mono tabular-nums', stats.winRate >= 50 ? 'text-green-500' : 'text-amber-500')}>
              {stats.winRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              {stats.wins}W / {stats.losses}L{stats.breakeven > 0 ? ` / ${stats.breakeven}BE` : ''}
            </p>
          </CardContent>
        </Card>

        {/* Profit Factor */}
        <Card className="glass-card rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Scale className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">{t('backtesting.profitFactor')}</span>
            </div>
            <p className={cn('text-xl font-bold font-mono tabular-nums', stats.profitFactor >= 1.5 ? 'text-green-500' : stats.profitFactor >= 1 ? 'text-amber-500' : 'text-red-500')}>
              {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats.profitFactor >= 2 ? t('backtesting.summary.excellent') : stats.profitFactor >= 1.5 ? t('backtesting.summary.good') : stats.profitFactor >= 1 ? t('backtesting.summary.breakeven') : t('backtesting.summary.unprofitable')}
            </p>
          </CardContent>
        </Card>

        {/* Max Drawdown */}
        <Card className="glass-card rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">{t('backtesting.maxDrawdown')}</span>
            </div>
            <p className="text-xl font-bold font-mono tabular-nums text-red-500">
              ${stats.maxDD.toFixed(2)}
            </p>
            <p className="text-xs text-red-500/70 font-mono mt-0.5">
              {stats.maxDDPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Equity Curve */}
      <Card className="glass-card rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t('backtesting.equityCurve')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-end justify-between mb-2">
            <span className="text-xs text-muted-foreground font-mono">${initialCapital.toLocaleString()}</span>
            <span className={cn('text-sm font-bold font-mono', stats.totalPnl >= 0 ? 'text-green-500' : 'text-red-500')}>
              ${stats.finalBalance.toFixed(2)}
            </span>
          </div>
          <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none" className="h-16">
            <defs>
              <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={eqColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={eqColor} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={eqFillPath} fill="url(#eqGrad)" />
            <path d={eqPath} fill="none" stroke={eqColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </CardContent>
      </Card>

      {/* Detailed stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Performance */}
        <Card className="glass-card rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('backtesting.summary.performance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <StatRow label={t('backtesting.summary.expectancy')} value={`$${stats.expectancy.toFixed(2)}`} color={stats.expectancy >= 0 ? 'green' : 'red'} />
              <StatRow label={t('backtesting.averageWin')} value={`$${stats.avgWin.toFixed(2)}`} color="green" />
              <StatRow label={t('backtesting.averageLoss')} value={`$${stats.avgLoss.toFixed(2)}`} color="red" />
              <StatRow label={t('backtesting.summary.avgWinLossRatio')} value={stats.avgWinLossRatio === Infinity ? '∞' : stats.avgWinLossRatio.toFixed(2)} color={stats.avgWinLossRatio >= 1 ? 'green' : 'red'} />
              <StatRow label={t('backtesting.summary.avgRR')} value={`1:${stats.avgRR.toFixed(1)}`} />
              <StatRow label={t('backtesting.largestWin')} value={`$${stats.largestWin.toFixed(2)}`} color="green" />
              <StatRow label={t('backtesting.largestLoss')} value={`$${stats.largestLoss.toFixed(2)}`} color="red" />
            </div>
          </CardContent>
        </Card>

        {/* Risk */}
        <Card className="glass-card rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {t('backtesting.summary.risk')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <StatRow label={t('backtesting.maxDrawdown')} value={`$${stats.maxDD.toFixed(2)} (${stats.maxDDPercent.toFixed(1)}%)`} color="red" />
              <StatRow label={t('backtesting.summary.maxConsWins')} value={`${stats.maxConsWins}`} color="green" />
              <StatRow label={t('backtesting.summary.maxConsLosses')} value={`${stats.maxConsLosses}`} color="red" />
              <StatRow label={t('backtesting.summary.longWinRate')} value={`${stats.longWinRate.toFixed(1)}% (${stats.longs} trades)`} />
              <StatRow label={t('backtesting.summary.shortWinRate')} value={`${stats.shortWinRate.toFixed(1)}% (${stats.shorts} trades)`} />
            </div>
          </CardContent>
        </Card>

        {/* Time Analysis */}
        <Card className="glass-card rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('backtesting.summary.timeAnalysis')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <StatRow label={t('backtesting.summary.avgDuration')} value={formatDuration(stats.avgDuration)} />
              <StatRow label={t('backtesting.summary.avgWinDuration')} value={formatDuration(stats.avgWinDuration)} color="green" />
              <StatRow label={t('backtesting.summary.avgLossDuration')} value={formatDuration(stats.avgLossDuration)} color="red" />
              <StatRow label={t('backtesting.totalTrades')} value={`${stats.totalTrades}`} />
            </div>
          </CardContent>
        </Card>

        {/* Best & Worst */}
        <Card className="glass-card rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {t('backtesting.summary.bestWorst')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.bestTrade && (
                <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Trophy className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs font-medium text-green-500">{t('backtesting.summary.bestTrade')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {stats.bestTrade.direction} @ {stats.bestTrade.entryPrice.toFixed(dec)}
                    </span>
                    <span className="font-mono font-bold text-green-500 text-sm">
                      +${stats.bestTrade.pnl?.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              {stats.worstTrade && (
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-xs font-medium text-red-500">{t('backtesting.summary.worstTrade')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {stats.worstTrade.direction} @ {stats.worstTrade.entryPrice.toFixed(dec)}
                    </span>
                    <span className="font-mono font-bold text-red-500 text-sm">
                      ${stats.worstTrade.pnl?.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis — Coming Soon */}
      <Card className="glass-card rounded-xl border-dashed">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{t('backtesting.summary.aiAnalysis')}</p>
              <p className="text-xs text-muted-foreground">{t('backtesting.summary.aiAnalysisDescription')}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" disabled className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {t('backtesting.summary.analyze')}
            <Badge variant="secondary" className="text-[10px] ml-1">
              {t('common.comingSoon', 'Coming Soon')}
            </Badge>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

/** Stat row helper */
const StatRow: React.FC<{ label: string; value: string; color?: 'green' | 'red' }> = ({ label, value, color }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={cn(
      'text-sm font-mono font-medium tabular-nums',
      color === 'green' && 'text-green-500',
      color === 'red' && 'text-red-500',
    )}>
      {value}
    </span>
  </div>
);

export default BacktestSessionSummary;
