
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, ResponsiveContainer, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";

interface MonthlyReturnData {
  month: string;
  return: number;
}

interface MonthlyReturnsChartProps {
  data: MonthlyReturnData[];
}

const MonthlyReturnsChart = ({ data }: MonthlyReturnsChartProps) => {
  const { t } = useTranslation();
  
  // Function to determine bar color based on return value
  const getReturnColor = (value: number) => {
    return value >= 0 ? "#10b981" : "#ef4444";
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('backtesting.monthlyReturns')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey="return" 
              name={t('backtesting.return')}
              radius={[4, 4, 0, 0]}
              fill="#10b981"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getReturnColor(entry.return)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlyReturnsChart;
