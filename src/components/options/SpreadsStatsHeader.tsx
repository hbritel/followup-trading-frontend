import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, CheckCircle2, DollarSign, TrendingUp } from 'lucide-react';
import type { OptionSpreadDto } from '@/types/dto';

interface SpreadsStatsHeaderProps {
  readonly spreads: readonly OptionSpreadDto[];
}

interface Stats {
  readonly count: number;
  readonly openCount: number;
  readonly closedCount: number;
  readonly expiredCount: number;
  readonly totalRealized: number;
  readonly winRate: number | null;
  readonly bestType: { type: string; pnl: number } | null;
}

function formatCurrency(value: number): string {
  const abs = Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 0 });
  return value >= 0 ? `$${abs}` : `-$${abs}`;
}

function computeStats(spreads: readonly OptionSpreadDto[]): Stats {
  const closed = spreads.filter((s) => s.status !== 'OPEN' && s.realizedPnl != null);
  const wins = closed.filter((s) => (s.realizedPnl ?? 0) > 0).length;
  const totalRealized = closed.reduce((sum, s) => sum + (s.realizedPnl ?? 0), 0);

  const byType = new Map<string, number>();
  closed.forEach((s) => {
    byType.set(s.spreadType, (byType.get(s.spreadType) ?? 0) + (s.realizedPnl ?? 0));
  });
  let bestType: { type: string; pnl: number } | null = null;
  byType.forEach((pnl, type) => {
    if (bestType == null || pnl > bestType.pnl) {
      bestType = { type, pnl };
    }
  });

  return {
    count: spreads.length,
    openCount: spreads.filter((s) => s.status === 'OPEN').length,
    closedCount: spreads.filter((s) => s.status === 'CLOSED').length,
    expiredCount: spreads.filter((s) => s.status === 'EXPIRED').length,
    totalRealized,
    winRate: closed.length === 0 ? null : (wins / closed.length) * 100,
    bestType,
  };
}

function formatSpreadType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: 'default' | 'profit' | 'loss';
}> = ({ icon, label, value, hint, tone = 'default' }) => {
  const toneClass =
    tone === 'profit'
      ? 'text-emerald-400'
      : tone === 'loss'
        ? 'text-red-400'
        : 'text-white';
  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-muted-foreground/70 text-[10px] uppercase tracking-wider">
        {icon}
        <span>{label}</span>
      </div>
      <p className={`text-xl font-bold tabular-nums ${toneClass}`}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  );
};

const SpreadsStatsHeader: React.FC<SpreadsStatsHeaderProps> = ({ spreads }) => {
  const { t } = useTranslation();
  const stats = useMemo(() => computeStats(spreads), [spreads]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon={<Activity className="w-3.5 h-3.5" />}
        label={t('options.stats.total', 'Total spreads')}
        value={stats.count}
        hint={
          <span>
            <span className="text-blue-400">{stats.openCount}</span>{' '}
            {t('options.open').toLowerCase()} ·{' '}
            <span className="text-emerald-400">{stats.closedCount}</span>{' '}
            {t('options.closed').toLowerCase()} ·{' '}
            <span className="text-slate-400">{stats.expiredCount}</span>{' '}
            {t('options.expired').toLowerCase()}
          </span>
        }
      />
      <StatCard
        icon={<DollarSign className="w-3.5 h-3.5" />}
        label={t('options.stats.realized', 'Realized P&L')}
        value={formatCurrency(stats.totalRealized)}
        tone={stats.totalRealized >= 0 ? 'profit' : 'loss'}
        hint={t('options.stats.realizedHint', 'Closed + expired spreads')}
      />
      <StatCard
        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
        label={t('options.stats.winRate', 'Win rate')}
        value={stats.winRate == null ? '--' : `${stats.winRate.toFixed(1)}%`}
        hint={
          stats.winRate == null
            ? t('options.stats.noClosedSpreads', 'No closed spreads yet')
            : undefined
        }
      />
      <StatCard
        icon={<TrendingUp className="w-3.5 h-3.5" />}
        label={t('options.stats.bestType', 'Best strategy')}
        value={stats.bestType == null ? '--' : formatSpreadType(stats.bestType.type)}
        hint={
          stats.bestType == null
            ? undefined
            : `${formatCurrency(stats.bestType.pnl)} ${t('options.stats.totalPnl', 'total')}`
        }
      />
    </div>
  );
};

export default SpreadsStatsHeader;
