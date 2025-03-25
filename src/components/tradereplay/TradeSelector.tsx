
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const TradeSelector = () => {
  const { t } = useTranslation();
  
  // Mock trade data
  const trades = [
    { id: 1, symbol: 'AAPL', date: '2023-05-15', type: 'Long', result: 'Win' },
    { id: 2, symbol: 'MSFT', date: '2023-05-10', type: 'Short', result: 'Loss' },
    { id: 3, symbol: 'GOOGL', date: '2023-05-08', type: 'Long', result: 'Win' },
    { id: 4, symbol: 'AMZN', date: '2023-05-05', type: 'Long', result: 'Loss' },
    { id: 5, symbol: 'TSLA', date: '2023-05-01', type: 'Short', result: 'Win' },
  ];
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="symbol">{t('tradeReplay.symbol')}</Label>
          <Select>
            <SelectTrigger id="symbol">
              <SelectValue placeholder={t('tradeReplay.selectSymbol')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('tradeReplay.allSymbols')}</SelectItem>
              <SelectItem value="AAPL">AAPL</SelectItem>
              <SelectItem value="MSFT">MSFT</SelectItem>
              <SelectItem value="GOOGL">GOOGL</SelectItem>
              <SelectItem value="AMZN">AMZN</SelectItem>
              <SelectItem value="TSLA">TSLA</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="result">{t('tradeReplay.result')}</Label>
          <Select>
            <SelectTrigger id="result">
              <SelectValue placeholder={t('tradeReplay.selectResult')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('tradeReplay.allResults')}</SelectItem>
              <SelectItem value="win">{t('tradeReplay.winning')}</SelectItem>
              <SelectItem value="loss">{t('tradeReplay.losing')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="date-range">{t('tradeReplay.dateRange')}</Label>
          <Select>
            <SelectTrigger id="date-range">
              <SelectValue placeholder={t('tradeReplay.selectDateRange')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('tradeReplay.allTime')}</SelectItem>
              <SelectItem value="30d">{t('tradeReplay.last30Days')}</SelectItem>
              <SelectItem value="90d">{t('tradeReplay.last90Days')}</SelectItem>
              <SelectItem value="ytd">{t('tradeReplay.yearToDate')}</SelectItem>
              <SelectItem value="custom">{t('tradeReplay.custom')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="search">{t('tradeReplay.search')}</Label>
          <div className="flex">
            <Input id="search" placeholder={t('tradeReplay.searchTrades')} />
            <Button variant="ghost" size="icon" className="ml-2">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {trades.map((trade) => (
          <Card 
            key={trade.id}
            className={`cursor-pointer hover:border-primary transition-colors ${trade.result === 'Win' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}`}
          >
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-base">{trade.symbol}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <p className="text-xs text-muted-foreground">{trade.date}</p>
              <div className="flex justify-between mt-1">
                <span className="text-xs">{trade.type}</span>
                <span className={`text-xs font-medium ${trade.result === 'Win' ? 'text-green-500' : 'text-red-500'}`}>
                  {trade.result}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TradeSelector;
