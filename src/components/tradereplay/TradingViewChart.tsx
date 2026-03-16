
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart as LineChartIcon } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
} from 'recharts';
import type { TradeReplayResponseDto } from '@/types/dto';

interface TradingViewChartProps {
  replayData: TradeReplayResponseDto | undefined;
  isLoading: boolean;
}

interface ChartDataPoint {
  timestamp: string;
  price: number;
  unrealizedPnl: number;
  annotation: string | null;
  label: string;
}

const formatTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
};

const getAnnotationColor = (annotation: string | null): string => {
  if (annotation === 'MAX_PROFIT') return '#22c55e';
  if (annotation === 'MAX_LOSS') return '#ef4444';
  return '#3b82f6';
};

const AnnotationDot = (props: Record<string, unknown>) => {
  const { cx, cy, payload } = props as { cx: number; cy: number; payload: ChartDataPoint };
  if (!payload?.annotation) return null;

  return (
    <Dot
      cx={cx}
      cy={cy}
      r={6}
      fill={getAnnotationColor(payload.annotation)}
      stroke="#fff"
      strokeWidth={2}
    />
  );
};

const TradingViewChart: React.FC<TradingViewChartProps> = ({ replayData, isLoading }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Skeleton className="w-full h-full rounded-xl" />
      </div>
    );
  }

  if (!replayData) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <LineChartIcon className="h-12 w-12 mb-4 opacity-40" />
        <p className="text-lg font-medium">{t('tradeReplay.noTradeSelected')}</p>
        <p className="text-sm">{t('tradeReplay.noTradeSelectedDescription')}</p>
      </div>
    );
  }

  const chartData: ChartDataPoint[] = replayData.timelinePoints.map((point) => ({
    timestamp: point.timestamp,
    price: point.price,
    unrealizedPnl: point.unrealizedPnl,
    annotation: point.annotation,
    label: formatTime(point.timestamp),
  }));

  const prices = chartData.map((d) => d.price);
  const minPrice = Math.min(...prices, replayData.entryPrice, replayData.exitPrice);
  const maxPrice = Math.max(...prices, replayData.entryPrice, replayData.exitPrice);
  const padding = (maxPrice - minPrice) * 0.1;

  return (
    <div className="h-full">
      <div className="p-0 h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="font-mono font-semibold text-lg kpi-value">{replayData.symbol}</span>
            <span className={`label-caps text-sm font-medium ${replayData.direction === 'LONG' ? 'text-profit' : 'text-loss'}`}>
              {replayData.direction}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono tabular-nums">
            <span className="label-caps">{t('tradeReplay.entryPrice')}: <span className="text-foreground">{replayData.entryPrice.toFixed(2)}</span></span>
            <span className="label-caps">{t('tradeReplay.exitPrice')}: <span className="text-foreground">{replayData.exitPrice.toFixed(2)}</span></span>
            <span className={`font-semibold tabular-nums ${replayData.profitLoss >= 0 ? 'text-profit' : 'text-loss'}`}>
              {t('tradeReplay.profitLoss')}: ${replayData.profitLoss.toFixed(2)}
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minPrice - padding, maxPrice + padding]}
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => v.toFixed(2)}
            />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              formatter={(value: number, name: string) => {
                if (name === 'price') return [value.toFixed(4), t('tradeReplay.price')];
                return [`$${value.toFixed(2)}`, t('tradeReplay.unrealizedPnl')];
              }}
              labelFormatter={(label: string) => label}
            />
            <ReferenceLine
              y={replayData.entryPrice}
              stroke="#3b82f6"
              strokeDasharray="5 5"
              label={{ value: t('tradeReplay.entryPrice'), position: 'right', fontSize: 10 }}
            />
            <ReferenceLine
              y={replayData.exitPrice}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              label={{ value: t('tradeReplay.exitPrice'), position: 'right', fontSize: 10 }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#8884d8"
              strokeWidth={2}
              dot={<AnnotationDot />}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TradingViewChart;
