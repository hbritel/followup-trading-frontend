
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  LineChart, 
  ResponsiveContainer, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Scatter
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PerformanceMetrics = () => {
  const { t } = useTranslation();
  const [timeframe, setTimeframe] = useState('6m');
  
  // Mock data for metrics (enhanced)
  const monthlyPerformance = [
    { month: 'Jan', profit: 1200, loss: -500, trades: 24, winRate: 65, drawdown: -2.3, ror: 3.2, kelly: 12.4 },
    { month: 'Feb', profit: 0, loss: -800, trades: 18, winRate: 45, drawdown: -4.1, ror: -2.1, kelly: -5.3 },
    { month: 'Mar', profit: 2300, loss: -420, trades: 32, winRate: 72, drawdown: -1.8, ror: 4.5, kelly: 18.2 },
    { month: 'Apr', profit: 1500, loss: -380, trades: 28, winRate: 68, drawdown: -2.5, ror: 3.1, kelly: 14.6 },
    { month: 'May', profit: 0, loss: -400, trades: 16, winRate: 42, drawdown: -3.2, ror: -1.1, kelly: -2.8 },
    { month: 'Jun', profit: 3200, loss: -650, trades: 35, winRate: 74, drawdown: -2.1, ror: 4.9, kelly: 22.1 },
  ];
  
  const strategyPerformance = [
    { name: 'Breakout', winRate: 56, profitFactor: 1.8, expectancy: 0.7, avgHoldTime: 4.2, var: -2.5, payoffRatio: 2.1 },
    { name: 'Trend', winRate: 48, profitFactor: 2.5, expectancy: 0.9, avgHoldTime: 12.6, var: -3.1, payoffRatio: 3.2 },
    { name: 'Reversal', winRate: 52, profitFactor: 2.2, expectancy: 0.8, avgHoldTime: 2.8, var: -2.8, payoffRatio: 2.4 },
    { name: 'Momentum', winRate: 62, profitFactor: 1.5, expectancy: 0.6, avgHoldTime: 1.4, var: -1.9, payoffRatio: 1.8 },
  ];
  
  // New data for sectors and market alignment
  const sectorExposure = [
    { name: 'Technology', value: 35 },
    { name: 'Finance', value: 22 },
    { name: 'Healthcare', value: 18 },
    { name: 'Consumer', value: 14 },
    { name: 'Energy', value: 8 },
    { name: 'Utilities', value: 3 },
  ];
  
  const marketAlignment = [
    { date: '2023-01-15', aligned: 85, misaligned: 15 },
    { date: '2023-02-15', aligned: 72, misaligned: 28 },
    { date: '2023-03-15', aligned: 93, misaligned: 7 },
    { date: '2023-04-15', aligned: 65, misaligned: 35 },
    { date: '2023-05-15', aligned: 78, misaligned: 22 },
    { date: '2023-06-15', aligned: 88, misaligned: 12 },
  ];
  
  // Risk-reward distribution
  const riskRewardData = [
    { r: 1, pnl: 250, winRate: 72, trades: 15 },
    { r: 1.5, pnl: 420, winRate: 65, trades: 22 },
    { r: 2, pnl: 850, winRate: 58, trades: 31 },
    { r: 2.5, pnl: 920, winRate: 52, trades: 18 },
    { r: 3, pnl: 670, winRate: 48, trades: 12 },
    { r: 3.5, pnl: 420, winRate: 42, trades: 8 },
    { r: 4, pnl: 180, winRate: 38, trades: 5 },
  ];
  
  // Custom function to get bar fill color based on profit
  const getBarFill = (entry: any) => {
    return entry.profit >= 0 ? "#10b981" : "#ef4444";
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <h2 className="text-2xl font-bold">{t('insights.performanceAnalysis')}</h2>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('insights.selectTimeframe')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">1 {t('insights.month')}</SelectItem>
            <SelectItem value="3m">3 {t('insights.months')}</SelectItem>
            <SelectItem value="6m">6 {t('insights.months')}</SelectItem>
            <SelectItem value="1y">1 {t('insights.year')}</SelectItem>
            <SelectItem value="all">{t('insights.allTime')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    
      <Card>
        <CardHeader>
          <CardTitle>{t('insights.monthlyPerformance')}</CardTitle>
          <CardDescription>{t('insights.monthlyPerformanceDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profit">
            <TabsList className="mb-4">
              <TabsTrigger value="profit">{t('insights.profitLoss')}</TabsTrigger>
              <TabsTrigger value="metrics">{t('insights.keyMetrics')}</TabsTrigger>
              <TabsTrigger value="cumulative">{t('insights.cumulative')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profit">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="profit" 
                    name={t('insights.profit')} 
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  >
                    {monthlyPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarFill(entry)} />
                    ))}
                  </Bar>
                  <Bar 
                    dataKey="loss" 
                    name={t('insights.loss')} 
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="trades" 
                    name={t('insights.trades')} 
                    stroke="#8884d8" 
                    yAxisId={1} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="metrics">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="winRate" 
                    name={t('insights.winRate')} 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ror" 
                    name={t('insights.returnOnRisk')} 
                    stroke="#10b981" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="kelly" 
                    name={t('insights.kellyPercentage')} 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="drawdown" 
                    name={t('insights.drawdown')} 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="cumulative">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <defs>
                    <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    name={t('insights.cumulativeProfit')} 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorPnL)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('insights.strategyPerformance')}</CardTitle>
            <CardDescription>{t('insights.strategyPerformanceDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={strategyPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="winRate" name={t('insights.winRate')} fill="#8884d8" radius={[0, 4, 4, 0]} />
                <Bar dataKey="profitFactor" name={t('insights.profitFactor')} fill="#82ca9d" radius={[0, 4, 4, 0]} />
                <Bar dataKey="expectancy" name={t('insights.expectancy')} fill="#ffc658" radius={[0, 4, 4, 0]} />
                <Bar dataKey="payoffRatio" name={t('insights.payoffRatio')} fill="#ff7300" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('insights.riskRewardAnalysis')}</CardTitle>
            <CardDescription>{t('insights.riskRewardDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={riskRewardData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="r" label={{ value: 'Risk:Reward Ratio', position: 'insideBottom', offset: -5 }} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="pnl" name={t('insights.pnl')} fill="#8884d8" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="winRate" name={t('insights.winRate')} stroke="#ff7300" />
                <Scatter yAxisId="right" dataKey="trades" name={t('insights.tradeCount')} fill="#82ca9d" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('insights.sectorExposure')}</CardTitle>
            <CardDescription>{t('insights.sectorExposureDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectorExposure}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name={t('insights.exposure')} fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('insights.marketDirectionAlignment')}</CardTitle>
            <CardDescription>{t('insights.marketDirectionDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={marketAlignment}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="aligned" 
                  stackId="1"
                  name={t('insights.aligned')} 
                  stroke="#10b981" 
                  fill="#10b981" />
                <Area 
                  type="monotone" 
                  dataKey="misaligned" 
                  stackId="1"
                  name={t('insights.misaligned')} 
                  stroke="#ef4444" 
                  fill="#ef4444" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
