import React, { useState, useEffect, useRef } from 'react';
import { usePageFilter } from '@/contexts/page-filters-context';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTrades } from '@/hooks/useTrades';
import { Plus, Columns, Search, Calendar as CalendarIcon, Loader2, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TradesTableWrapper, Trade } from '@/components/trades/TradesTableWrapper';
import TradeColumnFilter from '@/components/trades/TradeColumnFilter';
import TradeImportExport from '@/components/trades/TradeImportExport';
import DateRangeFilter from '@/components/trades/DateRangeFilter';
import AccountSelector from '@/components/dashboard/AccountSelector';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import NewTradeDialog from '@/components/dialogs/NewTradeDialog';
import { tradeService } from '@/services/trade.service';

/** Format a Date to ISO date string (YYYY-MM-DDT00:00:00+0000) for the backend */
const toBackendDate = (d: Date | null, endOfDay = false): string | undefined => {
  if (!d) return undefined;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const time = endOfDay ? '23:59:59' : '00:00:00';
  return `${year}-${month}-${day}T${time}+0000`;
};

const Trades = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [accountFilter, setAccountFilter] = usePageFilter('trades', 'accountId', 'all');
  const [currentPage, setCurrentPage] = usePageFilter('trades', 'currentPage', 1);
  const [itemsPerPage, setItemsPerPage] = usePageFilter('trades', 'itemsPerPage', 10);

  // --- Filter state ---
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = usePageFilter<string>('trades', 'searchQuery', '');
  const [statusFilter, setStatusFilter] = usePageFilter('trades', 'statusFilter', 'all');
  const [directionFilter, setDirectionFilter] = usePageFilter('trades', 'directionFilter', 'all');
  const [startDate, setStartDate] = usePageFilter<Date | null>('trades', 'startDate', null);
  const [endDate, setEndDate] = usePageFilter<Date | null>('trades', 'endDate', null);

  // Debounce search input (400ms)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    setSearchInput(debouncedSearch); // sync on mount
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(1);
    }, 400);
  };

  // Reset to page 1 when filters change
  const handleStatusChange = (value: string) => { setStatusFilter(value); setCurrentPage(1); };
  const handleDirectionChange = (value: string) => { setDirectionFilter(value); setCurrentPage(1); };
  const handleAccountChange = (value: string) => { setAccountFilter(value); setCurrentPage(1); };

  // Build server-side search params (all filters sent to backend)
  const tradeParams = {
    page: currentPage - 1, // backend is 0-indexed
    size: itemsPerPage,
    accountIds: accountFilter === 'all' ? undefined : accountFilter,
    direction: directionFilter === 'all' ? undefined : directionFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    searchText: debouncedSearch || undefined,
    entryDateFrom: toBackendDate(startDate),
    entryDateTo: toBackendDate(endDate, true),
  };

  // --- Fetch trades from backend (server-side filtering + pagination) ---
  const {
    data: tradesResponse,
    isLoading,
    isError,
    error,
  } = useTrades(tradeParams);

  const trades = tradesResponse?.content || [];
  const totalElements = tradesResponse?.totalElements || 0;

  // --- Delete mutation ---
  const deleteMutation = useMutation({
    mutationFn: (tradeId: string) => tradeService.deleteTrade(tradeId),
    onSuccess: (_data, tradeId) => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast({
        title: t('trades.deleteTrade'),
        description: `${t('trades.trade')} ${tradeId} ${t('trades.hasBeenDeleted')}`,
      });
    },
    onError: (err: Error) => {
      toast({
        title: t('trades.deleteTrade'),
        description: err.message || 'Failed to delete trade.',
        variant: 'destructive',
      });
    },
  });

  // --- UI state ---
  const [visibleColumns, setVisibleColumns] = useState({
    symbol: true,
    type: true,
    status: true,
    entryDate: true,
    exitDate: true,
    entryPrice: true,
    exitPrice: true,
    quantity: true,
    profit: true,
    profitPercentage: false,
    stopLoss: false,
    takeProfit: false,
    balance: true,
    notes: false,
    tags: false,
    fees: false,
    currency: false,
    strategy: false,
    createdAt: false,
    updatedAt: false,
  });
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showNewTradeDialog, setShowNewTradeDialog] = useState(false);

  // --- Handlers ---
  const handleNewTrade = () => {
    setShowNewTradeDialog(true);
  };
  const handleEditTrade = (tradeId: string) => {
    toast({
      title: t('trades.editTrade'),
      description: `${t('trades.editingTrade')} ${tradeId}`,
    });
  };
  const handleDeleteTrade = (tradeId: string) => {
    deleteMutation.mutate(tradeId);
  };
  const handleViewTrade = (tradeId: string) => {
    toast({
      title: t('trades.viewTrade'),
      description: `${t('trades.viewingTrade')} ${tradeId}`,
    });
  };
  const handleImportTrades = (importedTrades: Trade[]) => {
    queryClient.invalidateQueries({ queryKey: ['trades'] });
    toast({
      title: t('trades.importTrades'),
      description: `${importedTrades.length} ${t('trades.tradesImportedSuccessfully')}`,
    });
  };
  const handleColumnVisibilityChange = (column: string, visible: boolean) => {
    setVisibleColumns({
      ...visibleColumns,
      [column]: visible,
    });
  };
  const handleResetColumnVisibility = () => {
    setVisibleColumns({
      symbol: true,
      type: true,
      status: true,
      entryDate: true,
      exitDate: true,
      entryPrice: true,
      exitPrice: true,
      quantity: true,
      profit: true,
      profitPercentage: false,
      stopLoss: false,
      takeProfit: false,
      balance: true,
      notes: false,
      tags: false,
      fees: false,
      currency: false,
      strategy: false,
      createdAt: false,
      updatedAt: false,
    });
  };
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  const handleItemsPerPageChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };
  const handleDateFilterApply = () => {
    setShowDateFilter(false);
    setCurrentPage(1);
    if (startDate || endDate) {
      let desc = '';
      if (startDate && endDate) {
        desc = `${t('trades.filteringTradesBetween')} ${startDate.toLocaleDateString()} ${t('common.and')} ${endDate.toLocaleDateString()}`;
      } else if (startDate) {
        desc = `${t('trades.filteringTradesFrom')} ${startDate.toLocaleDateString()}`;
      } else if (endDate) {
        desc = `${t('trades.filteringTradesUntil')} ${endDate.toLocaleDateString()}`;
      }
      toast({
        title: t('trades.dateFilterApplied'),
        description: desc,
      });
    }
  };
  const handleDateFilterReset = () => {
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
    toast({
      title: t('trades.dateFilterReset'),
      description: t('trades.showingAllTrades'),
    });
  };

  // Determine empty state: differentiate "no trades at all" from "no results for filters"
  const hasActiveFilters = directionFilter !== 'all' || statusFilter !== 'all' || !!debouncedSearch || !!startDate || !!endDate;

  return (
    <DashboardLayout pageTitle={t('trades.title')}>
      <div className="flex flex-col space-y-4 max-w-full">
        <FiltersSection
          accountFilter={accountFilter}
          onAccountChange={handleAccountChange}
          searchQuery={searchInput}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusChange={handleStatusChange}
          directionFilter={directionFilter}
          onDirectionChange={handleDirectionChange}
          onToggleColumnFilter={() => setShowColumnFilter(!showColumnFilter)}
          onToggleDateFilter={() => setShowDateFilter(!showDateFilter)}
          onImport={handleImportTrades}
          trades={trades}
          visibleColumns={visibleColumns}
          totalElements={totalElements}
          onNewTrade={handleNewTrade}
        />

        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onApply={handleDateFilterApply}
          onReset={handleDateFilterReset}
          isOpen={showDateFilter}
        />

        {showColumnFilter && (
          <Card className="p-4 w-auto">
            <TradeColumnFilter
              visibleColumns={visibleColumns}
              onChange={handleColumnVisibilityChange}
              onApply={() => setShowColumnFilter(false)}
              onReset={handleResetColumnVisibility}
            />
          </Card>
        )}

        {/* Loading state */}
        {isLoading && (
          <Card className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground text-sm">{t('common.loading', 'Loading trades...')}</p>
          </Card>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <Card className="p-8 flex flex-col items-center justify-center gap-3 border-destructive/50">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-destructive font-medium">Failed to load trades</p>
            <p className="text-muted-foreground text-sm text-center max-w-md">
              {error?.message || 'Could not connect to the server. Please check your connection and try again.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['trades'] })}
            >
              Retry
            </Button>
          </Card>
        )}

        {/* Empty state - no trades at all */}
        {!isLoading && !isError && totalElements === 0 && !hasActiveFilters && (
          <Card className="p-12 flex flex-col items-center justify-center gap-3">
            <p className="text-muted-foreground font-medium">No trades yet</p>
            <p className="text-muted-foreground text-sm text-center max-w-md">
              Connect a broker account and sync your trades, or add a trade manually.
            </p>
            <Button onClick={handleNewTrade} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t('trades.newTrade')}
            </Button>
          </Card>
        )}

        {/* Empty state - no results for current filters */}
        {!isLoading && !isError && totalElements === 0 && hasActiveFilters && (
          <Card className="p-12 flex flex-col items-center justify-center gap-3">
            <Search className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground font-medium">{t('trades.noResults', 'No trades match your filters')}</p>
            <p className="text-muted-foreground text-sm text-center max-w-md">
              {t('trades.tryDifferentFilters', 'Try adjusting your search, status, or direction filters.')}
            </p>
          </Card>
        )}

        {/* Trades table */}
        {!isLoading && !isError && totalElements > 0 && (
          <div className="w-full">
            <TradesTableWrapper
              trades={trades}
              visibleColumns={visibleColumns}
              searchQuery={debouncedSearch}
              statusFilter={statusFilter}
              typeFilter={directionFilter}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              totalTrades={totalElements}
              onEdit={handleEditTrade}
              onDelete={handleDeleteTrade}
              onView={handleViewTrade}
            />
          </div>
        )}
      </div>

      <NewTradeDialog open={showNewTradeDialog} onOpenChange={setShowNewTradeDialog} />
    </DashboardLayout>
  );
};

