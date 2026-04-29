import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  FileDown,
  AlertTriangle,
  Ticket,
  BarChart3,
  Trash2,
  Plus,
  ExternalLink,
  Users,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  useAdminRevenue,
  useAdminRevenueSeries,
  useAdminInvoices,
  useAdminTaxReport,
  useAdminDunning,
  useAdminCoupons,
  useCreateCoupon,
  useDeleteCoupon,
  useAdminBillingMetrics,
} from '@/hooks/useAdminBilling';
import { adminBillingService, type RevenuePeriod } from '@/services/adminBilling.service';
import type { AdminInvoiceDto, AdminCouponDto } from '@/types/dto';

// ── Helpers ──────────────────────────────────────────────────────────────────

const localeFor = (lang: string): string => {
  if (lang.startsWith('fr')) return 'fr-FR';
  if (lang.startsWith('es')) return 'es-ES';
  return 'en-US';
};

const fmtCurrency = (amount: number, currency = 'USD', lang = 'en'): string =>
  new Intl.NumberFormat(localeFor(lang), { style: 'currency', currency: currency.toUpperCase() }).format(amount);

const fmtDate = (iso: string, lang = 'en'): string =>
  new Intl.DateTimeFormat(localeFor(lang), {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(iso));

const fmtPct = (v: number): string => `${(v * 100).toFixed(1)}%`;

// Render a body string with **bold** segments converted to <strong>.
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return <strong key={i}>{p.slice(2, -2)}</strong>;
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

// ── Info trigger button (right-aligned section help) ────────────────────────

function InfoSheet({ title, body }: { title: string; body: string }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={title}>
          <Info className="h-4 w-4 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription className="whitespace-pre-line text-sm leading-relaxed">
            <RichText text={body} />
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ title, value, icon, subtitle }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
          {icon}
        </div>
        <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

// ── Section header w/ optional Info button ───────────────────────────────────

function SectionHeader({ title, infoTitle, infoBody }: {
  title: string; infoTitle?: string; infoBody?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold">{title}</h3>
      {infoTitle && infoBody && <InfoSheet title={infoTitle} body={infoBody} />}
    </div>
  );
}

// ── Revenue Section ──────────────────────────────────────────────────────────

function RevenueSection() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data, isLoading } = useAdminRevenue();
  const [period, setPeriod] = useState<RevenuePeriod>('30d');
  const { data: series, isLoading: seriesLoading } = useAdminRevenueSeries(period);

  if (isLoading) return <SectionSkeleton cards={3} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title={t('admin.billing.mrr', 'MRR')}
          value={fmtCurrency(data.mrr / 100, 'USD', lang)}
          icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
        />
        <KpiCard
          title={t('admin.billing.arr', 'ARR')}
          value={fmtCurrency(data.arr / 100, 'USD', lang)}
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
        />
        <KpiCard
          title={t('admin.billing.revenue30d', 'Revenue (30d)')}
          value={fmtCurrency(data.revenue30d / 100, 'USD', lang)}
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
          subtitle={t('admin.billing.revenueSubtitle', { r60: fmtCurrency(data.revenue60d / 100, 'USD', lang), r90: fmtCurrency(data.revenue90d / 100, 'USD', lang) })}
        />
      </div>

      <Card className="border-border/40 bg-card/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">{t('admin.billing.revenueOverTime', 'Revenue Over Time')}</h3>
            <Select value={period} onValueChange={(v) => setPeriod(v as RevenuePeriod)}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">{t('admin.billing.period7d', '7 days')}</SelectItem>
                <SelectItem value="30d">{t('admin.billing.period30d', '30 days')}</SelectItem>
                <SelectItem value="90d">{t('admin.billing.period90d', '90 days')}</SelectItem>
                <SelectItem value="1y">{t('admin.billing.period1y', '1 year')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-64">
            {seriesLoading ? (
              <Skeleton className="w-full h-full rounded" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={(series ?? []).map((p) => ({ ...p, amountDollars: p.amount / 100 }))}>
                  <defs>
                    <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => fmtCurrency(v, 'USD', lang)} width={70} />
                  <RTooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => fmtCurrency(v, 'USD', lang)}
                    labelFormatter={(d: string) => fmtDate(d, lang)}
                  />
                  <Area type="monotone" dataKey="amountDollars" stroke="hsl(var(--primary))" fill="url(#revGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Invoices Section ─────────────────────────────────────────────────────────

function InvoicesSection() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [cursor, setCursor] = useState<string | undefined>();
  const { data, isLoading } = useAdminInvoices(20, cursor);
  const invoices = data?.data ?? [];
  const hasMore = data?.hasMore ?? false;

  if (isLoading) return <TableSkeleton rows={5} />;

  const handleNext = () => {
    if (invoices.length > 0) {
      setCursor(invoices[invoices.length - 1].id);
    }
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t('admin.billing.date', 'Date')}</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t('admin.billing.email', 'Email')}</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">{t('admin.billing.amount', 'Amount')}</th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">{t('admin.billing.status', 'Status')}</th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">{t('admin.billing.pdf', 'PDF')}</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv: AdminInvoiceDto) => (
              <tr key={inv.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2 tabular-nums">{fmtDate(inv.createdAt, lang)}</td>
                <td className="px-3 py-2 truncate max-w-[200px]">{inv.customerEmail}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtCurrency(inv.amount / 100, inv.currency, lang)}</td>
                <td className="px-3 py-2 text-center">
                  <InvoiceStatusBadge status={inv.status} />
                </td>
                <td className="px-3 py-2 text-center">
                  <a
                    href={adminBillingService.getInvoicePdfUrl(inv.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">{t('admin.billing.noInvoices', 'No invoices found')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleNext}>{t('admin.billing.loadMore', 'Load more')}</Button>
        </div>
      )}
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const variant = status === 'paid' ? 'default' : status === 'open' ? 'outline' : 'destructive';
  return <Badge variant={variant} className="text-xs capitalize">{status}</Badge>;
}

