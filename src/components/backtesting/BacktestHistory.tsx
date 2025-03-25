
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, BarChart, Trash, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const BacktestHistory = () => {
  const { t } = useTranslation();
  
  // Mock data for backtest history
  const backtests = [
    { 
      id: 1, 
      name: "Moving Average Crossover", 
      symbol: "AAPL", 
      startDate: "2023-01-01",
      endDate: "2023-06-01",
      profit: 4200,
      profitPercent: 42,
      trades: 42,
      winRate: 58,
      runDate: "2023-06-15"
    },
    { 
      id: 2, 
      name: "RSI Oversold Strategy", 
      symbol: "MSFT", 
      startDate: "2023-02-01",
      endDate: "2023-05-01",
      profit: 3150,
      profitPercent: 31.5,
      trades: 28,
      winRate: 54,
      runDate: "2023-06-14"
    },
    { 
      id: 3, 
      name: "Bollinger Band Breakout", 
      symbol: "GOOGL", 
      startDate: "2023-01-15",
      endDate: "2023-05-15",
      profit: -1800,
      profitPercent: -18,
      trades: 35,
      winRate: 42,
      runDate: "2023-06-10"
    },
    { 
      id: 4, 
      name: "MACD Histogram Divergence", 
      symbol: "AMZN", 
      startDate: "2023-03-01",
      endDate: "2023-06-01",
      profit: 2750,
      profitPercent: 27.5,
      trades: 31,
      winRate: 52,
      runDate: "2023-06-08"
    },
    { 
      id: 5, 
      name: "Gap and Go Strategy", 
      symbol: "TSLA", 
      startDate: "2023-02-15",
      endDate: "2023-05-15",
      profit: 5600,
      profitPercent: 56,
      trades: 25,
      winRate: 64,
      runDate: "2023-06-05"
    },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('backtesting.backtestHistory')}</CardTitle>
        <CardDescription>{t('backtesting.backtestHistoryDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" className="p-0 h-8 font-medium">
                  {t('backtesting.name')}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>{t('backtesting.symbol')}</TableHead>
              <TableHead>{t('backtesting.period')}</TableHead>
              <TableHead>
                <Button variant="ghost" className="p-0 h-8 font-medium">
                  {t('backtesting.profit')}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>{t('backtesting.tradesWinRate')}</TableHead>
              <TableHead>{t('backtesting.runDate')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {backtests.map((backtest) => (
              <TableRow key={backtest.id}>
                <TableCell className="font-medium">{backtest.name}</TableCell>
                <TableCell>{backtest.symbol}</TableCell>
                <TableCell>{backtest.startDate.slice(5)} - {backtest.endDate.slice(5)}</TableCell>
                <TableCell>
                  <span className={backtest.profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                    ${backtest.profit.toLocaleString()} ({backtest.profitPercent}%)
                  </span>
                </TableCell>
                <TableCell>
                  {backtest.trades} / {backtest.winRate}%
                </TableCell>
                <TableCell>{backtest.runDate.slice(5)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <BarChart className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default BacktestHistory;
