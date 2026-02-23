
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useDashboardSummary } from '@/hooks/useAdvancedMetrics';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePageFilter } from '@/contexts/page-filters-context';
import DashboardDateFilter, { computeDateRange } from '@/components/dashboard/DashboardDateFilter';
import AccountSelector from '@/components/dashboard/AccountSelector';

const COLORS = ['#1E40AF', '#dc2626'];

// Sample data for trade performance by day (no backend endpoint for this yet)
const tradeDayData = [
  { day: 'Mon', wins: 15, losses: 6 },
  { day: 'Tue', wins: 18, losses: 4 },
  { day: 'Wed', wins: 12, losses: 9 },
  { day: 'Thu', wins: 16, losses: 7 },
  { day: 'Fri', wins: 14, losses: 8 },
];

// Sample data for trade performance by time (no backend endpoint for this yet)
const tradeTimeData = [
  { time: '09:30', wins: 12, losses: 3 },
  { time: '10:30', wins: 18, losses: 5 },
  { time: '11:30', wins: 14, losses: 7 },
  { time: '12:30', wins: 10, losses: 8 },
  { time: '13:30', wins: 8, losses: 9 },
  { time: '14:30', wins: 15, losses: 6 },
  { time: '15:30', wins: 20, losses: 4 },
];

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const Statistics = () => {
  const [selectedAccountId, setSelectedAccountId] = usePageFilter('statistics', 'accountId', 'all');
  const [datePreset, setDatePreset] = usePageFilter('statistics', 'datePreset', 'all');
  const [customStart, setCustomStart] = usePageFilter<Date | null>('statistics', 'customStart', null);
  const [customEnd, setCustomEnd] = usePageFilter<Date | null>('statistics', 'customEnd', null);

  const apiAccountId = selectedAccountId === 'all' ? undefined : selectedAccountId;

  // Compute date range from preset or custom dates
  const dateRange = datePreset === 'custom'
    ? {
        startDate: customStart ? toISODate(customStart) : undefined,
        endDate: customEnd ? toISODate(customEnd) : undefined,
      }
    : computeDateRange(datePreset);

  // Primary: useAnalytics for trade counts/win rates (supports account filtering)
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(
    apiAccountId, dateRange.startDate, dateRange.endDate
  );
  // Secondary: useDashboardSummary for risk metrics (sharpe, sortino, drawdown)
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary(
    dateRange.startDate, dateRange.endDate
  );

  const isLoading = analyticsLoading || summaryLoading;

  // Use analytics as primary source for trade stats (supports account filter)
  const totalTrades = analytics?.totalTrades ?? 0;
  const winningTrades = analytics?.winningTrades ?? 0;
  const losingTrades = analytics?.losingTrades ?? 0;
  const winRate = analytics?.winRate ?? 0;

  // Risk metrics from dashboard summary
  const perf = summary?.performanceSummary;
  const drawdown = summary?.drawdownMetrics;
  const profitFactor = perf?.profitFactor ?? 0;
  const averageWin = perf?.averageWin ?? 0;
  const averageLoss = perf?.averageLoss ?? 0;
  const maxDrawdown = drawdown?.maxDrawdownPercent ?? 0;

  // Compute risk-reward ratio from averageWin / averageLoss
  const riskRewardRatio = averageLoss !== 0 ? Math.abs(averageWin / averageLoss) : 0;

  // Estimate period months for trades/month calculation
  const periodMonths = (() => {
    if (!dateRange.startDate) return 0;
    const start = new Date(dateRange.startDate);
    const end = dateRange.endDate ? new Date(dateRange.endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();
    return Math.max(diffMs / (1000 * 60 * 60 * 24 * 30), 1);
  })();
  const tradesPerMonth = periodMonths > 0 ? totalTrades / periodMonths : totalTrades;

  // Build trade distribution data for pie chart
  const tradeDistributionData = [
    { name: 'Winning Trades', value: winningTrades },
    { name: 'Losing Trades', value: losingTrades },
  ];

  // Build metrics data for progress bars
  const metricsData = [
    { name: 'Win Rate', value: winRate, target: 70, format: '%' },
    { name: 'Profit Factor', value: profitFactor, target: 2.5, format: 'x' },
    { name: 'Risk-Reward Ratio', value: riskRewardRatio, target: 2.0, format: 'x' },
    { name: 'Average Win', value: averageWin, target: 250, format: '$' },
    { name: 'Average Loss', value: Math.abs(averageLoss), target: 125, format: '$' },
    { name: 'Maximum Drawdown', value: maxDrawdown, target: 10, format: '%' },
  ];

  const formatMetricValue = (value: number, format: string) => {
    if (format === '$') return `$${value.toFixed(2)}`;
    if (format === 'x') return `${value.toFixed(2)}${format}`;
    return `${value.toFixed(1)}${format}`;
  };

  return (
    <DashboardLayout pageTitle="Statistics">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Trading Statistics</h1>
            <p className="text-muted-foreground">Detailed analysis of your trading performance</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <DashboardDateFilter
            preset={datePreset}
            onPresetChange={setDatePreset}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
          />
          <AccountSelector
            value={selectedAccountId}
            onChange={setSelectedAccountId}
            className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Trade Count</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-40 mt-1" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalTrades}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Average {tradesPerMonth.toFixed(1)} trades per month
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-36 mt-1" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {winningTrades} wins, {losingTrades} losses
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Profit Factor</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-44 mt-1" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{profitFactor.toFixed(2)}x</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Gross profit / gross loss ratio
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Average R:R</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-36 mt-1" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{riskRewardRatio.toFixed(1)}:1</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Average risk-reward ratio
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
              <CardDescription>Performance against target metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {metricsData.map((metric) => (
                    <div key={metric.name} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{metric.name}</span>
                        <span className="text-sm">
                          {formatMetricValue(metric.value, metric.format)}
                          <span className="text-muted-foreground"> / Target: </span>
                          {formatMetricValue(metric.target, metric.format)}
                        </span>
                      </div>
                      <Progress
                        value={metric.target !== 0 ? Math.min((metric.value / metric.target) * 100, 100) : 0}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trade Distribution</CardTitle>
              <CardDescription>Win vs loss ratio</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-40 w-40 rounded-full" />
                </div>
              ) : totalTrades === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No trades for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tradeDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {tradeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="by-day">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="by-day">Performance by Day</TabsTrigger>
            <TabsTrigger value="by-time">Performance by Time</TabsTrigger>
          </TabsList>

          <TabsContent value="by-day" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trade Performance by Day</CardTitle>
                <CardDescription>Win/loss distribution by day of week</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tradeDayData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="wins" name="Winning Trades" stackId="a" fill="#1E40AF" />
                    <Bar dataKey="losses" name="Losing Trades" stackId="a" fill="#dc2626" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="by-time" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trade Performance by Time</CardTitle>
                <CardDescription>Win/loss distribution by time of day</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tradeTimeData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="wins" name="Winning Trades" stackId="a" fill="#1E40AF" />
                    <Bar dataKey="losses" name="Losing Trades" stackId="a" fill="#dc2626" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Best Trading Sessions</CardTitle>
              <CardDescription>Highest win rate trading sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Tuesday Morning</div>
                    <div className="text-xs text-muted-foreground">9:30 AM - 11:30 AM</div>
                  </div>
                  <div className="text-sm font-semibold">85% Win Rate</div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Friday Afternoon</div>
                    <div className="text-xs text-muted-foreground">2:30 PM - 4:00 PM</div>
                  </div>
                  <div className="text-sm font-semibold">82% Win Rate</div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Thursday Morning</div>
                    <div className="text-xs text-muted-foreground">9:30 AM - 11:30 AM</div>
                  </div>
                  <div className="text-sm font-semibold">78% Win Rate</div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Wednesday Afternoon</div>
                    <div className="text-xs text-muted-foreground">1:30 PM - 3:30 PM</div>
                  </div>
                  <div className="text-sm font-semibold">74% Win Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Worst Trading Sessions</CardTitle>
              <CardDescription>Lowest win rate trading sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Monday Lunch</div>
                    <div className="text-xs text-muted-foreground">11:30 AM - 1:30 PM</div>
                  </div>
                  <div className="text-sm font-semibold">45% Win Rate</div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Wednesday Morning</div>
                    <div className="text-xs text-muted-foreground">9:30 AM - 10:30 AM</div>
                  </div>
                  <div className="text-sm font-semibold">52% Win Rate</div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Friday Morning</div>
                    <div className="text-xs text-muted-foreground">9:30 AM - 10:30 AM</div>
                  </div>
                  <div className="text-sm font-semibold">56% Win Rate</div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Thursday Lunch</div>
                    <div className="text-xs text-muted-foreground">11:30 AM - 1:30 PM</div>
                  </div>
                  <div className="text-sm font-semibold">58% Win Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Statistics;
