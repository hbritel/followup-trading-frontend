import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Download,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Search as SearchIcon,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOptionSpreads, useDetectSpreads } from '@/hooks/useOptionSpreads';
import { optionSpreadService } from '@/services/optionSpread.service';
import { toast } from 'sonner';
import type { OptionSpreadDto, SpreadType, SpreadStatus } from '@/types/dto';
import SpreadsStatsHeader from '@/components/options/SpreadsStatsHeader';
import SpreadsFilters, {
  DEFAULT_FILTERS,
  type SpreadsFilterValue,
} from '@/components/options/SpreadsFilters';
import SpreadDetailDialog from '@/components/options/SpreadDetailDialog';
import ManualSpreadBuilderDialog from '@/components/options/ManualSpreadBuilderDialog';
import PortfolioGreeksPanel from '@/components/options/PortfolioGreeksPanel';
import { computeDte, dteBucket } from '@/lib/options/dte';
import { useSubscription } from '@/hooks/useSubscription';

const SPREAD_TYPE_COLORS: Record<string, string> = {
  VERTICAL_CALL: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  VERTICAL_PUT: 'bg-red-500/10 text-red-400 border-red-500/20',
  STRADDLE: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  STRANGLE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  IRON_CONDOR: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  IRON_BUTTERFLY: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  BUTTERFLY_CALL: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  BUTTERFLY_PUT: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  CALENDAR: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  DIAGONAL: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  COVERED_CALL: 'bg-lime-500/10 text-lime-400 border-lime-500/20',
  PROTECTIVE_PUT: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  COLLAR: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  CUSTOM: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const STATUS_STYLES: Record<SpreadStatus, string> = {
  OPEN: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  CLOSED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  EXPIRED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const LEG_TYPE_LABELS: Record<string, { label: string; className: string }> = {
  LONG_CALL: { label: 'LC', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  SHORT_CALL: { label: 'SC', className: 'bg-red-500/15 text-red-400 border-red-500/25' },
  LONG_PUT: { label: 'LP', className: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  SHORT_PUT: { label: 'SP', className: 'bg-orange-500/15 text-orange-400 border-orange-500/25' },
  STOCK: { label: 'STK', className: 'bg-slate-500/15 text-slate-400 border-slate-500/25' },
};

function formatSpreadType(type: SpreadType): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCurrency(value: number | null): string {
  if (value == null) return '--';
  return value >= 0 ? `$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`;
}

type FilterTab = 'all' | 'OPEN' | 'CLOSED' | 'EXPIRED';

interface SpreadCardProps {
  readonly spread: OptionSpreadDto;
  readonly onOpen: (spread: OptionSpreadDto) => void;
}

const SpreadCard: React.FC<SpreadCardProps> = ({ spread, onOpen }) => {
  const { t } = useTranslation();
  const sortedLegs = [...spread.legs].sort((a, b) => a.sortOrder - b.sortOrder);
  const dte = computeDte(spread.expirationDate);

  const handleActivate = () => onOpen(spread);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleActivate();
        }
      }}
      className="glass-card rounded-2xl p-5 flex flex-col gap-4 h-full hover:border-white/10 hover:bg-white/[0.02] transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant="outline"
            className={`text-xs font-semibold ${SPREAD_TYPE_COLORS[spread.spreadType] ?? SPREAD_TYPE_COLORS.CUSTOM}`}
          >
            {formatSpreadType(spread.spreadType)}
          </Badge>
          {spread.source === 'MANUAL' && (
            <Badge
              variant="outline"
              className="text-[10px] font-semibold bg-violet-500/10 text-violet-300 border-violet-500/30"
            >
              {t('options.sourceManual', 'Manual')}
            </Badge>
          )}
          {spread.rolledFromId && (
            <Badge
              variant="outline"
              className="text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              {t('options.rolled', 'Rolled')}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {spread.status === 'OPEN' && dte.days != null && (
            <Badge
              variant="outline"
              className={
                dte.isExpiringSoon
                  ? 'text-[10px] font-semibold bg-red-500/15 text-red-400 border-red-500/30 animate-pulse'
                  : 'text-[10px] font-semibold bg-white/5 text-muted-foreground border-white/10'
              }
            >
              <Clock className="w-3 h-3 mr-1" />
              {dte.days}d
            </Badge>
          )}
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold ${STATUS_STYLES[spread.status]}`}
          >
            {spread.status}
          </Badge>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white tracking-tight">{spread.underlying}</h3>
        {spread.expirationDate && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('options.expiry')}: {new Date(spread.expirationDate).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{t('options.netPremium')}</p>
          <p className="text-sm font-semibold text-white mt-0.5">{formatCurrency(spread.netPremium)}</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{t('options.realizedPnl')}</p>
          <p className={`text-sm font-semibold mt-0.5 ${spread.realizedPnl != null && spread.realizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(spread.realizedPnl)}
          </p>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{t('options.maxProfit')}</p>
          <p className="text-sm font-semibold text-emerald-400 mt-0.5">{formatCurrency(spread.maxProfit)}</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{t('options.maxLoss')}</p>
          <p className="text-sm font-semibold text-red-400 mt-0.5">{formatCurrency(spread.maxLoss)}</p>
        </div>
      </div>

      {(spread.breakevenLow != null || spread.breakevenHigh != null) && (
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="text-muted-foreground/60">{t('options.breakeven')}:</span>
          {spread.breakevenLow != null && <span>${spread.breakevenLow.toFixed(2)}</span>}
          {spread.breakevenLow != null && spread.breakevenHigh != null && <span>-</span>}
          {spread.breakevenHigh != null && <span>${spread.breakevenHigh.toFixed(2)}</span>}
        </div>
      )}

      <div className="mt-auto">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-2">{t('options.legs')}</p>
        <div className="flex flex-wrap gap-1.5">
          {sortedLegs.map((leg) => {
            const legInfo = LEG_TYPE_LABELS[leg.legType] ?? LEG_TYPE_LABELS.STOCK;
            return (
              <Badge
                key={leg.id}
                variant="outline"
                className={`text-[10px] font-mono ${legInfo.className}`}
              >
                {legInfo.label} {leg.strike} x{leg.quantity}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function applyFilters(
  spreads: readonly OptionSpreadDto[],
  filters: SpreadsFilterValue,
): OptionSpreadDto[] {
  const search = filters.search.trim().toUpperCase();
  const filtered = spreads.filter((s) => {
    if (search && !s.underlying.toUpperCase().includes(search)) return false;
    if (filters.spreadType !== 'ALL' && s.spreadType !== filters.spreadType) return false;
    if (filters.dte !== 'any') {
      const dte = computeDte(s.expirationDate);
      if (dteBucket(dte.days) !== filters.dte) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  switch (filters.sort) {
    case 'dte':
      sorted.sort((a, b) => {
        const da = computeDte(a.expirationDate).days ?? Number.POSITIVE_INFINITY;
        const db = computeDte(b.expirationDate).days ?? Number.POSITIVE_INFINITY;
        return da - db;
      });
      break;
    case 'pnl':
      sorted.sort(
        (a, b) =>
          (b.realizedPnl ?? Number.NEGATIVE_INFINITY) -
          (a.realizedPnl ?? Number.NEGATIVE_INFINITY),
      );
      break;
    case 'underlying':
      sorted.sort((a, b) => a.underlying.localeCompare(b.underlying));
      break;
    case 'detected':
    default:
      sorted.sort(
        (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
      );
  }
  return sorted;
}

const OptionSpreads: React.FC = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [filters, setFilters] = useState<SpreadsFilterValue>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<OptionSpreadDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);

  useEffect(() => {
    document.title = `${t('options.title')} | FollowUp Trading`;
  }, [t]);

  const statusParam = filter === 'all' ? undefined : filter;
  const { data: spreads = [], isLoading, isError } = useOptionSpreads(statusParam);
  const detectMutation = useDetectSpreads();

  const displayed = useMemo(() => applyFilters(spreads, filters), [spreads, filters]);

  const handleDetect = async () => {
    try {
      await detectMutation.mutateAsync();
      toast.success(t('options.detectSuccess'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleOpenDetail = (spread: OptionSpreadDto) => {
    setSelected(spread);
    setDialogOpen(true);
  };

  const { data: subscription } = useSubscription();
  const isElite = subscription?.plan === 'ELITE';

  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await optionSpreadService.exportCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `option-spreads-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(t('options.exportSuccess', 'CSV downloaded'));
    } catch {
      toast.error(t('options.exportError', 'Export failed'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout pageTitle={t('options.title')}>
      <PageTransition className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 flex items-center gap-2">
              <Layers className="w-6 h-6 text-primary" />
              {t('options.title')}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{t('options.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exporting || !spreads || spreads.length === 0}
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {t('options.exportCsv', 'Export CSV')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setBuilderOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('options.createManual', 'Create spread')}
            </Button>
            <Button
              onClick={handleDetect}
              disabled={detectMutation.isPending}
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              {detectMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('options.detecting')}
                </>
              ) : (
                <>
                  <SearchIcon className="w-4 h-4 mr-2" />
                  {t('options.detect')}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats header (across all filtered by status tab) */}
        {!isLoading && !isError && spreads.length > 0 && (
          <SpreadsStatsHeader spreads={spreads} />
        )}

        {/* Portfolio Greeks — ELITE only */}
        {!isLoading && !isError && spreads.length > 0 && (
          <PortfolioGreeksPanel enabled={isElite} />
        )}

        {/* Status tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="all">{t('options.all')}</TabsTrigger>
            <TabsTrigger value="OPEN">{t('options.open')}</TabsTrigger>
            <TabsTrigger value="CLOSED">{t('options.closed')}</TabsTrigger>
            <TabsTrigger value="EXPIRED">{t('options.expired')}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        {!isLoading && !isError && spreads.length > 0 && (
          <SpreadsFilters value={filters} onChange={setFilters} />
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">{t('common.errorLoading')}</p>
          </div>
        )}

        {/* Empty state — no spreads at all */}
        {!isLoading && !isError && spreads.length === 0 && (
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Layers className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-white">{t('options.emptyTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('options.emptyDesc')}</p>
            </div>
          </div>
        )}

        {/* Empty — filters exclude everything */}
        {!isLoading && !isError && spreads.length > 0 && displayed.length === 0 && (
          <div className="glass-card rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
            <SearchIcon className="w-6 h-6 text-muted-foreground/60" />
            <div>
              <p className="font-semibold text-white">
                {t('options.noMatchTitle', 'No spreads match your filters')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('options.noMatchDesc', 'Try clearing filters or widening your search')}
              </p>
            </div>
          </div>
        )}

        {/* Spread grid */}
        {!isLoading && displayed.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((spread) => (
              <SpreadCard key={spread.id} spread={spread} onOpen={handleOpenDetail} />
            ))}
          </div>
        )}

        {/* Detail dialog */}
        <SpreadDetailDialog
          spread={selected}
          open={dialogOpen}
          showGreeks={isElite}
          onOpenChange={(o) => {
            setDialogOpen(o);
            if (!o) setSelected(null);
          }}
        />

        {/* Manual builder dialog */}
        <ManualSpreadBuilderDialog open={builderOpen} onOpenChange={setBuilderOpen} />
      </PageTransition>
    </DashboardLayout>
  );
};

export default OptionSpreads;
