
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Download, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Sample monthly performance data
const monthlyData = [
  { id: 1, month: 'January', year: 2022, profit: 1280.42, loss: -450.18, total: 830.24, trades: 28, winRate: 71 },
  { id: 2, month: 'February', year: 2022, profit: 1542.36, loss: -680.74, total: 861.62, trades: 32, winRate: 68 },
  { id: 3, month: 'March', year: 2022, profit: 2150.47, loss: -782.35, total: 1368.12, trades: 41, winRate: 76 },
];

// Sample monthly symbol performance data
const symbolData = [
  { id: 1, symbol: 'AAPL', profit: 680.24, loss: -120.50, total: 559.74, trades: 12, winRate: 83 },
  { id: 2, symbol: 'MSFT', profit: 425.18, loss: -150.30, total: 274.88, trades: 8, winRate: 75 },
  { id: 3, symbol: 'GOOGL', profit: 380.45, loss: -95.75, total: 284.70, trades: 6, winRate: 83 },
  { id: 4, symbol: 'AMZN', profit: 290.40, loss: -180.60, total: 109.80, trades: 7, winRate: 57 },
  { id: 5, symbol: 'NVDA', profit: 374.20, loss: -85.20, total: 289.00, trades: 5, winRate: 80 },
  { id: 6, symbol: 'META', profit: 0, loss: -150.00, total: -150.00, trades: 3, winRate: 0 },
];

// Sample strategy performance data
const strategyData = [
  { id: 1, strategy: 'Swing', profit: 850.35, loss: -230.45, total: 619.90, trades: 15, winRate: 80 },
  { id: 2, strategy: 'Breakout', profit: 720.42, loss: -180.30, total: 540.12, trades: 12, winRate: 75 },
  { id: 3, strategy: 'Reversal', profit: 580.70, loss: -370.60, total: 210.10, trades: 14, winRate: 64 },
];

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const Performance = () => {
  const [timeRange, setTimeRange] = useState('3m'); // Default to 3 months
  const { toast } = useToast();
  
  // Summary statistics
  const totalProfit = 3059.23;
  const totalLoss = -1913.27;
  const netProfitLoss = totalProfit + totalLoss;
  const winRate = 72;
  const totalTrades = 101;

  const handleFilter = () => {
    toast({
      title: "Filter Applied",
      description: "Performance data filtered to selected criteria.",
    });
  };

  const handleExport = () => {
    toast({
      title: "Data Exported",
      description: "Performance data has been exported successfully.",
    });
  };
  
  return (
    <DashboardLayout pageTitle="Performance">
      <div className="space-y-6">
        {/* Performance summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Net P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(netProfitLoss)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 3 months
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {winRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(winRate * totalTrades / 100)} wins / {totalTrades} trades
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(totalProfit / Math.abs(totalLoss)).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Gross profit / Gross loss
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Performance charts */}
        <PerformanceChart />
        
        {/* Performance tables */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Performance Analysis</CardTitle>
                <CardDescription>Detailed breakdown of your trading performance</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleFilter}>
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="monthly">
              <TabsList>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="symbols">Symbols</TabsTrigger>
                <TabsTrigger value="strategies">Strategies</TabsTrigger>
              </TabsList>
              
              <TabsContent value="monthly" className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-sm">Month</th>
                        <th className="text-right py-3 px-4 font-medium text-sm">Profit</th>
                        <th className="text-right py-3 px-4 font-medium text-sm">Loss</th>
                        <th className="text-right py-3 px-4 font-medium text-sm">Total</th>
                        <th className="text-right py-3 px-4 font-medium text-sm">Trades</th>
                        <th className="text-right py-3 px-4 font-medium text-sm">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-3 px-4 text-sm">{item.month} {item.year}</td>
                          <td className="py-3 px-4 text-sm text-right text-profit">
                            {formatCurrency(item.profit)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-loss">
                            {formatCurrency(item.loss)}
                          </td>
                          <td className={cn("py-3 px-4 text-sm font-medium text-right", 
                            item.total >= 0 ? "text-profit" : "text-loss")}>
                            {formatCurrency(item.total)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right">{item.trades}</td>
                          <td className="py-3 px-4 text-sm text-right">{item.winRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              
              <TabsContent value="symbols" className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-sm">Symbol</th>
                        <th className="text-right py-3 px-4 font-medium text-sm">Profit</th>
                        <th className="text-right py-3 px-4 font-medium text-sm">Loss</th>
                        <th className="text-right py-3 px-4 font-medium text-sm">Total</th>
                        <th className="text-right py-3 px-4 font-medium text-sm">Trades</th>
                        <th className="text-right py-3 px-4 font-medium text-sm">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {symbolData.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-3 px-4 text-sm">{item.symbol}</td>
                          <td className="py-3 px-4 text-sm text-right text-profit">
                            {formatCurrency(item.profit)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-loss">
                            {formatCurrency(item.loss)}
                          </td>
                          <td className={cn("py-3 px-4 text-sm font-medium text-right", 
                            item.total >= 0 ? "text-profit" : "text-loss")}>
                            {formatCurrency(item.total)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right">{item.trades}</td>
                          <td className="py-3 px-4 text-sm text-right">{item.winRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              
              <TabsContent value="strategies" className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-sm">Strategy</th>
                        <th className="text-right py-3 px-4 font-medium text-sm">Profit</th>
                        <th className="text-right py-3 px-4 font-medium text-sm">Loss</th>
                        <th className="text-right py-3 px-4 font-medium text-sm">Total</th>
                        <th className="text-right py-3 px-4 font-medium text-sm">Trades</th>
                        <th className="text-right py-3 px-4 font-medium text-sm">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {strategyData.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-3 px-4 text-sm">{item.strategy}</td>
                          <td className="py-3 px-4 text-sm text-right text-profit">
                            {formatCurrency(item.profit)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-loss">
                            {formatCurrency(item.loss)}
                          </td>
                          <td className={cn("py-3 px-4 text-sm font-medium text-right", 
                            item.total >= 0 ? "text-profit" : "text-loss")}>
                            {formatCurrency(item.total)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right">{item.trades}</td>
                          <td className="py-3 px-4 text-sm text-right">{item.winRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Performance;
