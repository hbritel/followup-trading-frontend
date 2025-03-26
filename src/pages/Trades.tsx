
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TradesTable from '@/components/trades/TradesTable';
import TradeColumnFilter from '@/components/trades/TradeColumnFilter';
import TradeImportExport from '@/components/trades/TradeImportExport';
import NewTradeDialog from "@/components/dialogs/NewTradeDialog";
import AdvancedTradeFilter from '@/components/trades/AdvancedTradeFilter';
import { useTranslation } from 'react-i18next';

// Define filter interface
interface FilterOptions {
  symbols: string[];
  strategies: string[];
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  status: string[];
  types: string[];
  tags: string[];
  profitRange: [number, number];
  riskRewardRange: [number, number];
  holdingPeriodRange: [number, number];
  winningTradesOnly: boolean;
  losingTradesOnly: boolean;
  withNotesOnly: boolean;
  marketAlignment: string;
  advancedFilters: {
    minProfitPercent?: number;
    maxDrawdown?: number;
    minEntryQuality?: number;
    minExitQuality?: number;
    hasStoploss?: boolean;
    hasTakeProfit?: boolean;
  };
}

const Trades = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions | null>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    symbol: true,
    type: true,
    price: true, 
    quantity: true,
    date: true,
    status: true,
    pl: true,
    entryPrice: false,
    exitPrice: false,
    stoploss: false,
    takeProfit: false,
    fees: false,
    notes: false,
    createdAt: false,
    updatedAt: false,
    plPercentage: true,
    riskReward: true,
    holdingPeriod: true,
    marketAlignment: false,
    strategyName: true,
    tags: true
  });

  const handleVisibilityChange = (columnName: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnName]: !prev[columnName as keyof typeof prev]
    }));
  };
  
  // Handle advanced filters
  const handleApplyFilters = (filters: FilterOptions) => {
    setAdvancedFilters(filters);
    // Simple filters are now part of the advanced filters
    if (filters.status.length === 1) {
      setStatusFilter(filters.status[0]);
    } else {
      setStatusFilter('all');
    }
    
    if (filters.types.length === 1) {
      setTypeFilter(filters.types[0]);
    } else {
      setTypeFilter('all');
    }
  };

  return (
    <DashboardLayout pageTitle={t('trades.trades')}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>{t('trades.tradeHistory')}</CardTitle>
                <CardDescription>{t('trades.tradeHistoryDescription')}</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <TradeImportExport />
                
                <TradeColumnFilter
                  visibleColumns={visibleColumns}
                  onVisibilityChange={handleVisibilityChange}
                />
                <NewTradeDialog
                  trigger={
                    <Button className="w-full sm:w-auto">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {t('trades.newTrade')}
                    </Button>
                  }
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder={t('trades.searchTrades')} 
                  className="pl-8" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <AdvancedTradeFilter 
                  onApplyFilters={handleApplyFilters}
                  activeFilters={advancedFilters ?? undefined}
                />
              </div>
            </div>
            
            <TradesTable 
              visibleColumns={visibleColumns} 
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              advancedFilters={advancedFilters}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Trades;
