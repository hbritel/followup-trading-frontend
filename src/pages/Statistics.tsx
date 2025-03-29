import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Statistics = () => {
  return (
    <DashboardLayout pageTitle="Statistics">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Trading Statistics</h1>
          <p className="text-muted-foreground">Comprehensive analysis of your trading metrics</p>
        </div>
        
        {/* Placeholder content for Statistics page */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">68%</div>
              <p className="text-sm text-muted-foreground">Last 90 days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Profit Factor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.8</div>
              <p className="text-sm text-muted-foreground">Last 90 days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Average Win</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$245.32</div>
              <p className="text-sm text-muted-foreground">Last 90 days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Average Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-$128.45</div>
              <p className="text-sm text-muted-foreground">Last 90 days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Total Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">86</div>
              <p className="text-sm text-muted-foreground">Last 90 days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Net Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$5,842.18</div>
              <p className="text-sm text-muted-foreground">Last 90 days</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Additional statistical charts and metrics would go here */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">Chart placeholder - Performance metrics over time</div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Statistics;
