
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Bar,
  BarChart as RechartsBarChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useDashboardSummary,
  useRiskDistribution,
  useMarginUtilizationTimeSeries,
  useHoldingPeriodDistribution,
  useKellyByStrategy,
} from '@/hooks/useAdvancedMetrics';
import { Badge } from '@/components/ui/badge';

// ---- Info tooltip component ----
const InfoBubble = ({ text }: { text: string }) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-4 w-4 text-muted-foreground cursor-help inline-block ml-1.5 shrink-0" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-sm">
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface RiskMetricsBoardProps {
  startDate?: string;
  endDate?: string;
  accountId?: string | string[];
}

const RiskMetricsBoard: React.FC<RiskMetricsBoardProps> = ({ startDate, endDate, accountId }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch real data from backend with date filters
  const { data: dashboardSummary, isLoading: summaryLoading, error: summaryError } = useDashboardSummary(startDate, endDate, accountId);
  const { data: riskDist, isLoading: distLoading, error: distError } = useRiskDistribution(startDate, endDate, accountId);
  const { data: marginTimeSeries } = useMarginUtilizationTimeSeries(startDate, endDate, accountId, 'WEEK');
  const { data: holdingDistribution } = useHoldingPeriodDistribution(startDate, endDate, accountId);
  const { data: strategyKelly } = useKellyByStrategy(startDate, endDate, accountId);

  const isLoading = summaryLoading || distLoading;
  const hasError = summaryError || distError;

  // ---- Extract real values from backend (safe defaults) ----
  const perf = dashboardSummary?.performanceSummary;
  const realSharpe = dashboardSummary?.sharpeRatio ?? 0;
  const realSortino = dashboardSummary?.sortinoRatio ?? 0;
  const realMaxDrawdown = dashboardSummary?.drawdownMetrics?.maxDrawdownPercent ?? 0;
  const realCurrentDrawdown = dashboardSummary?.drawdownMetrics?.currentDrawdownPercent ?? 0;
  const realMaxDrawdownAmount = dashboardSummary?.drawdownMetrics?.maxDrawdownAmount ?? 0;
  const realVaR = dashboardSummary?.valueAtRisk ?? 0;
  const realRecoveryFactor = dashboardSummary?.recoveryFactor ?? 0;
  const realProfitConsistency = dashboardSummary?.profitConsistency ?? 0;
  const realDiversityScore = dashboardSummary?.portfolioDiversityScore ?? 0;
  const realTimeInMarket = dashboardSummary?.timeInMarket ?? 0;
  const currentEquity = dashboardSummary?.currentEquity ?? 0;

  // Risk distribution (historical VaR from closed trades)
  const var95 = riskDist?.var95 ?? 0;
  const var99 = riskDist?.var99 ?? 0;
  const cvar95 = riskDist?.cvar95 ?? 0;
  const stdDev = riskDist?.standardDeviation ?? 0;
  const downside = riskDist?.downside ?? 0;

  // Performance by asset type (allocation from closed trades)
  const perfByAssetType = dashboardSummary?.performanceByAssetType ?? {};
  const perfByDirection = dashboardSummary?.performanceByDirection ?? {};

  // ---- Overview: Radar chart data ----
  const normalizeMetric = (val: number, maxExpected: number) =>
    Math.min(100, Math.max(0, (Math.abs(val) / maxExpected) * 100));

  const radarChartData = [
    { subject: t('riskMetrics.radar.var', 'VaR'), valeur: normalizeMetric(realVaR, 500), fullMark: 100 },
    { subject: t('riskMetrics.radar.sharpe', 'Sharpe'), valeur: normalizeMetric(realSharpe, 3), fullMark: 100 },
    { subject: t('riskMetrics.radar.drawdown', 'Drawdown'), valeur: 100 - normalizeMetric(realMaxDrawdown, 50), fullMark: 100 },
    { subject: t('riskMetrics.radar.timeInMarket', 'Time in Market'), valeur: realTimeInMarket, fullMark: 100 },
    { subject: t('riskMetrics.radar.sortino', 'Sortino'), valeur: normalizeMetric(realSortino, 3), fullMark: 100 },
    { subject: t('riskMetrics.radar.consistency', 'Consistency'), valeur: realProfitConsistency, fullMark: 100 },
  ];

  // ---- Overview: Downside risk metrics ----
  interface DownsideMetric {
    metric: string;
    value: number;
    unit: string;
    description: string;
    kind: 'drawdown-or-var' | 'other';
  }

  const downsideRiskMetrics: DownsideMetric[] = [
    {
      metric: t('riskMetrics.metrics.sharpeRatio', 'Sharpe Ratio'),
      value: realSharpe,
      unit: '',
      description: t('riskMetrics.metrics.sharpeRatioInfo', 'Measures risk-adjusted return. Compares your excess return (above risk-free rate) to its volatility. Above 1.0 is good, above 2.0 is excellent.'),
      kind: 'other',
    },
    {
      metric: t('riskMetrics.metrics.sortinoRatio', 'Sortino Ratio'),
      value: realSortino,
      unit: '',
      description: t('riskMetrics.metrics.sortinoRatioInfo', 'Like Sharpe but only penalizes downside volatility (losses). A higher Sortino means your losses are small relative to your gains.'),
      kind: 'other',
    },
    {
      metric: t('riskMetrics.metrics.maxDrawdown', 'Max Drawdown'),
      value: realMaxDrawdown,
      unit: '%',
      description: t('riskMetrics.metrics.maxDrawdownInfo', 'The largest peak-to-trough decline in your equity curve. Shows the worst loss you experienced from a high point before recovering.'),
      kind: 'drawdown-or-var',
    },
    {
      metric: t('riskMetrics.metrics.currentDrawdown', 'Current Drawdown'),
      value: realCurrentDrawdown,
      unit: '%',
      description: t('riskMetrics.metrics.currentDrawdownInfo', 'How far your current equity is below the all-time peak. 0% means you are at or above your previous high.'),
      kind: 'drawdown-or-var',
    },
    {
      metric: t('riskMetrics.metrics.recoveryFactor', 'Recovery Factor'),
      value: realRecoveryFactor,
      unit: '',
      description: t('riskMetrics.metrics.recoveryFactorInfo', 'Total profits divided by maximum drawdown. Shows how efficiently you recover from losses. Higher is better.'),
      kind: 'other',
    },
    {
      metric: t('riskMetrics.metrics.profitConsistency', 'Profit Consistency'),
      value: realProfitConsistency,
      unit: '/100',
      description: t('riskMetrics.metrics.profitConsistencyInfo', 'Score (0-100) measuring how consistently you profit each week. Combines win rate, stability of returns, and trend persistence.'),
      kind: 'other',
    },
  ];

  // ---- VaR tab: data from RiskDistribution ----
  const varCards = [
    {
      label: t('riskMetrics.var.var95', 'VaR 95%'),
      value: var95,
      description: t('riskMetrics.var.var95Info', 'Value at Risk at 95% confidence: the maximum loss expected in 95% of trading outcomes. In 1 out of 20 trades, you may lose more than this amount.'),
    },
    {
      label: t('riskMetrics.var.var99', 'VaR 99%'),
      value: var99,
      description: t('riskMetrics.var.var99Info', 'Value at Risk at 99% confidence: the maximum loss expected in 99% of trading outcomes. A more conservative estimate — only 1% of trades may exceed this loss.'),
    },
    {
      label: t('riskMetrics.var.cvar95', 'CVaR 95% (Expected Shortfall)'),
      value: cvar95,
      description: t('riskMetrics.var.cvar95Info', 'Conditional Value at Risk: the average loss in the worst 5% of trades. Unlike VaR, this tells you HOW BAD things get when they go wrong.'),
    },
  ];

  // ---- P&L Distribution histogram from backend ----
  const pnlDistribution = riskDist?.profitLossDistribution ?? {};
  const pnlDistData = Object.entries(pnlDistribution)
    .map(([range, count]) => ({ range, count }))
    .filter(d => d.count > 0);

  // ---- Stress test scenarios derived from actual trading data ----
  const totalTrades = perf?.totalTrades ?? 0;
  const largestLoss = Math.abs(perf?.largestLoss ?? 0);
  const avgLoss = Math.abs(perf?.averageLoss ?? 0);

  const stressScenarios = [
    {
      name: t('riskMetrics.stress.worstSingleTrade', 'Worst single trade'),
      impact: largestLoss,
      description: t('riskMetrics.stress.worstSingleTradeDesc', 'Your largest single-trade loss from actual trading history.'),
      info: t('riskMetrics.stress.worstSingleTradeInfo', 'This is the biggest loss you have experienced on a single closed trade. It represents your tail risk per position.'),
    },
    {
      name: t('riskMetrics.stress.maxDrawdown', 'Max drawdown'),
      impact: realMaxDrawdownAmount,
      description: t('riskMetrics.stress.maxDrawdownDesc', 'Peak-to-trough decline of {{pct}}% over {{duration}} trades.', {
        pct: realMaxDrawdown.toFixed(1),
        duration: dashboardSummary?.drawdownMetrics?.maxDrawdownDuration ?? 0,
      }),
      info: t('riskMetrics.stress.maxDrawdownInfo', 'Maximum cumulative loss from a peak before recovery. This is the worst sustained losing streak in your equity curve.'),
    },
    {
      name: t('riskMetrics.stress.avgLoss3x', '3x average loss scenario'),
      impact: avgLoss * 3,
      description: t('riskMetrics.stress.avgLoss3xDesc', 'Hypothetical: a single trade losing 3x your average loss.'),
      info: t('riskMetrics.stress.avgLoss3xInfo', 'A stress scenario assuming one trade loses 3 times your average losing trade amount. Tests resilience against an outsized loss.'),
    },
    {
      name: t('riskMetrics.stress.fiveLosses', '5 consecutive avg losses'),
      impact: avgLoss * 5,
      description: t('riskMetrics.stress.fiveLossesDesc', 'Hypothetical: five consecutive trades hitting your average loss.'),
      info: t('riskMetrics.stress.fiveLossesInfo', 'A streak scenario: 5 losing trades in a row at your average loss size. Tests if your account can survive a bad streak.'),
    },
    {
      name: t('riskMetrics.stress.tenPctDrawdown', '10% equity drawdown'),
      impact: currentEquity * 0.10,
      description: t('riskMetrics.stress.tenPctDrawdownDesc', '10% of current equity (${{amount}}).', { amount: currentEquity.toFixed(0) }),
      info: t('riskMetrics.stress.tenPctDrawdownInfo', 'A benchmark scenario showing what a 10% portfolio drawdown looks like in dollar terms given your current equity.'),
    },
  ].filter(s => s.impact > 0);

  // ---- Allocation: from performanceByAssetType (closed trades) ----
  const SECTOR_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--chart-6))', 'hsl(var(--chart-6))', 'hsl(var(--muted-foreground))'];
  const totalAssetPnL = Object.values(perfByAssetType).reduce((s, v) => s + Math.abs(v), 0);

  const allocationData = Object.entries(perfByAssetType).map(([name, pnl], idx) => ({
    name,
    pnl,
    share: totalAssetPnL > 0 ? Number(((Math.abs(pnl) / totalAssetPnL) * 100).toFixed(1)) : 0,
    color: SECTOR_COLORS[idx % SECTOR_COLORS.length],
  }));

  const NO_TRADES_LABEL = t('riskMetrics.allocation.noTrades', 'No trades');
  if (allocationData.length === 0 && !isLoading) {
    allocationData.push({ name: NO_TRADES_LABEL, pnl: 0, share: 100, color: 'hsl(var(--muted-foreground))' });
  }

  // ---- Margin utilization time series (real, from backend) ----
  const realMarginUtil = dashboardSummary?.marginUtilization ?? 0;
  const marginUtilization = (marginTimeSeries ?? []).map((p) => ({
    date: p.date,
    utilization: Number(p.utilizationPct) || 0,
    safe: 60,
    warning: 80,
  }));

  // ---- Holding period distribution (real, from backend) ----
  const holdingPeriods = (holdingDistribution ?? []).map((b) => ({
    period: b.label,
    count: b.tradeCount,
    avgPnl: Number(b.avgPnl) || 0,
  }));

  // ---- Kelly % per strategy (real, from backend) ----
  const kellyMetrics = (strategyKelly ?? []).map((k) => ({
    strategy: k.strategyName,
    kelly: Number(k.kellyPct) || 0,
    recommended: Number(k.halfKellyPct) || 0,
    aggressive: Number((k.kellyPct * 0.7).toFixed(2)) || 0,
    sampleSize: k.sampleSize,
  }));

  // ---- Correlations: from performanceByDirection (LONG vs SHORT) ----
  const longPnl = perfByDirection['LONG'] ?? 0;
  const shortPnl = perfByDirection['SHORT'] ?? 0;
  const longCount = perfByDirection['LONG_count'] ?? 0;
  const shortCount = perfByDirection['SHORT_count'] ?? 0;
  const longWinRate = perfByDirection['LONG_win_rate'] ?? 0;
  const shortWinRate = perfByDirection['SHORT_win_rate'] ?? 0;

  // ---- Error state ----
  if (hasError) {
    return (
      <Card className="glass-card rounded-2xl">
        <CardContent className="py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {t('riskMetrics.errorTitle', 'Unable to load risk metrics')}
          </h3>
          <p className="text-muted-foreground text-sm">
            {t('riskMetrics.errorDescription', 'There was an error loading your risk metrics. Please try again later.')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-1 mb-6">
          <TabsTrigger value="overview">{t('riskMetrics.tabs.overview', 'Overview')}</TabsTrigger>
          <TabsTrigger value="var">{t('riskMetrics.tabs.var', 'VaR')}</TabsTrigger>
          <TabsTrigger value="stress">{t('riskMetrics.tabs.stress', 'Stress Tests')}</TabsTrigger>
          <TabsTrigger value="direction">{t('riskMetrics.tabs.direction', 'Long vs Short')}</TabsTrigger>
          <TabsTrigger value="allocation">{t('riskMetrics.tabs.allocation', 'Allocation')}</TabsTrigger>
          <TabsTrigger value="margin">{t('riskMetrics.tabs.margin', 'Margin')}</TabsTrigger>
          <TabsTrigger value="holding">{t('riskMetrics.tabs.holding', 'Holding Period')}</TabsTrigger>
          <TabsTrigger value="kelly">{t('riskMetrics.tabs.kelly', 'Kelly %')}</TabsTrigger>
        </TabsList>

        {/* ============ OVERVIEW TAB ============ */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Radar chart */}
            <Card className="glass-card rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  {t('riskMetrics.overview.riskProfile', 'Risk Profile')}
                  <InfoBubble text={t('riskMetrics.overview.riskProfileInfo', 'A radar view of your key risk metrics normalized to a 0-100 scale. Higher values are generally better (except VaR where lower is better). Helps you see strengths and weaknesses at a glance.')} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <Skeleton className="h-64 w-64 rounded-full" />
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart outerRadius="75%" data={radarChartData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar name={t('riskMetrics.overview.portfolio', 'Portfolio')} dataKey="valeur" stroke='hsl(var(--chart-1))' fill='hsl(var(--chart-1))' fillOpacity={0.3} />
                        <Legend />
                        <RechartsTooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Downside risk metrics */}
            <Card className="glass-card rounded-2xl col-span-1 md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  {t('riskMetrics.overview.keyRiskMetrics', 'Key Risk Metrics')}
                  <InfoBubble text={t('riskMetrics.overview.keyRiskMetricsInfo', 'Core risk and performance ratios computed from your actual closed trades. These are the numbers professional traders and fund managers use to evaluate performance quality.')} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="space-y-1">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-1 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {downsideRiskMetrics.map((metric, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="label-caps">{metric.metric}</span>
                            <InfoBubble text={metric.description} />
                          </div>
                          <span className={`kpi-value text-lg tabular-nums ${
                            metric.kind === 'drawdown-or-var'
                              ? 'text-amber-400'
                              : metric.value >= 1
                                ? 'text-profit'
                                : 'text-muted-foreground'
                          }`}>
                            {metric.value.toFixed(2)}{metric.unit}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(Math.abs(metric.value) * (metric.unit === '%' ? 2 : 20), 100)}
                          className="h-1.5"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick stats cards */}
            <Card className="glass-card rounded-2xl md:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  {t('riskMetrics.overview.riskSummary', 'Risk Summary')}
                  <InfoBubble text={t('riskMetrics.overview.riskSummaryInfo', 'Quick snapshot of your risk distribution metrics from closed trade history. Standard deviation measures overall volatility, downside deviation only measures negative volatility.')} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-accent/10 rounded-xl border border-border/40">
                    <div className="label-caps flex items-center justify-center mb-1">
                      {t('riskMetrics.overview.stdDeviation', 'Std Deviation')}
                      <InfoBubble text={t('riskMetrics.overview.stdDeviationInfo', 'Standard deviation of your trade returns. Measures overall volatility of your trading results. Lower means more predictable outcomes.')} />
                    </div>
                    <div className="kpi-value text-xl tabular-nums text-amber-400">{(stdDev * 100).toFixed(2)}%</div>
                  </div>
                  <div className="text-center p-3 bg-accent/10 rounded-xl border border-border/40">
                    <div className="label-caps flex items-center justify-center mb-1">
                      {t('riskMetrics.overview.downsideDev', 'Downside Dev')}
                      <InfoBubble text={t('riskMetrics.overview.downsideDevInfo', 'Downside deviation: volatility of only the negative returns. Used in Sortino ratio. Lower is better as it means smaller losses.')} />
                    </div>
                    <div className="kpi-value text-xl tabular-nums text-loss">{(downside * 100).toFixed(2)}%</div>
                  </div>
                  <div className="text-center p-3 bg-accent/10 rounded-xl border border-border/40">
                    <div className="label-caps flex items-center justify-center mb-1">
                      {t('riskMetrics.overview.timeInMarket', 'Time in Market')}
                      <InfoBubble text={t('riskMetrics.overview.timeInMarketInfo', 'Percentage of time you had open positions during the analysis period. Shows how actively you trade vs staying on the sidelines.')} />
                    </div>
                    <div className="kpi-value text-xl tabular-nums">{realTimeInMarket.toFixed(1)}%</div>
                  </div>
                  <div className="text-center p-3 bg-accent/10 rounded-xl border border-border/40">
                    <div className="label-caps flex items-center justify-center mb-1">
                      {t('riskMetrics.overview.diversityScore', 'Diversity Score')}
                      <InfoBubble text={t('riskMetrics.overview.diversityScoreInfo', 'Portfolio diversification score (0-100) based on the Herfindahl-Hirschman Index. Higher means your exposure is spread across more symbols. Low score means concentrated risk.')} />
                    </div>
                    <div className="kpi-value text-xl tabular-nums text-profit">{realDiversityScore.toFixed(0)}/100</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============ VAR TAB ============ */}
        <TabsContent value="var">
          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <Card key={i} className="glass-card rounded-2xl bg-accent/5">
                    <CardHeader className="pb-2"><Skeleton className="h-6 w-40" /></CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-4 w-32 mt-2" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                varCards.map((item, index) => (
                  <Card key={index} className="glass-card rounded-2xl bg-accent/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="label-caps flex items-center">
                        {item.label}
                        <InfoBubble text={item.description} />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="kpi-value text-3xl tabular-nums text-amber-400">
                        {item.value > 0 ? `$${item.value.toFixed(2)}` : '$0.00'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.value > 0
                          ? t('riskMetrics.var.percentOfEquity', '{{percent}}% of equity', {
                              percent: ((item.value / (currentEquity || 10000)) * 100).toFixed(2),
                            })
                          : t('riskMetrics.var.noClosedTrades', 'No closed trades in period')}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Card className="glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  {t('riskMetrics.var.pnlDistribution', 'P&L Distribution')}
                  <InfoBubble text={t('riskMetrics.var.pnlDistributionInfo', 'Histogram showing how your trade P&L values are distributed across ranges. A bell-shaped curve centered above zero indicates consistent profitability. Heavy left tail means occasional large losses.')} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pnlDistData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={pnlDistData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 10 }} />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill='hsl(var(--chart-1))' name={t('riskMetrics.var.tradesCount', 'Number of trades')} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-muted-foreground">
                    {t('riskMetrics.var.noDistribution', 'No P&L distribution data for this period')}
                  </div>
                )}
                <div className="mt-4 text-sm text-muted-foreground">
                  {t('riskMetrics.var.varFootnote', 'Value at Risk (VaR) represents the maximum potential loss at a given confidence level over a defined period. A lower VaR relative to your equity indicates better risk management.')}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============ STRESS TESTS TAB ============ */}
        <TabsContent value="stress">
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                {t('riskMetrics.stress.title', 'Stress Test Scenarios')}
                <InfoBubble text={t('riskMetrics.stress.info', 'These scenarios are derived from YOUR actual trading data, not generic market events. They show what has happened and what could happen based on your real P&L patterns. Use them to check if your position sizing can survive worst-case outcomes.')} />
              </CardTitle>
              <CardDescription>
                {t('riskMetrics.stress.description', 'Impact analysis based on your actual trading history and hypothetical stress scenarios')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {totalTrades === 0 && !isLoading ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground">
                  {t('riskMetrics.stress.noData', 'No trade data available for stress analysis')}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {stressScenarios.map((scenario, index) => {
                      const severity = scenario.impact >= currentEquity * 0.1
                        ? 'critical'
                        : scenario.impact >= currentEquity * 0.05
                          ? 'warning'
                          : 'caution';
                      const severityLabel =
                        severity === 'critical'
                          ? t('riskMetrics.stress.severityCritical', 'Critical')
                          : severity === 'warning'
                            ? t('riskMetrics.stress.severityWarning', 'Warning')
                            : t('riskMetrics.stress.severityCaution', 'Caution');
                      const severityClass =
                        severity === 'critical'
                          ? 'bg-destructive/15 text-destructive border-destructive/30'
                          : severity === 'warning'
                            ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                            : 'bg-muted text-muted-foreground border-border';
                      return (
                        <Card key={index} className="mb-4">
                          <CardHeader className="py-3 px-4">
                            <div className="flex justify-between items-center gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Badge
                                  variant="outline"
                                  className={`${severityClass} text-[10px] uppercase tracking-wide font-semibold shrink-0`}
                                >
                                  {severityLabel}
                                </Badge>
                                <CardTitle className="text-base flex items-center truncate">
                                  {scenario.name}
                                  <InfoBubble text={scenario.info} />
                                </CardTitle>
                              </div>
                              <div className="text-red-500 font-bold">
                                -${scenario.impact.toFixed(2)}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="py-2 px-4">
                            <div className="flex justify-between text-sm">
                              <div>{scenario.description}</div>
                              <div className="text-muted-foreground ml-2 shrink-0">
                                {currentEquity > 0
                                  ? t('riskMetrics.stress.equityShare', '{{pct}}% of equity', {
                                      pct: ((scenario.impact / currentEquity) * 100).toFixed(1),
                                    })
                                  : ''}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={stressScenarios.map(s => ({ ...s, impact: -s.impact }))}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={['dataMin', 0]} />
                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                        <RechartsTooltip formatter={(value: number) => [`$${Math.abs(value).toFixed(2)}`, t('riskMetrics.stress.impactLabel', 'Impact')]} />
                        <Bar dataKey="impact" fill='hsl(var(--chart-5))' name={t('riskMetrics.stress.impactLabel', 'Impact')} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ LONG VS SHORT TAB ============ */}
        <TabsContent value="direction">
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                {t('riskMetrics.direction.title', 'Long vs Short Performance')}
                <InfoBubble text={t('riskMetrics.direction.info', 'Compares your performance on long (buy) trades vs short (sell) trades. Helps identify if you have a directional bias or if one direction is significantly more profitable than the other.')} />
              </CardTitle>
              <CardDescription>
                {t('riskMetrics.direction.description', 'Breakdown of your trading performance by direction')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {longCount === 0 && shortCount === 0 && !isLoading ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground">
                  {t('riskMetrics.direction.noData', 'No directional trade data for this period')}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-primary/30 dark:border-primary/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center text-primary">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        {t('riskMetrics.direction.long', 'Long Trades')}
                        <InfoBubble text={t('riskMetrics.direction.longInfo', 'Trades where you bought first expecting the price to go up. Shows total P&L, number of trades, and win rate for all your long positions.')} />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('riskMetrics.direction.totalPnl', 'Total P&L')}</span>
                        <span className={`font-bold ${longPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          ${longPnl.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('riskMetrics.direction.tradeCount', 'Trade Count')}</span>
                        <span className="font-bold">{longCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('riskMetrics.direction.winRate', 'Win Rate')}</span>
                        <span className="font-bold">{longWinRate.toFixed(1)}%</span>
                      </div>
                      {longCount > 0 && (
                        <Progress value={longWinRate} className="h-2" />
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-destructive/30 dark:border-destructive/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center text-destructive">
                        <TrendingDown className="h-5 w-5 mr-2" />
                        {t('riskMetrics.direction.short', 'Short Trades')}
                        <InfoBubble text={t('riskMetrics.direction.shortInfo', 'Trades where you sold first expecting the price to go down. Shows total P&L, number of trades, and win rate for all your short positions.')} />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('riskMetrics.direction.totalPnl', 'Total P&L')}</span>
                        <span className={`font-bold ${shortPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          ${shortPnl.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('riskMetrics.direction.tradeCount', 'Trade Count')}</span>
                        <span className="font-bold">{shortCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('riskMetrics.direction.winRate', 'Win Rate')}</span>
                        <span className="font-bold">{shortWinRate.toFixed(1)}%</span>
                      </div>
                      {shortCount > 0 && (
                        <Progress value={shortWinRate} className="h-2" />
                      )}
                    </CardContent>
                  </Card>

                  {(longCount > 0 || shortCount > 0) && (
                    <Card className="md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                          {t('riskMetrics.direction.comparison', 'P&L Comparison')}
                          <InfoBubble text={t('riskMetrics.direction.comparisonInfo', 'Visual comparison of P&L and trade counts between your long and short trades. Helps identify which direction contributes more to your profitability.')} />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={[
                              { name: t('riskMetrics.direction.chartPnl', 'P&L ($)'), Long: longPnl, Short: shortPnl },
                              { name: t('riskMetrics.direction.chartTrades', 'Trades'), Long: longCount, Short: shortCount },
                              { name: t('riskMetrics.direction.chartWinRate', 'Win Rate (%)'), Long: longWinRate, Short: shortWinRate },
                            ]}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <RechartsTooltip />
                              <Legend />
                              <Bar dataKey="Long" fill='hsl(var(--chart-1))' name={t('riskMetrics.direction.long', 'Long')} />
                              <Bar dataKey="Short" fill='hsl(var(--chart-5))' name={t('riskMetrics.direction.short', 'Short')} />
                            </RechartsBarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ ALLOCATION TAB ============ */}
        <TabsContent value="allocation">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  {t('riskMetrics.allocation.assetAllocation', 'Asset Type Allocation')}
                  <InfoBubble text={t('riskMetrics.allocation.assetAllocationInfo', 'Shows the distribution of your trading activity across different asset types (Forex, Stocks, Crypto, etc.) based on P&L contribution. Larger slices mean more P&L impact from that asset class.')} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <Skeleton className="h-48 w-48 rounded-full" />
                  </div>
                ) : allocationData[0]?.name === NO_TRADES_LABEL ? (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    {t('riskMetrics.allocation.noData', 'No asset type data for this period')}
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={allocationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="share"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {allocationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  {t('riskMetrics.allocation.pnlByAsset', 'P&L by Asset Type')}
                  <InfoBubble text={t('riskMetrics.allocation.pnlByAssetInfo', 'Detailed breakdown showing the profit or loss contribution of each asset type. Green means profitable, red means losing. The percentage shows relative weight in your total trading activity.')} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i}>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                ) : allocationData[0]?.name === NO_TRADES_LABEL ? (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    {t('riskMetrics.allocation.noData', 'No asset type data for this period')}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {allocationData.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="flex items-center gap-2" style={{ color: item.color }}>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            {item.name}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className={`font-bold ${item.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              ${item.pnl.toFixed(2)}
                            </span>
                            <span className="text-muted-foreground">{item.share}%</span>
                          </div>
                        </div>
                        <Progress value={item.share} className="h-2" />
                      </div>
                    ))}

                    <div className="pt-4 border-t border-border mt-4">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium flex items-center">
                          {t('riskMetrics.allocation.diversificationScore', 'Diversification Score')}
                          <InfoBubble text={t('riskMetrics.allocation.diversificationScoreInfo', 'Herfindahl-Hirschman based score (0-100). Higher means better diversification across symbols. A score below 40 means concentrated risk in few positions.')} />
                        </span>
                        <span className={`font-bold ${realDiversityScore >= 70 ? 'text-green-500' : realDiversityScore >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                          {realDiversityScore.toFixed(0)}/100
                        </span>
                      </div>
                      <Progress value={realDiversityScore} className="h-2 bg-amber-200 dark:bg-amber-900" />
                      <div className="text-xs text-muted-foreground mt-1">
                        {realDiversityScore < 40
                          ? t('riskMetrics.allocation.diversificationLow', 'Low diversification. Consider trading more asset types to reduce concentrated risk.')
                          : realDiversityScore < 70
                            ? t('riskMetrics.allocation.diversificationMedium', 'Moderate diversification. Adding exposure to non-correlated assets would improve risk.')
                            : t('riskMetrics.allocation.diversificationHigh', 'Good portfolio diversification.')
                        }
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============ MARGIN TAB ============ */}
        <TabsContent value="margin">
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                {t('riskMetrics.margin.title', 'Margin Utilization')}
                <InfoBubble text={t('riskMetrics.margin.info', 'Tracks how much of your available margin is being used. Staying below 60% is considered safe. Exceeding 80% increases the risk of margin calls.')} />
              </CardTitle>
              {!isLoading && (
                <CardDescription>
                  {t('riskMetrics.margin.current', 'Current: {{pct}}%', { pct: realMarginUtil.toFixed(1) })}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={marginUtilization}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="utilization" name={t('riskMetrics.margin.marginPct', 'Margin %')} stroke='hsl(var(--chart-1))' strokeWidth={2} />
                  <Line type="monotone" dataKey="safe" name={t('riskMetrics.margin.safeLevel', 'Safe level')} stroke='hsl(var(--chart-3))' strokeWidth={1} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="warning" name={t('riskMetrics.margin.warningLevel', 'Warning level')} stroke='hsl(var(--chart-4))' strokeWidth={1} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ HOLDING PERIOD TAB ============ */}
        <TabsContent value="holding">
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                {t('riskMetrics.holding.title', 'Holding Period Analysis')}
                <InfoBubble text={t('riskMetrics.holding.info', 'Analyzes how trade duration affects your performance. Helps identify your optimal holding time — whether you perform better on scalps, intraday, or swing trades.')} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {holdingPeriods.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground">
                  {t('riskMetrics.holding.noData', 'No closed trades in this range.')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={holdingPeriods}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="count" name={t('riskMetrics.holding.trades', 'Trades')} stroke='hsl(var(--chart-1))' />
                    <Line yAxisId="right" type="monotone" dataKey="avgPnl" name={t('riskMetrics.holding.avgPnl', 'Avg P&L ($)')} stroke='hsl(var(--chart-3))' />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ KELLY % TAB ============ */}
        <TabsContent value="kelly">
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                {t('riskMetrics.kelly.title', 'Kelly Criterion per Strategy')}
                <InfoBubble text={t('riskMetrics.kelly.info', "Kelly formula computes optimal position sizing from each strategy's historical win rate and avg win/loss. 'Recommended' is half-Kelly (the conservative practitioner's cut). 'Aggressive' is 0.7 × Kelly. Never bet full Kelly in practice.")} />
              </CardTitle>
              <CardDescription>
                {t('riskMetrics.kelly.description', 'Based on your closed trades — strategies with fewer trades have less reliable Kelly estimates.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {kellyMetrics.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                  {t('riskMetrics.kelly.noData', 'No closed trades tagged with a strategy in this range.')}
                </div>
              ) : (
                <div className="space-y-6">
                  {kellyMetrics.map((item) => {
                    const insufficient = item.sampleSize < 20;
                    return (
                      <div key={item.strategy}>
                        <div className="flex justify-between items-center text-sm mb-1 gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium truncate">{item.strategy}</span>
                            {insufficient && (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
                                {t('riskMetrics.kelly.sampleSize', '{{count}} trades', { count: item.sampleSize })}
                              </Badge>
                            )}
                          </div>
                          <span className="text-muted-foreground tabular-nums shrink-0">
                            {t('riskMetrics.kelly.kellyLabel', 'Kelly')} <span className="font-medium text-foreground">{item.kelly.toFixed(1)}%</span>
                            {' · '}
                            {t('riskMetrics.kelly.halfLabel', 'Half')} <span className="font-medium text-foreground">{item.recommended.toFixed(1)}%</span>
                          </span>
                        </div>
                        <div className="relative pt-1">
                          <div className="overflow-hidden h-2 text-xs flex rounded bg-muted">
                            <div
                              style={{ width: `${Math.max(0, item.recommended)}%` }}
                              className="bg-emerald-500 h-full"
                              title={t('riskMetrics.kelly.halfKellyTitle', 'Half-Kelly (recommended)')}
                            />
                            <div
                              style={{ width: `${Math.max(0, item.aggressive - item.recommended)}%` }}
                              className="bg-amber-500 h-full"
                              title={t('riskMetrics.kelly.aggressiveTitle', '0.7 × Kelly (aggressive)')}
                            />
                            <div
                              style={{ width: `${Math.max(0, item.kelly - item.aggressive)}%` }}
                              className="bg-destructive h-full"
                              title={t('riskMetrics.kelly.fullKellyTitle', 'Full Kelly (do not use in practice)')}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RiskMetricsBoard;
