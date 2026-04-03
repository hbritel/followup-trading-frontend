import { useState, useDeferredValue } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Label } from '@/components/ui/label';
import {
  Search,
  MoreHorizontal,
  Users,
  ShieldAlert,
  BarChart3,
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Activity,
  Info,
  TrendingUp,
  UserCheck,
  UserX,
  ShieldCheck,
  Link2,
  UserPlus,
  CreditCard,
  Crown,
  Lock,
  ToggleLeft,
  Plug,
  CheckCircle2,
  XCircle,
  Timer,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useAdminUsers,
  useAdminSearchUsers,
  useSetUserStatus,
  useAddRole,
  useRemoveRole,
  useAdminRoles,
  useAuditLogs,
  useAdminAuditEventTypes,
  useAdminDashboardStats,
  useAdminPlanDistribution,
  useAdminSubscriptions,
  useChangeUserPlan,
  useAdminResetPassword,
  useAdminUserGrowth,
  useAdminTopUsers,
  useAdminSubscriptionStats,
  useAdminHealth,
  useAdminFeatureFlags,
  useSetFeatureFlag,
  useAdminScheduledTasks,
  useAdminBrokerConnections,
  useAdminForceDisconnect,
  useUserFeatureOverrides,
  useSetUserFeatureOverride,
  useRemoveUserFeatureOverride,
} from '@/hooks/useAdmin';
import type { AdminUserDto, AuditLogFilters } from '@/services/admin.service';
import { useAuth } from '@/contexts/auth-context';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const locale = document.documentElement.lang || navigator.language || 'en-US';
  return new Intl.DateTimeFormat(locale, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

function fmtDateFull(iso: string | null | undefined): string {
  if (!iso) return '—';
  const locale = document.documentElement.lang || navigator.language || 'en-US';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

function roleBadgeVariant(name: string) {
  if (name.includes('ADMIN')) return 'destructive' as const;
  if (name.includes('PREMIUM') || name.includes('PRO')) return 'default' as const;
  return 'outline' as const;
}

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-muted text-muted-foreground',
  PRO: 'bg-primary/10 text-primary border-primary/30',
  ENTERPRISE: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
};

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onPrev, onNext }: {
  page: number; totalPages: number; onPrev: () => void; onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      <Button variant="outline" size="sm" onClick={onPrev} disabled={page === 0}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-xs text-muted-foreground tabular-nums">
        {page + 1} / {totalPages}
      </span>
      <Button variant="outline" size="sm" onClick={onNext} disabled={page >= totalPages - 1}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ title, value, icon, subtitle, trend }: {
  title: string; value: string | number; icon: React.ReactNode; subtitle?: string; trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className={cn(
              'text-2xl font-bold tabular-nums mt-1',
              trend === 'up' && 'text-emerald-500',
              trend === 'down' && 'text-destructive',
            )}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Confirm action dialog ─────────────────────────────────────────────────────

type ConfirmActionState = {
  type: 'toggle' | 'removeRole';
  user: AdminUserDto;
  roleName?: string;
};

function ConfirmActionDialog({ confirmAction, onConfirm, onClose }: {
  confirmAction: ConfirmActionState | null; onConfirm: () => void; onClose: () => void;
}) {
  const { t } = useTranslation();
  if (!confirmAction) return null;

  const title = confirmAction.type === 'toggle'
    ? (confirmAction.user.enabled ? t('admin.disableUser') : t('admin.enableUser'))
    : t('admin.removeRole');

  const description = confirmAction.type === 'toggle'
    ? t('admin.confirmToggleStatus', {
        name: confirmAction.user.fullName ?? confirmAction.user.username,
        action: confirmAction.user.enabled ? t('admin.disable') : t('admin.enable'),
      })
    : t('admin.confirmRemoveRole', {
        role: confirmAction.roleName,
        name: confirmAction.user.fullName ?? confirmAction.user.username,
      });

  return (
    <AlertDialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{t('common.confirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab({ searchQuery }: { searchQuery: string }) {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(0);
  const deferredSearch = useDeferredValue(searchQuery.trim());

  const listQuery = useAdminUsers(page, 20);
  const searchQuery2 = useAdminSearchUsers(deferredSearch, 0, 20);

  const isSearching = deferredSearch.length >= 2;
  const data = isSearching ? searchQuery2.data ?? [] : listQuery.data ?? [];
  const isLoading = isSearching ? searchQuery2.isLoading : listQuery.isLoading;
  const isError = isSearching ? searchQuery2.isError : listQuery.isError;

  const setStatusMutation = useSetUserStatus();
  const addRoleMutation = useAddRole();
  const removeRoleMutation = useRemoveRole();
  const changePlanMutation = useChangeUserPlan();
  const resetPasswordMutation = useAdminResetPassword();
  const rolesQuery = useAdminRoles();

  const [confirmAction, setConfirmAction] = useState<ConfirmActionState | null>(null);
  const [roleDialogUser, setRoleDialogUser] = useState<AdminUserDto | null>(null);
  const [selectedRoleName, setSelectedRoleName] = useState('');
  const [planDialogUser, setPlanDialogUser] = useState<AdminUserDto | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [featureOverrideUser, setFeatureOverrideUser] = useState<AdminUserDto | null>(null);

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'toggle') {
      setStatusMutation.mutate({ id: confirmAction.user.id, enable: !confirmAction.user.enabled });
    } else if (confirmAction.type === 'removeRole' && confirmAction.roleName) {
      removeRoleMutation.mutate({ id: confirmAction.user.id, roleName: confirmAction.roleName });
    }
    setConfirmAction(null);
  };

  const handleAddRole = () => {
    if (!roleDialogUser || !selectedRoleName) return;
    addRoleMutation.mutate({ id: roleDialogUser.id, roleName: selectedRoleName });
    setRoleDialogUser(null);
    setSelectedRoleName('');
  };

  const handleChangePlan = () => {
    if (!planDialogUser || !selectedPlan) return;
    changePlanMutation.mutate({ userId: planDialogUser.id, plan: selectedPlan });
    setPlanDialogUser(null);
    setSelectedPlan('');
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive py-4">{t('common.errorLoadingData')}</p>;
  }

  return (
    <>
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.name')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.email')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.roles')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.plan', 'Plan')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.status')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.lastLogin')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {t('admin.noUsersFound')}
                </td>
              </tr>
            ) : (
              data.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {(user.fullName ?? user.username).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.fullName ?? user.username}
                          {currentUser?.id === user.id && (
                            <span className="text-xs text-primary ml-1">({t('admin.me', 'Me')})</span>
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[200px]">{user.email}</span>
                      {user.mfaEnabled && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                            </TooltipTrigger>
                            <TooltipContent>MFA enabled</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(user.roles ?? []).map((role) => (
                        <Badge key={role} variant={roleBadgeVariant(role)} className="text-[10px] px-1.5 py-0">
                          {role.replace('ROLE_', '')}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', PLAN_COLORS[user.plan ?? 'FREE'] ?? PLAN_COLORS['FREE'])}>
                      {user.plan ?? 'FREE'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.enabled}
                        onCheckedChange={() => setConfirmAction({ type: 'toggle', user })}
                        disabled={setStatusMutation.isPending}
                        aria-label={user.enabled ? t('admin.disableUser') : t('admin.enableUser')}
                      />
                      <span className={cn(
                        'text-xs font-medium',
                        user.enabled ? 'text-emerald-500' : 'text-muted-foreground',
                      )}>
                        {user.enabled ? t('admin.active') : t('admin.inactive')}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-muted-foreground">{fmtDate(user.lastLoginAt)}</span>
                        </TooltipTrigger>
                        <TooltipContent>{fmtDateFull(user.lastLoginAt)}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('admin.userActions')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setPlanDialogUser(user); setSelectedPlan(''); }}>
                          <Crown className="mr-2 h-4 w-4" />
                          {t('admin.changePlan', 'Change Plan')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setRoleDialogUser(user); setSelectedRoleName(''); }}>
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          {t('admin.assignRole')}
                        </DropdownMenuItem>
                        {(user.roles ?? []).map((role) => (
                          <DropdownMenuItem
                            key={role}
                            className="text-destructive"
                            onClick={() => setConfirmAction({ type: 'removeRole', user, roleName: role })}
                          >
                            <ShieldAlert className="mr-2 h-4 w-4" />
                            {t('admin.removeRole')} {role.replace('ROLE_', '')}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuItem onClick={() => resetPasswordMutation.mutate(user.id)}>
                          <Lock className="mr-2 h-4 w-4" />
                          {t('admin.resetPassword', 'Reset Password')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFeatureOverrideUser(user)}>
                          <ToggleLeft className="mr-2 h-4 w-4" />
                          {t('admin.featureOverrides', 'Feature Overrides')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setConfirmAction({ type: 'toggle', user })}>
                          {user.enabled ? t('admin.disableUser') : t('admin.enableUser')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isSearching && (
        <Pagination
          page={page}
          totalPages={data.length < 20 ? page + 1 : page + 2}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      )}

      <ConfirmActionDialog confirmAction={confirmAction} onConfirm={handleConfirm} onClose={() => setConfirmAction(null)} />

      {/* Assign role dialog */}
      <Dialog open={roleDialogUser !== null} onOpenChange={(open) => { if (!open) setRoleDialogUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.assignRole')}</DialogTitle>
            <DialogDescription>
              {t('admin.assignRoleDescription', { name: roleDialogUser?.fullName ?? roleDialogUser?.username })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="role-select">{t('admin.role')}</Label>
            <Select value={selectedRoleName} onValueChange={setSelectedRoleName}>
              <SelectTrigger id="role-select" className="mt-2">
                <SelectValue placeholder={t('admin.selectRole')} />
              </SelectTrigger>
              <SelectContent>
                {(rolesQuery.data ?? []).map((r) => (
                  <SelectItem key={r.id} value={r.name}>
                    {r.name.replace('ROLE_', '')}
                    {r.description ? ` — ${r.description}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogUser(null)}>{t('common.cancel')}</Button>
            <Button onClick={handleAddRole} disabled={!selectedRoleName || addRoleMutation.isPending}>
              {t('admin.assignRole')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change plan dialog */}
      <Dialog open={planDialogUser !== null} onOpenChange={(open) => { if (!open) setPlanDialogUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.changePlan', 'Change Plan')}</DialogTitle>
            <DialogDescription>
              {t('admin.changePlanDescription', 'Change subscription plan for {{name}}', { name: planDialogUser?.fullName ?? planDialogUser?.username })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>{t('admin.plan', 'Plan')}</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={t('admin.selectPlan', 'Select plan')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogUser(null)}>{t('common.cancel')}</Button>
            <Button onClick={handleChangePlan} disabled={!selectedPlan || changePlanMutation.isPending}>
              {changePlanMutation.isPending ? t('common.saving', 'Saving...') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feature overrides dialog */}
      {featureOverrideUser && (
        <UserFeatureOverridesDialog
          user={featureOverrideUser}
          open={!!featureOverrideUser}
          onOpenChange={(open) => { if (!open) setFeatureOverrideUser(null); }}
        />
      )}
    </>
  );
}

// ── User Feature Overrides Dialog ─────────────────────────────────────────────

const OVERRIDE_FLAG_ORDER = ['ai_chat', 'backtesting', 'reports', 'trade_replay', 'alerts', 'market_feed'];
const OVERRIDE_FLAG_LABELS: Record<string, string> = {
  ai_chat: 'AI Trading Coach',
  backtesting: 'Backtesting Engine',
  trade_replay: 'Trade Replay',
  market_feed: 'Market Feed',
  reports: 'Reports Generation',
  alerts: 'Price Alerts',
};

function UserFeatureOverridesDialog({ user, open, onOpenChange }: {
  user: AdminUserDto; open: boolean; onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { data: overrides, isLoading } = useUserFeatureOverrides(user.id);
  const { data: globalFlags } = useAdminFeatureFlags();
  const setOverride = useSetUserFeatureOverride();
  const removeOverride = useRemoveUserFeatureOverride();

  // Build a map of current overrides for quick lookup
  const overrideMap = new Map(
    (overrides ?? []).map(o => [o.featureKey, o.enabled])
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('admin.featureOverrides', 'Feature Overrides')}</DialogTitle>
          <DialogDescription>
            {t('admin.featureOverridesDescription', 'Override global feature flags for {{name}}. Per-user overrides take priority over global settings.', { name: user.fullName ?? user.username })}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-2 py-4">
            {OVERRIDE_FLAG_ORDER.map((key) => {
              const globalValue = globalFlags?.[key] ?? true;
              const hasOverride = overrideMap.has(key);
              const effectiveValue = hasOverride ? overrideMap.get(key)! : globalValue;

              return (
                <div key={key} className={cn(
                  'flex items-center justify-between p-3 rounded-lg border transition-colors',
                  hasOverride
                    ? effectiveValue
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : 'border-destructive/20 bg-destructive/5'
                    : 'border-border',
                )}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{OVERRIDE_FLAG_LABELS[key] ?? key}</p>
                      {hasOverride ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {t('admin.overridden', 'Override')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                          {t('admin.global', 'Global')}: {globalValue ? 'ON' : 'OFF'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={effectiveValue}
                      onCheckedChange={(val) => setOverride.mutate({ userId: user.id, featureKey: key, enabled: val })}
                      disabled={setOverride.isPending || removeOverride.isPending}
                    />
                    {hasOverride && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => removeOverride.mutate({ userId: user.id, featureKey: key })}
                        disabled={removeOverride.isPending}
                        title={t('admin.resetToGlobal', 'Reset to global')}
                      >
                        {t('admin.reset', 'Reset')}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────

function DashboardTab() {
  const { t } = useTranslation();
  const { data: ds, isLoading, isError, refetch, isFetching } = useAdminDashboardStats();
  const { data: planDist } = useAdminPlanDistribution();
  const { data: growth } = useAdminUserGrowth();
  const { data: topUsers } = useAdminTopUsers(5);

  // Fallback to old stats if dashboard-stats endpoint not available yet
  const stats = ds as any;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-destructive mb-3">{t('common.errorLoadingData')}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const totalPlanUsers = planDist ? Object.values(planDist).reduce((a, b) => a + b, 0) : 0;

  const fmtUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* Refresh */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5 text-xs">
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
          {t('common.refresh', 'Refresh')}
        </Button>
      </div>

      {/* Section 1: KPIs */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard title={t('admin.totalUsers')} value={stats?.totalUsers ?? 0} icon={<Users className="h-5 w-5 text-muted-foreground" />} />
        <KpiCard title={t('admin.activeToday')} value={stats?.activeToday ?? 0} icon={<UserCheck className="h-5 w-5 text-emerald-500" />} subtitle={t('admin.last24h')} />
        <KpiCard title={t('admin.newThisWeek', 'New This Week')} value={stats?.newThisWeek ?? 0} icon={<UserPlus className="h-5 w-5 text-primary" />} trend="up" />
        <KpiCard title={t('admin.totalTrades')} value={stats?.totalTrades ?? 0} icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />} />
        <KpiCard title={t('admin.tradesToday', 'Trades Today')} value={stats?.tradesToday ?? 0} icon={<TrendingUp className="h-5 w-5 text-primary" />} />
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard title={t('admin.totalConnections', 'Connections')} value={stats?.totalConnections ?? 0} icon={<Link2 className="h-5 w-5 text-muted-foreground" />} />
        <KpiCard title={t('admin.connectionsInError', 'Errors')} value={stats?.connectionsInError ?? 0} icon={<XCircle className="h-5 w-5 text-destructive" />} trend={(stats?.connectionsInError ?? 0) > 0 ? 'down' : 'neutral'} />
        <KpiCard title={t('admin.mfaEnabled', 'MFA Enabled')} value={stats?.mfaEnabledUsers ?? 0} icon={<ShieldCheck className="h-5 w-5 text-emerald-500" />} />
        <KpiCard title={t('admin.disabledUsers', 'Disabled')} value={stats?.disabledUsers ?? 0} icon={<UserX className="h-5 w-5 text-destructive" />} trend={(stats?.disabledUsers ?? 0) > 0 ? 'down' : 'neutral'} />
        <KpiCard title={t('admin.retentionRate', 'Retention')} value={`${(stats?.retentionRate ?? 0).toFixed(0)}%`} icon={<Activity className="h-5 w-5 text-primary" />} />
      </div>

      {/* Section 2: Revenue + Section 5: Broker + Plan Distribution */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Revenue */}
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.revenue', 'Revenue & Conversion')}</p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                  <span className="text-sm text-muted-foreground flex items-center gap-1 cursor-help">MRR <Info className="h-3 w-3 text-muted-foreground/50" /></span>
                </TooltipTrigger><TooltipContent side="right" className="max-w-[220px] text-xs">{t('admin.mrrInfo', 'Monthly Recurring Revenue — total monthly income from all paid subscriptions')}</TooltipContent></Tooltip></TooltipProvider>
                <span className="text-lg font-bold tabular-nums text-emerald-500">${(stats?.mrr ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 cursor-help">ARR <Info className="h-3 w-3 text-muted-foreground/50" /></span>
                </TooltipTrigger><TooltipContent side="right" className="max-w-[220px] text-xs">{t('admin.arrInfo', 'Annual Recurring Revenue — MRR projected over 12 months (MRR × 12)')}</TooltipContent></Tooltip></TooltipProvider>
                <span className="text-sm font-semibold tabular-nums">${(stats?.arr ?? 0).toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 cursor-help">ARPU <Info className="h-3 w-3 text-muted-foreground/50" /></span>
                </TooltipTrigger><TooltipContent side="right" className="max-w-[220px] text-xs">{t('admin.arpuInfo', 'Average Revenue Per User — MRR divided by the number of paid subscribers')}</TooltipContent></Tooltip></TooltipProvider>
                <span className="text-sm font-semibold tabular-nums">${(stats?.arpu ?? 0).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('admin.conversionRate', 'Conversion')}</span>
                <span className="text-sm font-semibold tabular-nums">{(stats?.conversionRate ?? 0).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('admin.churnRate', 'Churn (30d)')}</span>
                <span className={cn('text-sm font-semibold tabular-nums', (stats?.churnRate ?? 0) > 5 && 'text-destructive')}>{(stats?.churnRate ?? 0).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('admin.paidUsers', 'Paid')}: {stats?.totalPaid ?? 0}</span>
                <span>{t('admin.freeUsers', 'Free')}: {stats?.totalFree ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Broker Connections Overview */}
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.brokerOverview', 'Broker Connections')}</p>
            {stats?.connectionsByStatus && Object.keys(stats.connectionsByStatus).length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">{t('admin.byStatus', 'By Status')}</p>
                {Object.entries(stats.connectionsByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <Badge variant={status === 'CONNECTED' ? 'default' : status === 'ERROR' ? 'destructive' : 'secondary'} className="text-[10px]">{status}</Badge>
                    <span className="text-sm font-semibold tabular-nums">{count}</span>
                  </div>
                ))}
                <Separator />
                <p className="text-[11px] text-muted-foreground">{t('admin.byBroker', 'By Broker')}</p>
                {stats?.connectionsByBroker && Object.entries(stats.connectionsByBroker).map(([broker, count]) => (
                  <div key={broker} className="flex items-center justify-between">
                    <span className="text-xs font-medium">{broker}</span>
                    <span className="text-sm tabular-nums">{count}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t('admin.failedSyncs', 'Failed Syncs (24h)')}</span>
                  <span className={cn('text-sm font-semibold tabular-nums', (stats?.failedSyncsLast24h ?? 0) > 0 && 'text-destructive')}>{stats?.failedSyncsLast24h ?? 0}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2">—</p>
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.planDistribution', 'Plan Distribution')}</p>
            {planDist && totalPlanUsers > 0 ? (
              <div className="space-y-2.5">
                {Object.entries(planDist).map(([plan, count]) => {
                  const pct = Math.round((count / totalPlanUsers) * 100);
                  return (
                    <div key={plan} className="flex items-center gap-2">
                      <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 w-20 justify-center', PLAN_COLORS[plan])}>{plan}</Badge>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn('h-full rounded-full', plan === 'PRO' ? 'bg-primary' : plan === 'ENTERPRISE' ? 'bg-amber-500' : 'bg-muted-foreground/30')} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground w-16 text-right">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 3: User Activity + Section 4: System + Section 6: Security */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Top Active Users */}
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.topActiveUsers', 'Top Active Users (7d)')}</p>
            {topUsers ? (
              <div className="space-y-2">
                {topUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">{t('admin.noActivity', 'No activity in the last 7 days')}</p>
                ) : topUsers.map((user, i) => (
                  <div key={user.userId} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold', i === 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-muted text-muted-foreground')}>{i + 1}</span>
                      <span className="text-sm font-medium truncate">{user.fullName ?? user.username}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] tabular-nums shrink-0 ml-2">{user.tradeCount} {t('admin.trades', 'trades')}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-full" />)}</div>
            )}
          </CardContent>
        </Card>

        {/* System Health + Uptime */}
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.systemHealth', 'System Health')}</p>
            <div className="space-y-2.5">
              {/* Uptime */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('admin.uptime', 'Uptime')}</span>
                <span className="text-sm font-semibold tabular-nums">{stats?.uptimeSeconds ? fmtUptime(stats.uptimeSeconds) : '—'}</span>
              </div>
              <Separator />
              {/* PostgreSQL */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {stats?.postgresStatus === 'UP' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                  <span className="text-xs font-medium">PostgreSQL</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{stats?.postgresLatencyMs ?? 0}ms</span>
              </div>
              {/* Redis */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {stats?.redisStatus === 'UP' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                  <span className="text-xs font-medium">Redis</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{stats?.redisLatencyMs ?? 0}ms</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit & Security */}
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.auditSecurity', 'Audit & Security')}</p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('admin.eventsToday', 'Events Today')}</span>
                <span className="text-sm font-semibold tabular-nums">{stats?.auditEventsToday ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('admin.failedLogins', 'Failed Logins (24h)')}</span>
                <span className={cn('text-sm font-semibold tabular-nums', (stats?.failedLoginsLast24h ?? 0) > 5 && 'text-destructive')}>{stats?.failedLoginsLast24h ?? 0}</span>
              </div>
              <Separator />
              <p className="text-[11px] text-muted-foreground">{t('admin.recentActions', 'Recent Admin Actions')}</p>
              {(stats?.recentAdminActions ?? []).length > 0 ? (
                <div className="space-y-1.5">
                  {stats.recentAdminActions.map((action: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-[11px]">
                      <span className="text-muted-foreground shrink-0 tabular-nums">{fmtDate(action.timestamp)}</span>
                      <span className="truncate">{action.details}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">—</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Growth chart */}
      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.userGrowth', 'New Users (30d)')}</p>
          {growth ? (
            <div className="space-y-2">
              <div className="flex items-end gap-[2px] h-24">
                {growth.map((day) => {
                  const maxCount = Math.max(...growth.map(d => d.count), 1);
                  const heightPct = (day.count / maxCount) * 100;
                  return (
                    <TooltipProvider key={day.date}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex-1 bg-primary/60 hover:bg-primary rounded-t transition-colors min-h-[2px]" style={{ height: `${Math.max(heightPct, 2)}%` }} />
                        </TooltipTrigger>
                        <TooltipContent>{day.date}: {day.count} new</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{growth[0]?.date?.slice(5)}</span>
                <span>{growth[growth.length - 1]?.date?.slice(5)}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {t('admin.totalNewUsers', '{{count}} new users', { count: growth.reduce((a, d) => a + d.count, 0) })}
              </p>
            </div>
          ) : (
            <Skeleton className="h-24 w-full" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Subscriptions Tab ─────────────────────────────────────────────────────────

function SubscriptionsTab() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const { data, isLoading, isError } = useAdminSubscriptions(page, 20);
  const changePlanMutation = useChangeUserPlan();
  const [planDialog, setPlanDialog] = useState<{ userId: string; username: string } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');

  const handleChangePlan = () => {
    if (!planDialog || !selectedPlan) return;
    changePlanMutation.mutate({ userId: planDialog.userId, plan: selectedPlan });
    setPlanDialog(null);
    setSelectedPlan('');
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive py-4">{t('common.errorLoadingData')}</p>;
  }

  const subs = data?.content ?? [];

  return (
    <>
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.user', 'User')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.plan', 'Plan')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.status')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.billing', 'Billing')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.periodEnd', 'Period End')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {subs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {t('admin.noSubscriptionsFound', 'No subscriptions found')}
                </td>
              </tr>
            ) : (
              subs.map((sub) => (
                <tr key={sub.userId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{sub.username}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{sub.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn('text-xs', PLAN_COLORS[sub.plan] ?? PLAN_COLORS['FREE'])}>
                      {sub.plan}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={sub.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px]">
                      {sub.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {sub.billingInterval?.toLowerCase() ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {sub.currentPeriodEnd ? fmtDate(sub.currentPeriodEnd) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => { setPlanDialog({ userId: sub.userId, username: sub.username }); setSelectedPlan(''); }}
                    >
                      <Crown className="h-3.5 w-3.5" />
                      {t('admin.changePlan', 'Change')}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-muted-foreground">
          {data ? `${data.totalElements} ${t('admin.subscriptions', 'subscriptions')}` : ''}
        </span>
        <Pagination
          page={page}
          totalPages={data?.totalPages ?? 1}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>

      {/* Change plan dialog */}
      <Dialog open={planDialog !== null} onOpenChange={(open) => { if (!open) setPlanDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.changePlan', 'Change Plan')}</DialogTitle>
            <DialogDescription>
              {t('admin.changePlanDescription', 'Change subscription plan for {{name}}', { name: planDialog?.username })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>{t('admin.plan', 'Plan')}</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={t('admin.selectPlan', 'Select plan')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialog(null)}>{t('common.cancel')}</Button>
            <Button onClick={handleChangePlan} disabled={!selectedPlan || changePlanMutation.isPending}>
              {changePlanMutation.isPending ? t('common.saving', 'Saving...') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Audit Logs Tab ────────────────────────────────────────────────────────────

const EVENT_TYPE_COLORS: Record<string, string> = {
  AUTH: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  LOGIN: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  TRADE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  ADMIN: 'bg-destructive/10 text-destructive border-destructive/30',
  SYSTEM: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  SYNC: 'bg-violet-500/10 text-violet-500 border-violet-500/30',
  BROKER: 'bg-violet-500/10 text-violet-500 border-violet-500/30',
};

function getEventColor(eventType: string): string {
  for (const [key, color] of Object.entries(EVENT_TYPE_COLORS)) {
    if (eventType.toUpperCase().includes(key)) return color;
  }
  return 'bg-muted text-muted-foreground';
}

function AuditLogsTab() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [eventType, setEventType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLog, setSelectedLog] = useState<import('@/services/admin.service').AuditLogDto | null>(null);

  // Build filters reactively — no "Apply" button needed
  const filters: AuditLogFilters = {
    eventType: eventType !== 'all' ? eventType : undefined,
    start: startDate ? new Date(startDate).toISOString() : undefined,
    end: endDate ? new Date(endDate + 'T23:59:59').toISOString() : undefined,
  };

  const { data, isLoading, isError, refetch, isFetching } = useAuditLogs(page, 20, filters);
  const { data: eventTypes } = useAdminAuditEventTypes();

  const hasFilters = eventType !== 'all' || startDate || endDate;

  const handleClearFilters = () => {
    setEventType('all');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  // Reset to page 0 when filters change
  const handleEventTypeChange = (val: string) => { setEventType(val); setPage(0); };
  const handleStartChange = (val: string) => { setStartDate(val); setPage(0); };
  const handleEndChange = (val: string) => { setEndDate(val); setPage(0); };

  return (
    <div className="space-y-4">
      {/* Filter bar — auto-applies on change */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border p-3 bg-muted/30">
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] text-muted-foreground">{t('admin.eventType')}</Label>
          <Select value={eventType} onValueChange={handleEventTypeChange}>
            <SelectTrigger className="h-8 w-[200px] text-xs">
              <SelectValue placeholder={t('admin.allEventTypes', 'All event types')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.allEventTypes', 'All event types')}</SelectItem>
              {(eventTypes ?? []).map((et) => (
                <SelectItem key={et} value={et}>
                  <span className="font-mono text-xs">{et}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] text-muted-foreground">{t('common.from')}</Label>
          <Input type="date" className="h-8 w-36 text-xs" value={startDate} onChange={(e) => handleStartChange(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] text-muted-foreground">{t('common.to')}</Label>
          <Input type="date" className="h-8 w-36 text-xs" value={endDate} onChange={(e) => handleEndChange(e.target.value)} />
        </div>
        {hasFilters && (
          <Button size="sm" variant="outline" className="h-8" onClick={handleClearFilters}>{t('common.clearFilters')}</Button>
        )}
        <Button size="sm" variant="ghost" className="h-8" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
        </Button>
        {data && (data.content ?? []).length > 0 && (
          <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => {
            const rows = (data.content ?? []).map(log =>
              [log.timestamp, log.principal, log.eventType, log.resourceType, log.resourceId ?? '', log.details ?? ''].join(',')
            );
            const csv = ['Timestamp,Principal,Event Type,Resource Type,Resource ID,Details', ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}>
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-10 w-full rounded" />)}
        </div>
      )}

      {isError && <p className="text-sm text-destructive py-4">{t('common.errorLoadingData')}</p>}

      {!isLoading && !isError && (
        <>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.timestamp')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.principal')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.eventType')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.resource')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.details')}</th>
                </tr>
              </thead>
              <tbody>
                {(data?.content ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      {t('admin.noAuditLogsFound')}
                    </td>
                  </tr>
                ) : (
                  (data?.content ?? []).map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedLog(log)}>
                      <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                        {fmtDate(log.timestamp)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs truncate max-w-[140px]" title={log.principal}>
                        {log.principal}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className={cn('text-[10px] font-mono px-1.5 py-0', getEventColor(log.eventType))}>
                          {log.eventType}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-xs">
                        <span className="font-medium">{log.resourceType}</span>
                        {log.resourceId && (
                          <span className="text-muted-foreground ml-1 truncate block max-w-[100px]" title={log.resourceId}>
                            {log.resourceId.slice(0, 8)}...
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[220px] truncate" title={log.details ?? ''}>
                        {log.details ?? '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {data ? `${data.totalElements} ${t('admin.entries')}` : ''}
            </span>
            <Pagination
              page={page}
              totalPages={data?.totalPages ?? 1}
              onPrev={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </div>
        </>
      )}

      {/* Audit log detail dialog */}
      <Dialog open={selectedLog !== null} onOpenChange={(open) => { if (!open) setSelectedLog(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('admin.auditLogDetail', 'Audit Log Detail')}</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-[100px_1fr] gap-y-3 gap-x-3 text-sm">
                <span className="text-xs font-medium text-muted-foreground uppercase">{t('admin.timestamp')}</span>
                <span className="font-mono text-xs">{fmtDateFull(selectedLog.timestamp)}</span>

                <span className="text-xs font-medium text-muted-foreground uppercase">{t('admin.principal')}</span>
                <span className="font-mono text-xs break-all">{selectedLog.principal}</span>

                <span className="text-xs font-medium text-muted-foreground uppercase">{t('admin.eventType')}</span>
                <Badge variant="outline" className={cn('text-[10px] font-mono px-1.5 py-0 w-fit', getEventColor(selectedLog.eventType))}>
                  {selectedLog.eventType}
                </Badge>

                <span className="text-xs font-medium text-muted-foreground uppercase">{t('admin.resource')}</span>
                <div>
                  <span className="font-medium text-xs">{selectedLog.resourceType}</span>
                  {selectedLog.resourceId && (
                    <p className="font-mono text-[11px] text-muted-foreground break-all">{selectedLog.resourceId}</p>
                  )}
                </div>

                <span className="text-xs font-medium text-muted-foreground uppercase">{t('admin.details')}</span>
                <p className="text-xs whitespace-pre-wrap break-all">{selectedLog.details ?? '—'}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLog(null)}>{t('common.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Broker Connections Tab ─────────────────────────────────────────────────────

function BrokerConnectionsTab() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const effectiveStatus = statusFilter === 'all' ? undefined : statusFilter;
  const { data, isLoading, isError } = useAdminBrokerConnections(page, 20, effectiveStatus);
  const forceDisconnect = useAdminForceDisconnect();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    );
  }

  if (isError) return <p className="text-sm text-destructive py-4">{t('common.errorLoadingData')}</p>;

  const connections = data?.content ?? [];

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder={t('admin.allStatuses', 'All statuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.allStatuses', 'All statuses')}</SelectItem>
            <SelectItem value="CONNECTED">Connected</SelectItem>
            <SelectItem value="DISCONNECTED">Disconnected</SelectItem>
            <SelectItem value="ERROR">Error</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.user', 'User')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.broker', 'Broker')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.protocol', 'Protocol')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.status')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.lastSync', 'Last Sync')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {connections.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">{t('admin.noConnectionsFound', 'No connections found')}</td></tr>
            ) : connections.map((conn) => (
              <tr key={conn.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-sm font-medium">{conn.username}</td>
                <td className="px-4 py-3 text-sm">{conn.brokerCode}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-[10px]">{conn.protocol}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={conn.status === 'CONNECTED' ? 'default' : conn.status === 'ERROR' ? 'destructive' : 'secondary'} className="text-[10px]">
                    {conn.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(conn.lastSyncTime)}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => forceDisconnect.mutate(conn.id)}
                    disabled={forceDisconnect.isPending || conn.status === 'DISCONNECTED'}
                  >
                    <Plug className="h-3.5 w-3.5 mr-1" />
                    {t('admin.disconnect', 'Disconnect')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-muted-foreground">
          {data ? `${data.totalElements} ${t('admin.connections', 'connections')}` : ''}
        </span>
        <Pagination page={page} totalPages={data?.totalPages ?? 1} onPrev={() => setPage(p => Math.max(0, p - 1))} onNext={() => setPage(p => p + 1)} />
      </div>
    </div>
  );
}

// ── Feature Flags Tab ─────────────────────────────────────────────────────────

function FeatureFlagsTab() {
  const { t } = useTranslation();
  const { data: flags, isLoading } = useAdminFeatureFlags();
  const setFlag = useSetFeatureFlag();
  const { data: health } = useAdminHealth();
  const { data: tasks } = useAdminScheduledTasks();

  // Stable display order for feature flags
  const FLAG_ORDER = ['ai_chat', 'backtesting', 'reports', 'trade_replay', 'alerts', 'market_feed'];
  const FLAG_LABELS: Record<string, string> = {
    ai_chat: 'AI Trading Coach',
    backtesting: 'Backtesting Engine',
    trade_replay: 'Trade Replay',
    market_feed: 'Market Feed',
    reports: 'Reports Generation',
    alerts: 'Price Alerts',
  };

  // Sort flags in stable order
  const sortedFlags = flags
    ? FLAG_ORDER
        .filter(key => key in flags)
        .map(key => [key, flags[key]] as [string, boolean])
        .concat(Object.entries(flags).filter(([key]) => !FLAG_ORDER.includes(key)))
    : [];

  return (
    <div className="space-y-6">
      {/* Feature Flags */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">{t('admin.featureFlags', 'Feature Flags')}</h3>
        <p className="text-xs text-muted-foreground">{t('admin.featureFlagsDescription', 'Toggle features on/off in real-time without restarting the server.')}</p>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
        ) : sortedFlags.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedFlags.map(([key, enabled]) => (
              <div key={key} className={cn(
                'flex items-center justify-between p-3.5 rounded-lg border transition-colors',
                enabled ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border',
              )}>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{FLAG_LABELS[key] ?? key}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{key}</p>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={(val) => setFlag.mutate({ key, enabled: val })}
                  disabled={setFlag.isPending}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <Separator />

      {/* Service Health */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">{t('admin.serviceHealth', 'Service Health')}</h3>
        {health?.services ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {health.services.map((svc) => (
              <div key={svc.name} className={cn(
                'flex items-center justify-between p-3.5 rounded-lg border',
                svc.status === 'UP' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-destructive/20 bg-destructive/5',
              )}>
                <div className="flex items-center gap-2.5">
                  {svc.status === 'UP' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{svc.name}</p>
                    {svc.latencyMs != null && (
                      <p className="text-[11px] text-muted-foreground">{svc.latencyMs}ms</p>
                    )}
                  </div>
                </div>
                <Badge variant={svc.status === 'UP' ? 'default' : 'destructive'} className="text-[10px]">
                  {svc.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
        )}
      </div>

      <Separator />

      {/* Scheduled Tasks */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">{t('admin.scheduledTasks', 'Scheduled Tasks')}</h3>
        {tasks ? (
          <div className="rounded-lg border divide-y">
            {tasks.map((task) => (
              <div key={task.name} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{task.name}</p>
                  <p className="text-[11px] text-muted-foreground">{task.description}</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono shrink-0 ml-3">
                  <Timer className="h-3 w-3 mr-1" />
                  {task.cronExpression}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const Administration = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <DashboardLayout pageTitle={t('admin.administration')}>
      <PageTransition className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('admin.administration')}</h1>
            <p className="text-sm text-muted-foreground">{t('admin.administrationDescription')}</p>
          </div>
          {activeTab === 'users' && (
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('admin.searchUsers')}
                className="pl-8 w-full sm:w-[260px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearchQuery(''); }}>
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('admin.dashboard', 'Dashboard')}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              {t('admin.users')}
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <CreditCard className="h-4 w-4" />
              {t('admin.subscriptions', 'Subscriptions')}
            </TabsTrigger>
            <TabsTrigger value="auditLog" className="gap-2">
              <FileText className="h-4 w-4" />
              {t('admin.auditLog')}
            </TabsTrigger>
            <TabsTrigger value="brokerConnections" className="gap-2">
              <Plug className="h-4 w-4" />
              {t('admin.brokerConnections', 'Connections')}
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <ToggleLeft className="h-4 w-4" />
              {t('admin.system', 'System')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UsersTab searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-6">
            <SubscriptionsTab />
          </TabsContent>

          <TabsContent value="auditLog" className="mt-6">
            <AuditLogsTab />
          </TabsContent>

          <TabsContent value="brokerConnections" className="mt-6">
            <BrokerConnectionsTab />
          </TabsContent>

          <TabsContent value="system" className="mt-6">
            <FeatureFlagsTab />
          </TabsContent>
        </Tabs>
      </PageTransition>
    </DashboardLayout>
  );
};

export default Administration;
