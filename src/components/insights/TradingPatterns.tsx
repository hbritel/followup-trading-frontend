
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const TradingPatterns = () => {
  const { t } = useTranslation();
  
  // Mock data for patterns
  const timeOfDayPerformance = [
    { name: 'Opening Hour', value: 35, profit: 2300 },
    { name: 'Mid-Day', value: 25, profit: -800 },
    { name: 'Closing Hour', value: 30, profit: 1700 },
    { name: 'After Hours', value: 10, profit: 500 },
  ];
  
  const dayOfWeekPerformance = [
    { day: 'Monday', winRate: 48, avgProfit: 150, totalTrades: 42 },
    { day: 'Tuesday', winRate: 53, avgProfit: 220, totalTrades: 38 },
    { day: 'Wednesday', winRate: 58, avgProfit: 280, totalTrades: 45 },
    { day: 'Thursday', winRate: 51, avgProfit: 180, totalTrades: 39 },
    { day: 'Friday', winRate: 45, avgProfit: 120, totalTrades: 40 },
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('insights.timeOfDayAnalysis')}</CardTitle>
          <CardDescription>{t('insights.timeOfDayAnalysisDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={timeOfDayPerformance}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {timeOfDayPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="flex items-center">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('insights.timeOfDay')}</TableHead>
                    <TableHead className="text-right">{t('insights.trades')}</TableHead>
                    <TableHead className="text-right">{t('insights.profit')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeOfDayPerformance.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">{item.value}%</TableCell>
                      <TableCell className={`text-right ${item.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${item.profit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('insights.dayOfWeekAnalysis')}</CardTitle>
          <CardDescription>{t('insights.dayOfWeekAnalysisDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('insights.dayOfWeek')}</TableHead>
                <TableHead className="text-right">{t('insights.winRate')}</TableHead>
                <TableHead className="text-right">{t('insights.averageProfit')}</TableHead>
                <TableHead className="text-right">{t('insights.totalTrades')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dayOfWeekPerformance.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.day}</TableCell>
                  <TableCell className="text-right">{item.winRate}%</TableCell>
                  <TableCell className="text-right">${item.avgProfit}</TableCell>
                  <TableCell className="text-right">{item.totalTrades}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradingPatterns;
