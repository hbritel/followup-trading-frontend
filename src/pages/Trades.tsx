import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { usePageFilter } from '@/contexts/page-filters-context';
import { useDefaultDatePreset } from '@/hooks/useDefaultDatePreset';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTrades } from '@/hooks/useTrades';
import { Plus, Columns, Search, AlertTriangle, BookOpen, X, Info, Loader2, Sparkles } from 'lucide-react';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import { useSubscription } from '@/hooks/useSubscription';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TradesTableWrapper, Trade } from '@/components/trades/TradesTableWrapper';
import TradeColumnFilter from '@/components/trades/TradeColumnFilter';
import TradeImportExport from '@/components/trades/TradeImportExport';
import ImportDialog from '@/components/trades/ImportDialog';
import TradePlanDialog from '@/components/trades/TradePlanDialog';
import TradePlanningModal from '@/components/trades/TradePlanningModal';
import DashboardDateFilter, { computeDateRange } from '@/components/dashboard/DashboardDateFilter';
import AccountSelector from '@/components/dashboard/AccountSelector';
import { useAccountFilter } from '@/hooks/useAccountFilter';
import { useBrokerConnections } from '@/hooks/useBrokers';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import NewTradeDialog from '@/components/dialogs/NewTradeDialog';
import TradeDetailDialog from '@/components/trades/TradeDetailDialog';
import { tradeService } from '@/services/trade.service';
import { userService } from '@/services/user.service';
import { TradeTableSkeleton } from '@/components/skeletons';
import ErrorBoundary from '@/components/ui/error-boundary';
import PageError from '@/components/ui/page-error';

/** Format a Date to YYYY-MM-DD */
const toISODate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const COLUMN_DEFAULTS_KEY = 'ft_trade_column_defaults';

const FACTORY_COLUMNS: Record<string, boolean> = {
  symbol: true,
  type: true,
  status: true,
  accountType: false,
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
};

function loadColumnDefaults(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(COLUMN_DEFAULTS_KEY);
    if (raw) return { ...FACTORY_COLUMNS, ...JSON.parse(raw) };
  } catch { /* corrupted data — ignore */ }
  return { ...FACTORY_COLUMNS };
}

function saveColumnDefaultsToLocalStorage(columns: Record<string, boolean>) {
  localStorage.setItem(COLUMN_DEFAULTS_KEY, JSON.stringify(columns));
}

