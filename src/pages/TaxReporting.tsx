import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useTaxReport, useGenerateTaxReport, useTaxLots, useWashSales } from '@/hooks/useTaxReport';
import { taxService } from '@/services/tax.service';
import type { TaxJurisdiction, TaxLotDto, WashSaleDto } from '@/types/dto';
import {
  Calculator,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';

// ---- Helpers ----------------------------------------------------------------

const CURRENT_YEAR = new Date().getFullYear();

const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

const JURISDICTIONS: { value: TaxJurisdiction; label: string }[] = [
  { value: 'US', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'OTHER', label: 'Other' },
];

const fmt = (n: number, fractionDigits = 2) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

type SortDir = 'asc' | 'desc';
type LotSortKey = keyof Pick<
  TaxLotDto,
  'symbol' | 'acquiredDate' | 'soldDate' | 'proceeds' | 'costBasis' | 'gain' | 'holdingPeriod'
>;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---- Sub-components ---------------------------------------------------------

interface KpiCardProps {
  label: string;
  value: string;
  valueClass?: string;
  icon: React.ReactNode;
  cardClass?: string;
}

const KpiCard = ({ label, value, valueClass = 'text-gradient', icon, cardClass = '' }: KpiCardProps) => (
  <div className={`glass-card p-5 ${cardClass}`}>
    <div className="flex items-center justify-between mb-3">
      <span className="label-caps text-muted-foreground">{label}</span>
      <span className="text-muted-foreground">{icon}</span>
    </div>
    <p className={`kpi-value text-2xl ${valueClass}`}>{value}</p>
  </div>
);

interface SortableHeaderProps {
  label: string;
  sortKey: LotSortKey;
  currentKey: LotSortKey;
  dir: SortDir;
  onSort: (key: LotSortKey) => void;
}

const SortableHeader = ({ label, sortKey, currentKey, dir, onSort }: SortableHeaderProps) => (
  <th
    className="px-3 py-2 text-left label-caps text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
    onClick={() => onSort(sortKey)}
  >
    <span className="inline-flex items-center gap-1">
      {label}
      {currentKey === sortKey ? (
        dir === 'asc' ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )
      ) : (
        <ChevronDown className="h-3 w-3 opacity-30" />
      )}
    </span>
  </th>
);

// ---- Tax Lots Table ---------------------------------------------------------

interface TaxLotsTableProps {
  lots: TaxLotDto[];
  isLoading: boolean;
}

