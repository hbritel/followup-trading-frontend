import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowDown, 
  ArrowDownUp, 
  ArrowUp, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Copy, 
  Edit, 
  ExternalLink, 
  MoreHorizontal, 
  Trash2
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';

import { Trade } from '@/components/trades/TradesTableWrapper';

const TradeTable = ({ trades }: { trades: Trade[] }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<keyof Trade>('entryDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const totalPages = Math.max(1, Math.ceil(trades.length / itemsPerPage));

  const handleSort = (column: keyof Trade) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column: keyof Trade) => {
    if (sortBy !== column) {
      return <ArrowDownUp className="h-4 w-4" />;
    }
    
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-4 w-4" /> 
      : <ArrowDown className="h-4 w-4" />;
  };

  const sortedTrades = [...trades].sort((a, b) => {
    if (sortBy === 'profit') {
      const valA = a.profit ?? 0;
      const valB = b.profit ?? 0;
      return sortOrder === 'asc' 
        ? valA - valB 
        : valB - valA;
    }
    
    const valA = a[sortBy]?.toString() || '';
    const valB = b[sortBy]?.toString() || '';
    
    return sortOrder === 'asc'
      ? valA.localeCompare(valB)
      : valB.localeCompare(valA);
  });

  const paginatedTrades = sortedTrades.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
  };

  const handleLastPage = () => {
    setCurrentPage(totalPages);
  };

  return (
    <Card className="glass-card animate-slide-up flex flex-col" style={{ animationDelay: '0.2s' }}>
      <CardHeader className="px-6 py-5 border-b border-slate-200/50 dark:border-white/5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight">Trade History</CardTitle>
            <CardDescription className="text-muted-foreground">Your recent trading activity</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/trades')} className="h-8 text-xs">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto min-h-0">
          <Table>
            <TableHeader className="bg-slate-100 dark:bg-white/5 sticky top-0 z-10">
              <TableRow className="border-slate-200/50 dark:border-white/5 hover:bg-transparent">
                <TableHead className="w-[100px] cursor-pointer hover:text-foreground dark:hover:text-white transition-colors text-xs uppercase tracking-wider font-semibold text-muted-foreground" onClick={() => handleSort('symbol')}>
                  <div className="flex items-center gap-1">
                    Symbol
                    {getSortIcon('symbol')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:text-foreground dark:hover:text-white transition-colors hidden md:table-cell text-xs uppercase tracking-wider font-semibold text-muted-foreground" onClick={() => handleSort('entryDate')}>
                  <div className="flex items-center gap-1">
                    Open Time
                    {getSortIcon('entryDate')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:text-foreground dark:hover:text-white transition-colors hidden md:table-cell text-xs uppercase tracking-wider font-semibold text-muted-foreground" onClick={() => handleSort('exitDate')}>
                  <div className="flex items-center gap-1">
                    Close Time
                    {getSortIcon('exitDate')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:text-foreground dark:hover:text-white transition-colors text-xs uppercase tracking-wider font-semibold text-muted-foreground" onClick={() => handleSort('direction')}>
                  <div className="flex items-center gap-1">
                    Position
                    {getSortIcon('direction')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:text-foreground dark:hover:text-white transition-colors text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground" onClick={() => handleSort('profit')}>
                  <div className="flex items-center gap-1 justify-end">
                    P&L
                    {getSortIcon('profit')}
                  </div>
                </TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTrades.map((trade) => (
                <TableRow key={trade.id} className="hover:bg-slate-100 dark:hover:bg-white/5 border-slate-200/50 dark:border-white/5 transition-colors group">
                  <TableCell className="font-bold text-foreground dark:text-white group-hover:text-primary transition-colors">
                    <div className="flex items-center font-mono">
                      {trade.symbol}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                    {trade.entryDate ? new Date(trade.entryDate).toLocaleString(undefined, {
                      year: '2-digit',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : '-'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                    {trade.exitDate ? new Date(trade.exitDate).toLocaleString(undefined, {
                      year: '2-digit',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize font-mono text-xs border backdrop-blur-sm",
                        trade.direction === 'long' || trade.direction === 'buy'
                          ? "border-primary/30 text-primary bg-primary/10"
                          : "border-accent/30 text-foreground dark:text-white bg-accent/20"
                      )}
                    >
                      {trade.direction === 'buy' ? 'long' : trade.direction === 'sell' ? 'short' : trade.direction}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-bold font-mono tracking-tight",
                    (trade.profit ?? 0) > 0 ? "text-profit" : (trade.profit ?? 0) < 0 ? "text-loss" : "text-muted-foreground"
                  )}>
                    {trade.profit !== undefined ? `${trade.profit > 0 ? "+" : ""}$${trade.profit.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-panel border-slate-200/50 dark:border-white/10">
                        <DropdownMenuItem className="cursor-pointer focus:bg-slate-200 dark:focus:bg-white/10 focus:text-foreground dark:focus:text-white">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer focus:bg-slate-200 dark:focus:bg-white/10 focus:text-foreground dark:focus:text-white">
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer focus:bg-slate-200 dark:focus:bg-white/10 focus:text-foreground dark:focus:text-white">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-white/10" />
                        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/50 dark:border-white/5 flex-shrink-0 mt-auto">
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground dark:text-white">{trades.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{' '}
            <span className="font-medium text-foreground dark:text-white">{Math.min(currentPage * itemsPerPage, trades.length)}</span> of{' '}
            <span className="font-medium text-foreground dark:text-white">{trades.length}</span> trades
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={handleFirstPage}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
              <span className="sr-only">First page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <div className="text-xs font-medium px-2">
              Page {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={handleLastPage}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
              <span className="sr-only">Last page</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradeTable;
