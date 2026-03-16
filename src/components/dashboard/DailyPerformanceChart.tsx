import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DailyPerformanceDto } from '@/types/dto';

interface DailyPerformanceChartProps {
  data?: DailyPerformanceDto[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const DailyPerformanceChart: React.FC<DailyPerformanceChartProps> = ({ data }) => {
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return (
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold tracking-tight text-gradient">{t('dashboard.recentPerformance', 'Recent Daily Performance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('dashboard.noPerformanceData', 'No performance data available')}</p>
        </CardContent>
      </Card>
    );
  }

  const recentData = data.slice(-14);
  const maxAbsValue = Math.max(...recentData.map(d => Math.abs(d.profitLoss)), 1);

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-tight text-gradient">
          {t('dashboard.recentPerformance', 'Recent Daily Performance')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-32">
          {recentData.map((day) => {
            const heightPercent = Math.max((Math.abs(day.profitLoss) / maxAbsValue) * 100, 4);
            const isProfit = day.profitLoss >= 0;
            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center justify-end group relative"
              >
                <div
                  className={cn(
                    "w-full rounded-t-sm transition-opacity",
                    isProfit ? "bg-green-500" : "bg-red-500"
                  )}
                  style={{ height: `${heightPercent}%` }}
                  title={`${day.date}: ${formatCurrency(day.profitLoss)} (${day.totalTrades} trades)`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {recentData[0]?.date?.slice(5)}
          </span>
          <span className="text-xs text-muted-foreground">
            {recentData[recentData.length - 1]?.date?.slice(5)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyPerformanceChart;
