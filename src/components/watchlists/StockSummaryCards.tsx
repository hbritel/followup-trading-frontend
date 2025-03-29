
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StockData } from './StockTable';

interface StockSummaryCardsProps {
  stocks: StockData[];
}

const StockSummaryCards: React.FC<StockSummaryCardsProps> = ({ stocks }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Gainers</CardTitle>
          <CardDescription>Best performing stocks today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stocks
              .filter(stock => stock.changePercent > 0)
              .sort((a, b) => b.changePercent - a.changePercent)
              .slice(0, 5)
              .map((stock) => (
                <div key={stock.symbol} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{stock.symbol}</div>
                    <div className="text-xs text-muted-foreground">{stock.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${stock.price.toFixed(2)}</div>
                    <div className="text-xs text-green-600">+{stock.changePercent.toFixed(2)}%</div>
                  </div>
                </div>
              ))
            }
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Top Losers</CardTitle>
          <CardDescription>Worst performing stocks today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stocks
              .filter(stock => stock.changePercent < 0)
              .sort((a, b) => a.changePercent - b.changePercent)
              .slice(0, 5)
              .map((stock) => (
                <div key={stock.symbol} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{stock.symbol}</div>
                    <div className="text-xs text-muted-foreground">{stock.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${stock.price.toFixed(2)}</div>
                    <div className="text-xs text-red-600">{stock.changePercent.toFixed(2)}%</div>
                  </div>
                </div>
              ))
            }
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>By Market Cap</CardTitle>
          <CardDescription>Largest companies by capitalization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stocks
              .sort((a, b) => {
                const aValue = parseFloat(a.marketCap.replace(/[^0-9.]/g, ''));
                const bValue = parseFloat(b.marketCap.replace(/[^0-9.]/g, ''));
                return bValue - aValue;
              })
              .slice(0, 5)
              .map((stock, index) => (
                <div key={stock.symbol} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">
                      <Badge variant="outline" className="mr-2">{index + 1}</Badge>
                      {stock.symbol}
                    </div>
                    <div className="text-xs text-muted-foreground">{stock.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{stock.marketCap}</div>
                    <div className="text-xs text-muted-foreground">Market Cap</div>
                  </div>
                </div>
              ))
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockSummaryCards;
