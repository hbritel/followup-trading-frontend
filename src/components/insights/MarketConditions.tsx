
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, ResponsiveContainer, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const MarketConditions = () => {
  const { t } = useTranslation();
  
  // Mock data for market conditions
  const marketPerformance = [
    { date: '2023-01-01', marketReturn: 1.2, userReturn: 2.5, volatility: 15 },
    { date: '2023-02-01', marketReturn: -0.8, userReturn: -0.3, volatility: 18 },
    { date: '2023-03-01', marketReturn: 2.3, userReturn: 3.1, volatility: 14 },
    { date: '2023-04-01', marketReturn: 1.5, userReturn: 0.8, volatility: 12 },
    { date: '2023-05-01', marketReturn: -0.4, userReturn: 1.2, volatility: 20 },
    { date: '2023-06-01', marketReturn: 3.2, userReturn: 4.5, volatility: 16 },
  ];
  
  const marketTypePerformance = [
    { type: 'Bull Market', winRate: 62, profitFactor: 2.3 },
    { type: 'Bear Market', winRate: 48, profitFactor: 1.5 },
    { type: 'Sideways', winRate: 53, profitFactor: 1.8 },
    { type: 'High Volatility', winRate: 55, profitFactor: 2.0 },
    { type: 'Low Volatility', winRate: 51, profitFactor: 1.7 },
  ];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('insights.marketIndex')}</Label>
          <Select defaultValue="spx">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spx">S&P 500</SelectItem>
              <SelectItem value="ndx">NASDAQ</SelectItem>
              <SelectItem value="dji">Dow Jones</SelectItem>
              <SelectItem value="rut">Russell 2000</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>{t('insights.timeframe')}</Label>
          <Select defaultValue="6m">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 Month</SelectItem>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('insights.marketPerformanceComparison')}</CardTitle>
          <CardDescription>{t('insights.marketPerformanceComparisonDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={marketPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="marketReturn" 
                name={t('insights.marketReturn')} 
                stroke="#8884d8" 
                activeDot={{ r: 8 }} 
              />
              <Line 
                type="monotone" 
                dataKey="userReturn" 
                name={t('insights.yourReturn')} 
                stroke="#82ca9d" 
              />
              <Line 
                type="monotone" 
                dataKey="volatility" 
                name={t('insights.volatility')} 
                stroke="#ffc658" 
                strokeDasharray="3 3"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('insights.marketTypeAnalysis')}</CardTitle>
          <CardDescription>{t('insights.marketTypeAnalysisDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {marketTypePerformance.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{item.type}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('insights.winRate')}</p>
                      <p className="text-2xl font-bold">{item.winRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('insights.profitFactor')}</p>
                      <p className="text-2xl font-bold">{item.profitFactor}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketConditions;
