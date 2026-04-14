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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useAdminRevenue,
  useAdminInvoices,
  useAdminTaxReport,
  useAdminDunning,
  useAdminCoupons,
  useCreateCoupon,
  useDeleteCoupon,
  useAdminBillingMetrics,
} from '@/hooks/useAdminBilling';
import { adminBillingService } from '@/services/adminBilling.service';
import type { AdminInvoiceDto, AdminCouponDto } from '@/types/dto';

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (amount: number, currency = 'USD'): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

const fmtDate = (iso: string): string => {
  const locale = document.documentElement.lang || navigator.language || 'en-US';
  return new Intl.DateTimeFormat(locale, {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(iso));
};

const fmtPct = (v: number): string => `${(v * 100).toFixed(1)}%`;

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

// ── Revenue Section ──────────────────────────────────────────────────────────

function RevenueSection() {
  const { data, isLoading } = useAdminRevenue();
  if (isLoading) return <SectionSkeleton cards={3} />;
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <KpiCard title="MRR" value={fmtCurrency(data.mrr)} icon={<DollarSign className="h-4 w-4 text-emerald-500" />} />
      <KpiCard title="ARR" value={fmtCurrency(data.arr)} icon={<TrendingUp className="h-4 w-4 text-primary" />} />
      <KpiCard title="Revenue (30d)" value={fmtCurrency(data.revenue30d)} icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />} subtitle={`60d: ${fmtCurrency(data.revenue60d)} | 90d: ${fmtCurrency(data.revenue90d)}`} />
    </div>
  );
}

// ── Invoices Section ─────────────────────────────────────────────────────────

function InvoicesSection() {
  const [cursor, setCursor] = useState<string | undefined>();
  const { data: invoices, isLoading } = useAdminInvoices(20, cursor);

  if (isLoading) return <TableSkeleton rows={5} />;

  const handleNext = () => {
    if (invoices && invoices.length > 0) {
      setCursor(invoices[invoices.length - 1].id);
    }
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">Status</th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">PDF</th>
            </tr>
          </thead>
          <tbody>
            {invoices?.map((inv: AdminInvoiceDto) => (
              <tr key={inv.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2 tabular-nums">{fmtDate(inv.createdAt)}</td>
                <td className="px-3 py-2 truncate max-w-[200px]">{inv.customerEmail}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtCurrency(inv.amount / 100, inv.currency)}</td>
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
            {(!invoices || invoices.length === 0) && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No invoices found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {invoices && invoices.length >= 20 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleNext}>Load more</Button>
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
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [from, setFrom] = useState(thirtyDaysAgo.toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));
  const { data, isLoading } = useAdminTaxReport(from, to);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <Label className="text-xs">From</Label>
          <Input type="date" className="h-8 w-40 text-xs" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">To</Label>
          <Input type="date" className="h-8 w-40 text-xs" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" onClick={() => adminBillingService.exportTaxCsv(from, to)}>
          <FileDown className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>
      {isLoading ? <TableSkeleton rows={3} /> : (
        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Jurisdiction</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Country</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Rate</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Collected</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((line, i) => (
                <tr key={`${line.jurisdiction}-${i}`} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2">{line.jurisdiction}</td>
                  <td className="px-3 py-2">{line.country}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtPct(line.taxRate)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtCurrency(line.amountCollected / 100, line.currency)}</td>
                </tr>
              ))}
              {(!data || data.length === 0) && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No tax data for this period</td></tr>
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
  const { data, isLoading } = useAdminDunning();
  if (isLoading) return <TableSkeleton rows={3} />;

  return (
    <div className="overflow-x-auto rounded-lg border border-border/40">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40 bg-muted/30">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Email</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground">Plan</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground">Step</th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">Days Left</th>
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
            <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No users in dunning</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Coupons Section ──────────────────────────────────────────────────────────

function CouponsSection() {
  const { data, isLoading } = useAdminCoupons();
  const deleteMutation = useDeleteCoupon();
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) return <TableSkeleton rows={3} />;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> Create Coupon
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Discount</th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">Duration</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Redeemed</th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">Valid</th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((c: AdminCouponDto) => (
              <tr key={c.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2 font-mono text-xs">{c.id}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {c.percentOff != null ? `${c.percentOff}%` : c.amountOff != null ? fmtCurrency(c.amountOff / 100, c.currency) : '---'}
                </td>
                <td className="px-3 py-2 text-center capitalize">{c.duration}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {c.timesRedeemed}{c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ''}
                </td>
                <td className="px-3 py-2 text-center">
                  <Badge variant={c.valid ? 'default' : 'destructive'} className="text-xs">{c.valid ? 'Yes' : 'No'}</Badge>
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
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No coupons</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <CreateCouponDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}

function CreateCouponDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
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
          <DialogTitle>Create Stripe Coupon</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs">Discount Type</Label>
            <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'percent' | 'amount')}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percentage</SelectItem>
                <SelectItem value="amount">Fixed Amount (USD)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{discountType === 'percent' ? 'Percent Off' : 'Amount Off ($)'}</Label>
            <Input type="number" className="h-8" value={value} onChange={(e) => setValue(e.target.value)} min={0} />
          </div>
          <div>
            <Label className="text-xs">Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Once</SelectItem>
                <SelectItem value="repeating">Repeating</SelectItem>
                <SelectItem value="forever">Forever</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Max Redemptions (optional)</Label>
            <Input type="number" className="h-8" value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} min={1} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending || !value}>
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Metrics Section ──────────────────────────────────────────────────────────

function MetricsSection() {
  const { data, isLoading } = useAdminBillingMetrics();
  if (isLoading) return <SectionSkeleton cards={4} />;
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard title="Churn Rate" value={fmtPct(data.churnRate)} icon={<AlertTriangle className="h-4 w-4 text-destructive" />} />
      <KpiCard title="Conversion Rate" value={fmtPct(data.conversionRate)} icon={<TrendingUp className="h-4 w-4 text-emerald-500" />} />
      <KpiCard title="ARPU" value={fmtCurrency(data.arpu)} icon={<DollarSign className="h-4 w-4 text-primary" />} />
      <KpiCard title="Est. LTV" value={fmtCurrency(data.estimatedLtv)} icon={<Users className="h-4 w-4 text-muted-foreground" />} subtitle={`${data.totalPaidUsers} paid | ${data.totalFreeUsers} free`} />
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