const Trades = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Strategy filter from URL (e.g. /trades?strategyId=xxx)
  const strategyIdParam = searchParams.get('strategyId');

  // Highlight trade from navigation state (e.g. from StrategyDetail click)
  const highlightTradeId = (location.state as { highlightTradeId?: string } | null)?.highlightTradeId ?? null;

  // Insight drill-down: filter to specific trade IDs (from Insights page)
  const insightTradeIds = (location.state as { filterTradeIds?: string[] } | null)?.filterTradeIds ?? null;
  const [activeInsightFilter, setActiveInsightFilter] = useState<string[] | null>(null);

  // Seed insight filter from navigation state on mount
  useEffect(() => {
    if (insightTradeIds && insightTradeIds.length > 0) {
      setActiveInsightFilter(insightTradeIds);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear navigation state after reading (so refreshing doesn't re-filter)
  useEffect(() => {
    if (highlightTradeId || insightTradeIds) {
      window.history.replaceState({}, '');
    }
  }, [highlightTradeId, insightTradeIds]);

  const [accountFilter, setAccountFilter] = usePageFilter('trades', 'accountId', 'all');
  const { accountIds: resolvedAccountIds } = useAccountFilter(accountFilter);
  const [currentPage, setCurrentPage] = usePageFilter('trades', 'currentPage', 1);
  const [itemsPerPage, setItemsPerPage] = usePageFilter('trades', 'itemsPerPage', 10);

  // --- Date filter state (preset-based, same as Dashboard/Performance/etc.) ---
  const [datePreset, setDatePreset] = useDefaultDatePreset('trades');
  const [customStart, setCustomStart] = usePageFilter<Date | null>('trades', 'customStart', null);
  const [customEnd, setCustomEnd] = usePageFilter<Date | null>('trades', 'customEnd', null);

  const dateRange = datePreset === 'custom'
    ? {
        startDate: customStart ? toISODate(customStart) : undefined,
        endDate: customEnd ? toISODate(customEnd) : undefined,
      }
    : computeDateRange(datePreset);

  // --- Other filter state ---
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = usePageFilter<string>('trades', 'searchQuery', '');
  const [statusFilter, setStatusFilter] = usePageFilter('trades', 'statusFilter', 'all');
  const [directionFilter, setDirectionFilter] = usePageFilter('trades', 'directionFilter', 'all');

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
    accountIds: resolvedAccountIds,
    direction: directionFilter === 'all' ? undefined : directionFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    searchText: debouncedSearch || undefined,
    entryDateFrom: dateRange.startDate ? `${dateRange.startDate}T00:00:00+0000` : undefined,
    entryDateTo: dateRange.endDate ? `${dateRange.endDate}T23:59:59+0000` : undefined,
    strategyIds: strategyIdParam ? [strategyIdParam] : undefined,
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

  // --- Plan-based trade visibility ---
  const { currentPlan } = useFeatureFlags();
  const { data: subscription } = useSubscription();
  const tradesMax = subscription?.usage?.tradesMax ?? 0;
  const tradesTotal = subscription?.usage?.tradesUsed ?? 0;
  const isUnlimitedTrades = tradesMax >= 2147483647;
  const isTradesCapped = !isUnlimitedTrades && tradesTotal > tradesMax && tradesMax > 0;

  // --- Enrich trades with accountType from broker connections ---
  const { data: connections } = useBrokerConnections();
  const accountTypeMap = useMemo(() => {
    const map: Record<string, string> = {};
    connections?.forEach(c => { map[c.id] = c.accountType || 'REAL'; });
    return map;
  }, [connections]);

  const enrichedTrades = useMemo(() => {
    const mapped = trades.map(t => ({ ...t, accountType: t.accountId ? accountTypeMap[t.accountId] : undefined }));
    // When insight filter is active, show only the related trades
    if (activeInsightFilter && activeInsightFilter.length > 0) {
      const idSet = new Set(activeInsightFilter);
      return mapped.filter(t => idSet.has(t.id));
    }
    return mapped;
  }, [trades, accountTypeMap, activeInsightFilter]);

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

  // --- Load column defaults from server (overrides localStorage) ---
  useEffect(() => {
    userService.getUserPreferences()
      .then((prefs) => {
        if (prefs.tradeColumnDefaults) {
          try {
            const serverColumns = JSON.parse(prefs.tradeColumnDefaults) as Record<string, boolean>;
            const merged = { ...FACTORY_COLUMNS, ...serverColumns };
            setVisibleColumns(merged);
            saveColumnDefaultsToLocalStorage(merged);
          } catch { /* invalid JSON — ignore */ }
        }
      })
      .catch(() => { /* offline / unauthenticated — use localStorage fallback */ });
  }, []);

  // --- UI state ---
  const [importOpen, setImportOpen] = useState(false);
  const [isSavingColumns, setIsSavingColumns] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(loadColumnDefaults);
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [showNewTradeDialog, setShowNewTradeDialog] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [planningScoreOpen, setPlanningScoreOpen] = useState(false);
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);

  // --- Handlers ---
  const handleNewTrade = () => {
    setShowNewTradeDialog(true);
  };
  const [editMode, setEditMode] = useState(false);
  const handleEditTrade = (tradeId: string) => {
    const trade = enrichedTrades.find(t => t.id === tradeId);
    if (trade) {
      setEditMode(true);
      setViewingTrade(trade);
    }
  };
  const handleDeleteTrade = (tradeId: string) => {
    deleteMutation.mutate(tradeId);
  };
  const handleViewTrade = (tradeId: string) => {
    const trade = enrichedTrades.find(t => t.id === tradeId);
    if (trade) setViewingTrade(trade);
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
    setVisibleColumns(loadColumnDefaults());
  };
  const handleSaveColumnDefaults = async () => {
    setIsSavingColumns(true);
    const json = JSON.stringify(visibleColumns);
    saveColumnDefaultsToLocalStorage(visibleColumns);
    try {
      await userService.updateUserPreferences({ tradeColumnDefaults: json });
      toast({
        title: t('trades.columnDefaultsSaved', 'Column preferences saved'),
        description: t('trades.columnDefaultsSavedDesc', 'Your column preferences will be remembered across sessions.'),
      });
    } catch {
      toast({
        title: t('common.error', 'Error'),
        description: t('trades.columnDefaultsSaveFailed', 'Failed to save preferences to server. Local changes were kept.'),
        variant: 'destructive',
      });
    } finally {
      setIsSavingColumns(false);
    }
  };
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  const handleItemsPerPageChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  // Determine empty state: differentiate "no trades at all" from "no results for filters"
  const hasActiveFilters = directionFilter !== 'all' || statusFilter !== 'all' || !!debouncedSearch || datePreset !== 'all' || !!strategyIdParam;

  // Count visible columns for the skeleton
  const visibleColumnCount = Object.values(visibleColumns).filter(Boolean).length + 1; // +1 for actions column

  return (
    <DashboardLayout pageTitle={t('trades.title')}>
      <PageTransition className="flex flex-col space-y-4 max-w-full">
        {activeInsightFilter && activeInsightFilter.length > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-amber-700 dark:text-amber-300">
                {t('insights.filteringByInsight', `Showing ${enrichedTrades.length} trades related to insight`, { count: enrichedTrades.length })}
              </span>
              <Badge variant="secondary" className="text-xs">{activeInsightFilter.length} IDs</Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setActiveInsightFilter(null)}
              className="h-7 px-2 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
            >
              <X className="h-3 w-3 mr-1" />
              {t('common.clearFilter', 'Clear filter')}
            </Button>
          </div>
        )}
        {isTradesCapped && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm">
            <Info className="h-4 w-4 text-blue-400 shrink-0" />
            <span className="text-blue-300">
              {t('trades.planLimitInfo', 'Your {{plan}} plan shows the {{max}} most recent trades. You have {{total}} trades total.', {
                plan: currentPlan,
                max: tradesMax.toLocaleString(),
                total: tradesTotal.toLocaleString(),
              })}
            </span>
            <a href="/pricing" className="ml-auto text-xs font-medium text-blue-400 hover:underline shrink-0">
              {t('subscription.upgrade', 'Upgrade')}
            </a>
          </div>
        )}
        <FiltersSection
          datePreset={datePreset}
          onDatePresetChange={(v) => { setDatePreset(v); setCurrentPage(1); }}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={setCustomStart}
          onCustomEndChange={setCustomEnd}
          accountFilter={accountFilter}
          onAccountChange={handleAccountChange}
          searchQuery={searchInput}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusChange={handleStatusChange}
          directionFilter={directionFilter}
          onDirectionChange={handleDirectionChange}
          onToggleColumnFilter={() => setShowColumnFilter(!showColumnFilter)}
          onImport={handleImportTrades}
          onOpenImportDialog={() => setImportOpen(true)}
          trades={enrichedTrades}
          visibleColumns={visibleColumns}
          totalElements={totalElements}
          onNewTrade={handleNewTrade}
          onPlanTrade={() => setPlanOpen(true)}
        />

        {showColumnFilter && (
          <Card className="glass-card rounded-2xl p-4 w-auto">
            <TradeColumnFilter
              visibleColumns={visibleColumns}
              onChange={handleColumnVisibilityChange}
              onApply={() => setShowColumnFilter(false)}
              onReset={handleResetColumnVisibility}
              onSaveDefault={handleSaveColumnDefaults}
              isSavingDefault={isSavingColumns}
            />
          </Card>
        )}

        {/* Strategy filter badge */}
        {strategyIdParam && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {t('trades.filteredByStrategy', 'Filtered by strategy')}
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="ml-1 rounded-full hover:bg-white/10 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}

        {/* Loading state - skeleton table */}
        {isLoading && (
          <TradeTableSkeleton rows={itemsPerPage} columns={Math.min(visibleColumnCount, 10)} />
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <Card className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center gap-3 border-destructive/50">
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
          <Card className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center gap-3">
            <p className="text-muted-foreground font-medium">No trades yet</p>
            <p className="text-muted-foreground text-sm text-center max-w-md">
              Connect a broker account and sync your trades, or add a trade manually.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button onClick={() => setPlanningScoreOpen(true)} size="sm" variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                {t('tradePlanning.cta', 'Score this setup')}
              </Button>
              <Button onClick={handleNewTrade} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t('trades.newTrade')}
              </Button>
            </div>
          </Card>
        )}

        {/* Empty state - no results for current filters */}
        {!isLoading && !isError && totalElements === 0 && hasActiveFilters && (
          <Card className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center gap-3">
            <Search className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground font-medium">{t('trades.noResults', 'No trades match your filters')}</p>
            <p className="text-muted-foreground text-sm text-center max-w-md">
              {t('trades.tryDifferentFilters', 'Try adjusting your search, status, or direction filters.')}
            </p>
          </Card>
        )}

        {/* Trades table */}
        {!isLoading && !isError && totalElements > 0 && (
          <ErrorBoundary
            fallback={
              <PageError
                title="Failed to render trades"
                message="An unexpected error occurred while displaying your trades."
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['trades'] })}
              />
            }
          >
          <div className="glass-card rounded-2xl w-full overflow-hidden">
            <TradesTableWrapper
              trades={enrichedTrades}
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
              highlightTradeId={highlightTradeId}
            />
          </div>
          </ErrorBoundary>
        )}
      </PageTransition>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <NewTradeDialog open={showNewTradeDialog} onOpenChange={setShowNewTradeDialog} />
      <TradePlanDialog open={planOpen} onOpenChange={setPlanOpen} />
      <TradePlanningModal
        open={planningScoreOpen}
        onClose={() => setPlanningScoreOpen(false)}
        onAccept={() => {
          setPlanningScoreOpen(false);
          setShowNewTradeDialog(true);
        }}
      />
      <TradeDetailDialog
        trade={viewingTrade}
        open={!!viewingTrade}
        onOpenChange={(o) => { if (!o) { setViewingTrade(null); setEditMode(false); } }}
        initialEditMode={editMode}
        onTradeUpdated={(updated) => setViewingTrade(updated)}
      />
    </DashboardLayout>
  );
};

