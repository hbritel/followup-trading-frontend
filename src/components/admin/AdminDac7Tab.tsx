import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, CheckCircle2, Loader2, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useDac7Sellers, useFinalizeDac7 } from '@/hooks/useAdminMentor';
import { adminMentorService } from '@/services/admin-mentor.service';

// ── Year selector ─────────────────────────────────────────────────────────────

function getYearOptions(): number[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => current - i);
}

function fmtCents(cents: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(
    document.documentElement.lang || navigator.language || 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' }
  ).format(new Date(iso));
}

// ── Main component ────────────────────────────────────────────────────────────

const AdminDac7Tab: React.FC = () => {
  const { t } = useTranslation();
  const years = getYearOptions();
  const [year, setYear] = useState(years[0]);

  const { data: sellers, isLoading, isError } = useDac7Sellers(year);
  const finalize = useFinalizeDac7(year);

  const handleDownloadXml = () => {
    const url = adminMentorService.getDac7ExportUrl(year);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dac7-sellers-${year}.xml`;
    a.click();
  };

  const isFinalized = sellers?.every((s) => s.reportedAt != null) ?? false;

  return (
    <div className="space-y-5">
      {/* Header + year selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">
            {t('admin.dac7.title', 'DAC7 seller export')}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t(
              'admin.dac7.description',
              'Aggregated revenue data per mentor for EU DAC7 tax reporting.'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleDownloadXml}
            disabled={!sellers || sellers.length === 0}
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {t('admin.dac7.downloadXml', 'Download XML')}
          </Button>

          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => finalize.mutate()}
            disabled={finalize.isPending || isFinalized || !sellers || sellers.length === 0}
          >
            {finalize.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {isFinalized
              ? t('admin.dac7.alreadyFinalized', 'Already finalized')
              : t('admin.dac7.finalize', 'Finalize')}
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive py-4">
          {t('common.errorLoadingData', 'Error loading data')}
        </p>
      ) : !sellers || sellers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <FileX className="h-8 w-8 opacity-30" aria-hidden="true" />
          <p className="text-sm">
            {t('admin.dac7.noSellers', 'No reportable sellers for {{year}}.', { year })}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b bg-muted/50">
                {[
                  t('admin.dac7.colBrand', 'Brand'),
                  t('admin.dac7.colLegalName', 'Legal name'),
                  t('admin.dac7.colCountry', 'Country'),
                  t('admin.dac7.colTin', 'TIN'),
                  t('admin.dac7.colGross', 'Gross revenue'),
                  t('admin.dac7.colTransactions', 'Transactions'),
                  t('admin.dac7.colFees', 'Platform fees'),
                  t('admin.dac7.colReportedAt', 'Reported'),
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sellers.map((s) => (
                <tr
                  key={s.mentorInstanceId}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium">{s.brandName}</td>
                  <td className="px-4 py-3 text-sm">{s.legalName}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {s.countryOfResidence}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                    {s.tin ?? s.vatNumber ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums font-medium">
                    {fmtCents(s.grossAmountCents)}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-center">
                    {s.transactionCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
                    {fmtCents(s.feesCents)}
                  </td>
                  <td className="px-4 py-3">
                    {s.reportedAt ? (
                      <span
                        className={cn(
                          'inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border',
                          'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
                        )}
                      >
                        {fmtDate(s.reportedAt)}
                      </span>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        {t('admin.dac7.pending', 'Pending')}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDac7Tab;