interface FiltersSectionProps {
  accountFilter: string;
  onAccountChange: (value: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  directionFilter: string;
  onDirectionChange: (value: string) => void;
  onToggleColumnFilter: () => void;
  onToggleDateFilter: () => void;
  onImport: (trades: Trade[]) => void;
  trades: Trade[];
  visibleColumns: Record<string, boolean>;
  totalElements: number;
  onNewTrade: () => void;
}

const FiltersSection: React.FC<FiltersSectionProps> = ({
  accountFilter,
  onAccountChange,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  directionFilter,
  onDirectionChange,
  onToggleColumnFilter,
  onToggleDateFilter,
  onImport,
  trades,
  visibleColumns,
  totalElements,
  onNewTrade,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col md:flex-row justify-between gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <AccountSelector 
          value={accountFilter} 
          onChange={onAccountChange} 
          className="w-full md:w-40" 
        />
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('trades.search')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 py-0"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder={t('trades.statusFilter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('trades.allStatuses')}</SelectItem>
            <SelectItem value="open">{t('trades.open')}</SelectItem>
            <SelectItem value="closed">{t('trades.closed')}</SelectItem>
            <SelectItem value="pending">{t('trades.pending')}</SelectItem>
            <SelectItem value="cancelled">{t('trades.cancelled')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={directionFilter} onValueChange={onDirectionChange}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder={t('trades.directionFilter', 'Direction')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('trades.allDirections', 'All Directions')}</SelectItem>
            <SelectItem value="long">{t('trades.long')}</SelectItem>
            <SelectItem value="short">{t('trades.short')}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={onToggleColumnFilter}>
          <Columns className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onToggleDateFilter} className="relative">
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <TradeImportExport
            onImport={onImport}
            filteredTrades={trades}
            visibleColumns={visibleColumns}
            accountFilter={accountFilter}
            totalElements={totalElements}
          />
        <Button onClick={onNewTrade}>
          <Plus className="mr-2 h-4 w-4" />
          {t('trades.newTrade')}
        </Button>
      </div>
    </div>
  );
};

export default Trades;