import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, Loader2, Search as SearchIcon } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOptionSpreads, useDetectSpreads } from '@/hooks/useOptionSpreads';
import { useSubscription } from '@/hooks/useSubscription';
import SpreadDetailDialog from '@/components/options/SpreadDetailDialog';
import { toast } from 'sonner';
import type { OptionSpreadDto, SpreadStatus } from '@/types/dto';

const SPREAD_TYPE_TONES: Record<string, string> = {
  VERTICAL_CALL: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  VERTICAL_PUT: 'bg-red-500/10 text-red-500 border-red-500/20',
  STRADDLE: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  STRANGLE: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  IRON_CONDOR: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  IRON_BUTTERFLY: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  BUTTERFLY_CALL: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  BUTTERFLY_PUT: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  CALENDAR: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  DIAGONAL: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  COVERED_CALL: 'bg-lime-500/10 text-lime-500 border-lime-500/20',
  PROTECTIVE_PUT: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  COLLAR: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  CUSTOM: 'bg-muted text-muted-foreground border-border',
};

const STATUS_TONES: Record<SpreadStatus, string> = {
  OPEN: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  CLOSED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  EXPIRED: 'bg-muted text-muted-foreground border-border',
};

const LEG_TYPE_LABELS: Record<string, { label: string; className: string }> = {
  LONG_CALL: { label: 'LC', className: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25' },
  SHORT_CALL: { label: 'SC', className: 'bg-red-500/15 text-red-500 border-red-500/25' },
  LONG_PUT: { label: 'LP', className: 'bg-blue-500/15 text-blue-500 border-blue-500/25' },
  SHORT_PUT: { label: 'SP', className: 'bg-orange-500/15 text-orange-500 border-orange-500/25' },
  STOCK: { label: 'STK', className: 'bg-muted text-muted-foreground border-border' },
};

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

  const spreadTypeLabel = t(`options.types.${spread.spreadType}`, spread.spreadType);
  const statusLabel = t(`options.status.${spread.status}`, spread.status);

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
      className="glass-card rounded-2xl p-5 flex flex-col gap-4 h-full transition-colors duration-200 cursor-pointer hover:border-border/80 hover:bg-white/[0.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {/* Header: type badge + status */}
      <div className="flex items-start justify-between gap-3">
        <Badge
          variant="outline"
          className={`text-xs font-semibold ${SPREAD_TYPE_TONES[spread.spreadType] ?? SPREAD_TYPE_TONES.CUSTOM}`}
        >
          {spreadTypeLabel}
        </Badge>
        <Badge
          variant="outline"
          className={`text-[10px] font-semibold uppercase tracking-wide ${STATUS_TONES[spread.status]}`}
        >
          {statusLabel}
        </Badge>
      </div>

      {/* Underlying + expiry */}
      <div>
        <h3 className="text-lg font-bold text-foreground tracking-tight">{spread.underlying}</h3>
        {spread.expirationDate && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('options.expiry')}: {new Date(spread.expirationDate).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-accent/10 border border-border/40 px-3 py-2">
          <p className="label-caps text-[10px]">{t('options.netPremium')}</p>
          <p className="text-sm font-semibold text-foreground tabular-nums mt-0.5">
            {formatCurrency(spread.netPremium)}
          </p>
        </div>
        <div className="rounded-xl bg-accent/10 border border-border/40 px-3 py-2">
          <p className="label-caps text-[10px]">{t('options.realizedPnl')}</p>
          <p
            className={`text-sm font-semibold tabular-nums mt-0.5 ${
              spread.realizedPnl != null && spread.realizedPnl >= 0 ? 'text-profit' : 'text-loss'
            }`}
          >
            {formatCurrency(spread.realizedPnl)}
          </p>
        </div>
        <div className="rounded-xl bg-accent/10 border border-border/40 px-3 py-2">
          <p className="label-caps text-[10px]">{t('options.maxProfit')}</p>
          <p className="text-sm font-semibold text-profit tabular-nums mt-0.5">
            {formatCurrency(spread.maxProfit)}
          </p>
        </div>
        <div className="rounded-xl bg-accent/10 border border-border/40 px-3 py-2">
          <p className="label-caps text-[10px]">{t('options.maxLoss')}</p>
          <p className="text-sm font-semibold text-loss tabular-nums mt-0.5">
            {formatCurrency(spread.maxLoss)}
          </p>
        </div>
      </div>

      {/* Breakeven */}
      {(spread.breakevenLow != null || spread.breakevenHigh != null) && (
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="text-muted-foreground/70">{t('options.breakeven')}:</span>
          {spread.breakevenLow != null && <span className="tabular-nums">${spread.breakevenLow.toFixed(2)}</span>}
          {spread.breakevenLow != null && spread.breakevenHigh != null && <span>-</span>}
          {spread.breakevenHigh != null && <span className="tabular-nums">${spread.breakevenHigh.toFixed(2)}</span>}
        </div>
      )}

      {/* Legs */}
      <div className="mt-auto">
        <p className="label-caps text-[10px] mb-2">{t('options.legs')}</p>
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

const OptionSpreads: React.FC = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [selected, setSelected] = useState<OptionSpreadDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    document.title = `${t('options.title')} | FollowUp Trading`;
  }, [t]);

  const statusParam = filter === 'all' ? undefined : filter;
  const { data: spreads = [], isLoading, isError } = useOptionSpreads(statusParam);
  const detectMutation = useDetectSpreads();
  const { data: subscription } = useSubscription();
  const canSeeGreeks = subscription?.plan === 'ELITE' || subscription?.plan === 'TEAM';

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

  return (
    <DashboardLayout pageTitle={t('options.title')}>
      <PageTransition className="space-y-6">
        {/* Header — matches the rest of the analytics pages: plain title + descriptive subtitle + right-rail action */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('options.title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('options.subtitle')}</p>
          </div>
          <Button onClick={handleDetect} disabled={detectMutation.isPending} className="gap-2">
            {detectMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('options.detecting')}
              </>
            ) : (
              <>
                <SearchIcon className="h-4 w-4" />
                {t('options.detect')}
              </>
            )}
          </Button>
        </div>

        {/* Filter tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="all">{t('options.all')}</TabsTrigger>
            <TabsTrigger value="OPEN">{t('options.open')}</TabsTrigger>
            <TabsTrigger value="CLOSED">{t('options.closed')}</TabsTrigger>
            <TabsTrigger value="EXPIRED">{t('options.expired')}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">{t('common.errorLoading')}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && spreads.length === 0 && (
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Layers className="h-7 w-7 text-primary" />
            </div>
            <div className="max-w-md">
              <p className="font-semibold text-foreground">{t('options.emptyTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {t('options.emptyDesc')}
              </p>
            </div>
          </div>
        )}

        {/* Spread grid */}
        {!isLoading && spreads.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {spreads.map((spread) => (
              <SpreadCard key={spread.id} spread={spread} onOpen={handleOpenDetail} />
            ))}
          </div>
        )}

        {/* Detail dialog */}
        <SpreadDetailDialog
          spread={selected}
          open={dialogOpen}
          showGreeks={canSeeGreeks}
          onOpenChange={(o) => {
            setDialogOpen(o);
            if (!o) setSelected(null);
          }}
        />
      </PageTransition>
    </DashboardLayout>
  );
};

export default OptionSpreads;