interface FiltersSectionProps {
  datePreset: string;
  onDatePresetChange: (value: string) => void;
  customStart: Date | null;
  customEnd: Date | null;
  onCustomStartChange: (date: Date | null) => void;
  onCustomEndChange: (date: Date | null) => void;
  accountFilter: string;
  onAccountChange: (value: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  directionFilter: string;
  onDirectionChange: (value: string) => void;
  onToggleColumnFilter: () => void;
  onImport: (trades: Trade[]) => void;
  onOpenImportDialog: () => void;
  trades: Trade[];
  visibleColumns: Record<string, boolean>;
  totalElements: number;
  onNewTrade: () => void;
  onPlanTrade: () => void;
}

const FiltersSection: React.FC<FiltersSectionProps> = ({
  datePreset,
  onDatePresetChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  accountFilter,
  onAccountChange,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  directionFilter,
  onDirectionChange,
  onToggleColumnFilter,
  onImport,
  onOpenImportDialog,
  trades,
  visibleColumns,
  totalElements,
  onNewTrade,
  onPlanTrade,
}) => {
  const { t } = useTranslation();
  const { hasPlan } = useFeatureFlags();
  const canUseTradePlanning = hasPlan('STARTER');
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <DashboardDateFilter
            preset={datePreset}
            onPresetChange={onDatePresetChange}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStartChange={onCustomStartChange}
            onCustomEndChange={onCustomEndChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <TradeImportExport
              onImport={onImport}
              onOpenImportDialog={onOpenImportDialog}
              filteredTrades={trades}
              visibleColumns={visibleColumns}
              accountFilter={accountFilter}
              totalElements={totalElements}
            />
          {canUseTradePlanning && (
            <Button variant="outline" size="sm" onClick={onPlanTrade}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              {t('tradePlan.planATrade', 'Plan a Trade')}
            </Button>
          )}
          <Button onClick={onNewTrade}>
            <Plus className="mr-2 h-4 w-4" />
            {t('trades.newTrade')}
          </Button>
        </div>
      </div>
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
            <SelectItem value="planned">{t('trades.planned', 'Planned')}</SelectItem>
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onToggleColumnFilter}>
                <Columns className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('trades.columnVisibility', 'Column Visibility')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default Trades;
