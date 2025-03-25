
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, ResponsiveContainer, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const PerformanceMetrics = () => {
  const { t } = useTranslation();
  
  // Mock data for metrics
  const monthlyPerformance = [
    { month: 'Jan', profit: 1200, trades: 24 },
    { month: 'Feb', profit: -800, trades: 18 },
    { month: 'Mar', profit: 2300, trades: 32 },
    { month: 'Apr', profit: 1500, trades: 28 },
    { month: 'May', profit: -400, trades: 16 },
    { month: 'Jun', profit: 3200, trades: 35 },
  ];
  
  const strategyPerformance = [
    { name: 'Breakout', winRate: 56, profitFactor: 1.8, expectancy: 0.7 },
    { name: 'Trend', winRate: 48, profitFactor: 2.5, expectancy: 0.9 },
    { name: 'Reversal', winRate: 52, profitFactor: 2.2, expectancy: 0.8 },
    { name: 'Momentum', winRate: 62, profitFactor: 1.5, expectancy: 0.6 },
  ];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('insights.monthlyPerformance')}</CardTitle>
          <CardDescription>{t('insights.monthlyPerformanceDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="profit" 
                name={t('insights.profit')} 
                fill={({ profit }) => profit >= 0 ? "#10b981" : "#ef4444"}
                radius={[4, 4, 0, 0]} 
              />
              <Line 
                type="monotone" 
                dataKey="trades" 
                name={t('insights.trades')} 
                stroke="#8884d8" 
                yAxisId={1} 
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('insights.strategyPerformance')}</CardTitle>
          <CardDescription>{t('insights.strategyPerformanceDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={strategyPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="winRate" name={t('insights.winRate')} fill="#8884d8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profitFactor" name={t('insights.profitFactor')} fill="#82ca9d" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expectancy" name={t('insights.expectancy')} fill="#ffc658" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMetrics;
