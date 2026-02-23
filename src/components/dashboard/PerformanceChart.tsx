import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { AnalyticsDashboard } from '@/services/trade.service';

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const formatDateFull = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatCurrency = (value: number) => {
  return `$${value.toFixed(2)}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-lg border border-slate-200/50 dark:border-white/10 shadow-xl backdrop-blur-md">
        <p className="text-xs font-semibold text-muted-foreground mb-1 font-mono">{formatDateFull(label)}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-sm">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="font-medium text-foreground dark:text-white">
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-foreground dark:text-white">
              {entry.name === 'Equity' || entry.name === 'Daily P&L'
                ? formatCurrency(entry.value)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

const formatAxisCurrency = (value: number) => {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1000) {
    return `${sign}$${(abs / 1000).toFixed(1)}K`;
  }
  return `${sign}$${Math.round(abs)}`;
};

const InfoBubble = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="ml-1.5 inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setOpen(prev => !prev)}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="text-sm leading-relaxed"
        onMouseLeave={() => setOpen(false)}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
};

const PROFIT_COLOR = 'hsl(var(--profit))';
const LOSS_COLOR = 'hsl(var(--loss))';

interface PerformanceChartProps {
  analytics?: AnalyticsDashboard;
}

const PerformanceChart = ({ analytics }: PerformanceChartProps) => {
  const { performanceData, volumeData } = React.useMemo(() => {
    if (!analytics || !analytics.equityCurve || analytics.equityCurve.length === 0) {
      return { performanceData: [], volumeData: [] };
    }

    let cumulativeEquity = analytics.priorEquity ?? 0;

    const performanceLine = analytics.equityCurve.map(point => {
      cumulativeEquity += point.dailyProfit;

      return {
        date: point.date,
        pnl: point.dailyProfit,
        equity: cumulativeEquity
      };
    });

    const volumeLine = analytics.equityCurve.map(point => ({
      date: point.date,
      volume: point.dailyVolume || 0
    }));

    return {
      performanceData: performanceLine,
      volumeData: volumeLine
    };
  }, [analytics]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="glass-card animate-slide-up">
        <CardHeader className="px-6 py-5 border-b border-slate-200/50 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div>
              <div className="flex items-center">
                <CardTitle className="text-lg font-semibold tracking-tight">Performance</CardTitle>
                <InfoBubble>
                  Shows your cumulative equity curve over time. Each point represents the running total of all realized P&L from closed trades.
                </InfoBubble>
              </div>
              <CardDescription className="text-muted-foreground">Cumulative performance over time</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-6 pb-2">
          <div className="h-[300px] px-2">
            {performanceData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No trading activity in this period
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={performanceData}
                margin={{ top: 10, right: 10, left: 5, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickMargin={10}
                  minTickGap={30}
                />
                <YAxis
                  tickFormatter={formatAxisCurrency}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickMargin={10}
                  width={60}
                  domain={['dataMin - 100', 'dataMax + 100']}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorEquity)"
                  name="Equity"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader className="px-6 py-5 border-b border-slate-200/50 dark:border-white/5">
          <div>
            <div className="flex items-center">
              <CardTitle className="text-lg font-semibold tracking-tight">Daily P&L</CardTitle>
              <InfoBubble>
                Displays your daily profit and loss from closed trades. Green bars represent profitable days, red bars represent losing days. Switch to the Volume tab to see the number of trades executed each day.
              </InfoBubble>
            </div>
            <CardDescription className="text-muted-foreground">Profit and loss by day</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-6">
          <Tabs defaultValue="pnl">
            <div className="px-6 mb-4">
              <TabsList className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 w-full justify-start p-1 h-auto">
                <TabsTrigger value="pnl" className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:shadow-none text-xs h-8">P&L</TabsTrigger>
                <TabsTrigger value="volume" className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:shadow-none text-xs h-8">Volume</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="pnl" className="h-[270px] mt-0 px-2 pb-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickMargin={10}
                    minTickGap={30}
                  />
                  <YAxis
                    tickFormatter={formatAxisCurrency}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickMargin={10}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                  <Bar
                    dataKey="pnl"
                    name="Daily P&L"
                    animationDuration={1500}
                    radius={[2, 2, 2, 2]}
                    fillOpacity={0.8}
                  >
                    {performanceData.map((entry, index) => (
                      <Cell key={`pnl-${index}`} fill={entry.pnl >= 0 ? PROFIT_COLOR : LOSS_COLOR} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="volume" className="h-[270px] mt-0 px-2 pb-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickMargin={10}
                    minTickGap={30}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickMargin={10}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                  <Bar
                    dataKey="volume"
                    name="Trade Volume"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                    radius={[2, 2, 0, 0]}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceChart;
