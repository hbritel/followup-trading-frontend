
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Clock, Filter, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const activityData = [
  {
    id: 1,
    type: 'trade',
    action: 'buy',
    description: 'Bought 10 shares of AAPL at $182.52',
    timestamp: '2023-06-12T10:23:15',
    status: 'completed',
    account: 'Main Trading',
  },
  {
    id: 2,
    type: 'trade',
    action: 'sell',
    description: 'Sold 5 shares of MSFT at $337.94',
    timestamp: '2023-06-12T09:45:28',
    status: 'completed',
    account: 'Main Trading',
  },
  {
    id: 3,
    type: 'system',
    action: 'alert',
    description: 'Price alert triggered for TSLA at $190.00',
    timestamp: '2023-06-11T15:12:43',
    status: 'notification',
    account: 'System',
  },
  {
    id: 4,
    type: 'account',
    action: 'deposit',
    description: 'Deposited $5,000.00 to Trading Account',
    timestamp: '2023-06-10T11:05:32',
    status: 'completed',
    account: 'Main Trading',
  },
  {
    id: 5,
    type: 'trade',
    action: 'buy',
    description: 'Bought 15 shares of AMZN at $127.90',
    timestamp: '2023-06-09T14:23:51',
    status: 'completed',
    account: 'Retirement',
  },
  {
    id: 6,
    type: 'watchlist',
    action: 'add',
    description: 'Added NVDA to Tech Stocks watchlist',
    timestamp: '2023-06-09T10:45:12',
    status: 'completed',
    account: 'System',
  },
  {
    id: 7,
    type: 'system',
    action: 'login',
    description: 'New login from Chrome on Windows',
    timestamp: '2023-06-08T09:12:38',
    status: 'security',
    account: 'System',
  },
  {
    id: 8,
    type: 'trade',
    action: 'sell',
    description: 'Sold 8 shares of TSLA at $193.17',
    timestamp: '2023-06-08T11:34:27',
    status: 'completed',
    account: 'Options Trading',
  },
  {
    id: 9,
    type: 'account',
    action: 'withdrawal',
    description: 'Withdrew $2,500.00 from Trading Account',
    timestamp: '2023-06-07T16:48:15',
    status: 'completed',
    account: 'Main Trading',
  },
  {
    id: 10,
    type: 'system',
    action: 'error',
    description: 'Failed to update portfolio data',
    timestamp: '2023-06-07T12:15:42',
    status: 'error',
    account: 'System',
  },
  {
    id: 11,
    type: 'trade',
    action: 'buy',
    description: 'Bought 12 shares of GOOGL at $122.23',
    timestamp: '2023-06-06T10:56:33',
    status: 'completed',
    account: 'Main Trading',
  },
  {
    id: 12,
    type: 'watchlist',
    action: 'remove',
    description: 'Removed IBM from Tech Stocks watchlist',
    timestamp: '2023-06-06T09:23:18',
    status: 'completed',
    account: 'System',
  },
];

const getActivityStatusVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'outline';
    case 'error':
      return 'destructive';
    case 'notification':
      return 'secondary';
    case 'security':
      return 'default';
    default:
      return 'outline';
  }
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'trade':
      return <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </div>;
    case 'system':
      return <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
        <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>;
    case 'account':
      return <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
        <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>;
    case 'watchlist':
      return <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
        <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </div>;
    default:
      return <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const Activity = () => {
  return (
    <DashboardLayout pageTitle="Activity">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Activity Log</h1>
            <p className="text-muted-foreground">Track all actions and events in your account</p>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions across all accounts and systems</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search activities..."
                    className="pl-8 w-60"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="trades">Trades</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                <div className="space-y-4">
                  {activityData.map((activity) => (
                    <div key={activity.id} className="flex gap-4 p-3 rounded-lg border bg-card">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{activity.description}</span>
                          <Badge variant={getActivityStatusVariant(activity.status)}>
                            {activity.status}
                          </Badge>
                        </div>
                        <div className="flex mt-1 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(activity.timestamp)}
                          </div>
                          <span className="mx-2">•</span>
                          <span>{activity.account}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" className="w-full">
                  Load More
                </Button>
              </TabsContent>
              
              <TabsContent value="trades" className="space-y-4">
                <div className="space-y-4">
                  {activityData
                    .filter(activity => activity.type === 'trade')
                    .map((activity) => (
                      <div key={activity.id} className="flex gap-4 p-3 rounded-lg border bg-card">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{activity.description}</span>
                            <Badge variant={getActivityStatusVariant(activity.status)}>
                              {activity.status}
                            </Badge>
                          </div>
                          <div className="flex mt-1 text-xs text-muted-foreground">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(activity.timestamp)}
                            </div>
                            <span className="mx-2">•</span>
                            <span>{activity.account}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
              
              <TabsContent value="account" className="space-y-4">
                <div className="space-y-4">
                  {activityData
                    .filter(activity => activity.type === 'account')
                    .map((activity) => (
                      <div key={activity.id} className="flex gap-4 p-3 rounded-lg border bg-card">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{activity.description}</span>
                            <Badge variant={getActivityStatusVariant(activity.status)}>
                              {activity.status}
                            </Badge>
                          </div>
                          <div className="flex mt-1 text-xs text-muted-foreground">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(activity.timestamp)}
                            </div>
                            <span className="mx-2">•</span>
                            <span>{activity.account}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
              
              <TabsContent value="system" className="space-y-4">
                <div className="space-y-4">
                  {activityData
                    .filter(activity => activity.type === 'system' || activity.type === 'watchlist')
                    .map((activity) => (
                      <div key={activity.id} className="flex gap-4 p-3 rounded-lg border bg-card">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{activity.description}</span>
                            <Badge variant={getActivityStatusVariant(activity.status)}>
                              {activity.status}
                            </Badge>
                          </div>
                          <div className="flex mt-1 text-xs text-muted-foreground">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(activity.timestamp)}
                            </div>
                            <span className="mx-2">•</span>
                            <span>{activity.account}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total Activities</span>
                  <span className="text-sm">{activityData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Trade Operations</span>
                  <span className="text-sm">{activityData.filter(a => a.type === 'trade').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Account Changes</span>
                  <span className="text-sm">{activityData.filter(a => a.type === 'account').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">System Events</span>
                  <span className="text-sm">{activityData.filter(a => a.type === 'system').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Watchlist Updates</span>
                  <span className="text-sm">{activityData.filter(a => a.type === 'watchlist').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Logins</CardTitle>
              <CardDescription>Last 5 login activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Chrome on Windows</div>
                    <div className="text-xs text-muted-foreground">June 8, 9:12 AM</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Safari on macOS</div>
                    <div className="text-xs text-muted-foreground">June 7, 2:45 PM</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Chrome on Android</div>
                    <div className="text-xs text-muted-foreground">June 6, 5:18 PM</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
              <CardDescription>Recent security notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border p-3">
                  <div className="font-medium">New device login</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    New login detected from Chrome on Windows
                  </p>
                  <div className="text-xs text-muted-foreground mt-2">June 8, 9:12 AM</div>
                </div>
                
                <div className="rounded-md border p-3">
                  <div className="font-medium">Password changed</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your account password was changed
                  </p>
                  <div className="text-xs text-muted-foreground mt-2">June 5, 3:45 PM</div>
                </div>
                
                <Button variant="link" className="pl-0">View all security alerts</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Activity;
