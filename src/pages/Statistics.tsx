
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Sample data for trade distribution
const tradeDistributionData = [
  { name: 'Winning Trades', value: 68 },
  { name: 'Losing Trades', value: 32 },
];

const COLORS = ['#1E40AF', '#dc2626'];

// Sample data for trade performance by day
const tradeDayData = [
  { day: 'Mon', wins: 15, losses: 6 },
  { day: 'Tue', wins: 18, losses: 4 },
  { day: 'Wed', wins: 12, losses: 9 },
  { day: 'Thu', wins: 16, losses: 7 },
  { day: 'Fri', wins: 14, losses: 8 },
];

// Sample data for trade performance by time
const tradeTimeData = [
  { time: '09:30', wins: 12, losses: 3 },
  { time: '10:30', wins: 18, losses: 5 },
  { time: '11:30', wins: 14, losses: 7 },
  { time: '12:30', wins: 10, losses: 8 },
  { time: '13:30', wins: 8, losses: 9 },
  { time: '14:30', wins: 15, losses: 6 },
  { time: '15:30', wins: 20, losses: 4 },
];

// Sample metrics data
const metricsData = [
  { name: 'Win Rate', value: 68, target: 70, format: '%' },
  { name: 'Profit Factor', value: 2.4, target: 2.5, format: 'x' },
  { name: 'Risk-Reward Ratio', value: 1.8, target: 2.0, format: 'x' },
  { name: 'Average Win', value: 245, target: 250, format: '$' },
  { name: 'Average Loss', value: 136, target: 125, format: '$' },
  { name: 'Maximum Drawdown', value: 12, target: 10, format: '%' },
];

const Statistics = () => {
  return (
    <DashboardLayout pageTitle="Statistics">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Trading Statistics</h1>
            <p className="text-muted-foreground">Detailed analysis of your trading performance</p>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Trade Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">285</div>
              <div className="text-xs text-muted-foreground mt-1">
                Average 23.8 trades per month
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">68%</div>
              <div className="text-xs text-muted-foreground mt-1">
                194 wins, 91 losses
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Profit Factor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4x</div>
              <div className="text-xs text-muted-foreground mt-1">
                Gross profit / gross loss ratio
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Average R:R</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.8:1</div>
              <div className="text-xs text-muted-foreground mt-1">
                Average risk-reward ratio
              </div>
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
              <div className="space-y-6">
                {metricsData.map((metric) => (
                  <div key={metric.name} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{metric.name}</span>
                      <span className="text-sm">
                        {metric.format === '$' ? `$${metric.value}` : `${metric.value}${metric.format}`} 
                        <span className="text-muted-foreground"> / Target: </span>
                        {metric.format === '$' ? `$${metric.target}` : `${metric.target}${metric.format}`}
                      </span>
                    </div>
                    <Progress 
                      value={(metric.value / metric.target) * 100} 
                      className="h-2" 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Trade Distribution</CardTitle>
              <CardDescription>Win vs loss ratio</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
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
                    <YAxis id="day-axis" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="wins" name="Winning Trades" stackId="a" fill="#1E40AF" yAxisId="day-axis" />
                    <Bar dataKey="losses" name="Losing Trades" stackId="a" fill="#dc2626" yAxisId="day-axis" />
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
                    <YAxis id="time-axis" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="wins" name="Winning Trades" stackId="a" fill="#1E40AF" yAxisId="time-axis" />
                    <Bar dataKey="losses" name="Losing Trades" stackId="a" fill="#dc2626" yAxisId="time-axis" />
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
