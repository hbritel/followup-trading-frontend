import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Filter, Plus, Columns, Search, Calendar as CalendarIcon, Loader2, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TradesTableWrapper, Trade } from '@/components/trades/TradesTableWrapper';
import TradeColumnFilter from '@/components/trades/TradeColumnFilter';
import TradeImportExport from '@/components/trades/TradeImportExport';
import DateRangeFilter from '@/components/trades/DateRangeFilter';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import NewTradeDialog from '@/components/dialogs/NewTradeDialog';
import { tradeService } from '@/services/trade.service';

const Trades = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Fetch trades from backend ---
  const {
    data: trades = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['trades'],
    queryFn: () => tradeService.getTrades(),
    retry: 2,
    staleTime: 30_000, // 30s before refetch
  });

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
    direction: true,
    notes: false,
    tags: false,
    fees: false,
    currency: false,
    strategy: false,
    createdAt: false,
    updatedAt: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: {
      from: null as Date | null,
      to: null as Date | null,
    },
    profitRange: {
      min: null as number | null,
      max: null as number | null,
    },
    tags: [] as string[],
  });
  const [showNewTradeDialog, setShowNewTradeDialog] = useState(false);

  // --- Client-side filtering ---
  useEffect(() => {
    filterTrades();
  }, [trades, searchQuery, statusFilter, typeFilter, advancedFilters, startDate, endDate]);

  const filterTrades = () => {
    const filtered = trades.filter((trade) => {
      // Search query filter
      const matchesSearch =
        searchQuery === '' ||
        trade.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (trade.strategy && trade.strategy.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (trade.notes && trade.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status and type filters
      const matchesStatus = statusFilter === 'all' || trade.status === statusFilter;
      const matchesType = typeFilter === 'all' || trade.type === typeFilter;

      // Date range filter
      let matchesDateRange = true;
      if (startDate || endDate) {
        const tradeDate = new Date(trade.entryDate);
        if (startDate && endDate) {
          matchesDateRange = tradeDate >= startDate && tradeDate <= endDate;
        } else if (startDate) {
          matchesDateRange = tradeDate >= startDate;
        } else if (endDate) {
          matchesDateRange = tradeDate <= endDate;
        }
      }
      return matchesSearch && matchesStatus && matchesType && matchesDateRange;
    });
    setFilteredTrades(filtered);
    setCurrentPage(1);
  };

  // Pagination
  const indexOfLastTrade = currentPage * itemsPerPage;
  const indexOfFirstTrade = indexOfLastTrade - itemsPerPage;
  const currentTrades = filteredTrades.slice(indexOfFirstTrade, indexOfLastTrade);

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
    // After import, refetch trades from the backend
    queryClient.invalidateQueries({ queryKey: ['trades'] });
    toast({
      title: t('trades.importTrades'),
      description: `${importedTrades.length} ${t('trades.tradesImportedSuccessfully')}`,
    });
  };
  const handleExportTrades = () => {
    toast({
      title: t('trades.exportTrades'),
      description: t('trades.tradesExportedSuccessfully'),
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
      direction: true,
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
  const handleDateFilterApply = () => {
    setShowDateFilter(false);
    if (startDate || endDate) {
      toast({
        title: t('trades.dateFilterApplied'),
        description:
          startDate && endDate
            ? `${t('trades.filteringTradesBetween')} ${startDate.toLocaleDateString()} ${t('common.and')} ${endDate.toLocaleDateString()}`
            : startDate
              ? `${t('trades.filteringTradesFrom')} ${startDate.toLocaleDateString()}`
              : `${t('trades.filteringTradesUntil')} ${endDate?.toLocaleDateString()}`,
      });
    }
  };
  const handleDateFilterReset = () => {
    setStartDate(null);
    setEndDate(null);
    toast({
      title: t('trades.dateFilterReset'),
      description: t('trades.showingAllTrades'),
    });
  };

  // --- Render ---
  return (
    <DashboardLayout pageTitle={t('trades.title')}>
      <div className="flex flex-col space-y-4 max-w-full">
        <FiltersSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          onToggleColumnFilter={() => setShowColumnFilter(!showColumnFilter)}
          onToggleDateFilter={() => setShowDateFilter(!showDateFilter)}
          onImport={handleImportTrades}
          onExport={handleExportTrades}
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
              {(error as Error)?.message || 'Could not connect to the server. Please check your connection and try again.'}
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

        {/* Empty state */}
        {!isLoading && !isError && trades.length === 0 && (
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

        {/* Trades table */}
        {!isLoading && !isError && trades.length > 0 && (
          <div className="w-full">
            <TradesTableWrapper
              trades={currentTrades}
              visibleColumns={visibleColumns}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              advancedFilters={advancedFilters}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              totalTrades={filteredTrades.length}
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
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  onToggleColumnFilter: () => void;
  onToggleDateFilter: () => void;
  onImport: (trades: Trade[]) => void;
  onExport: () => void;
  onNewTrade: () => void;
}

const FiltersSection: React.FC<FiltersSectionProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  onToggleColumnFilter,
  onToggleDateFilter,
  onImport,
  onExport,
  onNewTrade,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col md:flex-row justify-between gap-4">
      <div className="flex items-center gap-2 flex-wrap">
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
        <Select value={typeFilter} onValueChange={onTypeChange}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder={t('trades.typeFilter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('trades.allTypes')}</SelectItem>
            <SelectItem value="long">{t('trades.long')}</SelectItem>
            <SelectItem value="short">{t('trades.short')}</SelectItem>
            <SelectItem value="option">{t('trades.option')}</SelectItem>
            <SelectItem value="future">{t('trades.future')}</SelectItem>
            <SelectItem value="crypto">{t('trades.crypto')}</SelectItem>
            <SelectItem value="forex">{t('trades.forex')}</SelectItem>
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
        <TradeImportExport onImport={onImport} onExport={onExport} />
        <Button onClick={onNewTrade}>
          <Plus className="mr-2 h-4 w-4" />
          {t('trades.newTrade')}
        </Button>
      </div>
    </div>
  );
};

export default Trades;