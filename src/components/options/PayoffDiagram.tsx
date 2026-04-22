import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buildPayoffCurve, findBreakevens } from '@/lib/options/payoff';
import type { SpreadLegDto } from '@/types/dto';

interface PayoffDiagramProps {
  readonly legs: readonly SpreadLegDto[];
  readonly height?: number;
}

interface ChartPoint {
  readonly price: number;
  readonly pnl: number;
  readonly profit: number | null;
  readonly loss: number | null;
}

const PROFIT_COLOR = '#10b981';
const LOSS_COLOR = '#ef4444';
const LINE_COLOR = '#e2e8f0';
const STRIKE_COLOR = '#64748b';
const BE_COLOR = '#f59e0b';

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatPnl(value: number): string {
  return value >= 0
    ? `+$${value.toFixed(0)}`
    : `-$${Math.abs(value).toFixed(0)}`;
}

const PayoffDiagram: React.FC<PayoffDiagramProps> = ({ legs, height = 280 }) => {
  const { t } = useTranslation();

  const { data, breakevens, strikes } = useMemo(() => {
    const curve = buildPayoffCurve(legs);
    const bes = findBreakevens(curve);
    const chartData: ChartPoint[] = curve.map((p) => ({
      price: p.price,
      pnl: p.pnl,
      profit: p.pnl >= 0 ? p.pnl : 0,
      loss: p.pnl < 0 ? p.pnl : 0,
    }));
    const uniqueStrikes = Array.from(
      new Set(legs.filter((l) => l.legType !== 'STOCK').map((l) => l.strike)),
    ).sort((a, b) => a - b);
    return { data: chartData, breakevens: bes, strikes: uniqueStrikes };
  }, [legs]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-muted-foreground"
        style={{ height }}
      >
        {t('options.payoffUnavailable', 'Payoff unavailable')}
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
          <defs>
            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PROFIT_COLOR} stopOpacity={0.45} />
              <stop offset="100%" stopColor={PROFIT_COLOR} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="lossGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={LOSS_COLOR} stopOpacity={0.45} />
              <stop offset="100%" stopColor={LOSS_COLOR} stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="price"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatPrice}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            stroke="#334155"
          />
          <YAxis
            tickFormatter={formatPnl}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            stroke="#334155"
            width={64}
          />

          <Tooltip
            contentStyle={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: 10,
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => {
              if (name === 'pnl') return [formatPnl(value), t('options.pnl', 'P&L')];
              return null;
            }}
            labelFormatter={(label: number) =>
              `${t('options.price', 'Price')}: ${formatPrice(label)}`
            }
          />

          <ReferenceLine y={0} stroke={STRIKE_COLOR} strokeDasharray="2 4" />

          {strikes.map((s) => (
            <ReferenceLine
              key={`strike-${s}`}
              x={s}
              stroke={STRIKE_COLOR}
              strokeDasharray="3 3"
              strokeOpacity={0.5}
              label={{
                value: `K ${s}`,
                position: 'top',
                fill: '#94a3b8',
                fontSize: 10,
              }}
            />
          ))}

          {breakevens.map((be, idx) => (
            <ReferenceLine
              key={`be-${idx}`}
              x={be}
              stroke={BE_COLOR}
              strokeDasharray="4 2"
              label={{
                value: `BE ${be.toFixed(2)}`,
                position: 'bottom',
                fill: BE_COLOR,
                fontSize: 10,
              }}
            />
          ))}

          <Area
            type="monotone"
            dataKey="profit"
            stroke="none"
            fill="url(#profitGradient)"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="loss"
            stroke="none"
            fill="url(#lossGradient)"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="pnl"
            stroke={LINE_COLOR}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PayoffDiagram;
