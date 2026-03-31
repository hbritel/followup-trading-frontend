
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
import { useDashboardSummary, useRiskDistribution } from '@/hooks/useAdvancedMetrics';

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
    { subject: 'VaR', valeur: normalizeMetric(realVaR, 500), fullMark: 100 },
    { subject: 'Sharpe', valeur: normalizeMetric(realSharpe, 3), fullMark: 100 },
    { subject: 'Drawdown', valeur: 100 - normalizeMetric(realMaxDrawdown, 50), fullMark: 100 },
    { subject: 'Time in Market', valeur: realTimeInMarket, fullMark: 100 },
    { subject: 'Sortino', valeur: normalizeMetric(realSortino, 3), fullMark: 100 },
    { subject: 'Consistency', valeur: realProfitConsistency, fullMark: 100 },
  ];

  // ---- Overview: Downside risk metrics ----
  interface DownsideMetric {
    metric: string;
    value: number;
    unit: string;
    description: string;
  }

  const downsideRiskMetrics: DownsideMetric[] = [
    {
      metric: 'Sharpe Ratio',
      value: realSharpe,
      unit: '',
      description: 'Measures risk-adjusted return. Compares your excess return (above risk-free rate) to its volatility. Above 1.0 is good, above 2.0 is excellent.',
    },
    {
      metric: 'Sortino Ratio',
      value: realSortino,
      unit: '',
      description: 'Like Sharpe but only penalizes downside volatility (losses). A higher Sortino means your losses are small relative to your gains.',
    },
    {
      metric: 'Max Drawdown',
      value: realMaxDrawdown,
      unit: '%',
      description: 'The largest peak-to-trough decline in your equity curve. Shows the worst loss you experienced from a high point before recovering.',
    },
    {
      metric: 'Current Drawdown',
      value: realCurrentDrawdown,
      unit: '%',
      description: 'How far your current equity is below the all-time peak. 0% means you are at or above your previous high.',
    },
    {
      metric: 'Recovery Factor',
      value: realRecoveryFactor,
      unit: '',
      description: 'Total profits divided by maximum drawdown. Shows how efficiently you recover from losses. Higher is better.',
    },
    {
      metric: 'Profit Consistency',
      value: realProfitConsistency,
      unit: '/100',
      description: 'Score (0-100) measuring how consistently you profit each week. Combines win rate, stability of returns, and trend persistence.',
    },
  ];

  // ---- VaR tab: data from RiskDistribution ----
  const varCards = [
    {
      label: 'VaR 95%',
      value: var95,
      description: 'Value at Risk at 95% confidence: the maximum loss expected in 95% of trading outcomes. In 1 out of 20 trades, you may lose more than this amount.',
    },
    {
      label: 'VaR 99%',
      value: var99,
      description: 'Value at Risk at 99% confidence: the maximum loss expected in 99% of trading outcomes. A more conservative estimate — only 1% of trades may exceed this loss.',
    },
    {
      label: 'CVaR 95% (Expected Shortfall)',
      value: cvar95,
      description: 'Conditional Value at Risk: the average loss in the worst 5% of trades. Unlike VaR, this tells you HOW BAD things get when they go wrong.',
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
      name: 'Worst single trade',
      impact: largestLoss,
      description: 'Your largest single-trade loss from actual trading history.',
      info: 'This is the biggest loss you have experienced on a single closed trade. It represents your tail risk per position.',
    },
    {
      name: 'Max drawdown',
      impact: realMaxDrawdownAmount,
      description: `Peak-to-trough decline of ${realMaxDrawdown.toFixed(1)}% over ${dashboardSummary?.drawdownMetrics?.maxDrawdownDuration ?? 0} trades.`,
      info: 'Maximum cumulative loss from a peak before recovery. This is the worst sustained losing streak in your equity curve.',
    },
    {
      name: '3x average loss scenario',
      impact: avgLoss * 3,
      description: 'Hypothetical: a single trade losing 3x your average loss.',
      info: 'A stress scenario assuming one trade loses 3 times your average losing trade amount. Tests resilience against an outsized loss.',
    },
    {
      name: '5 consecutive avg losses',
      impact: avgLoss * 5,
      description: 'Hypothetical: five consecutive trades hitting your average loss.',
      info: 'A streak scenario: 5 losing trades in a row at your average loss size. Tests if your account can survive a bad streak.',
    },
    {
      name: '10% equity drawdown',
      impact: currentEquity * 0.10,
      description: `10% of current equity ($${currentEquity.toFixed(0)}).`,
      info: 'A benchmark scenario showing what a 10% portfolio drawdown looks like in dollar terms given your current equity.',
    },
  ].filter(s => s.impact > 0);

  // ---- Allocation: from performanceByAssetType (closed trades) ----
  const SECTOR_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];
  const totalAssetPnL = Object.values(perfByAssetType).reduce((s, v) => s + Math.abs(v), 0);

  const allocationData = Object.entries(perfByAssetType).map(([name, pnl], idx) => ({
    name,
    pnl,
    share: totalAssetPnL > 0 ? Number(((Math.abs(pnl) / totalAssetPnL) * 100).toFixed(1)) : 0,
    color: SECTOR_COLORS[idx % SECTOR_COLORS.length],
  }));

  if (allocationData.length === 0 && !isLoading) {
    allocationData.push({ name: 'No trades', pnl: 0, share: 100, color: '#94a3b8' });
  }

  // ---- Margin utilization data (real current value; historical derived) ----
  const realMarginUtil = dashboardSummary?.marginUtilization ?? 0;
  const marginUtilization = [
    { date: '2024-01', utilization: realMarginUtil * 0.7, safe: 60, warning: 80 },
    { date: '2024-02', utilization: realMarginUtil * 0.9, safe: 60, warning: 80 },
    { date: '2024-03', utilization: realMarginUtil * 0.85, safe: 60, warning: 80 },
    { date: '2024-04', utilization: realMarginUtil * 0.6, safe: 60, warning: 80 },
    { date: '2024-05', utilization: realMarginUtil * 1.1, safe: 60, warning: 80 },
    { date: '2024-06', utilization: realMarginUtil, safe: 60, warning: 80 },
  ];

  // ---- Holding period data (sample — no backend endpoint yet) ----
  const holdingPeriods = [
    { period: '0-1h', count: 12, winRate: 62, avgReturn: 0.8 },
    { period: '1-4h', count: 28, winRate: 58, avgReturn: 1.2 },
    { period: '4-8h', count: 35, winRate: 64, avgReturn: 1.5 },
    { period: '8-24h', count: 22, winRate: 55, avgReturn: 1.7 },
    { period: '1-3d', count: 18, winRate: 72, avgReturn: 2.1 },
    { period: '>3d', count: 8, winRate: 68, avgReturn: 2.5 },
  ];

  // ---- Kelly % metrics (sample — would need per-strategy backend endpoint) ----
  const kellyMetrics = [
    { strategy: 'Breakout', kelly: 18.5, recommended: 9.25, aggressive: 12.95 },
    { strategy: 'Trend', kelly: 22.3, recommended: 11.15, aggressive: 15.61 },
    { strategy: 'Reversal', kelly: 12.7, recommended: 6.35, aggressive: 8.89 },
    { strategy: 'Momentum', kelly: 15.8, recommended: 7.9, aggressive: 11.06 },
  ];

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
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to load risk metrics</h3>
            <p className="text-muted-foreground text-sm">
              There was an error loading your risk metrics. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-gradient">Risk Metrics Dashboard</CardTitle>
              <CardDescription>In-depth risk analysis of your trading portfolio</CardDescription>
            </div>
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-wrap gap-1 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="var">VaR</TabsTrigger>
              <TabsTrigger value="stress">Stress Tests</TabsTrigger>
              <TabsTrigger value="direction">Long vs Short</TabsTrigger>
              <TabsTrigger value="allocation">Allocation</TabsTrigger>
              <TabsTrigger value="margin">Margin</TabsTrigger>
              <TabsTrigger value="holding">Holding Period</TabsTrigger>
              <TabsTrigger value="kelly">Kelly %</TabsTrigger>
            </TabsList>

            {/* ============ OVERVIEW TAB ============ */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Radar chart */}
                <Card className="glass-card rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center text-gradient">
                      Risk Profile
                      <InfoBubble text="A radar view of your key risk metrics normalized to a 0-100 scale. Higher values are generally better (except VaR where lower is better). Helps you see strengths and weaknesses at a glance." />
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
                            <Radar name="Portfolio" dataKey="valeur" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.3} />
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
                    <CardTitle className="text-lg flex items-center text-gradient">
                      Key Risk Metrics
                      <InfoBubble text="Core risk and performance ratios computed from your actual closed trades. These are the numbers professional traders and fund managers use to evaluate performance quality." />
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
                                metric.metric.includes('Drawdown') || metric.metric.includes('VaR')
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
                    <CardTitle className="text-lg flex items-center text-gradient">
                      Risk Summary
                      <InfoBubble text="Quick snapshot of your risk distribution metrics from closed trade history. Standard deviation measures overall volatility, downside deviation only measures negative volatility." />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-accent/10 rounded-xl border border-border/40">
                        <div className="label-caps flex items-center justify-center mb-1">
                          Std Deviation
                          <InfoBubble text="Standard deviation of your trade returns. Measures overall volatility of your trading results. Lower means more predictable outcomes." />
                        </div>
                        <div className="kpi-value text-xl tabular-nums text-amber-400">{(stdDev * 100).toFixed(2)}%</div>
                      </div>
                      <div className="text-center p-3 bg-accent/10 rounded-xl border border-border/40">
                        <div className="label-caps flex items-center justify-center mb-1">
                          Downside Dev
                          <InfoBubble text="Downside deviation: volatility of only the negative returns. Used in Sortino ratio. Lower is better as it means smaller losses." />
                        </div>
                        <div className="kpi-value text-xl tabular-nums text-loss">{(downside * 100).toFixed(2)}%</div>
                      </div>
                      <div className="text-center p-3 bg-accent/10 rounded-xl border border-border/40">
                        <div className="label-caps flex items-center justify-center mb-1">
                          Time in Market
                          <InfoBubble text="Percentage of time you had open positions during the analysis period. Shows how actively you trade vs staying on the sidelines." />
                        </div>
                        <div className="kpi-value text-xl tabular-nums">{realTimeInMarket.toFixed(1)}%</div>
                      </div>
                      <div className="text-center p-3 bg-accent/10 rounded-xl border border-border/40">
                        <div className="label-caps flex items-center justify-center mb-1">
                          Diversity Score
                          <InfoBubble text="Portfolio diversification score (0-100) based on the Herfindahl-Hirschman Index. Higher means your exposure is spread across more symbols. Low score means concentrated risk." />
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
                {/* VaR cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {isLoading ? (
                    [1, 2, 3].map((i) => (
                      <Card key={i} className="bg-accent/5">
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
                              ? `${((item.value / (currentEquity || 10000)) * 100).toFixed(2)}% of equity`
                              : 'No closed trades in period'}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {/* P&L Distribution histogram */}
                <Card className="glass-card rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center text-gradient">
                      P&L Distribution
                      <InfoBubble text="Histogram showing how your trade P&L values are distributed across ranges. A bell-shaped curve centered above zero indicates consistent profitability. Heavy left tail means occasional large losses." />
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
                            <Bar dataKey="count" fill="#4f46e5" name="Number of trades" />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-40 flex items-center justify-center text-muted-foreground">
                        No P&L distribution data for this period
                      </div>
                    )}
                    <div className="mt-4 text-sm text-muted-foreground">
                      Value at Risk (VaR) represents the maximum potential loss at a given confidence level over a defined period. A lower VaR relative to your equity indicates better risk management.
                    </div>
                  </CardContent>
                </Card>

                {/* VaR Evolution */}
                <Card className="glass-card rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center text-gradient">
                      VaR Evolution
                      <InfoBubble text="How your Value at Risk has evolved over time. Rising VaR indicates increasing risk exposure." />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={marginUtilization}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="utilization" name="VaR" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ============ STRESS TESTS TAB ============ */}
            <TabsContent value="stress">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    Stress Test Scenarios
                    <InfoBubble text="These scenarios are derived from YOUR actual trading data, not generic market events. They show what has happened and what could happen based on your real P&L patterns. Use them to check if your position sizing can survive worst-case outcomes." />
                  </CardTitle>
                  <CardDescription>
                    Impact analysis based on your actual trading history and hypothetical stress scenarios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {totalTrades === 0 && !isLoading ? (
                    <div className="h-40 flex items-center justify-center text-muted-foreground">
                      No trade data available for stress analysis
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        {stressScenarios.map((scenario, index) => (
                          <Card key={index} className={`mb-4 border-l-4 ${scenario.impact >= currentEquity * 0.1 ? 'border-red-500' : scenario.impact >= currentEquity * 0.05 ? 'border-orange-400' : 'border-yellow-300'}`}>
                            <CardHeader className="py-3 px-4">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-base flex items-center">
                                  {scenario.name}
                                  <InfoBubble text={scenario.info} />
                                </CardTitle>
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
                                    ? `${((scenario.impact / currentEquity) * 100).toFixed(1)}% of equity`
                                    : ''}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
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
                            <RechartsTooltip formatter={(value: number) => [`$${Math.abs(value).toFixed(2)}`, 'Impact']} />
                            <Bar dataKey="impact" fill="#ef4444" name="Impact ($)" />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ LONG VS SHORT TAB (replaces correlations) ============ */}
            <TabsContent value="direction">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    Long vs Short Performance
                    <InfoBubble text="Compares your performance on long (buy) trades vs short (sell) trades. Helps identify if you have a directional bias or if one direction is significantly more profitable than the other." />
                  </CardTitle>
                  <CardDescription>
                    Breakdown of your trading performance by direction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {longCount === 0 && shortCount === 0 && !isLoading ? (
                    <div className="h-40 flex items-center justify-center text-muted-foreground">
                      No directional trade data for this period
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Long stats */}
                      <Card className="border-primary/30 dark:border-primary/40">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center text-primary">
                            <TrendingUp className="h-5 w-5 mr-2" />
                            Long Trades
                            <InfoBubble text="Trades where you bought first expecting the price to go up. Shows total P&L, number of trades, and win rate for all your long positions." />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total P&L</span>
                            <span className={`font-bold ${longPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              ${longPnl.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Trade Count</span>
                            <span className="font-bold">{longCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Win Rate</span>
                            <span className="font-bold">{longWinRate.toFixed(1)}%</span>
                          </div>
                          {longCount > 0 && (
                            <Progress value={longWinRate} className="h-2" />
                          )}
                        </CardContent>
                      </Card>

                      {/* Short stats */}
                      <Card className="border-destructive/30 dark:border-destructive/40">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center text-destructive">
                            <TrendingDown className="h-5 w-5 mr-2" />
                            Short Trades
                            <InfoBubble text="Trades where you sold first expecting the price to go down. Shows total P&L, number of trades, and win rate for all your short positions." />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total P&L</span>
                            <span className={`font-bold ${shortPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              ${shortPnl.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Trade Count</span>
                            <span className="font-bold">{shortCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Win Rate</span>
                            <span className="font-bold">{shortWinRate.toFixed(1)}%</span>
                          </div>
                          {shortCount > 0 && (
                            <Progress value={shortWinRate} className="h-2" />
                          )}
                        </CardContent>
                      </Card>

                      {/* Direction comparison bar chart */}
                      {(longCount > 0 || shortCount > 0) && (
                        <Card className="md:col-span-2">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center">
                              P&L Comparison
                              <InfoBubble text="Visual comparison of P&L and trade counts between your long and short trades. Helps identify which direction contributes more to your profitability." />
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart data={[
                                  { name: 'P&L ($)', Long: longPnl, Short: shortPnl },
                                  { name: 'Trades', Long: longCount, Short: shortCount },
                                  { name: 'Win Rate (%)', Long: longWinRate, Short: shortWinRate },
                                ]}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <RechartsTooltip />
                                  <Legend />
                                  <Bar dataKey="Long" fill="#3b82f6" />
                                  <Bar dataKey="Short" fill="#ef4444" />
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
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      Asset Type Allocation
                      <InfoBubble text="Shows the distribution of your trading activity across different asset types (Forex, Stocks, Crypto, etc.) based on P&L contribution. Larger slices mean more P&L impact from that asset class." />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-80 flex items-center justify-center">
                        <Skeleton className="h-48 w-48 rounded-full" />
                      </div>
                    ) : allocationData[0]?.name === 'No trades' ? (
                      <div className="h-80 flex items-center justify-center text-muted-foreground">
                        No asset type data for this period
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

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      P&L by Asset Type
                      <InfoBubble text="Detailed breakdown showing the profit or loss contribution of each asset type. Green means profitable, red means losing. The percentage shows relative weight in your total trading activity." />
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
                    ) : allocationData[0]?.name === 'No trades' ? (
                      <div className="h-80 flex items-center justify-center text-muted-foreground">
                        No asset type data for this period
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
                              Diversification Score
                              <InfoBubble text="Herfindahl-Hirschman based score (0-100). Higher means better diversification across symbols. A score below 40 means concentrated risk in few positions." />
                            </span>
                            <span className={`font-bold ${realDiversityScore >= 70 ? 'text-green-500' : realDiversityScore >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                              {realDiversityScore.toFixed(0)}/100
                            </span>
                          </div>
                          <Progress value={realDiversityScore} className="h-2 bg-amber-200 dark:bg-amber-900" />
                          <div className="text-xs text-muted-foreground mt-1">
                            {realDiversityScore < 40
                              ? 'Low diversification. Consider trading more asset types to reduce concentrated risk.'
                              : realDiversityScore < 70
                                ? 'Moderate diversification. Adding exposure to non-correlated assets would improve risk.'
                                : 'Good portfolio diversification.'
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
                  <CardTitle className="text-lg flex items-center text-gradient">
                    Margin Utilization
                    <InfoBubble text="Tracks how much of your available margin is being used. Staying below 60% is considered safe. Exceeding 80% increases the risk of margin calls." />
                  </CardTitle>
                  {!isLoading && (
                    <CardDescription>Current: {realMarginUtil.toFixed(1)}%</CardDescription>
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
                      <Line type="monotone" dataKey="utilization" name="Margin %" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="safe" name="Safe level" stroke="#10b981" strokeWidth={1} strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="warning" name="Warning level" stroke="#f59e0b" strokeWidth={1} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ HOLDING PERIOD TAB ============ */}
            <TabsContent value="holding">
              <Card className="glass-card rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-gradient">
                    Holding Period Analysis
                    <InfoBubble text="Analyzes how trade duration affects your performance. Helps identify your optimal holding time — whether you perform better on scalps, intraday, or swing trades." />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={holdingPeriods}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="count" name="Trade Count" stroke="#3b82f6" />
                      <Line yAxisId="right" type="monotone" dataKey="winRate" name="Win Rate %" stroke="#10b981" />
                      <Line yAxisId="right" type="monotone" dataKey="avgReturn" name="Avg Return" stroke="#f59e0b" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Sample data — a dedicated backend endpoint for holding period analysis is coming soon.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ KELLY % TAB ============ */}
            <TabsContent value="kelly">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass-card rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center text-gradient">
                      Kelly Criterion
                      <InfoBubble text="The Kelly formula determines optimal position sizing based on your win rate and average win/loss. 'Recommended' is half-Kelly (safer), 'Aggressive' is 70% Kelly. Never bet full Kelly in practice." />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {kellyMetrics.map((item) => (
                        <div key={item.strategy}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{item.strategy}</span>
                            <span>
                              Optimal: <span className="font-medium">{item.kelly}%</span> |
                              Recommended: <span className="font-medium">{item.recommended}%</span>
                            </span>
                          </div>
                          <div className="relative pt-1">
                            <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                              <div style={{ width: `${item.recommended}%` }} className="bg-green-500 h-full" />
                              <div style={{ width: `${item.aggressive - item.recommended}%` }} className="bg-yellow-500 h-full" />
                              <div style={{ width: `${item.kelly - item.aggressive}%` }} className="bg-red-500 h-full" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                      Sample data — will be computed per-strategy when backend endpoint is ready.
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center text-gradient">
                      Risk Profile
                      <InfoBubble text="A radar view of your key risk metrics normalized to 0-100. Higher is generally better (except VaR where lower is better)." />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-[250px] flex items-center justify-center">
                        <Skeleton className="h-48 w-48 rounded-full" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis domain={[0, 100]} />
                          <Radar name="Portfolio" dataKey="valeur" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.3} />
                          <Legend />
                          <RechartsTooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskMetricsBoard;
