import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PlanGatedSection from '@/components/subscription/PlanGatedSection';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import AccountSelector from '@/components/dashboard/AccountSelector';
import { usePageFilter } from '@/contexts/page-filters-context';
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
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import {
  useTaxReport,
  useGenerateTaxReport,
  useTaxLots,
  useWashSales,
} from '@/hooks/useTaxReport';
import { taxService } from '@/services/tax.service';
import type { TaxJurisdiction, TaxLotDto, WashSaleDto, TaxReportDto } from '@/types/dto';
import {
  PRIMARY_JURISDICTIONS,
  SECONDARY_JURISDICTIONS,
  getCountryConfig,
  type TaxCountryConfig,
  type TaxCountryKpi,
} from '@/data/taxCountryConfig';
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
  Scale,
  Banknote,
  Globe,
  Info,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

// ---- Constants --------------------------------------------------------------

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

// ---- Helpers ----------------------------------------------------------------

function fmtCurrency(n: number, locale: string, currency: string, fractionDigits = 2): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type SortDir = 'asc' | 'desc';
type LotSortKey = keyof Pick<
  TaxLotDto,
  'symbol' | 'acquiredDate' | 'soldDate' | 'proceeds' | 'costBasis' | 'gain' | 'holdingPeriod'
>;

// ---- Icon resolver (keeps config file icon-library-agnostic) ---------------

const ICON_MAP = {
  TrendingUp: TrendingUp,
  TrendingDown: TrendingDown,
  DollarSign: DollarSign,
  Calculator: Calculator,
  AlertTriangle: AlertTriangle,
  Scale: Scale,
  Banknote: Banknote,
  Globe: Globe,
} as const;

function KpiIcon({ name }: { name: TaxCountryKpi['icon'] }) {
  const Icon = ICON_MAP[name];
  return <Icon className="h-4 w-4" />;
}

// ---- KPI value resolver from TaxReportDto ----------------------------------

const MA_EXEMPTION_THRESHOLD = 30_000;

function resolveKpiValue(
  field: TaxCountryKpi['field'],
  report: TaxReportDto,
): number {
  switch (field) {
    case '__exemptionRemaining':
      return Math.max(0, MA_EXEMPTION_THRESHOLD - report.totalGain);
    case '__stLtBreakdown':
      return report.totalGain;
    case 'totalProceeds':
      return report.totalProceeds;
    case 'totalCostBasis':
      return report.totalCostBasis;
    case 'totalGain':
      return report.totalGain;
    case 'totalShortTermGain':
      return report.totalShortTermGain;
    case 'totalLongTermGain':
      return report.totalLongTermGain;
    case 'estimatedTax':
      return report.estimatedTax;
    case 'totalWins':
      return report.totalWins ?? 0;
    case 'totalLosses':
      return report.totalLosses ?? 0;
    case 'tradeCount':
      return report.tradeCount ?? 0;
    case 'washSaleAdjustment':
      return report.washSaleAdjustment;
    case 'washSaleCount':
      return report.washSaleCount;
    default:
      return 0;
  }
}

function resolveKpiClass(kpi: TaxCountryKpi, value: number): string {
  if (kpi.valueClass) return kpi.valueClass;
  if (kpi.signed) return value >= 0 ? 'text-profit' : 'text-loss';
  return 'text-gradient';
}

function resolveKpiCardClass(kpi: TaxCountryKpi, value: number): string {
  if (kpi.cardClass) return kpi.cardClass;
  if (kpi.signed) return value >= 0 ? 'glass-card-profit' : 'glass-card-loss';
  return '';
}

// ---- Sub-components ---------------------------------------------------------

interface KpiCardProps {
  label: string;
  value: string;
  valueClass?: string;
  icon: React.ReactNode;
  cardClass?: string;
  tooltip?: string;
}

