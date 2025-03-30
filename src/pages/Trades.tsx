import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { TradesTableWrapper } from '@/components/trades/TradesTableWrapper';
import AdvancedTradeFilter from '@/components/trades/AdvancedTradeFilter';
import TradeColumnFilter from '@/components/trades/TradeColumnFilter';
import TradeImportExport from '@/components/trades/TradeImportExport';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import NewTradeDialog from '@/components/dialogs/NewTradeDialog';
import { 
  Filter, 
  Plus, 
  Columns, 
  Search 
} from 'lucide-react';

interface Trade {
  id: string;
  date: string;
  symbol: string;
  type: 'long' | 'short' | 'option' | 'future' | 'crypto' | 'forex';
  entry: number;
  exit: number;
  profit: number;
  status: 'open' | 'closed' | 'pending' | 'cancelled';
  notes?: string;
  tags?: string[];
}

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

  useEffect(() => {
    // Simulate loading trades from an API
    // In a real application, you would fetch data from an API endpoint here
    // and update the trades state with the fetched data.
  }, []);

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

  const handleResetAdvancedFilters = () => {
    setAdvancedFilters({
      dateRange: { from: null, to: null },
      profitRange: { min: null, max: null },
      tags: [],
    });
  };

  const filteredTrades = trades.filter((trade) => {
    const searchRegex = new RegExp(searchQuery, 'i');
    const statusMatch = statusFilter === 'all' || trade.status === statusFilter;
    const typeMatch = typeFilter === 'all' || trade.type === typeFilter;
    const searchMatch =
      searchRegex.test(trade.symbol) ||
      searchRegex.test(trade.notes || '') ||
      searchRegex.test(trade.tags?.join(',') || '');

    const dateRangeMatch =
      !advancedFilters.dateRange.from ||
      !advancedFilters.dateRange.to ||
      (new Date(trade.date) >= advancedFilters.dateRange.from &&
        new Date(trade.date) <= advancedFilters.dateRange.to);

    const profitRangeMatch =
      (advancedFilters.profitRange.min === null || trade.profit >= (advancedFilters.profitRange.min || 0)) &&
      (advancedFilters.profitRange.max === null || trade.profit <= (advancedFilters.profitRange.max || Infinity));

    const tagsMatch =
      advancedFilters.tags.length === 0 ||
      (trade.tags && advancedFilters.tags.every((tag) => trade.tags?.includes(tag)));

    return statusMatch && typeMatch && searchMatch && dateRangeMatch && profitRangeMatch && tagsMatch;
  });

  return (
    <DashboardLayout pageTitle={t('trades.title')}>
      <div className="flex flex-col space-y-4 max-w-full">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('trades.search')}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
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
              onClick={() => setShowColumnFilter(!showColumnFilter)}
            >
              <Columns className="h-4 w-4" />
            </Button>
            <Button
              variant="outline" 
              size="icon"
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <TradeImportExport
              onImport={handleImportTrades}
              onExport={handleExportTrades}
            />
            <Button onClick={handleNewTrade}>
              <Plus className="mr-2 h-4 w-4" />
              {t('trades.newTrade')}
            </Button>
          </div>
        </div>
        
        {showAdvancedFilter && (
          <Card className="p-4">
            <AdvancedTradeFilter 
              advancedFilters={advancedFilters}
              onFilterChange={setAdvancedFilters}
              onApply={() => setShowAdvancedFilter(false)}
              onReset={handleResetAdvancedFilters}
            />
          </Card>
        )}
        
        {showColumnFilter && (
          <Card className="p-4">
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
            trades={filteredTrades}
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

export default Trades;
