import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Play, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { computeDateRange } from '@/components/dashboard/DashboardDateFilter';

interface ClosedTrade {
  id: string;
  symbol: string;
  direction: string;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  profitLoss: number;
  quantity: number;
  accountId?: string;
}

export interface TradeReplayFilters {
  search: string;
  page: number;
  pageSize: number;
  datePreset: string;
  customStart: Date | null;
  customEnd: Date | null;
  selectedAccountId: string;
  direction: string;
}

interface TradeReplaySelectorProps {
  onSelectTrade: (tradeId: string) => void;
  filters: TradeReplayFilters;
  onFiltersChange: (filters: TradeReplayFilters) => void;
}

const TradeReplaySelector: React.FC<TradeReplaySelectorProps> = ({ onSelectTrade, filters, onFiltersChange }) => {
  const { t } = useTranslation();

  const { search, page, pageSize, datePreset, customStart, customEnd, selectedAccountId, direction } = filters;

  const update = (partial: Partial<TradeReplayFilters>) =>
    onFiltersChange({ ...filters, ...partial });

  // Compute date range from preset or custom
  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return {
        startDate: customStart ? customStart.toISOString().split('T')[0] : undefined,
        endDate: customEnd ? customEnd.toISOString().split('T')[0] : undefined,
      };
    }
    return computeDateRange(datePreset);
  }, [datePreset, customStart, customEnd]);

  // Build search request
  const searchBody = useMemo(() => {
    const body: Record<string, unknown> = {
      status: 'CLOSED',
      page: page - 1, // API is 0-based
      size: pageSize,
    };
    if (search.trim()) body.searchText = search.trim();
    if (direction !== 'all') body.direction = direction;
    if (dateRange.startDate) body.entryDateFrom = dateRange.startDate + 'T00:00:00+0000';
    if (dateRange.endDate) body.entryDateTo = dateRange.endDate + 'T23:59:59+0000';
    if (selectedAccountId && selectedAccountId !== 'all') {
      if (selectedAccountId === 'all-real') {
        body.accountType = 'REAL';
      } else if (selectedAccountId === 'all-demo') {
        body.accountType = 'DEMO';
      } else {
        body.accountId = selectedAccountId;
      }
    }
    return body;
  }, [search, page, pageSize, dateRange, selectedAccountId, direction]);

  // Fetch closed trades
  const { data, isLoading } = useQuery({
    queryKey: ['trades-closed-for-replay', searchBody],
    queryFn: async () => {
      const res = await apiClient.post('/trades/search', searchBody);
      const trades = (res.data.trades ?? res.data.content ?? []) as ClosedTrade[];
      const totalCount = res.data.totalCount ?? res.data.totalElements ?? trades.length;
      const totalPages = res.data.totalPages ?? Math.ceil(totalCount / pageSize);
      return { trades, totalCount, totalPages };
    },
    staleTime: 2 * 60 * 1000,
  });

  const trades = data?.trades ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalCount = data?.totalCount ?? 0;

  // Pagination rendering (same pattern as TradesTableWrapper)
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink onClick={() => update({ page: 1 })}>1</PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => update({ page: i })} isActive={page === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      items.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => update({ page: totalPages })}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="space-y-4">
      {/* Result count */}
      <div className="flex items-center justify-end">
        <span className="text-xs text-muted-foreground tabular-nums font-mono">
          {totalCount} {t('tradeReplay.closedTrades')}
        </span>
      </div>

      {/* Trade list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : trades.length === 0 ? (
        <Card className="glass-card rounded-2xl">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-muted-foreground">{t('tradeReplay.noClosedTrades')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {trades.map((trade) => {
            const isProfit = trade.profitLoss >= 0;
            const dec = trade.entryPrice > 100 ? 2 : 5;
            return (
              <Card
                key={trade.id}
                className="glass-card rounded-xl cursor-pointer hover:border-primary/30 transition-all group"
                onClick={() => onSelectTrade(trade.id)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      trade.direction === 'LONG' ? 'bg-green-500/10' : 'bg-red-500/10'
                    )}>
                      <Play className={cn('h-4 w-4', trade.direction === 'LONG' ? 'text-green-500' : 'text-red-500')} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{trade.symbol}</span>
                        <Badge variant={trade.direction === 'LONG' ? 'default' : 'destructive'} className="text-[10px]">
                          {trade.direction}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {trade.entryDate?.split('T')[0]} → {trade.exitDate?.split('T')[0]}
                        <span className="mx-2">|</span>
                        <span className="font-mono">{trade.entryPrice.toFixed(dec)} → {trade.exitPrice.toFixed(dec)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={cn('font-mono font-bold flex items-center gap-0.5 justify-end', isProfit ? 'text-green-500' : 'text-red-500')}>
                        {isProfit ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        ${Math.abs(trade.profitLoss).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">{trade.quantity} lots</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination — matches Trades page style */}
      {totalCount > 0 && (
        <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div>
              {t('trades.showing', {
                from: Math.min((page - 1) * pageSize + 1, totalCount),
                to: Math.min(page * pageSize, totalCount),
                total: totalCount,
              })}
            </div>
            <div className="flex items-center gap-2">
              <span>{t('trades.rowsPerPage', 'Rows per page')}</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(v) => { update({ pageSize: Number(v), page: 1 }); }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={pageSize.toString()} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 50, 100].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {totalPages > 1 && (
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => update({ page: Math.max(1, page - 1) })}
                    aria-disabled={page === 1}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>

                {renderPaginationItems()}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => update({ page: Math.min(totalPages, page + 1) })}
                    aria-disabled={page === totalPages}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
};

export default TradeReplaySelector;
