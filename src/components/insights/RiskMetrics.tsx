
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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

const RiskMetrics = () => {
  const { t } = useTranslation();
  const [selectedMetric, setSelectedMetric] = useState('var');
  
  // Mock data for risk metrics
  const valueAtRisk = [
    { confidence: "95%", value: -2.3, benchmark: -3.1 },
    { confidence: "99%", value: -3.8, benchmark: -5.2 },
    { confidence: "99.9%", value: -5.4, benchmark: -7.6 },
  ];
  
  const portfolioDiversity = [
    { name: 'Stocks', value: 65 },
    { name: 'Crypto', value: 15 },
    { name: 'Forex', value: 12 },
    { name: 'Futures', value: 8 },
  ];
  
  const marginUtilization = [
    { date: '2023-01', utilization: 45, safe: 60, warning: 20, danger: 20 },
    { date: '2023-02', utilization: 62, safe: 60, warning: 20, danger: 20 },
    { date: '2023-03', utilization: 58, safe: 60, warning: 20, danger: 20 },
    { date: '2023-04', utilization: 43, safe: 60, warning: 20, danger: 20 },
    { date: '2023-05', utilization: 72, safe: 60, warning: 20, danger: 20 },
    { date: '2023-06', utilization: 52, safe: 60, warning: 20, danger: 20 },
  ];
  
  const holdingPeriods = [
    { period: '0-1h', count: 12, winRate: 62, avgReturn: 0.8 },
    { period: '1-4h', count: 28, winRate: 58, avgReturn: 1.2 },
    { period: '4-8h', count: 35, winRate: 64, avgReturn: 1.5 },
    { period: '8-24h', count: 22, winRate: 55, avgReturn: 1.7 },
    { period: '1-3d', count: 18, winRate: 72, avgReturn: 2.1 },
    { period: '>3d', count: 8, winRate: 68, avgReturn: 2.5 },
  ];
  
  const riskProfile = [
    { subject: 'VAR', A: 65, B: 90, fullMark: 100 },
    { subject: 'Sharpe Ratio', A: 78, B: 85, fullMark: 100 },
    { subject: 'Win Rate', A: 86, B: 75, fullMark: 100 },
    { subject: 'Risk-Reward', A: 72, B: 80, fullMark: 100 },
    { subject: 'Drawdown', A: 70, B: 65, fullMark: 100 },
    { subject: 'Consistency', A: 82, B: 70, fullMark: 100 },
  ];
  
  const kellyMetrics = [
    { strategy: "Breakout", kelly: 18.5, recommended: 9.25, aggressive: 12.95 },
    { strategy: "Trend", kelly: 22.3, recommended: 11.15, aggressive: 15.61 },
    { strategy: "Reversal", kelly: 12.7, recommended: 6.35, aggressive: 8.89 },
    { strategy: "Momentum", kelly: 15.8, recommended: 7.9, aggressive: 11.06 },
  ];
  
  // Colors for pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
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
                {valueAtRisk.map((item) => (
                  <Card key={item.confidence} className="bg-accent/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium">{t('insights.valueAtRisk')} ({item.confidence})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold">{item.value}%</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {t('insights.benchmark')}: {item.benchmark}%
                          </div>
                        </div>
                        <div className={`text-sm ${item.value > item.benchmark ? 'text-destructive' : 'text-green-500'}`}>
                          {((item.benchmark - item.value) / Math.abs(item.benchmark) * 100).toFixed(1)}% {item.value > item.benchmark ? t('insights.worse') : t('insights.better')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t('insights.portfolioBalance')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {portfolioDiversity.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.name}</span>
                          <span>{item.value}%</span>
                        </div>
                        <Progress value={item.value} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="margin" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('insights.marginUtilization')}</CardTitle>
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
