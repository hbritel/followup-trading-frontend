import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building,
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  usePropFirmDashboard,
  usePropFirmTraders,
  useAddTrader,
  useRemoveTrader,
} from '@/hooks/usePropFirmAdmin';
import { toast } from '@/hooks/use-toast';
import type { TraderSummaryDto } from '@/types/dto';

type RiskLevel = TraderSummaryDto['riskLevel'];
type SortField = 'username' | 'winRate' | 'maxDrawdown' | 'tradeCount' | 'riskLevel';
type SortDir = 'asc' | 'desc';

const RISK_ORDER: Record<RiskLevel, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

const riskBadgeClasses: Record<RiskLevel, string> = {
  LOW: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const riskIconColor: Record<RiskLevel, string> = {
  LOW: 'text-emerald-400',
  MEDIUM: 'text-amber-400',
  HIGH: 'text-orange-400',
  CRITICAL: 'text-red-400',
};

function formatPercent(value: number | null | undefined): string {
  if (value == null) return '--';
  return `${value.toFixed(1)}%`;
}

function formatReturn(value: number | null | undefined): string {
  if (value == null) return '--';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

const PropFirmAdmin: React.FC = () => {
  const { t } = useTranslation();

  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [label, setLabel] = useState('');
  const [sortField, setSortField] = useState<SortField>('riskLevel');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    document.title = `${t('propFirmAdmin.title')} | FollowUp Trading`;
  }, [t]);

  const { data: dashboard, isLoading: loadingDash, isError: errorDash } = usePropFirmDashboard();
  const { data: traders, isLoading: loadingTraders, isError: errorTraders } = usePropFirmTraders();
  const addMutation = useAddTrader();
  const removeMutation = useRemoveTrader();

  const isLoading = loadingDash || loadingTraders;
  const isError = errorDash || errorTraders;

  const sortedTraders = useMemo(() => {
    if (!traders) return [];
    const sorted = [...traders];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'username':
          cmp = a.username.localeCompare(b.username);
          break;
        case 'winRate':
          cmp = (a.winRate ?? 0) - (b.winRate ?? 0);
          break;
        case 'maxDrawdown':
          cmp = (a.maxDrawdown ?? 0) - (b.maxDrawdown ?? 0);
          break;
        case 'tradeCount':
          cmp = a.tradeCount - b.tradeCount;
          break;
        case 'riskLevel':
          cmp = RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel];
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [traders, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const handleAdd = async () => {
    if (!userId.trim()) return;
    try {
      await addMutation.mutateAsync({ userId: userId.trim(), label: label.trim() || undefined });
      toast({ title: t('propFirmAdmin.addSuccess') });
      setAddOpen(false);
      setUserId('');
      setLabel('');
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return;
    try {
      await removeMutation.mutateAsync(removeTarget);
      toast({ title: t('propFirmAdmin.removeSuccess') });
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    } finally {
      setRemoveTarget(null);
    }
  };

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? ' \u2191' : ' \u2193';
  };

  return (
    <DashboardLayout pageTitle={t('propFirmAdmin.title')}>
      <PageTransition className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 flex items-center gap-2">
              <Building className="w-6 h-6 text-primary" />
              {t('propFirmAdmin.title')}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t('propFirmAdmin.subtitle')}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border text-primary bg-primary/10 border-primary/20">
            <Building className="w-3.5 h-3.5" />
            B2B Admin
          </span>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">{t('common.errorLoading', 'Failed to load data.')}</p>
          </div>
        )}

        {/* Dashboard content */}
        {!isLoading && !isError && dashboard && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                icon={<Users className="w-5 h-5 text-blue-400" />}
                label={t('propFirmAdmin.activeTraders')}
                value={String(dashboard.activeTraders)}
                accent="blue"
              />
              <KpiCard
                icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
                label={t('propFirmAdmin.evalsPassed')}
                value={String(dashboard.passedEvaluations)}
                accent="emerald"
              />
              <KpiCard
                icon={<XCircle className="w-5 h-5 text-red-400" />}
                label={t('propFirmAdmin.evalsFailed')}
                value={String(dashboard.failedEvaluations)}
                accent="red"
              />
              <KpiCard
                icon={<TrendingUp className="w-5 h-5 text-primary" />}
                label={t('propFirmAdmin.avgWinRate')}
                value={formatPercent(dashboard.avgWinRate)}
                accent="primary"
              />
            </div>

            {/* Two-column section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performers */}
              <section className="glass-card rounded-2xl p-5">
                <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  {t('propFirmAdmin.topPerformers')}
                </h2>
                {dashboard.topPerformers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    {t('propFirmAdmin.noTraders')}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground text-xs border-b border-white/5">
                          <th className="text-left py-2 font-medium">{t('propFirmAdmin.trader')}</th>
                          <th className="text-right py-2 font-medium">{t('propFirmAdmin.winRate')}</th>
                          <th className="text-right py-2 font-medium">{t('propFirmAdmin.return')}</th>
                          <th className="text-right py-2 font-medium">{t('propFirmAdmin.trades')}</th>
                          <th className="text-right py-2 font-medium">{t('propFirmAdmin.riskLevel')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.topPerformers.slice(0, 5).map((trader) => (
                          <tr key={trader.userId} className="border-b border-white/5 last:border-0">
                            <td className="py-2.5 text-white font-medium">{trader.username}</td>
                            <td className="py-2.5 text-right">{formatPercent(trader.winRate)}</td>
                            <td className="py-2.5 text-right">
                              <span className={(trader.totalReturn ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                {formatReturn(trader.totalReturn)}
                              </span>
                            </td>
                            <td className="py-2.5 text-right text-muted-foreground">{trader.tradeCount}</td>
                            <td className="py-2.5 text-right">
                              <RiskBadge level={trader.riskLevel} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* At-Risk Traders */}
              <section className="glass-card rounded-2xl p-5">
                <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  {t('propFirmAdmin.atRiskTraders')}
                </h2>
                {dashboard.atRiskTraders.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    {t('propFirmAdmin.noTraders')}
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {dashboard.atRiskTraders.map((trader) => (
                      <div
                        key={trader.userId}
                        className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 ${riskIconColor[trader.riskLevel]}`}>
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{trader.username}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-0.5">
                                <ArrowDownRight className="w-3 h-3 text-red-400" />
                                {formatPercent(trader.maxDrawdown)} DD
                              </span>
                              <span>{trader.tradeCount} trades</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <RiskBadge level={trader.riskLevel} />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground hover:text-white"
                            title={t('propFirmAdmin.alertTrader')}
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Full Traders Table */}
            <section className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  {t('propFirmAdmin.allTraders')}
                </h2>
                <Button
                  onClick={() => setAddOpen(true)}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  {t('propFirmAdmin.addTrader')}
                </Button>
              </div>

              {sortedTraders.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{t('propFirmAdmin.noTraders')}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('propFirmAdmin.noTradersDesc')}</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground text-xs border-b border-white/5">
                        <SortableHeader field="username" current={sortField} dir={sortDir} onSort={handleSort} indicator={sortIndicator}>
                          {t('propFirmAdmin.trader')}
                        </SortableHeader>
                        <th className="text-left py-2 px-2 font-medium">{t('propFirmAdmin.label', 'Label')}</th>
                        <SortableHeader field="winRate" current={sortField} dir={sortDir} onSort={handleSort} indicator={sortIndicator} align="right">
                          {t('propFirmAdmin.winRate')}
                        </SortableHeader>
                        <SortableHeader field="maxDrawdown" current={sortField} dir={sortDir} onSort={handleSort} indicator={sortIndicator} align="right">
                          {t('propFirmAdmin.maxDrawdown')}
                        </SortableHeader>
                        <SortableHeader field="tradeCount" current={sortField} dir={sortDir} onSort={handleSort} indicator={sortIndicator} align="right">
                          {t('propFirmAdmin.trades')}
                        </SortableHeader>
                        <SortableHeader field="riskLevel" current={sortField} dir={sortDir} onSort={handleSort} indicator={sortIndicator} align="right">
                          {t('propFirmAdmin.riskLevel')}
                        </SortableHeader>
                        <th className="text-right py-2 px-2 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTraders.map((trader) => (
                        <tr key={trader.userId} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-2 text-white font-medium">{trader.username}</td>
                          <td className="py-2.5 px-2 text-muted-foreground text-xs">{trader.label ?? '--'}</td>
                          <td className="py-2.5 px-2 text-right">{formatPercent(trader.winRate)}</td>
                          <td className="py-2.5 px-2 text-right">
                            <span className={(trader.maxDrawdown ?? 0) > 50 ? 'text-red-400' : 'text-muted-foreground'}>
                              {formatPercent(trader.maxDrawdown)}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right text-muted-foreground">{trader.tradeCount}</td>
                          <td className="py-2.5 px-2 text-right">
                            <RiskBadge level={trader.riskLevel} />
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRemoveTarget(trader.userId)}
                              className="text-muted-foreground hover:text-red-400 h-7 w-7 p-0"
                              title={t('propFirmAdmin.removeTrader')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {/* Add Trader Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="glass-panel border border-white/10 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                {t('propFirmAdmin.addTrader')}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="trader-user-id">{t('propFirmAdmin.userId')}</Label>
                <Input
                  id="trader-user-id"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder={t('propFirmAdmin.userId')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trader-label">{t('propFirmAdmin.label', 'Label (optional)')}</Label>
                <Input
                  id="trader-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={t('propFirmAdmin.label', 'Label (optional)')}
                  maxLength={100}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddOpen(false)}
                className="border-white/20"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!userId.trim() || addMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {addMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {t('propFirmAdmin.addTrader')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove confirmation */}
        <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
          <AlertDialogContent className="glass-panel border border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle>{t('propFirmAdmin.removeTrader')}</AlertDialogTitle>
              <AlertDialogDescription>{t('propFirmAdmin.removeConfirm')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/20">{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {t('propFirmAdmin.removeTrader')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageTransition>
    </DashboardLayout>
  );
};

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: 'blue' | 'emerald' | 'red' | 'primary';
}

const accentRing: Record<KpiCardProps['accent'], string> = {
  blue: 'shadow-blue-500/5',
  emerald: 'shadow-emerald-500/5',
  red: 'shadow-red-500/5',
  primary: 'shadow-primary/5',
};

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, accent }) => (
  <div className={`glass-card rounded-2xl p-5 flex items-center gap-4 ${accentRing[accent]}`}>
    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground truncate">{label}</p>
      <p className="text-xl font-bold text-white mt-0.5">{value}</p>
    </div>
  </div>
);

const RiskBadge: React.FC<{ level: RiskLevel }> = ({ level }) => {
  const { t } = useTranslation();
  const labels: Record<RiskLevel, string> = {
    LOW: t('propFirmAdmin.riskLow'),
    MEDIUM: t('propFirmAdmin.riskMedium'),
    HIGH: t('propFirmAdmin.riskHigh'),
    CRITICAL: t('propFirmAdmin.riskCritical'),
  };
  return (
    <span
      className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-md border leading-tight ${riskBadgeClasses[level]}`}
    >
      {labels[level]}
    </span>
  );
};

interface SortableHeaderProps {
  field: SortField;
  current: SortField;
  dir: SortDir;
  onSort: (field: SortField) => void;
  indicator: (field: SortField) => string | null;
  align?: 'left' | 'right';
  children: React.ReactNode;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  field,
  onSort,
  indicator,
  align = 'left',
  children,
}) => (
  <th
    className={`py-2 px-2 font-medium cursor-pointer select-none hover:text-white transition-colors ${
      align === 'right' ? 'text-right' : 'text-left'
    }`}
    onClick={() => onSort(field)}
  >
    {children}
    {indicator(field)}
  </th>
);

export default PropFirmAdmin;
