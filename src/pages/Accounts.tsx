
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowUpRight, CreditCard, RefreshCw, ExternalLink } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const accountsData = [
  {
    id: 1,
    name: 'Trading Account (Main)',
    broker: 'Interactive Brokers',
    balance: 58742.63,
    buyingPower: 117485.26,
    positions: 12,
    status: 'active',
    change: '+2.34%',
    changeAmount: '+1346.28',
  },
  {
    id: 2,
    name: 'Retirement Account',
    broker: 'Fidelity',
    balance: 124836.49,
    buyingPower: 0,
    positions: 18,
    status: 'active',
    change: '+0.87%',
    changeAmount: '+1076.28',
  },
  {
    id: 3,
    name: 'Options Trading',
    broker: 'ThinkorSwim',
    balance: 24516.82,
    buyingPower: 24516.82,
    positions: 5,
    status: 'active',
    change: '-1.24%',
    changeAmount: '-308.23',
  },
  {
    id: 4,
    name: 'Forex Trading',
    broker: 'Oanda',
    balance: 10825.47,
    buyingPower: 108254.70,
    positions: 3,
    status: 'active',
    change: '+0.56%',
    changeAmount: '+60.15',
  },
  {
    id: 5,
    name: 'Paper Trading',
    broker: 'TradingView',
    balance: 100000.00,
    buyingPower: 100000.00,
    positions: 8,
    status: 'demo',
    change: '-0.78%',
    changeAmount: '-786.42',
  },
];

const Accounts = () => {
  return (
    <DashboardLayout pageTitle="Accounts">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Trading Accounts</h1>
            <p className="text-muted-foreground">Manage your connected trading accounts</p>
          </div>
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Link Account
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$218,921.41</div>
              <div className="flex items-center text-xs text-profit mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                <span>+$2,174.48 (1.18%)</span>
              </div>
              <div className="mt-4">
                <Progress value={78} className="h-1.5" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Target: $280,000</span>
                  <span>78% Complete</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Open Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">46</div>
              <div className="text-xs text-muted-foreground mt-1">
                <span>Across 5 accounts</span>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs font-medium">
                  <span>Profit:</span>
                  <span className="text-profit">28 positions</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span>Loss:</span>
                  <span className="text-loss">18 positions</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total Buying Power</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$350,256.78</div>
              <div className="text-xs text-muted-foreground mt-1">
                <span>With margin across all accounts</span>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs font-medium">
                  <span>Margin Used:</span>
                  <span>32%</span>
                </div>
                <Progress value={32} className="h-1.5 mt-1" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Linked Accounts</CardTitle>
            <CardDescription>Manage your connected trading and investment accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {accountsData.map((account) => (
              <div 
                key={account.id} 
                className="mb-4 last:mb-0 border rounded-lg overflow-hidden"
              >
                <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between border-b">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">{account.name}</h3>
                      <Badge variant={account.status === 'active' ? 'outline' : 'secondary'}>
                        {account.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{account.broker}</p>
                  </div>
                  <div className="mt-2 md:mt-0 flex gap-2">
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/40 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Balance</div>
                      <div className="font-medium">${account.balance.toLocaleString()}</div>
                      <div className={`text-xs ${account.change.startsWith('+') ? 'text-profit' : 'text-loss'}`}>
                        {account.change} (${account.changeAmount})
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Buying Power</div>
                      <div className="font-medium">${account.buyingPower.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Positions</div>
                      <div className="font-medium">{account.positions}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Allocation</div>
                      <div className="font-medium">
                        {((account.balance / 218921.41) * 100).toFixed(1)}%
                      </div>
                      <Progress 
                        value={((account.balance / 218921.41) * 100)} 
                        className="h-1.5 mt-1" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full mt-4">
              <PlusCircle className="h-4 w-4 mr-2" />
              Connect New Account
            </Button>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="allocation">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="allocation">Portfolio Allocation</TabsTrigger>
            <TabsTrigger value="performance">Account Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="allocation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
                <CardDescription>Distribution of assets across accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Stocks</span>
                      <span className="text-sm">65%</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">ETFs</span>
                      <span className="text-sm">15%</span>
                    </div>
                    <Progress value={15} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Options</span>
                      <span className="text-sm">8%</span>
                    </div>
                    <Progress value={8} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Forex</span>
                      <span className="text-sm">5%</span>
                    </div>
                    <Progress value={5} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Cash</span>
                      <span className="text-sm">7%</span>
                    </div>
                    <Progress value={7} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Performance Comparison</CardTitle>
                <CardDescription>Performance metrics for connected accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accountsData.map((account) => (
                    <div key={account.id}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{account.name}</span>
                        <span className={`text-sm ${account.change.startsWith('+') ? 'text-profit' : 'text-loss'}`}>
                          {account.change}
                        </span>
                      </div>
                      <Progress 
                        value={parseFloat(account.change.replace(/[^0-9.-]+/g, "")) * 10} 
                        className={`h-2 ${account.change.startsWith('+') ? 'bg-profit' : 'bg-loss'}`} 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Accounts;
