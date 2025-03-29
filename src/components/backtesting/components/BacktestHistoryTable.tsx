
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, BarChart, Trash, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface BacktestData {
  id: number;
  name: string;
  symbol: string;
  startDate: string;
  endDate: string;
  profit: number;
  profitPercent: number;
  trades: number;
  winRate: number;
  runDate: string;
}

interface BacktestHistoryTableProps {
  backtests: BacktestData[];
}

const BacktestHistoryTable = ({ backtests }: BacktestHistoryTableProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const handleViewBacktest = (id: number) => {
    toast({
      title: "Viewing Backtest",
      description: `Viewing backtest #${id} details.`,
    });
  };
  
  const handleViewChart = (id: number) => {
    toast({
      title: "Viewing Chart",
      description: `Viewing performance chart for backtest #${id}.`,
    });
  };
  
  const handleDeleteBacktest = (id: number) => {
    toast({
      title: "Backtest Deleted",
      description: `Backtest #${id} has been deleted.`,
      variant: "destructive",
    });
  };
  
  return (
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
                <Button size="icon" variant="ghost" onClick={() => handleViewBacktest(backtest.id)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleViewChart(backtest.id)}>
                  <BarChart className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDeleteBacktest(backtest.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default BacktestHistoryTable;
