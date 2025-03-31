
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, Plus, Columns, Search, Calendar as CalendarIcon } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TradesTableWrapper, Trade } from '@/components/trades/TradesTableWrapper';
import AdvancedTradeFilter from '@/components/trades/AdvancedTradeFilter';
import TradeColumnFilter from '@/components/trades/TradeColumnFilter';
import TradeImportExport from '@/components/trades/TradeImportExport';
import DateRangeFilter from '@/components/trades/DateRangeFilter';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import NewTradeDialog from '@/components/dialogs/NewTradeDialog';

// Mocked trades data for demonstration
const mockTrades: Trade[] = [
  {
    id: '1',
    symbol: 'AAPL',
    type: 'long',
    status: 'closed',
    entryDate: '2023-01-05',
    exitDate: '2023-01-07',
    entryPrice: 130.50,
    exitPrice: 135.75,
    quantity: 100,
    profit: 5.25,
    profitPercentage: 4.02,
    direction: 'long',
    notes: 'Good trade on AAPL',
    tags: ['tech', 'swing']
  },
  {
    id: '2',
    symbol: 'TSLA',
    type: 'short',
    status: 'closed',
    entryDate: '2023-01-10',
    exitDate: '2023-01-11',
    entryPrice: 900.00,
    exitPrice: 850.00,
    quantity: 50,
    profit: 50.00,
    profitPercentage: 5.56,
    direction: 'short',
    notes: 'Short position on TSLA',
    tags: ['tech', 'day']
  },
  {
    id: '3',
    symbol: 'GOOG',
    type: 'long',
    status: 'open',
    entryDate: '2023-01-15',
    entryPrice: 2500.00,
    quantity: 20,
    stopLoss: 2400.00,
    takeProfit: 2600.00,
    direction: 'long',
    notes: 'Long position on GOOG',
    tags: ['tech', 'swing']
  },
  {
    id: '4',
    symbol: 'AMZN',
    type: 'short',
    status: 'pending',
    entryDate: '2023-01-20',
    entryPrice: 3200.00,
    quantity: 30,
    direction: 'short',
    notes: 'Short position on AMZN',
    tags: ['tech', 'day']
  },
  {
    id: '5',
    symbol: 'MSFT',
    type: 'long',
    status: 'cancelled',
    entryDate: '2023-01-25',
    entryPrice: 280.00,
    quantity: 150,
    direction: 'long',
    notes: 'Long position on MSFT',
    tags: ['tech', 'swing']
  },
  {
    id: '6',
    symbol: 'NVDA',
    type: 'long',
    status: 'closed',
    entryDate: '2023-02-01',
    exitDate: '2023-02-05',
    entryPrice: 250.00,
    exitPrice: 260.00,
    quantity: 80,
    profit: 10.00,
    profitPercentage: 4.00,
    direction: 'long',
    notes: 'Long position on NVDA',
    tags: ['tech', 'swing']
  },
  {
    id: '7',
    symbol: 'NFLX',
    type: 'short',
    status: 'closed',
    entryDate: '2023-02-05',
    exitDate: '2023-02-07',
    entryPrice: 500.00,
    exitPrice: 480.00,
    quantity: 60,
    profit: 20.00,
    profitPercentage: 4.00,
    direction: 'short',
    notes: 'Short position on NFLX',
    tags: ['tech', 'day']
  },
  {
    id: '8',
    symbol: 'FB',
    type: 'long',
    status: 'open',
    entryDate: '2023-02-10',
    entryPrice: 200.00,
    quantity: 120,
    stopLoss: 190.00,
    takeProfit: 220.00,
    direction: 'long',
    notes: 'Long position on FB',
    tags: ['tech', 'swing']
  },
  {
    id: '9',
    symbol: 'SNAP',
    type: 'short',
    status: 'pending',
    entryDate: '2023-02-15',
    entryPrice: 30.00,
    quantity: 200,
    direction: 'short',
    notes: 'Short position on SNAP',
    tags: ['tech', 'day']
  },
  {
    id: '10',
    symbol: 'TWTR',
    type: 'long',
    status: 'cancelled',
    entryDate: '2023-02-20',
    entryPrice: 50.00,
    quantity: 180,
    direction: 'long',
    notes: 'Long position on TWTR',
    tags: ['tech', 'swing']
  },
];

const Trades = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [trades, setTrades] = useState<Trade[]>(mockTrades);
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
    strategy: false,
    createdAt: false,
    updatedAt: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>(trades);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: { from: null as Date | null, to: null as Date | null },
    profitRange: { min: null as number | null, max: null as number | null },
    tags: [] as string[],
  });
  const [showNewTradeDialog, setShowNewTradeDialog] = useState(false);

  useEffect(() => {
    filterTrades();
  }, [trades, searchQuery, statusFilter, typeFilter, advancedFilters, startDate, endDate]);

  const filterTrades = () => {
    let filtered = trades.filter((trade) => {
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
    setCurrentPage(1);  // Reset to first page when filters change
  };

  // Get current trades for pagination
  const indexOfLastTrade = currentPage * itemsPerPage;
  const indexOfFirstTrade = indexOfLastTrade - itemsPerPage;
  const currentTrades = filteredTrades.slice(indexOfFirstTrade, indexOfLastTrade);

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
    setTrades(trades.filter((trade) => trade.id !== tradeId));
    toast({
      title: t('trades.deleteTrade'),
      description: `${t('trades.trade')} ${tradeId} ${t('trades.hasBeenDeleted')}`,
    });
  };

  const handleViewTrade = (tradeId: string) => {
    toast({
      title: t('trades.viewTrade'),
      description: `${t('trades.viewingTrade')} ${tradeId}`,
    });
  };

  const handleImportTrades = (importedTrades: Trade[]) => {
    setTrades([...trades, ...importedTrades]);
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
    setVisibleColumns({ ...visibleColumns, [column]: visible });
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
      strategy: false,
      createdAt: false,
      updatedAt: false,
    });
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleDateFilterApply = () => {
    // The filtering is already handled by the useEffect
    setShowDateFilter(false);
    
    if (startDate || endDate) {
      toast({
        title: t('trades.dateFilterApplied'),
        description: startDate && endDate 
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
      </div>
      
      <NewTradeDialog 
        open={showNewTradeDialog} 
        onOpenChange={setShowNewTradeDialog} 
      />
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
  onNewTrade
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
            className="pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
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
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onToggleColumnFilter}
        >
          <Columns className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onToggleDateFilter} 
          className="relative"
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <TradeImportExport
          onImport={onImport}
          onExport={onExport}
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
