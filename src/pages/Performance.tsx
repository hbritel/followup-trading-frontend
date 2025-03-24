
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

const performanceData = [
  { date: '2023-01', profit: 1250, trades: 12, winRate: 75 },
  { date: '2023-02', profit: 1820, trades: 15, winRate: 80 },
  { date: '2023-03', profit: 1420, trades: 18, winRate: 72 },
  { date: '2023-04', profit: 2150, trades: 14, winRate: 85 },
  { date: '2023-05', profit: 1950, trades: 16, winRate: 81 },
  { date: '2023-06', profit: 2450, trades: 20, winRate: 70 },
  { date: '2023-07', profit: 2100, trades: 17, winRate: 82 },
  { date: '2023-08', profit: 2780, trades: 22, winRate: 77 },
  { date: '2023-09', profit: 3120, trades: 25, winRate: 84 },
  { date: '2023-10', profit: 2850, trades: 20, winRate: 80 },
  { date: '2023-11', profit: 3350, trades: 23, winRate: 87 },
  { date: '2023-12', profit: 3780, trades: 28, winRate: 89 },
];

// Format data
const chartData = performanceData.map(item => ({
  ...item,
  month: item.date.split('-')[1],
  winRate: item.winRate / 100, // Convert to decimal for the chart
}));

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formattedChartData = chartData.map(item => ({
  ...item,
  month: monthNames[parseInt(item.month) - 1],
}));

const Performance = () => {
  return (
    <DashboardLayout pageTitle="Performance">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Performance Analytics</h1>
            <p className="text-muted-foreground">Track and analyze your trading performance</p>
          </div>
          <div className="flex gap-2">
            <Select defaultValue="1y">
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 Month</SelectItem>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$3,780.00</div>
              <p className="text-xs text-profit flex items-center mt-1">
                <span className="i-lucide-trending-up mr-1"></span>
                +12.8% from previous period
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Average Win</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$245.32</div>
              <p className="text-xs text-profit flex items-center mt-1">
                <span className="i-lucide-trending-up mr-1"></span>
                +5.3% from previous period
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">82.4%</div>
              <p className="text-xs text-profit flex items-center mt-1">
                <span className="i-lucide-trending-up mr-1"></span>
                +3.1% from previous period
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="profit">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="profit">Profit</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
            <TabsTrigger value="winrate">Win Rate</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profit Over Time</CardTitle>
                <CardDescription>Monthly profit performance</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, 'Profit']}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="profit" 
                      name="Profit" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trades" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trade Volume</CardTitle>
                <CardDescription>Number of trades per month</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="trades" 
                      name="Number of Trades" 
                      fill="#82ca9d" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="winrate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Win Rate</CardTitle>
                <CardDescription>Monthly win rate percentage</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(tick) => `${Math.round(tick * 100)}%`} />
                    <Tooltip 
                      formatter={(value) => [`${Math.round(value * 100)}%`, 'Win Rate']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="winRate" 
                      name="Win Rate" 
                      stroke="#ff7300" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Best Performing Assets</CardTitle>
              <CardDescription>Top trading symbols by profit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="font-medium">AAPL</div>
                  <div className="text-profit">+$1,245.67</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-medium">MSFT</div>
                  <div className="text-profit">+$987.32</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-medium">AMZN</div>
                  <div className="text-profit">+$754.21</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-medium">GOOGL</div>
                  <div className="text-profit">+$632.45</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-medium">NVDA</div>
                  <div className="text-profit">+$521.89</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Worst Performing Assets</CardTitle>
              <CardDescription>Bottom trading symbols by loss</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="font-medium">TSLA</div>
                  <div className="text-loss">-$432.87</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-medium">NFLX</div>
                  <div className="text-loss">-$321.54</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-medium">INTC</div>
                  <div className="text-loss">-$276.32</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-medium">PYPL</div>
                  <div className="text-loss">-$198.76</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-medium">AMD</div>
                  <div className="text-loss">-$145.23</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Performance;
