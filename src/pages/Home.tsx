
import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TradingStats from '@/components/dashboard/TradingStats';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import NewTradeDialog from '@/components/dialogs/NewTradeDialog';

const Home = () => {
  const navigate = useNavigate();
  
  return (
    <DashboardLayout pageTitle="Welcome to DashNest Trader">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <NewTradeDialog 
                  trigger={
                    <Button variant="outline" className="h-auto py-4 justify-start w-full">
                      <div className="flex flex-col items-start text-left">
                        <div className="flex items-center mb-1">
                          <PlusCircle className="h-4 w-4 mr-1" />
                          <span className="font-medium">New Trade</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Record a new trading position</span>
                      </div>
                    </Button>
                  }
                />
                
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start"
                  onClick={() => navigate('/performance')}
                >
                  <div className="flex flex-col items-start text-left">
                    <div className="flex items-center mb-1">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span className="font-medium">View P&L</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Check your profit and loss</span>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start"
                  onClick={() => navigate('/activity')}
                >
                  <div className="flex flex-col items-start text-left">
                    <div className="flex items-center mb-1">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="font-medium">Recent</span>
                    </div>
                    <span className="text-xs text-muted-foreground">View recent activities</span>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start"
                  onClick={() => navigate('/calendar')}
                >
                  <div className="flex flex-col items-start text-left">
                    <div className="flex items-center mb-1">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="font-medium">Reminders</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Set up trade reminders</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Trading Summary</CardTitle>
              <CardDescription>Recent trading performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Today's P&L</h3>
                    <p className="text-sm text-muted-foreground">3 trades</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-profit">+$142.56</p>
                    <p className="text-sm text-profit">+1.24%</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">This Week</h3>
                    <p className="text-sm text-muted-foreground">12 trades</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-profit">+$567.23</p>
                    <p className="text-sm text-profit">+3.85%</p>
                  </div>
                </div>
                
                <Button 
                  variant="link" 
                  className="w-full justify-between mt-2 px-0"
                  onClick={() => navigate('/performance')}
                >
                  <span>View detailed performance</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <TradingStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
              <CardDescription>Your last 5 trading activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <div className="px-4 py-3 border-b flex items-center justify-between text-sm">
                  <div className="font-medium">AAPL</div>
                  <div className="font-medium text-profit">+$125.32</div>
                </div>
                <div className="px-4 py-3 border-b flex items-center justify-between text-sm">
                  <div className="font-medium">MSFT</div>
                  <div className="font-medium text-profit">+$87.45</div>
                </div>
                <div className="px-4 py-3 border-b flex items-center justify-between text-sm">
                  <div className="font-medium">TSLA</div>
                  <div className="font-medium text-loss">-$43.21</div>
                </div>
                <div className="px-4 py-3 border-b flex items-center justify-between text-sm">
                  <div className="font-medium">AMZN</div>
                  <div className="font-medium text-profit">+$102.67</div>
                </div>
                <div className="px-4 py-3 flex items-center justify-between text-sm">
                  <div className="font-medium">GOOGL</div>
                  <div className="font-medium text-profit">+$65.43</div>
                </div>
              </div>
              <Button 
                variant="link" 
                className="mt-4 px-0"
                onClick={() => navigate('/trades')}
              >
                View all trades
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Watchlist Alerts</CardTitle>
              <CardDescription>Price movements on your watchlist</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="font-medium">NVDA</div>
                  <div className="text-profit">+2.34%</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-medium">META</div>
                  <div className="text-profit">+1.56%</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-medium">AMD</div>
                  <div className="text-loss">-0.87%</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-medium">INTC</div>
                  <div className="text-loss">-1.23%</div>
                </div>
                <Button 
                  variant="link" 
                  className="mt-2 px-0"
                  onClick={() => navigate('/watchlists')}
                >
                  Manage watchlists
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;
