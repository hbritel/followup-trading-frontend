import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Percent, BarChart2, Activity, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MentorPublicStatsDto } from '@/types/dto';

interface StatCellProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}

const StatCell: React.FC<StatCellProps> = ({ icon, label, value, accent }) => (
  <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-muted/40 border border-border/30 min-w-0">
    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', accent ?? 'bg-primary/10 text-primary')}>
      {icon}
    </div>
    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground leading-none">
      {label}
    </p>
    <p className="text-xl font-bold tabular-nums tracking-tight leading-none">
      {value}
    </p>
  </div>
);

interface VerifiedStatsPanelProps {
  stats: MentorPublicStatsDto;
  className?: string;
}

const VerifiedStatsPanel: React.FC<VerifiedStatsPanelProps> = ({ stats, className }) => {
  const { t } = useTranslation();

  if (stats.insufficientData) {
    return (
      <aside
        aria-label={t('mentor.trust.stats.panelLabel', 'Verified trading stats')}
        className={cn(
          'glass-card rounded-2xl p-5 border border-border/50 flex items-start gap-3',
          className
        )}
      >
        <AlertCircle className="w-5 h-5 text-muted-foreground/60 mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium">
            {t('mentor.trust.stats.insufficientTitle', 'Not enough data yet')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              'mentor.trust.stats.insufficientDesc',
              'Stats will appear once the mentor has closed enough trades in the last {{days}} days.',
              { days: stats.lookbackDays }
            )}
          </p>
        </div>
      </aside>
    );
  }

  const fmt = (n: number | null, decimals = 1): string =>
    n == null ? '—' : n.toFixed(decimals);

  return (
    <section
      aria-labelledby="verified-stats-heading"
      className={cn('glass-card rounded-2xl p-5 border border-border/50 space-y-4', className)}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3
          id="verified-stats-heading"
          className="text-sm font-semibold"
        >
          {t('mentor.trust.stats.sectionTitle', 'Verified trading stats')}
        </h3>
        <span className="text-[11px] text-muted-foreground">
          {t('mentor.trust.stats.lookback', 'Last {{days}} days', {
            days: stats.lookbackDays,
          })}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCell
          icon={<Percent className="w-3.5 h-3.5" aria-hidden="true" />}
          label={t('mentor.trust.stats.winRate', 'Win rate')}
          value={stats.winRate != null ? `${(stats.winRate * 100).toFixed(1)}%` : '—'}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCell
          icon={<TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />}
          label={t('mentor.trust.stats.profitFactor', 'Profit factor')}
          value={fmt(stats.profitFactor)}
          accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <StatCell
          icon={<BarChart2 className="w-3.5 h-3.5" aria-hidden="true" />}
          label={t('mentor.trust.stats.avgR', 'Avg R')}
          value={stats.avgRMultiple != null ? `${fmt(stats.avgRMultiple)}R` : '—'}
          accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
        <StatCell
          icon={<Activity className="w-3.5 h-3.5" aria-hidden="true" />}
          label={t('mentor.trust.stats.trades', 'Trades')}
          value={String(stats.tradeCount)}
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </div>

      <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
        {t(
          'mentor.trust.stats.disclosure',
          'Historical, unaudited trades of the mentor (last {{days}} days). Past performance is not indicative of future results.',
          { days: stats.lookbackDays }
        )}
      </p>
    </section>
  );
};

export default VerifiedStatsPanel;
