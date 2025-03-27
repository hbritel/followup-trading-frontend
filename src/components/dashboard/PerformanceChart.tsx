
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
      <div className="frosted-glass p-3 rounded-lg shadow-md">
        <p className="text-sm font-medium">{formatDate(label)}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.name === 'Equity' || entry.name === 'Daily P&L' 
              ? formatCurrency(entry.value) 
              : entry.value}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

// Custom bar shape component to handle color based on value
const CustomBar = (props: any) => {
  const { x, y, width, height, value } = props;
  const fill = value >= 0 ? '#10b981' : '#ef4444';
  
  return <rect x={x} y={y} width={width} height={height} fill={fill} />;
};

const PerformanceChart = () => {
  const [timeRange, setTimeRange] = useState('1m');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="animate-slide-up">
        <CardHeader className="px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold">Performance</CardTitle>
              <CardDescription>Cumulative performance over time</CardDescription>
            </div>
            <div className="flex space-x-1 bg-accent/50 rounded-lg p-1">
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  variant={timeRange === range.value ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs font-medium"
                  onClick={() => setTimeRange(range.value)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-2">
          <div className="h-[300px] px-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={performanceData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgba(59,130,246,0.8)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="rgba(59,130,246,0.1)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate} 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                  minTickGap={20}
                />
                <YAxis 
                  id="equity-axis"
                  tickFormatter={(value) => `$${value}`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                  domain={['dataMin - 100', 'dataMax + 100']}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="equity" 
                  stroke="rgba(59,130,246,1)" 
                  fillOpacity={1}
                  fill="url(#colorEquity)" 
                  name="Equity"
                  strokeWidth={2}
                  animationDuration={800}
                  yAxisId="equity-axis"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card className="animate-slide-up">
        <CardHeader className="px-6 py-4">
          <div>
            <CardTitle className="text-lg font-semibold">Daily P&L</CardTitle>
            <CardDescription>Profit and loss by day</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-2">
          <Tabs defaultValue="pnl">
            <div className="px-6">
              <TabsList className="bg-accent/50">
                <TabsTrigger value="pnl">P&L</TabsTrigger>
                <TabsTrigger value="volume">Volume</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="pnl" className="h-[300px] mt-2 px-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                    minTickGap={20}
                  />
                  <YAxis 
                    id="pnl-axis"
                    tickFormatter={(value) => `$${value}`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="pnl" 
                    name="Daily P&L"
                    animationDuration={800}
                    shape={<CustomBar />}
                    yAxisId="pnl-axis"
                  />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="volume" className="h-[300px] mt-2 px-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                    minTickGap={20}
                  />
                  <YAxis 
                    id="volume-axis"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="volume" 
                    name="Trade Volume" 
                    fill="rgba(59,130,246,0.8)" 
                    animationDuration={800}
                    yAxisId="volume-axis"
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
