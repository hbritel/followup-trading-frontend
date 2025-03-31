import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TradesTableWrapper, Trade } from '@/components/trades/TradesTableWrapper';
import AdvancedTradeFilter from '@/components/trades/AdvancedTradeFilter';
import TradeColumnFilter from '@/components/trades/TradeColumnFilter';
import TradeImportExport from '@/components/trades/TradeImportExport';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import NewTradeDialog from '@/components/dialogs/NewTradeDialog';
import { Filter, Plus, Columns, Search } from 'lucide-react';

// Mocked trades data for demonstration
const mockTrades: Trade[] = [
  {
    id: '1',
    date: '2023-01-05',
    symbol: 'AAPL',
    type: 'long',
    entry: 130.50,
    exit: 135.75,
    profit: 5.25,
    status: 'closed',
    entryDate: '2023-01-05',
    entryPrice: 130.50,
    exitPrice: 135.75,
    quantity: 100,
    notes: 'Good trade on AAPL',
    tags: ['tech', 'swing']
  },
  {
    id: '2',
    date: '2023-01-10',
    symbol: 'TSLA',
    type: 'short',
    entry: 900.00,
    exit: 850.00,
    profit: 50.00,
    status: 'closed',
    entryDate: '2023-01-10',
    entryPrice: 900.00,
    exitPrice: 850.00,
    quantity: 50,
    notes: 'Short position on TSLA',
    tags: ['tech', 'day']
  },
  {
    id: '3',
    date: '2023-01-15',
    symbol: 'GOOG',
    type: 'long',
    entry: 2500.00,
    exit: 2550.00,
    profit: 50.00,
    status: 'open',
    entryDate: '2023-01-15',
    entryPrice: 2500.00,
    exitPrice: 2550.00,
    quantity: 20,
    notes: 'Long position on GOOG',
    tags: ['tech', 'swing']
  },
  {
    id: '4',
    date: '2023-01-20',
    symbol: 'AMZN',
    type: 'short',
    entry: 3200.00,
    exit: 3100.00,
    profit: 100.00,
    status: 'pending',
    entryDate: '2023-01-20',
    entryPrice: 3200.00,
    exitPrice: 3100.00,
    quantity: 30,
    notes: 'Short position on AMZN',
    tags: ['tech', 'day']
  },
  {
    id: '5',
    date: '2023-01-25',
    symbol: 'MSFT',
    type: 'long',
    entry: 280.00,
    exit: 285.00,
    profit: 5.00,
    status: 'cancelled',
    entryDate: '2023-01-25',
    entryPrice: 280.00,
    exitPrice: 285.00,
    quantity: 150,
    notes: 'Long position on MSFT',
    tags: ['tech', 'swing']
  },
  {
    id: '6',
    date: '2023-02-01',
    symbol: 'NVDA',
    type: 'long',
    entry: 250.00,
    exit: 260.00,
    profit: 10.00,
    status: 'closed',
    entryDate: '2023-02-01',
    entryPrice: 250.00,
    exitPrice: 260.00,
    quantity: 80,
    notes: 'Long position on NVDA',
    tags: ['tech', 'swing']
  },
  {
    id: '7',
    date: '2023-02-05',
    symbol: 'NFLX',
    type: 'short',
    entry: 500.00,
    exit: 480.00,
    profit: 20.00,
    status: 'closed',
    entryDate: '2023-02-05',
    entryPrice: 500.00,
    exitPrice: 480.00,
    quantity: 60,
    notes: 'Short position on NFLX',
    tags: ['tech', 'day']
  },
  {
    id: '8',
    date: '2023-02-10',
    symbol: 'FB',
    type: 'long',
    entry: 200.00,
    exit: 210.00,
    profit: 10.00,
    status: 'open',
    entryDate: '2023-02-10',
    entryPrice: 200.00,
    exitPrice: 210.00,
    quantity: 120,
    notes: 'Long position on FB',
    tags: ['tech', 'swing']
  },
  {
    id: '9',
    date: '2023-02-15',
    symbol: 'SNAP',
    type: 'short',
    entry: 30.00,
    exit: 28.00,
    profit: 2.00,
    status: 'pending',
    entryDate: '2023-02-15',
    entryPrice: 30.00,
    exitPrice: 28.00,
    quantity: 200,
    notes: 'Short position on SNAP',
    tags: ['tech', 'day']
  },
  {
    id: '10',
    date: '2023-02-20',
    symbol: 'TWTR',
    type: 'long',
    entry: 50.00,
    exit: 52.00,
    profit: 2.00,
    status: 'cancelled',
    entryDate: '2023-02-20',
    entryPrice: 50.00,
    exitPrice: 52.00,
    quantity: 180,
    notes: 'Long position on TWTR',
    tags: ['tech', 'swing']
  },
];

const Trades = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [trades, setTrades] = useState<Trade[]>(mockTrades);
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    symbol: true,
    type: true,
    entry: true,
    exit: true,
    profit: true,
    status: true,
    notes: false,
    tags: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: { from: null, to: null },
    profitRange: { min: null, max: null },
    tags: [] as string[],
  });
  const [showNewTradeDialog, setShowNewTradeDialog] = useState(false);

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
      date: true,
      symbol: true,
      type: true,
      entry: true,
      exit: true,
      profit: true,
      status: true,
      notes: false,
      tags: false,
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
          onImport={handleImportTrades}
          onExport={handleExportTrades}
          onNewTrade={handleNewTrade}
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
            trades={trades}
            visibleColumns={visibleColumns}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            typeFilter={typeFilter}
            advancedFilters={advancedFilters}
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
