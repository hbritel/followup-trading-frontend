
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, BarChart, ResponsiveContainer, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Download, Save } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const BacktestResults = () => {
  const { t } = useTranslation();
  
  // Mock data for backtest results
  const equityCurve = [
    { date: '2023-01-01', equity: 10000 },
    { date: '2023-01-15', equity: 10500 },
    { date: '2023-02-01', equity: 10300 },
    { date: '2023-02-15', equity: 11200 },
    { date: '2023-03-01', equity: 11800 },
    { date: '2023-03-15', equity: 11500 },
    { date: '2023-04-01', equity: 12300 },
    { date: '2023-04-15', equity: 13100 },
    { date: '2023-05-01', equity: 12800 },
    { date: '2023-05-15', equity: 13500 },
    { date: '2023-06-01', equity: 14200 },
  ];
  
  const monthlyReturns = [
    { month: 'Jan', return: 5.0 },
    { month: 'Feb', return: 7.0 },
    { month: 'Mar', return: 2.6 },
    { month: 'Apr', return: 13.9 },
    { month: 'May', return: 5.4 },
    { month: 'Jun', return: -2.3 },
  ];
  
  const statistics = [
    { name: t('backtesting.netProfit'), value: '$4,200', highlight: true },
    { name: t('backtesting.profitFactor'), value: '2.3', highlight: true },
    { name: t('backtesting.sharpeRatio'), value: '1.8', highlight: true },
    { name: t('backtesting.maxDrawdown'), value: '-8.5%', highlight: true },
    { name: t('backtesting.totalTrades'), value: '42', highlight: false },
    { name: t('backtesting.winRate'), value: '58%', highlight: false },
    { name: t('backtesting.averageWin'), value: '$320', highlight: false },
    { name: t('backtesting.averageLoss'), value: '-$180', highlight: false },
    { name: t('backtesting.largestWin'), value: '$850', highlight: false },
    { name: t('backtesting.largestLoss'), value: '-$430', highlight: false },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Moving Average Crossover Backtest</h2>
          <p className="text-sm text-muted-foreground">AAPL | Daily | Jan 1, 2023 - Jun 1, 2023</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            {t('backtesting.saveBacktest')}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {t('backtesting.exportResults')}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statistics.slice(0, 4).map((stat, index) => (
          <Card key={index}>
            <CardHeader className="p-4 pb-2">
              <CardDescription>{stat.name}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className={`text-2xl font-bold ${stat.highlight && stat.value.includes('-') ? 'text-red-500' : (stat.highlight ? 'text-green-500' : '')}`}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('backtesting.equityCurve')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={equityCurve}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="equity" 
                name={t('backtesting.equity')} 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('backtesting.monthlyReturns')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyReturns}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="return" 
                name={t('backtesting.return')}
                fill={({ return: value }) => value >= 0 ? "#10b981" : "#ef4444"}
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('backtesting.performanceStatistics')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('backtesting.metric')}</TableHead>
                  <TableHead className="text-right">{t('backtesting.value')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statistics.map((stat, index) => (
                  <TableRow key={index}>
                    <TableCell>{stat.name}</TableCell>
                    <TableCell className={`text-right ${stat.highlight && stat.value.includes('-') ? 'text-red-500' : (stat.highlight ? 'text-green-500' : '')}`}>
                      {stat.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('backtesting.tradeDistribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('backtesting.winningTrades')}</p>
                    <div className="h-2 bg-muted mt-1 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-[58%]" />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>58% (24)</span>
                      <span>$7,680</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">{t('backtesting.losingTrades')}</p>
                    <div className="h-2 bg-muted mt-1 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 w-[42%]" />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>42% (18)</span>
                      <span>-$3,240</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BacktestResults;
