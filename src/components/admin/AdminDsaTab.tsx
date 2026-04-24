import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquareWarning, Clock, Trash2, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useDsaTransparency } from '@/hooks/useAdminMentor';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getYearOptions(): number[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => current - i);
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            <p className={cn('text-2xl font-bold tabular-nums mt-1', accent)}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Breakdown bar ─────────────────────────────────────────────────────────────

function BreakdownBar({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground truncate pr-2 max-w-[200px]">{label}</span>
        <span className="tabular-nums font-medium shrink-0">
          {count.toLocaleString()} <span className="text-muted-foreground">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/70 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const AdminDsaTab: React.FC = () => {
  const { t } = useTranslation();
  const years = getYearOptions();
  const [year, setYear] = useState(years[0]);

  const { data: report, isLoading, isError } = useDsaTransparency(year);

  const totalByCategory = report
    ? Object.values(report.byCategory).reduce((a, b) => a + b, 0)
    : 0;

  const totalByResolution = report
    ? Object.values(report.byResolution).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header + year selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">
            {t('admin.dsa.title', 'DSA transparency report')}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t(
              'admin.dsa.description',
              'Annual transparency reporting required by the EU Digital Services Act.'
            )}
          </p>
        </div>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-[110px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)} className="text-sm">
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive py-4">
          {t('common.errorLoadingData', 'Error loading data')}
        </p>
      ) : !report ? (
        <p className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border/50 rounded-xl">
          {t('admin.dsa.noReport', 'No transparency data available for {{year}}.', { year })}
        </p>
      ) : (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard
              label={t('admin.dsa.totalComplaints', 'Total complaints')}
              value={report.totalComplaints}
              icon={<MessageSquareWarning className="h-4 w-4 text-muted-foreground" />}
            />
            <KpiCard
              label={t('admin.dsa.medianResponseHours', 'Median response (h)')}
              value={report.medianResponseHours}
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            />
            <KpiCard
              label={t('admin.dsa.removalsCount', 'Content removals')}
              value={report.removalsCount}
              icon={<Trash2 className="h-4 w-4 text-muted-foreground" />}
              accent="text-destructive"
            />
            <KpiCard
              label={t('admin.dsa.uniqueCategories', 'Categories')}
              value={Object.keys(report.byCategory).length}
              icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          {/* Breakdown tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* By category */}
            <div className="rounded-xl border border-border/60 p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('admin.dsa.byCategory', 'By category')}
              </h4>
              {Object.entries(report.byCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([key, count]) => (
                  <BreakdownBar key={key} label={key} count={count} total={totalByCategory} />
                ))}
            </div>

            {/* By resolution */}
            <div className="rounded-xl border border-border/60 p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('admin.dsa.byResolution', 'By resolution')}
              </h4>
              {Object.entries(report.byResolution)
                .sort(([, a], [, b]) => b - a)
                .map(([key, count]) => (
                  <BreakdownBar key={key} label={key} count={count} total={totalByResolution} />
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDsaTab;
