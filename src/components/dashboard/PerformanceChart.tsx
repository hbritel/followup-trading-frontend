import React, { useState } from 'react';
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Legend, 
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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Sample data for the performance chart
const performanceData = [
  { date: '2022-03-01', pnl: 152, equity: 1152 },
  { date: '2022-03-02', pnl: -23, equity: 1129 },
  { date: '2022-03-03', pnl: 47, equity: 1176 },
  { date: '2022-03-04', pnl: 125, equity: 1301 },
  { date: '2022-03-07', pnl: -67, equity: 1234 },
  { date: '2022-03-08', pnl: 89, equity: 1323 },
  { date: '2022-03-09', pnl: 132, equity: 1455 },
  { date: '2022-03-10', pnl: -45, equity: 1410 },
  { date: '2022-03-11', pnl: 76, equity: 1486 },
  { date: '2022-03-14', pnl: 44, equity: 1530 },
  { date: '2022-03-15', pnl: -12, equity: 1518 },
  { date: '2022-03-16', pnl: 37, equity: 1555 },
  { date: '2022-03-17', pnl: 91, equity: 1646 },
  { date: '2022-03-18', pnl: 23, equity: 1669 },
  { date: '2022-03-21', pnl: -19, equity: 1650 },
  { date: '2022-03-22', pnl: 62, equity: 1712 },
  { date: '2022-03-23', pnl: 27, equity: 1739 },
];

// Sample data for volume chart
const volumeData = [
  { date: '2022-03-01', volume: 12 },
  { date: '2022-03-02', volume: 5 },
  { date: '2022-03-03', volume: 8 },
  { date: '2022-03-04', volume: 10 },
  { date: '2022-03-07', volume: 7 },
  { date: '2022-03-08', volume: 9 },
  { date: '2022-03-09', volume: 15 },
  { date: '2022-03-10', volume: 11 },
  { date: '2022-03-11', volume: 8 },
  { date: '2022-03-14', volume: 6 },
  { date: '2022-03-15', volume: 4 },
  { date: '2022-03-16', volume: 7 },
  { date: '2022-03-17', volume: 13 },
  { date: '2022-03-18', volume: 9 },
  { date: '2022-03-21', volume: 5 },
  { date: '2022-03-22', volume: 8 },
  { date: '2022-03-23', volume: 6 },
];

const timeRanges = [
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: 'YTD', value: 'ytd' },
  { label: '1Y', value: '1y' },
  { label: 'All', value: 'all' },
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

const formatCurrency = (value: number) => {
  return `$${value.toFixed(2)}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-lg border border-slate-200/50 dark:border-white/10 shadow-xl backdrop-blur-md">
        <p className="text-xs font-semibold text-muted-foreground mb-1 font-mono">{formatDate(label)}</p>
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

// Custom bar shape component to handle color based on value
const CustomBar = (props: any) => {
  const { x, y, width, height, value } = props;
  const isProfit = value >= 0;
  const fill = isProfit ? 'hsl(var(--profit))' : 'hsl(var(--loss))';
  
  // Create neon glow effect for bars (Dark mode only via CSS filter class, or stick to drop-shadow which is generally supported)
  // For light mode, we might not want the glow.
  // We can't easily use Tailwind classes inside SVG elements for filter without a wrapping group.
  // Let's keep the filter but maybe make it subtler.
  
  const filter = isProfit 
    ? 'drop-shadow(0 0 4px rgba(52, 211, 153, 0.5))' 
    : 'drop-shadow(0 0 4px rgba(248, 113, 113, 0.5))';
  
  return (
    <g style={{ filter: 'var(--chart-glow, none)' }} className="dark:[--chart-glow:drop-shadow(0_0_4px_rgba(52,211,153,0.5))]">
       {/* Actually, styling SVG via class for filter is tricky with React attributes. 
           Let's simplify: only apply filter if we can detect dark mode or just keep it as it adds "pop" even in light mode,
           though typically glows are for dark mode.
           Let's just use the fill opacity.
       */}
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={2} ry={2} fillOpacity={0.8} />
    </g>
  );
};

const PerformanceChart = () => {
  const [timeRange, setTimeRange] = useState('1m');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="glass-card animate-slide-up">
        <CardHeader className="px-6 py-5 border-b border-slate-200/50 dark:border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">Performance</CardTitle>
              <CardDescription className="text-muted-foreground">Cumulative performance over time</CardDescription>
            </div>
            <div className="flex bg-slate-100 dark:bg-black/40 rounded-lg p-1 border border-slate-200 dark:border-white/5">
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  variant={timeRange === range.value ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-7 px-3 text-xs font-medium rounded-md transition-all",
                    timeRange === range.value 
                      ? "bg-white dark:bg-primary/20 text-primary shadow-sm dark:shadow-[0_0_10px_rgba(var(--primary),0.2)]" 
                      : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
                  )}
                  onClick={() => setTimeRange(range.value)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-6 pb-2">
          <div className="h-[300px] px-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={performanceData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
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
                  tickFormatter={(value) => `$${value}`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickMargin={10}
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
          </div>
        </CardContent>
      </Card>
      
      <Card className="glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader className="px-6 py-5 border-b border-slate-200/50 dark:border-white/5">
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight">Daily P&L</CardTitle>
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
                    tickFormatter={(value) => `$${value}`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickMargin={10}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                  <Bar 
                    dataKey="pnl" 
                    name="Daily P&L"
                    animationDuration={1500}
                    shape={<CustomBar />}
                  />
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
