
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import {
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Type definition for the color mapping function
type ColorFunction = (entry: any) => string;

// Sample data for the trading chart
const tradeData = [
  { date: '2023-01-01', pnl: 235, trades: 5, winRate: 0.80 },
  { date: '2023-02-01', pnl: -120, trades: 10, winRate: 0.40 },
  { date: '2023-03-01', pnl: 450, trades: 8, winRate: 0.75 },
  { date: '2023-04-01', pnl: 320, trades: 7, winRate: 0.71 },
  { date: '2023-05-01', pnl: -85, trades: 12, winRate: 0.50 },
  { date: '2023-06-01', pnl: 670, trades: 15, winRate: 0.87 },
  { date: '2023-07-01', pnl: 540, trades: 9, winRate: 0.78 },
  { date: '2023-08-01', pnl: -220, trades: 11, winRate: 0.36 },
  { date: '2023-09-01', pnl: 190, trades: 6, winRate: 0.67 },
  { date: '2023-10-01', pnl: 410, trades: 10, winRate: 0.70 },
  { date: '2023-11-01', pnl: 380, trades: 8, winRate: 0.75 },
  { date: '2023-12-01', pnl: 520, trades: 12, winRate: 0.83 },
];

// Cumulative PnL data for equity line chart
const cumulativePnL = tradeData.reduce((acc, curr, index) => {
  const prevTotal = index > 0 ? acc[index - 1].totalPnl : 0;
  return [...acc, {
    date: curr.date,
    pnl: curr.pnl,
    totalPnl: prevTotal + curr.pnl
  }];
}, [] as { date: string; pnl: number; totalPnl: number }[]);

// Format date for display
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

// Custom tooltip for PnL chart
const PnLTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background p-2 border rounded shadow-sm">
        <p className="font-medium">{formatDate(label)}</p>
        <p className="text-sm">
          P&L: <span className={data.pnl >= 0 ? 'text-profit' : 'text-loss'}>
            {data.pnl >= 0 ? '+' : ''}${data.pnl}
          </span>
        </p>
        <p className="text-sm">Trades: {data.trades}</p>
        <p className="text-sm">Win Rate: {(data.winRate * 100).toFixed(0)}%</p>
      </div>
    );
  }
  return null;
};

// Custom tooltip for Equity Line chart
const EquityTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background p-2 border rounded shadow-sm">
        <p className="font-medium">{formatDate(label)}</p>
        <p className="text-sm">
          Monthly P&L: <span className={data.pnl >= 0 ? 'text-profit' : 'text-loss'}>
            {data.pnl >= 0 ? '+' : ''}${data.pnl}
          </span>
        </p>
        <p className="text-sm">
          Total P&L: <span className={data.totalPnl >= 0 ? 'text-profit' : 'text-loss'}>
            {data.totalPnl >= 0 ? '+' : ''}${data.totalPnl}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

// Color function for bars
const barColor: ColorFunction = (entry) => (entry.pnl >= 0 ? "#10b981" : "#ef4444");

const PerformanceChart = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Monthly P&L</CardTitle>
          <CardDescription>Performance results by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tradeData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis 
                  tickFormatter={(value) => `$${value}`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<PnLTooltip />} />
                <Bar 
                  dataKey="pnl" 
                  radius={[4, 4, 0, 0]} 
                  fill="#10b981"
                  // Use string fill for the bar, React handles the function properly
                  // Applying a conditional style
                  style={{ fill: 'var(--color)' }}
                  className="[--color:var(--bar-fill)]"
                  data-fill-bar={true}
                  // Apply a data attribute that we'll use for styling
                  data-profit-bar={true}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <style jsx global>{`
            [data-profit-bar="true"] path {
              fill: var(--bar-fill, #10b981);
            }
            [data-profit-bar="true"] path[fill="#10b981"] {
              --bar-fill: #10b981;
            }
            [data-profit-bar="true"] path[fill="#ef4444"] {
              --bar-fill: #ef4444;
            }
          `}</style>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equity Line</CardTitle>
          <CardDescription>Cumulative profit and loss</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativePnL} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="totalPnlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis 
                  tickFormatter={(value) => `$${value}`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<EquityTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="totalPnl" 
                  stroke="#10b981" 
                  fillOpacity={1}
                  fill="url(#totalPnlGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceChart;