const KpiCard = ({
  label,
  value,
  valueClass = 'text-gradient',
  icon,
  cardClass = '',
  tooltip,
}: KpiCardProps) => (
  <div className={`glass-card p-5 ${cardClass}`}>
    <div className="flex items-center justify-between mb-3">
      <span className="label-caps text-muted-foreground flex items-center gap-1.5">
        {label}
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </span>
      <span className="text-muted-foreground">{icon}</span>
    </div>
    <p className={`kpi-value text-2xl ${valueClass}`}>{value}</p>
  </div>
);

// ---- Country Selector -------------------------------------------------------

interface CountrySelectorProps {
  value: TaxJurisdiction;
  onChange: (j: TaxJurisdiction) => void;
}

const CountrySelector = ({ value, onChange }: CountrySelectorProps) => {
  const { t } = useTranslation();
  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const isSecondary = SECONDARY_JURISDICTIONS.includes(value);

  return (
    <div className="glass-card p-4 space-y-3">
      <p className="label-caps text-muted-foreground">Tax Jurisdiction</p>

      {/* Primary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PRIMARY_JURISDICTIONS.map((j) => {
          const cfg = getCountryConfig(j);
          const active = value === j;
          return (
            <button
              key={j}
              type="button"
              onClick={() => onChange(j)}
              className={[
                'flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 text-center transition-all duration-150',
                active
                  ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20'
                  : 'border-border/50 hover:border-border hover:bg-white/[0.03] text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              <span className="text-xl leading-none" aria-hidden="true">{cfg.flag}</span>
              <span className="text-xs font-medium leading-tight">{t(cfg.name)}</span>
            </button>
          );
        })}
      </div>

      {/* Secondary collapsible */}
      <Collapsible open={secondaryOpen || isSecondary} onOpenChange={setSecondaryOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight
              className={`h-3.5 w-3.5 transition-transform ${secondaryOpen || isSecondary ? 'rotate-90' : ''}`}
            />
            {t('tax.moreCountries', 'More countries (UK, DE, AU, Other)')}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {SECONDARY_JURISDICTIONS.map((j) => {
              const cfg = getCountryConfig(j);
              const active = value === j;
              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => onChange(j)}
                  className={[
                    'flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 text-center transition-all duration-150',
                    active
                      ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20'
                      : 'border-border/50 hover:border-border hover:bg-white/[0.03] text-muted-foreground hover:text-foreground',
                  ].join(' ')}
                >
                  <span className="text-xl leading-none" aria-hidden="true">{cfg.flag}</span>
                  <span className="text-xs font-medium leading-tight">{t(cfg.name)}</span>
                </button>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// ---- Country Info Panel -----------------------------------------------------

interface CountryInfoPanelProps {
  config: TaxCountryConfig;
}

const CountryInfoPanel = ({ config }: CountryInfoPanelProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { info } = config;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 overflow-hidden">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-indigo-500/5 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Info className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-indigo-300">{t(info.headline)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-400/70">{t('tax.deadlineLabel', 'Deadline')}: {t(info.deadline)}</span>
              <ChevronDown
                className={`h-4 w-4 text-indigo-400 transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t border-indigo-500/20 pt-4">

            {/* Warnings first — most important */}
            {info.warnings.length > 0 && (
              <div className="space-y-2">
                {info.warnings.map((w) => (
                  <div
                    key={w.text.slice(0, 40)}
                    className={[
                      'flex gap-2.5 rounded-lg p-3 text-xs',
                      w.level === 'red'
                        ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                        : 'bg-amber-500/10 border border-amber-500/20 text-amber-300',
                    ].join(' ')}
                  >
                    <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{t(w.text)}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tax rates */}
              <div>
                <p className="label-caps text-muted-foreground mb-2">{t('tax.taxRatesLabel', 'Tax Rates')}</p>
                <ul className="space-y-1.5">
                  {info.rates.map((r) => (
                    <li key={r} className="text-xs text-foreground/80 flex gap-2">
                      <span className="text-indigo-400 flex-shrink-0 mt-0.5">•</span>
                      <span>{t(r)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Required forms */}
              <div>
                <p className="label-caps text-muted-foreground mb-2">{t('tax.requiredFormsLabel', 'Required Forms')}</p>
                <ul className="space-y-1.5">
                  {info.forms.map((f) => (
                    <li key={f} className="text-xs text-foreground/80 flex gap-2">
                      <FileText className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <span>{t(f)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Loss carryforward + notes */}
            {(info.lossCarryforward || (info.notes && info.notes.length > 0)) && (
              <div className="space-y-1.5 pt-1 border-t border-indigo-500/10">
                {info.lossCarryforward && (
                  <p className="text-xs text-foreground/70">
                    <span className="text-indigo-400 font-medium">{t('tax.lossCarryforwardLabel', 'Loss Carryforward')}:</span>{' '}
                    {t(info.lossCarryforward)}
                  </p>
                )}
                {info.notes?.map((n) => (
                  <p key={n} className="text-xs text-foreground/60 flex gap-2">
                    <span className="text-indigo-400/60 flex-shrink-0">→</span>
                    <span>{t(n)}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

// ---- KPI cards row ----------------------------------------------------------

interface CountryKpiRowProps {
  config: TaxCountryConfig;
  report: TaxReportDto | undefined;
  isLoading: boolean;
  isError: boolean;
}

const CountryKpiRow = ({ config, report, isLoading, isError }: CountryKpiRowProps) => {
  const { t } = useTranslation();
  const fmt = (n: number) => fmtCurrency(n, config.locale, config.currency);

  if (isLoading) {
    return (
      <>
        {config.kpis.map((kpi) => (
          <div key={kpi.field} className="glass-card p-5 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
          </div>
        ))}
      </>
    );
  }

  if (isError || !report) {
    return (
      <div className="glass-card p-5 col-span-full text-center text-muted-foreground text-sm py-8">
        <Calculator className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>{t('tax.noReportYet')}</p>
        <p className="text-xs mt-1 opacity-60">{t('tax.clickGenerate')}</p>
      </div>
    );
  }

  return (
    <>
      {config.kpis.map((kpi) => {
        const value = resolveKpiValue(kpi.field, report);
        return (
          <KpiCard
            key={kpi.field}
            label={t(kpi.label)}
            value={fmt(value)}
            icon={<KpiIcon name={kpi.icon} />}
            valueClass={resolveKpiClass(kpi, value)}
            cardClass={resolveKpiCardClass(kpi, value)}
            tooltip={kpi.tooltip ? t(kpi.tooltip) : undefined}
          />
        );
      })}
    </>
  );
};

// ---- ST/LT breakdown strip (US, CA, others) --------------------------------

interface BreakdownStripProps {
  report: TaxReportDto;
  config: TaxCountryConfig;
}

const BreakdownStrip = ({ report, config }: BreakdownStripProps) => {
  const { t } = useTranslation();
  const fmt = (n: number) => fmtCurrency(n, config.locale, config.currency);
  const showWash = config.jurisdiction === 'US';
  const gridClass = showWash ? 'sm:grid-cols-3' : 'sm:grid-cols-2';
  const stClass = report.totalShortTermGain >= 0 ? 'text-profit' : 'text-loss';
  const ltClass = report.totalLongTermGain >= 0 ? 'text-profit' : 'text-loss';

  return (
    <div className={`grid grid-cols-1 gap-4 ${gridClass}`}>
      <div className="glass-card p-4">
        <p className="label-caps text-muted-foreground mb-2">{t('tax.shortTermGain')}</p>
        <p className={`kpi-value text-xl font-mono tabular-nums ${stClass}`}>
          {fmt(report.totalShortTermGain)}
        </p>
      </div>
      <div className="glass-card p-4">
        <p className="label-caps text-muted-foreground mb-2">{t('tax.longTermGain')}</p>
        <p className={`kpi-value text-xl font-mono tabular-nums ${ltClass}`}>
          {fmt(report.totalLongTermGain)}
        </p>
      </div>
      {showWash && (
        <div className="glass-card p-4">
          <p className="label-caps text-muted-foreground mb-2">{t('tax.washSaleAdjustment')}</p>
          <div className="flex items-center gap-2">
            {report.washSaleCount > 0 && (
              <Badge
                variant="outline"
                className="border-amber-500/40 text-amber-400 text-xs"
              >
                {report.washSaleCount} {t('tax.washSales')}
              </Badge>
            )}
            <p className="kpi-value text-xl font-mono tabular-nums text-amber-400">
              {fmt(report.washSaleAdjustment)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ---- Sortable table header --------------------------------------------------

interface SortableHeaderProps {
  label: string;
  sortKey: LotSortKey;
  currentKey: LotSortKey;
  dir: SortDir;
  onSort: (key: LotSortKey) => void;
}

function SortIcon({ isActive, dir }: { isActive: boolean; dir: SortDir }) {
  if (!isActive) return <ChevronDown className="h-3 w-3 opacity-30" />;
  if (dir === 'asc') return <ChevronUp className="h-3 w-3" />;
  return <ChevronDown className="h-3 w-3" />;
}

const SortableHeader = ({
  label,
  sortKey,
  currentKey,
  dir,
  onSort,
}: SortableHeaderProps) => (
  <th
    className="px-3 py-2 text-left label-caps text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
    onClick={() => onSort(sortKey)}
  >
    <span className="inline-flex items-center gap-1">
      {label}
      <SortIcon isActive={currentKey === sortKey} dir={dir} />
    </span>
  </th>
);

// ---- Tax Lots Table ---------------------------------------------------------

type LotValue = TaxLotDto[LotSortKey];

function compareLotValues(a: LotValue, b: LotValue): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

interface TaxLotsTableProps {
  lots: TaxLotDto[];
  isLoading: boolean;
  config: TaxCountryConfig;
}

const TaxLotsTable = ({ lots, isLoading, config }: TaxLotsTableProps) => {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<LotSortKey>('soldDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const fmt = (n: number) => fmtCurrency(n, config.locale, config.currency);

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
      const cmp = compareLotValues(av, bv);
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
        <p className="text-sm">{t('tax.noLots', 'No tax lots found for this period.')}</p>
      </div>
    );
  }

  const showWashCol = config.jurisdiction === 'US';

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
            {showWashCol && (
              <th className="px-3 py-2 text-left label-caps text-muted-foreground">{t('tax.washSale')}</th>
            )}
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
              <td className="px-3 py-2.5 text-muted-foreground font-mono tabular-nums text-xs">
                {fmtDate(lot.acquiredDate)}
              </td>
              <td className="px-3 py-2.5 text-muted-foreground font-mono tabular-nums text-xs">
                {fmtDate(lot.soldDate)}
              </td>
              <td className="px-3 py-2.5 font-mono tabular-nums">{fmt(lot.proceeds)}</td>
              <td className="px-3 py-2.5 font-mono tabular-nums">{fmt(lot.costBasis)}</td>
              <td
                className={`px-3 py-2.5 font-mono tabular-nums font-semibold ${
                  lot.gain >= 0 ? 'text-profit' : 'text-loss'
                }`}
              >
                {fmt(lot.gain)}
              </td>
              <td className="px-3 py-2.5">
                <Badge
                  variant="outline"
                  className={
                    lot.holdingPeriod === 'LONG_TERM'
                      ? 'border-primary/40 text-primary'
                      : 'border-amber-500/40 text-amber-400'
                  }
                >
                  {lot.holdingPeriod === 'LONG_TERM' ? t('tax.longTerm') : t('tax.shortTerm')}
                </Badge>
              </td>
              {showWashCol && (
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
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ---- Wash Sales Table (US only) --------------------------------------------

interface WashSalesTableProps {
  washSales: WashSaleDto[];
  isLoading: boolean;
  config: TaxCountryConfig;
}

const WashSalesTable = ({ washSales, isLoading, config }: WashSalesTableProps) => {
  const { t } = useTranslation();
  const fmt = (n: number) => fmtCurrency(n, config.locale, config.currency);

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
          {washSales.map((ws) => (
            <tr
              key={`${ws.originalTradeId}-${ws.replacementTradeId}`}
              className="border-b border-border/30 bg-amber-500/5 border-l-2 border-l-amber-500 hover:bg-amber-500/10 transition-colors"
            >
              <td className="px-3 py-2.5 font-mono font-medium tabular-nums">{ws.symbol}</td>
              <td className="px-3 py-2.5 text-muted-foreground font-mono tabular-nums text-xs">
                {fmtDate(ws.washSaleDate)}
              </td>
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

// ---- Export card ------------------------------------------------------------

interface ExportCardProps {
  title: string;
  description: string;
  onDownload: () => void;
  isPending: boolean;
}

const ExportCard = ({ title, description, onDownload, isPending }: ExportCardProps) => (
  <div className="glass-card p-6 flex flex-col gap-4">
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
    <Button variant="outline" className="w-full" onClick={onDownload} disabled={isPending}>
      {isPending ? (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {isPending ? 'Downloading...' : 'Download CSV'}
    </Button>
  </div>
);

// ---- France: Formulaires tab ------------------------------------------------

const FranceFormulairesTab = () => {
  const forms = [
    {
      name: 'Formulaire 2042',
      cerfa: '10330',
      description: 'Déclaration des revenus — cases 3VG (plus-values) et 3VH (moins-values)',
      url: 'https://www.impots.gouv.fr/formulaire/2042/declaration-des-revenus',
    },
    {
      name: 'Formulaire 2074',
      cerfa: '11905',
      description: 'Plus-values et gains divers — obligatoire si cessions > 50 000€',
      url: 'https://www.impots.gouv.fr/formulaire/2074/plus-values-et-gains-divers',
    },
    {
      name: 'Formulaire 2074-CMV',
      cerfa: '11905',
      description: 'Calcul de la plus-value selon la méthode du coût moyen pondéré',
      url: 'https://www.impots.gouv.fr/formulaire/2074-cmv/plus-values-de-cession-de-valeurs-mobilieres',
    },
    {
      name: 'Formulaire 3916-bis',
      cerfa: '15314',
      description: 'Déclaration des comptes d\'actifs numériques et comptes étrangers — OBLIGATOIRE',
      url: 'https://www.impots.gouv.fr/formulaire/3916-bis/declaration-de-comptes-dactifs-numeriques-ouverts',
      critical: true,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          Le formulaire 3916-bis est obligatoire pour tout compte ouvert auprès d'un courtier
          étranger (Exness, XM, Interactive Brokers, etc.). L'amende en cas de non-déclaration est
          de 1 500€ par compte et par an.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {forms.map((f) => (
          <div
            key={f.name}
            className={[
              'glass-card p-4 flex flex-col gap-3',
              f.critical ? 'border-amber-500/30' : '',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{f.name}</p>
                  {f.critical && (
                    <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-xs">
                      Obligatoire
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">CERFA n° {f.cerfa}</p>
              </div>
            </div>
            <p className="text-xs text-foreground/70">{f.description}</p>
            <a
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Accéder au formulaire sur impots.gouv.fr
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---- Canada: CRA Classification tab ----------------------------------------

const CanadaCraClassificationTab = () => {
  const criteria = [
    { label: 'Trading frequency', investor: 'Occasional', trader: 'Daily / weekly' },
    { label: 'Holding period', investor: 'Weeks to years', trader: 'Minutes to days' },
    { label: 'Use of margin / leverage', investor: 'Rare', trader: 'Common' },
    { label: 'Time spent on trading', investor: 'Part-time research', trader: 'Primary activity' },
    { label: 'Financing method', investor: 'Own capital', trader: 'Borrowed funds' },
    { label: 'Market knowledge', investor: 'General', trader: 'Sophisticated / systematic' },
    { label: 'Intention at purchase', investor: 'Capital appreciation / income', trader: 'Short-term profit from price swings' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3 text-xs text-indigo-300">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          The CRA uses these factors to determine whether your trading constitutes a business
          (100% taxable as income) or investing (50% capital gains inclusion). There is no single
          determinative test — the CRA looks at the totality of facts.
        </p>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-white/[0.02]">
              <th className="px-4 py-2.5 text-left label-caps text-muted-foreground">Factor</th>
              <th className="px-4 py-2.5 text-left label-caps text-profit">Investor (Schedule 3)</th>
              <th className="px-4 py-2.5 text-left label-caps text-amber-400">Trader (T2125)</th>
            </tr>
          </thead>
          <tbody>
            {criteria.map((row, i) => (
              <tr key={i} className="border-b border-border/30 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-2.5 text-xs font-medium">{row.label}</td>
                <td className="px-4 py-2.5 text-xs text-foreground/70">{row.investor}</td>
                <td className="px-4 py-2.5 text-xs text-foreground/70">{row.trader}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-profit/20 bg-profit/5 p-4">
          <p className="text-sm font-semibold text-profit mb-1">Investor Classification</p>
          <p className="text-xs text-foreground/70">
            50% of gains are included in taxable income. Use Schedule 3. Capital losses can only
            offset capital gains.
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm font-semibold text-amber-400 mb-1">Business Income Classification</p>
          <p className="text-xs text-foreground/70">
            100% of gains taxable as business income. Use T2125. Losses deductible against all
            income, but no capital gains treatment.
          </p>
        </div>
      </div>
    </div>
  );
};

// ---- Morocco: Réglementation tab -------------------------------------------

const MoroccoReglementationTab = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300">
        <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Nouveau régime 2026 — Paiement par opération</p>
          <p>
            Depuis 2026, les résidents marocains disposant de comptes chez des courtiers étrangers
            doivent déclarer et payer l'impôt sur les plus-values dans les 30 jours suivant chaque
            cession. La déclaration annuelle reste obligatoire avant le 1er avril.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-4 space-y-3">
          <p className="label-caps text-muted-foreground">Office des Changes — Limites</p>
          <ul className="space-y-2 text-xs text-foreground/70">
            <li className="flex gap-2">
              <span className="text-amber-400 flex-shrink-0">•</span>
              Dotation touristique / investissement personnel : 20 000 MAD/an maximum pour les transferts à l'étranger
            </li>
            <li className="flex gap-2">
              <span className="text-amber-400 flex-shrink-0">•</span>
              Le trading forex/CFD via des plateformes étrangères reste dans une zone grise — aucun cadre légal explicite n'autorise ni n'interdit ces activités
            </li>
            <li className="flex gap-2">
              <span className="text-amber-400 flex-shrink-0">•</span>
              Les infractions à la réglementation des changes peuvent entraîner des sanctions pénales
            </li>
          </ul>
        </div>

        <div className="glass-card p-4 space-y-3">
          <p className="label-caps text-muted-foreground">Taux d'imposition applicables</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/70">Valeurs cotées (Casablanca)</span>
              <Badge variant="outline" className="border-primary/40 text-primary">15%</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/70">Valeurs non cotées</span>
              <Badge variant="outline" className="border-primary/40 text-primary">20%</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/70">Seuil d'exonération</span>
              <Badge variant="outline" className="border-profit/40 text-profit">30 000 MAD</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/70">Report des moins-values</span>
              <Badge variant="outline" className="border-indigo-400/40 text-indigo-400">4 ans</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-2">
        <p className="text-sm font-semibold text-indigo-300">Recommandations pratiques</p>
        <ul className="space-y-1.5 text-xs text-foreground/70">
          <li className="flex gap-2">
            <span className="text-indigo-400 flex-shrink-0">1.</span>
            Consultez un fiscaliste marocain agréé — la réglementation évolue rapidement
          </li>
          <li className="flex gap-2">
            <span className="text-indigo-400 flex-shrink-0">2.</span>
            Conservez toutes les preuves de transactions (relevés courtier, bordereaux de virement)
          </li>
          <li className="flex gap-2">
            <span className="text-indigo-400 flex-shrink-0">3.</span>
            Si le total de vos cessions dépasse 30 000 MAD, la déclaration est obligatoire même si vous n'avez pas de plus-value
          </li>
          <li className="flex gap-2">
            <span className="text-indigo-400 flex-shrink-0">4.</span>
            La régularisation volontaire avant tout contrôle fiscal permet de bénéficier de majorations réduites
          </li>
        </ul>
      </div>
    </div>
  );
};

// ---- Export Tab (country-aware) --------------------------------------------

type ExportKey = 'form8949' | 'scheduleD' | 'summary';

interface CountryExportTabProps {
  config: TaxCountryConfig;
  year: number;
  jurisdiction: TaxJurisdiction;
  exportPending: string | null;
  onExport: (key: ExportKey, filename: string) => void;
}

const CountryExportTab = ({
  config,
  year,
  jurisdiction,
  exportPending,
  onExport,
}: CountryExportTabProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {config.exports.map((exp) => (
          <ExportCard
            key={exp.key}
            title={t(exp.title)}
            description={t(exp.description)}
            onDownload={() =>
              onExport(
                exp.key as ExportKey,
                `${exp.key}-${year}-${jurisdiction}.csv`
              )
            }
            isPending={exportPending === exp.key}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        CSV exports contain data as recorded in your trading journal. Always verify with a
        qualified tax professional before filing.
      </p>
    </div>
  );
};

// ---- Main Page --------------------------------------------------------------

const TaxReporting = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { hasPlan } = useFeatureFlags();
  const isElite = hasPlan('ELITE');

  const [selectedAccountId, setSelectedAccountId] = usePageFilter(
    'taxReporting',
    'accountId',
    'all'
  );
  const [year, setYear] = useState<number>(CURRENT_YEAR - 1);
  const [jurisdiction, setJurisdiction] = useState<TaxJurisdiction>('US');
  const [exportPending, setExportPending] = useState<string | null>(null);

  const config = getCountryConfig(jurisdiction);

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
            title: t('tax.reportGenerated', 'Report generated'),
            description: t('tax.reportGeneratedDesc', 'Your tax report has been calculated successfully.'),
          });
        },
        onError: () => {
          toast({
            title: t('common.error', 'Error'),
            description: t('tax.generationFailed', 'Failed to generate the tax report. Please try again.'),
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleExport = async (type: ExportKey, filename: string) => {
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
        title: t('tax.exportSuccess', 'Export ready'),
        description: t('tax.exportSuccessDesc', 'Your file has been downloaded.'),
      });
    } catch {
      toast({
        title: t('common.error', 'Error'),
        description: t('tax.exportFailed', 'Failed to export. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setExportPending(null);
    }
  };

  // Default active tab — reset when jurisdiction changes
  const defaultTab = 'lots';

  return (
    <DashboardLayout pageTitle={t('pages.taxReporting', 'Tax Reporting')}>
      <PageTransition className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gradient">
              {t('tax.title', 'Tax Reporting')}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {t('tax.description', 'Capital gains, tax lots, and jurisdiction-specific filing guidance.')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <AccountSelector
              value={selectedAccountId}
              onChange={setSelectedAccountId}
              className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
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
            <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4 mr-2" />
              )}
              {generateMutation.isPending
                ? t('tax.generating', 'Generating...')
                : t('tax.generateReport', 'Generate Report')}
            </Button>
          </div>
        </div>

        {/* Country selector */}
        <CountrySelector value={jurisdiction} onChange={setJurisdiction} />

        {/* Country info panel (collapsible) */}
        <CountryInfoPanel config={config} />

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <CountryKpiRow
            config={config}
            report={report}
            isLoading={reportLoading}
            isError={isError}
          />
        </div>

        {/* ST/LT breakdown strip — only when report is available */}
        {report && <BreakdownStrip report={report} config={config} />}

        {/* PRO upgrade prompt — shown only for PRO users (not ELITE) */}
        {!isElite && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300 flex items-center gap-3">
            <span className="flex-shrink-0 text-base">★</span>
            <span>
              {t(
                'tax.eliteUpsell',
                'Upgrade to Elite for the full tax report: detailed tax lots, wash sale detection, and CSV exports for 14 jurisdictions.'
              )}
              {' '}
              <a href="/pricing" className="underline font-medium hover:text-amber-200">
                {t('subscription.viewPlans', 'View plans')}
              </a>
            </span>
          </div>
        )}

        {/* Tabs — ELITE only: tax lots table, wash sales, export */}
        <PlanGatedSection
          requiredPlan="ELITE"
          feature={t('tax.eliteFeature', 'Upgrade to Elite for full tax report with 14 jurisdictions, tax lots, and wash sale detection.')}
          showBlurredPreview={false}
        >
        <Tabs key={jurisdiction} defaultValue={defaultTab} className="w-full">
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="lots">{t('tax.tabs.taxLots', 'Tax Lots')}</TabsTrigger>

            {/* Country-specific extra tab */}
            {config.extraTab && (
              <TabsTrigger value={config.extraTab.value}>
                {t(config.extraTab.label)}
                {config.jurisdiction === 'US' && report?.washSaleCount ? (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {report.washSaleCount}
                  </Badge>
                ) : null}
              </TabsTrigger>
            )}

            <TabsTrigger value="export">{t('tax.tabs.exports', 'Export')}</TabsTrigger>
          </TabsList>

          {/* Tax Lots */}
          <TabsContent value="lots">
            <div className="glass-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{t('tax.tabs.taxLots', 'Tax Lots')}</h2>
                {lots && (
                  <span className="label-caps text-muted-foreground">
                    {lots.length} {t('tax.records', 'records')}
                  </span>
                )}
              </div>
              <TaxLotsTable lots={lots ?? []} isLoading={lotsLoading} config={config} />
            </div>
          </TabsContent>

          {/* US: Wash Sales */}
          {config.jurisdiction === 'US' && config.extraTab && (
            <TabsContent value={config.extraTab.value}>
              <div className="glass-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <h2 className="text-sm font-semibold">{t('tax.tabs.washSales', 'Wash Sales')}</h2>
                </div>
                <WashSalesTable
                  washSales={washSales ?? []}
                  isLoading={washLoading}
                  config={config}
                />
              </div>
            </TabsContent>
          )}

          {/* France: Formulaires */}
          {config.jurisdiction === 'FR' && config.extraTab && (
            <TabsContent value={config.extraTab.value}>
              <FranceFormulairesTab />
            </TabsContent>
          )}

          {/* Canada: CRA Classification */}
          {config.jurisdiction === 'CA' && config.extraTab && (
            <TabsContent value={config.extraTab.value}>
              <CanadaCraClassificationTab />
            </TabsContent>
          )}

          {/* Morocco: Réglementation */}
          {config.jurisdiction === 'MA' && config.extraTab && (
            <TabsContent value={config.extraTab.value}>
              <MoroccoReglementationTab />
            </TabsContent>
          )}

          {/* Export */}
          <TabsContent value="export">
            <CountryExportTab
              config={config}
              year={year}
              jurisdiction={jurisdiction}
              exportPending={exportPending}
              onExport={handleExport}
            />
          </TabsContent>
        </Tabs>
        </PlanGatedSection>

      </PageTransition>
    </DashboardLayout>
  );
};

export default TaxReporting;
