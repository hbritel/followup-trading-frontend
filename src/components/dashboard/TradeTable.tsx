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

interface Trade {
  id: string;
  symbol: string;
  openDate: string;
  closeDate: string;
  position: 'long' | 'short';
  profitLoss: number;
  status: 'open' | 'closed';
}

const sampleTrades: Trade[] = [
  {
    id: '1',
    symbol: 'NVDA',
    openDate: '2022-03-22 10:23:11',
    closeDate: '2022-03-22 10:30:45',
    position: 'long',
    profitLoss: 62.11,
    status: 'closed'
  },
  {
    id: '2',
    symbol: 'AAPL',
    openDate: '2022-03-16 10:31:55',
    closeDate: '2022-03-16 11:01:21',
    position: 'long',
    profitLoss: 37.00,
    status: 'closed'
  },
  {
    id: '3',
    symbol: 'MSFT',
    openDate: '2022-03-10 10:47:22',
    closeDate: '2022-03-10 10:57:33',
    position: 'long',
    profitLoss: -12.50,
    status: 'closed'
  },
  {
    id: '4',
    symbol: 'CGC',
    openDate: '2022-03-04 11:39:21',
    closeDate: '2022-03-04 13:08:22',
    position: 'long',
    profitLoss: 10.00,
    status: 'closed'
  },
  {
    id: '5',
    symbol: 'SOFI',
    openDate: '2022-03-02 11:04:23',
    closeDate: '2022-03-02 11:11:53',
    position: 'long',
    profitLoss: 5.04,
    status: 'closed'
  },
  {
    id: '6',
    symbol: 'TQQQ',
    openDate: '2022-02-23 09:18:53',
    closeDate: '2022-02-23 09:32:52',
    position: 'long',
    profitLoss: -3.42,
    status: 'closed'
  },
  {
    id: '7',
    symbol: 'DYN',
    openDate: '2022-02-18 10:35:16',
    closeDate: '2022-02-22 11:45:22',
    position: 'long',
    profitLoss: -6.10,
    status: 'closed'
  },
  {
    id: '8',
    symbol: 'PACB',
    openDate: '2022-01-12 09:32:08',
    closeDate: '2022-01-12 11:15:02',
    position: 'short',
    profitLoss: 11.15,
    status: 'closed'
  },
  {
    id: '9',
    symbol: 'OPEN',
    openDate: '2022-01-12 09:56:15',
    closeDate: '2022-01-12 11:01:42',
    position: 'long',
    profitLoss: 7.53,
    status: 'closed'
  },
  {
    id: '10',
    symbol: 'GM',
    openDate: '2021-12-18 14:22:00',
    closeDate: '2021-12-29 10:33:32',
    position: 'long',
    profitLoss: 7.40,
    status: 'closed'
  }
];

const TradeTable = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<keyof Trade>('openDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const totalPages = Math.ceil(sampleTrades.length / itemsPerPage);

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

  const sortedTrades = [...sampleTrades].sort((a, b) => {
    if (sortBy === 'profitLoss') {
      return sortOrder === 'asc' 
        ? a.profitLoss - b.profitLoss 
        : b.profitLoss - a.profitLoss;
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
    <Card className="glass-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <CardHeader className="px-6 py-5 border-b border-slate-200/50 dark:border-white/5">
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
      <CardContent className="p-0 overflow-auto">
        <Table>
          <TableHeader className="bg-slate-100 dark:bg-white/5">
            <TableRow className="border-slate-200/50 dark:border-white/5 hover:bg-transparent">
              <TableHead className="w-[100px] cursor-pointer hover:text-foreground dark:hover:text-white transition-colors text-xs uppercase tracking-wider font-semibold text-muted-foreground" onClick={() => handleSort('symbol')}>
                <div className="flex items-center gap-1">
                  Symbol
                  {getSortIcon('symbol')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-foreground dark:hover:text-white transition-colors hidden md:table-cell text-xs uppercase tracking-wider font-semibold text-muted-foreground" onClick={() => handleSort('openDate')}>
                <div className="flex items-center gap-1">
                  Open Time
                  {getSortIcon('openDate')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-foreground dark:hover:text-white transition-colors hidden md:table-cell text-xs uppercase tracking-wider font-semibold text-muted-foreground" onClick={() => handleSort('closeDate')}>
                <div className="flex items-center gap-1">
                  Close Time
                  {getSortIcon('closeDate')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-foreground dark:hover:text-white transition-colors text-xs uppercase tracking-wider font-semibold text-muted-foreground" onClick={() => handleSort('position')}>
                <div className="flex items-center gap-1">
                  Position
                  {getSortIcon('position')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:text-foreground dark:hover:text-white transition-colors text-right text-xs uppercase tracking-wider font-semibold text-muted-foreground" onClick={() => handleSort('profitLoss')}>
                <div className="flex items-center gap-1 justify-end">
                  P&L
                  {getSortIcon('profitLoss')}
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
                  {new Date(trade.openDate).toLocaleString(undefined, {
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                  {new Date(trade.closeDate).toLocaleString(undefined, {
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize font-mono text-xs border backdrop-blur-sm",
                      trade.position === 'long' 
                        ? "border-primary/30 text-primary bg-primary/10" 
                        : "border-accent/30 text-foreground dark:text-white bg-accent/20"
                    )}
                  >
                    {trade.position}
                  </Badge>
                </TableCell>
                <TableCell className={cn(
                  "text-right font-bold font-mono tracking-tight",
                  trade.profitLoss > 0 ? "text-profit text-glow" : "text-loss"
                )}>
                  {trade.profitLoss > 0 ? "+" : ""}${trade.profitLoss.toFixed(2)}
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
        
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/50 dark:border-white/5">
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span className="font-medium text-foreground dark:text-white">{Math.min(currentPage * itemsPerPage, sampleTrades.length)}</span> of{' '}
            <span className="font-medium text-foreground dark:text-white">{sampleTrades.length}</span> trades
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