// ── Tax Section ──────────────────────────────────────────────────────────────

function TaxSection() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [from, setFrom] = useState(thirtyDaysAgo.toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));
  const { data, isLoading } = useAdminTaxReport(from, to);

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t('admin.billing.tax', 'Tax')}
        infoTitle={t('admin.billing.taxInfoTitle', 'About the tax report')}
        infoBody={`${t('admin.billing.taxInfoBody')}\n\n⚠ ${t('admin.billing.taxMockNotice')}`}
      />
      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400 flex gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <span>{t('admin.billing.taxMockNotice')}</span>
      </div>
      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <Label className="text-xs">{t('admin.billing.from', 'From')}</Label>
          <Input type="date" className="h-8 w-40 text-xs" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">{t('admin.billing.to', 'To')}</Label>
          <Input type="date" className="h-8 w-40 text-xs" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" onClick={() => adminBillingService.exportTaxCsv(from, to)}>
          <FileDown className="h-4 w-4 mr-1" /> {t('admin.billing.exportCsv', 'Export CSV')}
        </Button>
      </div>
      {isLoading ? <TableSkeleton rows={3} /> : (
        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t('admin.billing.jurisdiction', 'Jurisdiction')}</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t('admin.billing.country', 'Country')}</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">{t('admin.billing.rate', 'Rate')}</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">{t('admin.billing.collected', 'Collected')}</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((line, i) => {
                const rate = typeof line.taxRate === 'number'
                  ? line.taxRate
                  : Number(line.taxRate) / 100;
                return (
                  <tr key={`${line.jurisdiction}-${i}`} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2">{line.jurisdiction}</td>
                    <td className="px-3 py-2">{line.country}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtPct(rate)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtCurrency(line.amountCollected / 100, line.currency, lang)}</td>
                  </tr>
                );
              })}
              {(!data || data.length === 0) && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">{t('admin.billing.noTaxData', 'No tax data for this period')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Dunning Section ──────────────────────────────────────────────────────────

function DunningSection() {
  const { t } = useTranslation();
  const { data, isLoading } = useAdminDunning();
  if (isLoading) return <TableSkeleton rows={3} />;

  const isMock = (data ?? []).some((u) => u.mock);

  return (
    <div className="space-y-3">
      <SectionHeader
        title={t('admin.billing.dunning', 'Dunning')}
        infoTitle={t('admin.billing.dunningInfoTitle')}
        infoBody={t('admin.billing.dunningInfoBody')}
      />
      {isMock && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400 flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Mock data (dev mode). Set <code>app.billing.mock-dunning=false</code> to disable.</span>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-border/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t('admin.billing.email', 'Email')}</th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">{t('admin.billing.plan', 'Plan')}</th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">{t('admin.billing.step', 'Step')}</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">{t('admin.billing.daysLeft', 'Days Left')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((u) => (
              <tr key={u.userId} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2 truncate max-w-[200px]">{u.email}</td>
                <td className="px-3 py-2 text-center"><Badge variant="outline" className="text-xs">{u.plan}</Badge></td>
                <td className="px-3 py-2 text-center tabular-nums">{u.dunningStep}</td>
                <td className={cn('px-3 py-2 text-right tabular-nums font-medium', u.daysRemaining <= 3 && 'text-destructive')}>
                  {u.daysRemaining}
                </td>
              </tr>
            ))}
            {(!data || data.length === 0) && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">{t('admin.billing.noDunning', 'No users in dunning')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Coupons Section ──────────────────────────────────────────────────────────

function CouponsSection() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data, isLoading } = useAdminCoupons();
  const deleteMutation = useDeleteCoupon();
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  if (isLoading) return <TableSkeleton rows={3} />;

  const copy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <div className="space-y-3">
      <SectionHeader
        title={t('admin.billing.coupons', 'Coupons')}
        infoTitle={t('admin.billing.couponsInfoTitle')}
        infoBody={t('admin.billing.couponsInfoBody')}
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> {t('admin.billing.createCoupon', 'Create Coupon')}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t('admin.billing.id', 'ID')}</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t('admin.billing.promoCode', 'Promo Code')}</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">{t('admin.billing.discount', 'Discount')}</th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">{t('admin.billing.duration', 'Duration')}</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">{t('admin.billing.redeemed', 'Redeemed')}</th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">{t('admin.billing.valid', 'Valid')}</th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">{t('admin.billing.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((c: AdminCouponDto) => (
              <tr key={c.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2 font-mono text-xs">{c.id}</td>
                <td className="px-3 py-2">
                  {c.promotionCode ? (
                    <button
                      type="button"
                      onClick={() => copy(c.promotionCode!)}
                      className="inline-flex items-center gap-1.5 rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary hover:bg-primary/20 transition"
                      title={t('admin.billing.howUsersRedeem')}
                    >
                      {c.promotionCode}
                      {copied === c.promotionCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {c.percentOff != null ? `${c.percentOff}%` : c.amountOff != null ? fmtCurrency(c.amountOff / 100, c.currency, lang) : '---'}
                </td>
                <td className="px-3 py-2 text-center capitalize">
                  {c.duration === 'once' ? t('admin.billing.durationOnce', 'Once')
                    : c.duration === 'repeating' ? t('admin.billing.durationRepeating', 'Repeating')
                    : c.duration === 'forever' ? t('admin.billing.durationForever', 'Forever')
                    : c.duration}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {c.timesRedeemed}{c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ''}
                </td>
                <td className="px-3 py-2 text-center">
                  <Badge variant={c.valid ? 'default' : 'destructive'} className="text-xs">
                    {c.valid ? t('admin.billing.yes', 'Yes') : t('admin.billing.no', 'No')}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(c.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
            {(!data || data.length === 0) && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">{t('admin.billing.noCoupons', 'No coupons')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <CreateCouponDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}

function CreateCouponDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useTranslation();
  const createMutation = useCreateCoupon();
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [value, setValue] = useState('');
  const [duration, setDuration] = useState('once');
  const [maxRedemptions, setMaxRedemptions] = useState('');

  const handleSubmit = () => {
    const parsed = Number(value);
    if (isNaN(parsed) || parsed <= 0) return;

    createMutation.mutate(
      {
        ...(discountType === 'percent' ? { percentOff: parsed } : { amountOff: Math.round(parsed * 100), currency: 'usd' }),
        duration,
        ...(maxRedemptions ? { maxRedemptions: Number(maxRedemptions) } : {}),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setValue('');
          setMaxRedemptions('');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('admin.billing.createCouponTitle', 'Create Stripe Coupon')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs">{t('admin.billing.discountType', 'Discount Type')}</Label>
            <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'percent' | 'amount')}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">{t('admin.billing.percentage', 'Percentage')}</SelectItem>
                <SelectItem value="amount">{t('admin.billing.fixedAmountUsd', 'Fixed Amount (USD)')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{discountType === 'percent' ? t('admin.billing.percentOff', 'Percent Off') : t('admin.billing.amountOff', 'Amount Off ($)')}</Label>
            <Input type="number" className="h-8" value={value} onChange={(e) => setValue(e.target.value)} min={0} />
          </div>
          <div>
            <Label className="text-xs">{t('admin.billing.duration', 'Duration')}</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="once">{t('admin.billing.durationOnce', 'Once')}</SelectItem>
                <SelectItem value="repeating">{t('admin.billing.durationRepeating', 'Repeating')}</SelectItem>
                <SelectItem value="forever">{t('admin.billing.durationForever', 'Forever')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t('admin.billing.maxRedemptions', 'Max Redemptions (optional)')}</Label>
            <Input type="number" className="h-8" value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} min={1} />
          </div>
          <p className="text-xs text-muted-foreground">{t('admin.billing.howUsersRedeem')}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('admin.billing.cancel', 'Cancel')}</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending || !value}>
            {createMutation.isPending ? t('admin.billing.creating', 'Creating...') : t('admin.billing.create', 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Metrics Section ──────────────────────────────────────────────────────────

function MetricsSection() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data, isLoading } = useAdminBillingMetrics();
  if (isLoading) return <SectionSkeleton cards={4} />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t('admin.billing.metrics', 'Metrics')}
        infoTitle={t('admin.billing.metricsInfoTitle')}
        infoBody={t('admin.billing.metricsInfoBody')}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title={t('admin.billing.churnRate', 'Churn Rate')} value={fmtPct(data.churnRate)} icon={<AlertTriangle className="h-4 w-4 text-destructive" />} />
        <KpiCard title={t('admin.billing.conversionRate', 'Conversion Rate')} value={fmtPct(data.conversionRate)} icon={<TrendingUp className="h-4 w-4 text-emerald-500" />} />
        <KpiCard title={t('admin.billing.arpu', 'ARPU')} value={fmtCurrency(data.arpu, 'USD', lang)} icon={<DollarSign className="h-4 w-4 text-primary" />} />
        <KpiCard
          title={t('admin.billing.estimatedLtv', 'Estimated LTV')}
          value={fmtCurrency(data.estimatedLtv, 'USD', lang)}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          subtitle={t('admin.billing.ltvSubtitle', { paid: data.totalPaidUsers, free: data.totalFreeUsers })}
        />
        {data.netMrr != null && (
          <KpiCard title={t('admin.billing.netMrr', 'Net MRR')} value={fmtCurrency(data.netMrr, 'USD', lang)} icon={<DollarSign className="h-4 w-4 text-emerald-500" />} />
        )}
        {data.grossMrr != null && (
          <KpiCard title={t('admin.billing.grossMrr', 'Gross MRR')} value={fmtCurrency(data.grossMrr, 'USD', lang)} icon={<DollarSign className="h-4 w-4 text-primary" />} />
        )}
        {data.paymentFailureRate != null && (
          <KpiCard title={t('admin.billing.paymentFailureRate', 'Payment Failure Rate')} value={fmtPct(data.paymentFailureRate)} icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} />
        )}
        {data.refundRate != null && (
          <KpiCard title={t('admin.billing.refundRate', 'Refund Rate')} value={fmtPct(data.refundRate)} icon={<Receipt className="h-4 w-4 text-amber-500" />} />
        )}
        {data.avgTenureMonths != null && (
          <KpiCard
            title={t('admin.billing.avgTenureMonths', 'Avg. Tenure')}
            value={t('admin.billing.tenureMonths', { months: data.avgTenureMonths.toFixed(1) })}
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          />
        )}
        {data.topPlan && (
          <KpiCard title={t('admin.billing.topPlan', 'Top Plan')} value={data.topPlan} icon={<BarChart3 className="h-4 w-4 text-primary" />} />
        )}
      </div>
    </div>
  );
}

// ── Skeletons ────────────────────────────────────────────────────────────────

function SectionSkeleton({ cards }: { cards: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
  );
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 rounded" />
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function BillingTab() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue" className="gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            {t('admin.billing.revenue', 'Revenue')}
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5">
            <Receipt className="h-3.5 w-3.5" />
            {t('admin.billing.invoices', 'Invoices')}
          </TabsTrigger>
          <TabsTrigger value="tax" className="gap-1.5">
            <FileDown className="h-3.5 w-3.5" />
            {t('admin.billing.tax', 'Tax')}
          </TabsTrigger>
          <TabsTrigger value="dunning" className="gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t('admin.billing.dunning', 'Dunning')}
          </TabsTrigger>
          <TabsTrigger value="coupons" className="gap-1.5">
            <Ticket className="h-3.5 w-3.5" />
            {t('admin.billing.coupons', 'Coupons')}
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            {t('admin.billing.metrics', 'Metrics')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-4"><RevenueSection /></TabsContent>
        <TabsContent value="invoices" className="mt-4"><InvoicesSection /></TabsContent>
        <TabsContent value="tax" className="mt-4"><TaxSection /></TabsContent>
        <TabsContent value="dunning" className="mt-4"><DunningSection /></TabsContent>
        <TabsContent value="coupons" className="mt-4"><CouponsSection /></TabsContent>
        <TabsContent value="metrics" className="mt-4"><MetricsSection /></TabsContent>
      </Tabs>
    </div>
  );
}
