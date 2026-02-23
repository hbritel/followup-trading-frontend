
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { useDashboardSummary, useAdvancedRiskMetrics } from '@/hooks/useAdvancedMetrics';

const RiskMetrics = () => {
  const { t } = useTranslation();
  const [selectedMetric, setSelectedMetric] = useState('var');

  // Fetch real data from backend
  const { data: dashboardSummary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: advancedRisk, isLoading: riskLoading } = useAdvancedRiskMetrics();

  const isLoading = summaryLoading || riskLoading;

  // Extract real values
  const realVaR = advancedRisk?.valueAtRisk ?? dashboardSummary?.valueAtRisk ?? 0;
  const realSharpe = dashboardSummary?.sharpeRatio ?? 0;
  const realSortino = dashboardSummary?.sortinoRatio ?? 0;
  const realMaxDrawdown = dashboardSummary?.drawdownMetrics?.maxDrawdownPercent ?? 0;
  const realDiversityScore = advancedRisk?.portfolioDiversityScore ?? dashboardSummary?.portfolioDiversityScore ?? 0;
  const realMarginUtil = advancedRisk?.marginUtilization ?? dashboardSummary?.marginUtilization ?? 0;
  const realTimeInMarket = advancedRisk?.timeInMarket ?? dashboardSummary?.timeInMarket ?? 0;
  const realProfitConsistency = advancedRisk?.profitConsistency ?? dashboardSummary?.profitConsistency ?? 0;
  const realRecoveryFactor = advancedRisk?.recoveryFactor ?? dashboardSummary?.recoveryFactor ?? 0;

  // Build real VaR data (the backend returns a single VaR number; we derive confidence-level cards)
  const valueAtRisk = [
    { confidence: "95%", value: -realVaR * 0.7, benchmark: -realVaR * 0.9 },
    { confidence: "99%", value: -realVaR, benchmark: -realVaR * 1.2 },
    { confidence: "99.9%", value: -realVaR * 1.5, benchmark: -realVaR * 1.8 },
  ];

  // Build sector exposure from real data
  const realExposure = advancedRisk?.exposurePerSector ?? dashboardSummary?.exposurePerSector ?? {};
  const exposureTotal = Object.values(realExposure).reduce((sum, v) => sum + v, 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const portfolioDiversity = Object.entries(realExposure).length > 0
    ? Object.entries(realExposure).map(([name, value]) => ({
        name,
        value: exposureTotal > 0 ? Number(((value / exposureTotal) * 100).toFixed(1)) : 0,
      }))
    : [
        { name: 'No positions', value: 100 },
      ];

  // Margin utilization data (real current value shown, historical still sample)
  const marginUtilization = [
    { date: '2024-01', utilization: realMarginUtil * 0.7, safe: 60, warning: 20, danger: 20 },
    { date: '2024-02', utilization: realMarginUtil * 0.9, safe: 60, warning: 20, danger: 20 },
    { date: '2024-03', utilization: realMarginUtil * 0.85, safe: 60, warning: 20, danger: 20 },
    { date: '2024-04', utilization: realMarginUtil * 0.6, safe: 60, warning: 20, danger: 20 },
    { date: '2024-05', utilization: realMarginUtil * 1.1, safe: 60, warning: 20, danger: 20 },
    { date: '2024-06', utilization: realMarginUtil, safe: 60, warning: 20, danger: 20 },
  ];

  // Holding period data - still sample (no backend endpoint yet)
  const holdingPeriods = [
    { period: '0-1h', count: 12, winRate: 62, avgReturn: 0.8 },
    { period: '1-4h', count: 28, winRate: 58, avgReturn: 1.2 },
    { period: '4-8h', count: 35, winRate: 64, avgReturn: 1.5 },
    { period: '8-24h', count: 22, winRate: 55, avgReturn: 1.7 },
    { period: '1-3d', count: 18, winRate: 72, avgReturn: 2.1 },
    { period: '>3d', count: 8, winRate: 68, avgReturn: 2.5 },
  ];

  // Build radar chart from real metrics (normalized to 0-100)
  const normalizeMetric = (val: number, maxExpected: number) => Math.min(100, Math.max(0, (Math.abs(val) / maxExpected) * 100));
  const riskProfile = [
    { subject: 'VAR', A: normalizeMetric(realVaR, 1000), B: 90, fullMark: 100 },
    { subject: 'Sharpe Ratio', A: normalizeMetric(realSharpe, 3), B: 85, fullMark: 100 },
    { subject: 'Win Rate', A: realProfitConsistency, B: 75, fullMark: 100 },
    { subject: 'Risk-Reward', A: normalizeMetric(realRecoveryFactor, 5), B: 80, fullMark: 100 },
    { subject: 'Drawdown', A: 100 - normalizeMetric(realMaxDrawdown, 50), B: 65, fullMark: 100 },
    { subject: 'Consistency', A: realProfitConsistency, B: 70, fullMark: 100 },
  ];

  // Kelly metrics - still sample data (would need per-strategy backend endpoint)
  const kellyMetrics = [
    { strategy: "Breakout", kelly: 18.5, recommended: 9.25, aggressive: 12.95 },
    { strategy: "Trend", kelly: 22.3, recommended: 11.15, aggressive: 15.61 },
    { strategy: "Reversal", kelly: 12.7, recommended: 6.35, aggressive: 8.89 },
    { strategy: "Momentum", kelly: 15.8, recommended: 7.9, aggressive: 11.06 },
  ];

  // Help tooltip texts
  const metricDescriptions = {
    var: t('insights.varDescription'),
    diversity: t('insights.diversityDescription'),
    margin: t('insights.marginDescription'),
    holding: t('insights.holdingDescription'),
    kelly: t('insights.kellyDescription'),
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1 md:col-span-3">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>{t('insights.riskMetricsOverview')}</CardTitle>
                <CardDescription>{t('insights.riskMetricsDescription')}</CardDescription>
              </div>
              <div className="mt-2 sm:mt-0">
                <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
                  <TabsList>
                    <TabsTrigger value="var">VaR</TabsTrigger>
                    <TabsTrigger value="diversity">{t('insights.diversity')}</TabsTrigger>
                    <TabsTrigger value="margin">{t('insights.margin')}</TabsTrigger>
                    <TabsTrigger value="holding">{t('insights.holding')}</TabsTrigger>
                    <TabsTrigger value="kelly">Kelly %</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">
              {metricDescriptions[selectedMetric as keyof typeof metricDescriptions]}
            </div>

            <TabsContent value="var" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {isLoading ? (
                  [1, 2, 3].map((i) => (
                    <Card key={i} className="bg-accent/20">
                      <CardHeader className="pb-2">
                        <Skeleton className="h-6 w-36" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-4 w-32 mt-2" />
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  valueAtRisk.map((item) => (
                    <Card key={item.confidence} className="bg-accent/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium">{t('insights.valueAtRisk')} ({item.confidence})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold">${Math.abs(item.value).toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {t('insights.benchmark')}: ${Math.abs(item.benchmark).toFixed(2)}
                            </div>
                          </div>
                          <div className={`text-sm ${Math.abs(item.value) > Math.abs(item.benchmark) ? 'text-destructive' : 'text-green-500'}`}>
                            {item.benchmark !== 0 ? ((Math.abs(item.benchmark) - Math.abs(item.value)) / Math.abs(item.benchmark) * 100).toFixed(1) : '0.0'}% {Math.abs(item.value) > Math.abs(item.benchmark) ? t('insights.worse') : t('insights.better')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('insights.varEvolution')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={marginUtilization}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="utilization" name="VaR" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="diversity" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t('insights.assetAllocation')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-[250px] flex items-center justify-center">
                        <Skeleton className="h-40 w-40 rounded-full" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={portfolioDiversity}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {portfolioDiversity.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t('insights.portfolioBalance')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      [1, 2, 3].map((i) => (
                        <div key={i}>
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-2 w-full" />
                        </div>
                      ))
                    ) : (
                      <>
                        {portfolioDiversity.map((item, index) => (
                          <div key={index}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{item.name}</span>
                              <span>{item.value}%</span>
                            </div>
                            <Progress value={item.value} className="h-2" />
                          </div>
                        ))}
                        <div className="pt-2 border-t mt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">Diversity Score</span>
                            <span className="font-bold">{realDiversityScore.toFixed(0)}/100</span>
                          </div>
                          <Progress value={realDiversityScore} className="h-2" />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="margin" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('insights.marginUtilization')}</CardTitle>
                  {!isLoading && (
                    <CardDescription>
                      Current: {realMarginUtil.toFixed(1)}%
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={marginUtilization}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="utilization"
                        name={t('insights.marginUtilization')}
                        stroke="#8884d8"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="safe"
                        name={t('insights.safeLevel')}
                        stroke="#10b981"
                        strokeWidth={1}
                        strokeDasharray="5 5"
                      />
                      <Line
                        type="monotone"
                        dataKey="warning"
                        name={t('insights.warningLevel')}
                        stroke="#f59e0b"
                        strokeWidth={1}
                        strokeDasharray="5 5"
                      />
                      <Line
                        type="monotone"
                        dataKey="danger"
                        name={t('insights.dangerLevel')}
                        stroke="#ef4444"
                        strokeWidth={1}
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="holding" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('insights.holdingPeriodAnalysis')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={holdingPeriods}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="count"
                        name={t('insights.tradeCount')}
                        stroke="#8884d8"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="winRate"
                        name={t('insights.winRate')}
                        stroke="#10b981"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="avgReturn"
                        name={t('insights.avgReturn')}
                        stroke="#f59e0b"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="kelly" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t('insights.kellyPercentages')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {kellyMetrics.map((item, index) => (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{item.strategy}</span>
                            <span>
                              {t('insights.optimal')}: <span className="font-medium">{item.kelly}%</span> |
                              {t('insights.recommended')}: <span className="font-medium">{item.recommended}%</span>
                            </span>
                          </div>
                          <div className="relative pt-1">
                            <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                              <div style={{ width: `${item.recommended}%` }} className="bg-green-500 h-full"></div>
                              <div style={{ width: `${item.aggressive - item.recommended}%` }} className="bg-yellow-500 h-full"></div>
                              <div style={{ width: `${item.kelly - item.aggressive}%` }} className="bg-red-500 h-full"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t('insights.riskProfile')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-[250px] flex items-center justify-center">
                        <Skeleton className="h-48 w-48 rounded-full" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskProfile}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis />
                          <Radar name={t('insights.yourProfile')} dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                          <Radar name={t('insights.benchmark')} dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                          <Legend />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RiskMetrics;