const TaxLotsTable = ({ lots, isLoading }: TaxLotsTableProps) => {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<LotSortKey>('soldDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: LotSortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = useMemo(() => {
    if (!lots) return [];
    return [...lots].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [lots, sortKey, sortDir]);

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!lots || lots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <FileText className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">{t('tax.noLots')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50">
            <SortableHeader label={t('tax.symbol')} sortKey="symbol" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
            <SortableHeader label={t('tax.acquiredDate')} sortKey="acquiredDate" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
            <SortableHeader label={t('tax.soldDate')} sortKey="soldDate" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
            <SortableHeader label={t('tax.proceeds')} sortKey="proceeds" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
            <SortableHeader label={t('tax.costBasis')} sortKey="costBasis" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
            <SortableHeader label={t('tax.gain')} sortKey="gain" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
            <SortableHeader label={t('tax.holdingPeriod')} sortKey="holdingPeriod" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
            <th className="px-3 py-2 text-left label-caps text-muted-foreground">{t('tax.washSale')}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((lot) => (
            <tr
              key={lot.tradeId}
              className={[
                'border-b border-border/30 transition-colors',
                lot.isWashSale
                  ? 'bg-amber-500/5 border-l-2 border-l-amber-500'
                  : 'hover:bg-white/[0.02]',
              ].join(' ')}
            >
              <td className="px-3 py-2.5 font-mono font-medium tabular-nums">{lot.symbol}</td>
              <td className="px-3 py-2.5 text-muted-foreground font-mono tabular-nums">{fmtDate(lot.acquiredDate)}</td>
              <td className="px-3 py-2.5 text-muted-foreground font-mono tabular-nums">{fmtDate(lot.soldDate)}</td>
              <td className="px-3 py-2.5 font-mono tabular-nums">{fmt(lot.proceeds)}</td>
              <td className="px-3 py-2.5 font-mono tabular-nums">{fmt(lot.costBasis)}</td>
              <td className={`px-3 py-2.5 font-mono tabular-nums font-semibold ${lot.gain >= 0 ? 'text-profit' : 'text-loss'}`}>
                {fmt(lot.gain)}
              </td>
              <td className="px-3 py-2.5">
                <Badge
                  variant="outline"
                  className={
                    lot.holdingPeriod === 'LONG_TERM'
                      ? 'border-violet-500/40 text-violet-400'
                      : 'border-amber-500/40 text-amber-400'
                  }
                >
                  {lot.holdingPeriod === 'LONG_TERM' ? t('tax.longTerm') : t('tax.shortTerm')}
                </Badge>
              </td>
              <td className="px-3 py-2.5">
                {lot.isWashSale ? (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-amber-400 font-mono tabular-nums text-xs">
                      {fmt(lot.washSaleAdjustment)}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground/40">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ---- Wash Sales Table -------------------------------------------------------

interface WashSalesTableProps {
  washSales: WashSaleDto[];
  isLoading: boolean;
}

const WashSalesTable = ({ washSales, isLoading }: WashSalesTableProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!washSales || washSales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <AlertTriangle className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">{t('tax.noWashSales')}</p>
        <p className="text-xs mt-1 opacity-60">{t('tax.noWashSalesDesc')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50">
            <th className="px-3 py-2 text-left label-caps text-muted-foreground">{t('tax.symbol')}</th>
            <th className="px-3 py-2 text-left label-caps text-muted-foreground">{t('tax.washSaleDate')}</th>
            <th className="px-3 py-2 text-left label-caps text-muted-foreground">{t('tax.originalTrade')}</th>
            <th className="px-3 py-2 text-left label-caps text-muted-foreground">{t('tax.replacementTrade')}</th>
            <th className="px-3 py-2 text-left label-caps text-muted-foreground">{t('tax.lossAmount')}</th>
            <th className="px-3 py-2 text-left label-caps text-muted-foreground">{t('tax.adjustment')}</th>
          </tr>
        </thead>
        <tbody>
          {washSales.map((ws, idx) => (
            <tr
              key={idx}
              className="border-b border-border/30 bg-amber-500/5 border-l-2 border-l-amber-500 hover:bg-amber-500/10 transition-colors"
            >
              <td className="px-3 py-2.5 font-mono font-medium tabular-nums">{ws.symbol}</td>
              <td className="px-3 py-2.5 text-muted-foreground font-mono tabular-nums">{fmtDate(ws.washSaleDate)}</td>
              <td className="px-3 py-2.5 text-muted-foreground font-mono text-xs tabular-nums truncate max-w-[120px]">
                {ws.originalTradeId}
              </td>
              <td className="px-3 py-2.5 text-muted-foreground font-mono text-xs tabular-nums truncate max-w-[120px]">
                {ws.replacementTradeId}
              </td>
              <td className="px-3 py-2.5 font-mono tabular-nums text-loss font-semibold">
                {fmt(ws.lossAmount)}
              </td>
              <td className="px-3 py-2.5 font-mono tabular-nums text-amber-400 font-semibold">
                {fmt(ws.adjustmentAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ---- Export Tab -------------------------------------------------------------

interface ExportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onDownload: () => void;
  isPending: boolean;
}

const ExportCard = ({ title, description, icon, onDownload, isPending }: ExportCardProps) => (
  <div className="glass-card p-6 flex flex-col gap-4">
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
    <Button
      variant="outline"
      className="w-full"
      onClick={onDownload}
      disabled={isPending}
    >
      {isPending ? (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {isPending ? 'Downloading...' : 'Download CSV'}
    </Button>
  </div>
);

// ---- Main Page --------------------------------------------------------------

const TaxReporting = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [year, setYear] = useState<number>(CURRENT_YEAR - 1);
  const [jurisdiction, setJurisdiction] = useState<TaxJurisdiction>('US');
  const [exportPending, setExportPending] = useState<string | null>(null);

  const { data: report, isLoading: reportLoading, isError } = useTaxReport(year, jurisdiction);
  const generateMutation = useGenerateTaxReport();
  const { data: lots, isLoading: lotsLoading } = useTaxLots(year);
  const { data: washSales, isLoading: washLoading } = useWashSales(year);

  const handleGenerate = () => {
    generateMutation.mutate(
      { year, jurisdiction },
      {
        onSuccess: () => {
          toast({
            title: t('tax.reportGenerated'),
            description: t('tax.reportGeneratedDesc'),
          });
        },
        onError: () => {
          toast({
            title: t('common.error'),
            description: t('tax.generationFailed'),
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleExport = async (
    type: 'form8949' | 'scheduleD' | 'summary',
    filename: string
  ) => {
    setExportPending(type);
    try {
      let blob: Blob;
      if (type === 'form8949') {
        blob = await taxService.exportForm8949(year, jurisdiction);
      } else if (type === 'scheduleD') {
        blob = await taxService.exportScheduleD(year, jurisdiction);
      } else {
        blob = await taxService.exportSummary(year, jurisdiction);
      }
      downloadBlob(blob, filename);
      toast({
        title: t('tax.exportSuccess'),
        description: t('tax.exportSuccessDesc'),
      });
    } catch {
      toast({
        title: t('common.error'),
        description: t('tax.exportFailed'),
        variant: 'destructive',
      });
    } finally {
      setExportPending(null);
    }
  };

  const gainIsPositive = (report?.totalGain ?? 0) >= 0;

  return (
    <DashboardLayout pageTitle={t('pages.taxReporting', 'Tax Reporting')}>
      <PageTransition className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gradient">{t('tax.title')}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{t('tax.description')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Year selector */}
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Jurisdiction selector */}
            <Select value={jurisdiction} onValueChange={(v) => setJurisdiction(v as TaxJurisdiction)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JURISDICTIONS.map((j) => (
                  <SelectItem key={j.value} value={j.value}>
                    {j.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4 mr-2" />
              )}
              {generateMutation.isPending ? t('tax.generating') : t('tax.generateReport')}
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {reportLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-card p-5 space-y-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-32" />
                </div>
              ))}
            </>
          ) : isError ? (
            <div className="glass-card p-5 col-span-full text-center text-muted-foreground text-sm">
              {t('tax.noReportYet')}
            </div>
          ) : report ? (
            <>
              <KpiCard
                label={t('tax.totalProceeds')}
                value={fmt(report.totalProceeds)}
                icon={<TrendingUp className="h-4 w-4" />}
                valueClass="text-gradient"
              />
              <KpiCard
                label={t('tax.totalCostBasis')}
                value={fmt(report.totalCostBasis)}
                icon={<DollarSign className="h-4 w-4" />}
                valueClass="text-gradient"
              />
              <KpiCard
                label={t('tax.netGainLoss')}
                value={fmt(report.totalGain)}
                icon={gainIsPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                valueClass={gainIsPositive ? 'text-profit' : 'text-loss'}
                cardClass={gainIsPositive ? 'glass-card-profit' : 'glass-card-loss'}
              />
              <KpiCard
                label={t('tax.estimatedTax')}
                value={fmt(report.estimatedTax)}
                icon={<Calculator className="h-4 w-4" />}
                valueClass="text-gradient-gold"
                cardClass="glass-card-gold"
              />
            </>
          ) : (
            <div className="glass-card p-5 col-span-full text-center text-muted-foreground text-sm py-8">
              <Calculator className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>{t('tax.noReportYet')}</p>
              <p className="text-xs mt-1 opacity-60">{t('tax.clickGenerate')}</p>
            </div>
          )}
        </div>

        {/* Short-term vs Long-term breakdown */}
        {report && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-4">
              <p className="label-caps text-muted-foreground mb-2">{t('tax.shortTermGain')}</p>
              <p className={`kpi-value text-xl font-mono tabular-nums ${report.totalShortTermGain >= 0 ? 'text-profit' : 'text-loss'}`}>
                {fmt(report.totalShortTermGain)}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="label-caps text-muted-foreground mb-2">{t('tax.longTermGain')}</p>
              <p className={`kpi-value text-xl font-mono tabular-nums ${report.totalLongTermGain >= 0 ? 'text-profit' : 'text-loss'}`}>
                {fmt(report.totalLongTermGain)}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="label-caps text-muted-foreground mb-2">{t('tax.washSaleAdjustment')}</p>
              <div className="flex items-center gap-2">
                {report.washSaleCount > 0 && (
                  <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-xs">
                    {report.washSaleCount} {t('tax.washSales')}
                  </Badge>
                )}
                <p className="kpi-value text-xl font-mono tabular-nums text-amber-400">
                  {fmt(report.washSaleAdjustment)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="lots" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="lots">{t('tax.taxLots')}</TabsTrigger>
            {jurisdiction === 'US' && (
              <TabsTrigger value="wash-sales">
                {t('tax.washSalesTab')}
                {report?.washSaleCount ? (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {report.washSaleCount}
                  </Badge>
                ) : null}
              </TabsTrigger>
            )}
            <TabsTrigger value="export">{t('tax.export')}</TabsTrigger>
          </TabsList>

          {/* Tax Lots */}
          <TabsContent value="lots">
            <div className="glass-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{t('tax.taxLots')}</h2>
                {lots && (
                  <span className="label-caps text-muted-foreground">
                    {lots.length} {t('tax.records')}
                  </span>
                )}
              </div>
              <TaxLotsTable lots={lots ?? []} isLoading={lotsLoading} />
            </div>
          </TabsContent>

          {/* Wash Sales (US only) */}
          {jurisdiction === 'US' && (
            <TabsContent value="wash-sales">
              <div className="glass-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <h2 className="text-sm font-semibold">{t('tax.washSalesTab')}</h2>
                </div>
                <WashSalesTable washSales={washSales ?? []} isLoading={washLoading} />
              </div>
            </TabsContent>
          )}

          {/* Export */}
          <TabsContent value="export">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {jurisdiction === 'US' && (
                <ExportCard
                  title={t('tax.form8949Title')}
                  description={t('tax.form8949Desc')}
                  icon={<FileText className="h-5 w-5" />}
                  onDownload={() =>
                    handleExport('form8949', `form-8949-${year}-${jurisdiction}.csv`)
                  }
                  isPending={exportPending === 'form8949'}
                />
              )}
              {jurisdiction === 'US' && (
                <ExportCard
                  title={t('tax.scheduleDTitle')}
                  description={t('tax.scheduleDDesc')}
                  icon={<FileText className="h-5 w-5" />}
                  onDownload={() =>
                    handleExport('scheduleD', `schedule-d-${year}-${jurisdiction}.csv`)
                  }
                  isPending={exportPending === 'scheduleD'}
                />
              )}
              <ExportCard
                title={t('tax.summaryTitle')}
                description={t('tax.summaryDesc')}
                icon={<Download className="h-5 w-5" />}
                onDownload={() =>
                  handleExport('summary', `tax-summary-${year}-${jurisdiction}.csv`)
                }
                isPending={exportPending === 'summary'}
              />
            </div>
            {jurisdiction !== 'US' && (
              <p className="text-xs text-muted-foreground mt-4 text-center">
                {t('tax.nonUsNote')}
              </p>
            )}
          </TabsContent>
        </Tabs>

      </PageTransition>
    </DashboardLayout>
  );
};

export default TaxReporting;
