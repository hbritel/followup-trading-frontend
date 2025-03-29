
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatisticItem } from './StatisticsCards';

interface PerformanceStatisticsProps {
  statistics: StatisticItem[];
}

const PerformanceStatistics = ({ statistics }: PerformanceStatisticsProps) => {
  const { t } = useTranslation();
  
  return (
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
          
          <TradeDistribution />
        </div>
      </CardContent>
    </Card>
  );
};

const TradeDistribution = () => {
  const { t } = useTranslation();
  
  return (
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
  );
};

export default PerformanceStatistics;
