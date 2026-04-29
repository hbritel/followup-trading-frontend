import React, { useState, useDeferredValue, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { ChangePlanDialog } from '@/components/admin/ChangePlanDialog';
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
  Tag,
  Plus,
  Eye,
  Percent,
  DollarSign,
  Sparkles,
  ArrowUpCircle,
  Users2,
  Calendar,
  Wallet,
  ShieldOff,
  Scale,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMentorshipEnabled } from '@/hooks/useFeatureConfig';
import {
  useAdminUsers,
  useAdminSearchUsers,
  useSetUserStatus,
  useAddRole,
  useRemoveRole,
  useAdminRoles,
  useAuditLogs,
  useAdminAllUsersForLookup,
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
import type { AdminUserDto, AuditLogFilters, DashboardStatsDto, RecentAdminActionDto } from '@/services/admin.service';
import { promoService, type PromoCodeDto, type PromoUsageDto } from '@/services/promo.service';
import { useAuth } from '@/contexts/auth-context';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import BillingTab from '@/components/admin/BillingTab';
import AiUsageTab from '@/components/admin/AiUsageTab';
import AdminAiTab from '@/components/admin/AdminAiTab';
import AdminMentorVerificationQueue from '@/components/admin/AdminMentorVerificationQueue';
import AdminMentorComplaintQueue from '@/components/admin/AdminMentorComplaintQueue';
import AdminDac7Tab from '@/components/admin/AdminDac7Tab';
import AdminDsaTab from '@/components/admin/AdminDsaTab';
import AdminMentorSuspensionsTab from '@/components/admin/AdminMentorSuspensionsTab';

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
  STARTER: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  PRO: 'bg-primary/10 text-primary border-primary/30',
  ELITE: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  TEAM: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30',
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

function UsersTab() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
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
  const [featureOverrideUser, setFeatureOverrideUser] = useState<AdminUserDto | null>(null);

  // Batch selection state
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [batchPromoDialogOpen, setBatchPromoDialogOpen] = useState(false);
  const [batchSelectedPromoId, setBatchSelectedPromoId] = useState('');
  const [batchPlanDialogOpen, setBatchPlanDialogOpen] = useState(false);
  const { data: promos } = useAdminPromos();
  const applyBatchMutation = useApplyBatch();

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === data.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(data.map(u => u.id)));
    }
  };

  const handleBatchApplyPromo = async () => {
    if (!batchSelectedPromoId || selectedUserIds.size === 0) return;
    await applyBatchMutation.mutateAsync({ promoId: batchSelectedPromoId, userIds: Array.from(selectedUserIds) });
    setSelectedUserIds(new Set());
    setBatchPromoDialogOpen(false);
    setBatchSelectedPromoId('');
  };

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
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:w-[280px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('admin.searchUsers')}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-3 text-left">
                <Checkbox
                  checked={data.length > 0 && selectedUserIds.size === data.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label={t('admin.selectAll', 'Select all')}
                />
              </th>
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
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {t('admin.noUsersFound')}
                </td>
              </tr>
            ) : (
              data.map((user) => (
                <tr key={user.id} className={cn('border-b last:border-0 hover:bg-muted/30 transition-colors', selectedUserIds.has(user.id) && 'bg-primary/5')}>
                  <td className="px-3 py-3">
                    <Checkbox
                      checked={selectedUserIds.has(user.id)}
                      onCheckedChange={() => toggleSelectUser(user.id)}
                      aria-label={`Select ${user.username}`}
                    />
                  </td>
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
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', PLAN_COLORS[user.plan ?? 'FREE'] ?? PLAN_COLORS['FREE'])}>
                          {user.plan ?? 'FREE'}
                        </Badge>
                        {user.grantedByAdmin && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-violet-400 border-violet-500/30 bg-violet-500/10">
                            {t('admin.granted', 'Granted')}
                          </Badge>
                        )}
                      </div>
                      {user.planExpiresAt && (
                        <span className="text-[10px] text-amber-400/80">
                          {t('admin.expiresIn', 'Expires in {{days}}d', { days: Math.max(0, Math.ceil((new Date(user.planExpiresAt).getTime() - Date.now()) / 86400000)) })}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.enabled}
                        onCheckedChange={() => setConfirmAction({ type: 'toggle', user })}
                        disabled={setStatusMutation.isPending}
                        aria-label={user.enabled ? t('admin.disableUser') : t('admin.enableUser')}
                      />
                      <span
                        className={cn(
                          'inline-block h-2 w-2 rounded-full',
                          user.enabled ? 'bg-emerald-500' : 'bg-muted-foreground/40',
                        )}
                        aria-hidden="true"
                      />
                      <span className="sr-only">
                        {user.enabled ? t('admin.active') : t('admin.inactive')}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-muted-foreground tabular-nums">{fmtDate(user.lastLoginAt)}</span>
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
                        <DropdownMenuItem onClick={() => setPlanDialogUser(user)}>
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

      {/* Floating batch action bar */}
      {selectedUserIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border bg-background/95 backdrop-blur-sm shadow-lg px-5 py-3">
          <span className="text-sm font-medium text-muted-foreground">
            {selectedUserIds.size} {t('admin.usersSelected', 'selected')}
          </span>
          <Separator orientation="vertical" className="h-5" />
          <Button size="sm" variant="outline" onClick={() => setBatchPlanDialogOpen(true)}>
            <Crown className="h-3.5 w-3.5 mr-1.5" />
            {t('admin.changePlan', 'Change Plan')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setBatchPromoDialogOpen(true)}>
            <Tag className="h-3.5 w-3.5 mr-1.5" />
            {t('admin.applyPromo', 'Apply Promo')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedUserIds(new Set())}>
            {t('common.cancel')}
          </Button>
        </div>
      )}

      {/* Batch apply promo dialog */}
      <Dialog open={batchPromoDialogOpen} onOpenChange={(open) => { if (!open) setBatchPromoDialogOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.applyPromoToUsers', 'Apply Promo Code to Users')}</DialogTitle>
            <DialogDescription>
              {t('admin.applyPromoDescription', 'Apply a promo code to {{count}} selected user(s).', { count: selectedUserIds.size })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>{t('admin.selectPromo', 'Select Promo Code')}</Label>
            <Select value={batchSelectedPromoId} onValueChange={setBatchSelectedPromoId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={t('admin.selectPromo', 'Select a promo code')} />
              </SelectTrigger>
              <SelectContent>
                {(promos ?? []).filter(p => p.active).map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="font-mono font-semibold">{p.code}</span>
                    <span className="text-muted-foreground ml-2 text-xs">— {p.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchPromoDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={handleBatchApplyPromo}
              disabled={!batchSelectedPromoId || applyBatchMutation.isPending}
            >
              {applyBatchMutation.isPending ? t('common.saving', 'Applying...') : t('admin.applyPromo', 'Apply Promo')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch change plan — reuses shared dialog */}
      <ChangePlanDialog
        open={batchPlanDialogOpen}
        onOpenChange={setBatchPlanDialogOpen}
        targetLabel={t('admin.batchPlanTarget', '{{count}} selected user(s)', { count: selectedUserIds.size })}
        isPending={changePlanMutation.isPending}
        confirmLabel={t('admin.applyToSelected', 'Apply to Selected')}
        onConfirm={(plan, durationDays) => {
          Array.from(selectedUserIds).forEach((userId) => {
            changePlanMutation.mutate({ userId, plan, durationDays });
          });
          setSelectedUserIds(new Set());
          setBatchPlanDialogOpen(false);
        }}
      />

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
      <ChangePlanDialog
        open={planDialogUser !== null}
        onOpenChange={(open) => { if (!open) setPlanDialogUser(null); }}
        targetLabel={planDialogUser?.fullName ?? planDialogUser?.username ?? ''}
        isPending={changePlanMutation.isPending}
        onConfirm={(plan, durationDays) => {
          if (!planDialogUser) return;
          changePlanMutation.mutate(
            { userId: planDialogUser.id, plan, durationDays },
            { onSuccess: () => setPlanDialogUser(null) },
          );
        }}
      />

      {/* Feature overrides dialog */}
      {featureOverrideUser && (
        <UserFeatureOverridesDialog
          user={featureOverrideUser}
          open={!!featureOverrideUser}
          onOpenChange={(open) => { if (!open) setFeatureOverrideUser(null); }}
        />
      )}
    </div>
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

/** Minimum plan required to access each feature (independent of feature flags). */
const FEATURE_REQUIRED_PLAN: Record<string, string> = {
  ai_chat: 'STARTER',
  backtesting: 'PRO',
  trade_replay: 'PRO',
  market_feed: 'STARTER',
  reports: 'STARTER',
  alerts: 'STARTER',
};

const PLAN_RANK: Record<string, number> = { FREE: 0, STARTER: 1, PRO: 2, ELITE: 3, TEAM: 4 };

function userPlanAllowsFeature(userPlan: string | undefined, featureKey: string): boolean {
  const required = FEATURE_REQUIRED_PLAN[featureKey];
  if (!required) return true;
  return (PLAN_RANK[userPlan ?? 'FREE'] ?? 0) >= (PLAN_RANK[required] ?? 0);
}

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
          <DialogTitle>{t('admin.featureAccess', 'Feature Access')}</DialogTitle>
          <DialogDescription>
            {t('admin.featureOverridesDescription', 'Customize feature access for {{name}}. Overrides take priority over global settings.', { name: user.fullName ?? user.username })}
          </DialogDescription>
          <div className="flex items-center gap-2 pt-2">
            <span className="text-xs text-muted-foreground">{t('admin.userPlan', 'Plan')}:</span>
            <Badge variant="outline" className="text-xs font-semibold">
              {user.plan ?? 'FREE'}
            </Badge>
          </div>
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
              const planAllows = userPlanAllowsFeature(user.plan, key);
              const requiredPlan = FEATURE_REQUIRED_PLAN[key];

              const grantedByOverride = !planAllows && hasOverride && effectiveValue;

              return (
                <div key={key} className={cn(
                  'flex items-center justify-between p-3 rounded-lg border transition-colors',
                  grantedByOverride
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : !planAllows
                      ? 'border-amber-500/20 bg-amber-500/5'
                      : hasOverride
                        ? effectiveValue
                          ? 'border-emerald-500/20 bg-emerald-500/5'
                          : 'border-destructive/20 bg-destructive/5'
                        : 'border-border',
                )}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{OVERRIDE_FLAG_LABELS[key] ?? key}</p>
                      {!planAllows && requiredPlan && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-400 border-amber-500/30 bg-amber-500/10">
                          {requiredPlan.charAt(0) + requiredPlan.slice(1).toLowerCase()}+
                        </Badge>
                      )}
                      {hasOverride ? (
                        <Badge variant="outline" className={cn(
                          'text-[10px] px-1.5 py-0',
                          grantedByOverride ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : '',
                        )}>
                          {t('admin.overridden', 'Override')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                          {t('admin.global', 'Global')}: {globalValue ? 'ON' : 'OFF'}
                        </Badge>
                      )}
                    </div>
                    {!planAllows && !grantedByOverride && (
                      <p className="text-[11px] text-amber-400/70 mt-0.5">
                        {t('admin.planBlockedCanOverride', 'Not included in plan — toggle ON to grant access')}
                      </p>
                    )}
                    {grantedByOverride && (
                      <p className="text-[11px] text-emerald-400/70 mt-0.5">
                        {t('admin.grantedByOverride', 'Access granted by admin override (bypasses plan)')}
                      </p>
                    )}
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
  const stats = ds as DashboardStatsDto | undefined;

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
              {(stats?.grantedSubscriptionsCount ?? 0) > 0 && (
                <p className="text-[10px] text-muted-foreground/70">
                  {t('admin.excludesGranted', 'Excludes {{count}} admin-granted subscription(s)', { count: stats!.grantedSubscriptionsCount })}
                </p>
              )}
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
                        <div
                          className={cn(
                            'h-full rounded-full',
                            plan === 'TEAM' ? 'bg-fuchsia-500'
                              : plan === 'ELITE' ? 'bg-amber-500'
                              : plan === 'PRO' ? 'bg-primary'
                              : plan === 'STARTER' ? 'bg-blue-500'
                              : 'bg-muted-foreground/30',
                          )}
                          style={{ width: `${pct}%` }}
                        />
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
                  {stats.recentAdminActions.map((action: RecentAdminActionDto, i: number) => (
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
  const mentorshipEnabled = useMentorshipEnabled();
  const [page, setPage] = useState(0);
  const { data, isLoading, isError } = useAdminSubscriptions(page, 20);
  const changePlanMutation = useChangeUserPlan();
  const [planDialog, setPlanDialog] = useState<{ userId: string; username: string } | null>(null);

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

  // Hide TEAM-plan subscribers entirely while the mentorship feature is OFF —
  // the plan should not exist as far as the admin is concerned.
  const allSubs = data?.content ?? [];
  const subs = mentorshipEnabled
    ? allSubs
    : allSubs.filter((s) => s.plan !== 'TEAM');

  return (
    <>
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.user', 'User')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.plan', 'Plan')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.status')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.billing.title', 'Billing')}</th>
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
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className={cn('text-xs', PLAN_COLORS[sub.plan] ?? PLAN_COLORS['FREE'])}>
                          {sub.plan}
                        </Badge>
                        {sub.grantedByAdmin && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-violet-400 border-violet-500/30 bg-violet-500/10">
                            {t('admin.granted', 'Granted')}
                          </Badge>
                        )}
                      </div>
                      {sub.planExpiresAt && (
                        <span className="text-[10px] text-amber-400/80">
                          {t('admin.expiresIn', 'Expires in {{days}}d', { days: Math.max(0, Math.ceil((new Date(sub.planExpiresAt).getTime() - Date.now()) / 86400000)) })}
                        </span>
                      )}
                    </div>
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
                      onClick={() => setPlanDialog({ userId: sub.userId, username: sub.username })}
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

      <ChangePlanDialog
        open={planDialog !== null}
        onOpenChange={(open) => { if (!open) setPlanDialog(null); }}
        targetLabel={planDialog?.username ?? ''}
        isPending={changePlanMutation.isPending}
        onConfirm={(plan, durationDays) => {
          if (!planDialog) return;
          changePlanMutation.mutate(
            { userId: planDialog.userId, plan, durationDays },
            { onSuccess: () => setPlanDialog(null) },
          );
        }}
      />
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

// UUID regex — used to detect whether a string is a raw UUID
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface UserInfo {
  username: string;
  email: string;
  fullName: string | null;
}

/**
 * Given a raw principal value (UUID or username) and a user lookup map,
 * returns a readable display label and a tooltip string with full details.
 */
function resolvePrincipal(
  principal: string,
  userMap: Map<string, UserInfo>
): { label: string; tooltip: string } {
  if (!UUID_RE.test(principal)) {
    // Already a username / system name — display as-is
    return { label: principal, tooltip: principal };
  }
  const user = userMap.get(principal);
  if (!user) {
    // Unknown UUID — show short form
    return {
      label: principal.slice(0, 8) + '…',
      tooltip: principal,
    };
  }
  const name = user.fullName ? `${user.username} (${user.fullName})` : user.username;
  return { label: name, tooltip: `${name}\n${user.email}\nID: ${principal}` };
}

/**
 * Resolves a resourceId to a readable label when resourceType is USER.
 * For other resource types the raw UUID short form is kept.
 */
function resolveResourceId(
  resourceId: string,
  resourceType: string,
  userMap: Map<string, UserInfo>
): { label: string; tooltip: string } {
  if (!UUID_RE.test(resourceId)) {
    return { label: resourceId, tooltip: resourceId };
  }
  if (resourceType === 'USER') {
    const user = userMap.get(resourceId);
    if (user) {
      const name = user.fullName ? `${user.username} (${user.fullName})` : user.username;
      return { label: name, tooltip: `${name}\n${user.email}\nID: ${resourceId}` };
    }
  }
  return { label: resourceId.slice(0, 8) + '…', tooltip: resourceId };
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

  // Fetch a large batch of users so we can resolve UUIDs to human-readable names
  const { data: allUsers } = useAdminAllUsersForLookup();
  const userMap = useMemo<Map<string, UserInfo>>(() => {
    const map = new Map<string, UserInfo>();
    for (const u of allUsers ?? []) {
      map.set(u.id, { username: u.username, email: u.email, fullName: u.fullName });
    }
    return map;
  }, [allUsers]);

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
            const rows = (data.content ?? []).map(log => {
              const { label: principalLabel } = resolvePrincipal(log.principal, userMap);
              const resourceLabel = log.resourceId
                ? resolveResourceId(log.resourceId, log.resourceType, userMap).label
                : '';
              return [log.timestamp, principalLabel, log.eventType, log.resourceType, resourceLabel, log.details ?? ''].join(',');
            });
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.actor', 'Actor')}</th>
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
                  (data?.content ?? []).map((log) => {
                    const principal = resolvePrincipal(log.principal, userMap);
                    const resource = log.resourceId
                      ? resolveResourceId(log.resourceId, log.resourceType, userMap)
                      : null;
                    return (
                      <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedLog(log)}>
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                          {fmtDate(log.timestamp)}
                        </td>
                        <td className="px-4 py-2.5 text-xs max-w-[160px]">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={cn('truncate block', UUID_RE.test(log.principal) && !userMap.has(log.principal) ? 'font-mono text-muted-foreground' : 'font-medium')}>
                                  {principal.label}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="whitespace-pre-line text-xs max-w-[260px]">
                                {principal.tooltip}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className={cn('text-[10px] font-mono px-1.5 py-0', getEventColor(log.eventType))}>
                            {log.eventType}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-xs max-w-[160px]">
                          <span className="font-medium">{log.resourceType}</span>
                          {resource && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className={cn('truncate block mt-0.5', UUID_RE.test(log.resourceId ?? '') && !userMap.has(log.resourceId ?? '') ? 'font-mono text-muted-foreground text-[11px]' : 'text-muted-foreground text-[11px]')}>
                                    {resource.label}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="whitespace-pre-line text-xs max-w-[260px]">
                                  {resource.tooltip}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[220px] truncate" title={log.details ?? ''}>
                          {log.details ?? '—'}
                        </td>
                      </tr>
                    );
                  })
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
          {selectedLog && (() => {
            const principal = resolvePrincipal(selectedLog.principal, userMap);
            const resource = selectedLog.resourceId
              ? resolveResourceId(selectedLog.resourceId, selectedLog.resourceType, userMap)
              : null;
            return (
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-[100px_1fr] gap-y-3 gap-x-3 text-sm">
                  <span className="text-xs font-medium text-muted-foreground uppercase">{t('admin.timestamp')}</span>
                  <span className="font-mono text-xs">{fmtDateFull(selectedLog.timestamp)}</span>

                  <span className="text-xs font-medium text-muted-foreground uppercase">{t('admin.actor', 'Actor')}</span>
                  <div>
                    <span className="text-xs font-medium">{principal.label}</span>
                    {UUID_RE.test(selectedLog.principal) && (
                      <p className="font-mono text-[11px] text-muted-foreground break-all mt-0.5">{selectedLog.principal}</p>
                    )}
                  </div>

                  <span className="text-xs font-medium text-muted-foreground uppercase">{t('admin.eventType')}</span>
                  <Badge variant="outline" className={cn('text-[10px] font-mono px-1.5 py-0 w-fit', getEventColor(selectedLog.eventType))}>
                    {selectedLog.eventType}
                  </Badge>

                  <span className="text-xs font-medium text-muted-foreground uppercase">{t('admin.resource')}</span>
                  <div>
                    <span className="font-medium text-xs">{selectedLog.resourceType}</span>
                    {resource && (
                      <>
                        <p className="text-xs text-muted-foreground mt-0.5">{resource.label}</p>
                        {selectedLog.resourceId && (
                          <p className="font-mono text-[11px] text-muted-foreground break-all">{selectedLog.resourceId}</p>
                        )}
                      </>
                    )}
                  </div>

                  <span className="text-xs font-medium text-muted-foreground uppercase">{t('admin.details')}</span>
                  <p className="text-xs whitespace-pre-wrap break-all">{selectedLog.details ?? '—'}</p>
                </div>
              </div>
            );
          })()}
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

// ── Promotions Tab ────────────────────────────────────────────────────────────

const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: 'Percentage',
  FIXED_AMOUNT: 'Fixed Amount',
  FEATURE_ACCESS: 'Feature Access',
  PLAN_UPGRADE: 'Plan Upgrade',
};

const PROMO_QUERY_KEY = ['admin', 'promos'];

function useAdminPromos() {
  return useQuery({
    queryKey: PROMO_QUERY_KEY,
    queryFn: () => promoService.listPromos(),
    staleTime: 30 * 1000,
  });
}

function useCreatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PromoCodeDto>) => promoService.createPromo(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROMO_QUERY_KEY }),
  });
}

function useUpdatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PromoCodeDto> }) =>
      promoService.updatePromo(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROMO_QUERY_KEY }),
  });
}

function useDeactivatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => promoService.deactivatePromo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROMO_QUERY_KEY }),
  });
}

function usePromoUsage(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'promos', id, 'usage'],
    queryFn: () => promoService.getPromoUsage(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

function useApplyBatch() {
  return useMutation({
    mutationFn: ({ promoId, userIds }: { promoId: string; userIds: string[] }) =>
      promoService.applyBatch(promoId, userIds),
  });
}

const EMPTY_PROMO: Partial<PromoCodeDto> = {
  code: '',
  name: '',
  discountType: 'PERCENTAGE',
  discountValue: null,
  targetPlan: null,
  featureKeys: null,
  featureDurationDays: null,
  validFrom: new Date().toISOString().slice(0, 16),
  validUntil: null,
  maxUses: null,
  maxUsesPerUser: 1,
  active: true,
};

function PromoFormDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Partial<PromoCodeDto> | null;
}) {
  const { t } = useTranslation();
  const mentorshipEnabled = useMentorshipEnabled();
  const createMutation = useCreatePromo();
  const updateMutation = useUpdatePromo();
  const [form, setForm] = useState<Partial<PromoCodeDto>>(initial ?? EMPTY_PROMO);
  const isEditing = !!initial?.id;

  const set = (key: keyof PromoCodeDto, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && initial?.id) {
      await updateMutation.mutateAsync({ id: initial.id, data: form });
    } else {
      await createMutation.mutateAsync(form);
    }
    onOpenChange(false);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('admin.editPromo', 'Edit Promo Code') : t('admin.createPromo', 'Create Promo Code')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="promo-code">{t('admin.promoCode', 'Code')} *</Label>
              <Input
                id="promo-code"
                value={form.code ?? ''}
                onChange={e => set('code', e.target.value.toUpperCase())}
                placeholder="SUMMER25"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="promo-name">{t('admin.promoName', 'Name')} *</Label>
              <Input
                id="promo-name"
                value={form.name ?? ''}
                onChange={e => set('name', e.target.value)}
                placeholder="Summer 2025"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('admin.discountType', 'Discount Type')}</Label>
              <Select value={form.discountType ?? 'PERCENTAGE'} onValueChange={v => set('discountType', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DISCOUNT_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="promo-value">
                {form.discountType === 'PERCENTAGE'
                  ? t('admin.discountPct', 'Discount %')
                  : form.discountType === 'FIXED_AMOUNT'
                    ? t('admin.discountAmount', 'Amount ($)')
                    : t('admin.discountValue', 'Value')}
              </Label>
              <Input
                id="promo-value"
                type="number"
                value={form.discountValue ?? ''}
                onChange={e => set('discountValue', e.target.value ? Number(e.target.value) : null)}
                placeholder="20"
              />
            </div>
          </div>

          {form.discountType === 'PLAN_UPGRADE' && (
            <div className="space-y-1.5">
              <Label>{t('admin.targetPlan', 'Target Plan')}</Label>
              <Select value={form.targetPlan ?? ''} onValueChange={v => set('targetPlan', v || null)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.selectPlan', 'Select plan')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STARTER">Starter</SelectItem>
                  <SelectItem value="PRO">Pro</SelectItem>
                  <SelectItem value="ELITE">Elite</SelectItem>
                  {mentorshipEnabled && (
                    <SelectItem value="TEAM">Team</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {form.discountType === 'FEATURE_ACCESS' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="promo-features">{t('admin.featureKeys', 'Feature Keys')}</Label>
                <Input
                  id="promo-features"
                  value={form.featureKeys ?? ''}
                  onChange={e => set('featureKeys', e.target.value || null)}
                  placeholder="backtesting,trade_replay"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="promo-duration">{t('admin.featureDurationDays', 'Duration (days)')}</Label>
                <Input
                  id="promo-duration"
                  type="number"
                  value={form.featureDurationDays ?? ''}
                  onChange={e => set('featureDurationDays', e.target.value ? Number(e.target.value) : null)}
                  placeholder="30"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="promo-valid-from">{t('admin.validFrom', 'Valid From')}</Label>
              <Input
                id="promo-valid-from"
                type="datetime-local"
                value={form.validFrom ? form.validFrom.slice(0, 16) : ''}
                onChange={e => set('validFrom', e.target.value ? new Date(e.target.value).toISOString() : null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="promo-valid-until">{t('admin.validUntil', 'Valid Until')}</Label>
              <Input
                id="promo-valid-until"
                type="datetime-local"
                value={form.validUntil ? form.validUntil.slice(0, 16) : ''}
                onChange={e => set('validUntil', e.target.value ? new Date(e.target.value).toISOString() : null)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="promo-max-uses">{t('admin.maxUses', 'Max Uses (total)')}</Label>
              <Input
                id="promo-max-uses"
                type="number"
                value={form.maxUses ?? ''}
                onChange={e => set('maxUses', e.target.value ? Number(e.target.value) : null)}
                placeholder="Unlimited"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="promo-max-per-user">{t('admin.maxUsesPerUser', 'Max Per User')}</Label>
              <Input
                id="promo-max-per-user"
                type="number"
                min={1}
                value={form.maxUsesPerUser ?? 1}
                onChange={e => set('maxUsesPerUser', Number(e.target.value))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending || !form.code || !form.name}>
              {isPending ? t('common.saving', 'Saving...') : isEditing ? t('common.save', 'Save') : t('admin.create', 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PromoUsageDialog({
  promoId,
  promoCode,
  open,
  onOpenChange,
}: {
  promoId: string;
  promoCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { data: usages, isLoading } = usePromoUsage(open ? promoId : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {t('admin.promoUsageTitle', 'Redemptions for')} <span className="font-mono text-primary">{promoCode}</span>
          </DialogTitle>
          <DialogDescription>
            {usages ? `${usages.length} ${t('admin.redemptions', 'redemptions')}` : ''}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full rounded" />)}
          </div>
        ) : usages && usages.length > 0 ? (
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">{t('admin.userId', 'User ID')}</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">{t('admin.appliedAt', 'Applied')}</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">{t('admin.grantedPlan', 'Plan')}</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">{t('admin.discount', 'Discount')}</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">{t('admin.status')}</th>
                </tr>
              </thead>
              <tbody>
                {usages.map(u => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground truncate max-w-[100px]">{u.userId}</td>
                    <td className="px-3 py-2 text-xs">{fmtDate(u.appliedAt)}</td>
                    <td className="px-3 py-2">
                      {u.grantedPlan ? (
                        <Badge variant="outline" className={cn('text-[10px]', PLAN_COLORS[u.grantedPlan])}>{u.grantedPlan}</Badge>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {u.discountAmount != null ? `$${u.discountAmount.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={u.active ? 'default' : 'secondary'} className="text-[10px]">
                        {u.active ? t('admin.active') : t('admin.expired', 'Expired')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">{t('admin.noRedemptions', 'No redemptions yet.')}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PromotionsTab() {
  const { t } = useTranslation();
  const { data: promos, isLoading, isError, refetch } = useAdminPromos();
  const deactivateMutation = useDeactivatePromo();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editPromo, setEditPromo] = useState<PromoCodeDto | null>(null);
  const [usagePromo, setUsagePromo] = useState<PromoCodeDto | null>(null);

  const handleDeactivate = (id: string) => {
    deactivateMutation.mutate(id);
  };

  const discountTypeIcon = (type: string) => {
    if (type === 'PERCENTAGE') return <Percent className="h-3 w-3" />;
    if (type === 'FIXED_AMOUNT') return <DollarSign className="h-3 w-3" />;
    if (type === 'FEATURE_ACCESS') return <Sparkles className="h-3 w-3" />;
    if (type === 'PLAN_UPGRADE') return <ArrowUpCircle className="h-3 w-3" />;
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{t('admin.promoCodes', 'Promo Codes')}</h3>
          <p className="text-xs text-muted-foreground">{t('admin.promoCodesDescription', 'Manage discount codes and promotional offers.')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isLoading && 'animate-spin')} />
            {t('common.refresh', 'Refresh')}
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {t('admin.createPromo', 'Create Promo')}
          </Button>
        </div>
      </div>

      {isError && (
        <p className="text-sm text-destructive">{t('common.errorLoadingData')}</p>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : promos && promos.length > 0 ? (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.promoCode', 'Code')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.promoName', 'Name')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.discountType', 'Type')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.validity', 'Validity')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.usage', 'Usage')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.status')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {promos.map(promo => (
                <tr key={promo.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-semibold tracking-wider">{promo.code}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">{promo.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0">
                        {discountTypeIcon(promo.discountType)}
                        {DISCOUNT_TYPE_LABELS[promo.discountType] ?? promo.discountType}
                      </Badge>
                      {promo.discountValue != null && (
                        <span className="text-xs text-muted-foreground">
                          {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}%` : `$${promo.discountValue}`}
                        </span>
                      )}
                      {promo.targetPlan && (
                        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', PLAN_COLORS[promo.targetPlan])}>
                          {promo.targetPlan}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div className="space-y-0.5">
                      <p>{fmtDate(promo.validFrom)}</p>
                      {promo.validUntil && <p className="text-[10px]">→ {fmtDate(promo.validUntil)}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Users2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm tabular-nums">
                        {promo.usedCount}{promo.maxUses != null ? `/${promo.maxUses}` : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={promo.active ? 'default' : 'secondary'} className="text-[10px]">
                      {promo.active ? t('admin.active') : t('admin.inactive')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('admin.promoActions', 'Actions')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setUsagePromo(promo)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t('admin.viewUsage', 'View Redemptions')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditPromo(promo)}>
                          <Tag className="mr-2 h-4 w-4" />
                          {t('common.edit', 'Edit')}
                        </DropdownMenuItem>
                        {promo.active && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeactivate(promo.id)}
                            disabled={deactivateMutation.isPending}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            {t('admin.deactivate', 'Deactivate')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10 border rounded-lg">
          <Tag className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">{t('admin.noPromos', 'No promo codes yet.')}</p>
          <Button size="sm" className="mt-3" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {t('admin.createPromo', 'Create Promo')}
          </Button>
        </div>
      )}

      {/* Create/Edit dialog */}
      <PromoFormDialog
        open={createDialogOpen || editPromo !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditPromo(null);
          }
        }}
        initial={editPromo}
      />

      {/* Usage detail dialog */}
      {usagePromo && (
        <PromoUsageDialog
          promoId={usagePromo.id}
          promoCode={usagePromo.code}
          open={!!usagePromo}
          onOpenChange={(open) => { if (!open) setUsagePromo(null); }}
        />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const Administration = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const mentorshipEnabled = useMentorshipEnabled();

  // Sub-nav model — grouped to avoid the 13-tab horizontal sprawl.
  // Sections render as small uppercase labels on lg+; on narrow screens the
  // labels collapse and triggers fall back to a horizontal scrollable strip.
  const tabSections: Array<{
    id: string;
    label: string;
    items: Array<{ value: string; icon: React.ReactNode; label: string }>;
  }> = [
    {
      id: 'overview',
      label: t('admin.section.overview', 'Vue'),
      items: [
        {
          value: 'dashboard',
          icon: <BarChart3 className="h-4 w-4" strokeWidth={1.75} />,
          label: t('admin.dashboard', 'Tableau de bord'),
        },
      ],
    },
    {
      id: 'users',
      label: t('admin.section.users', 'Utilisateurs'),
      items: [
        {
          value: 'users',
          icon: <Users className="h-4 w-4" strokeWidth={1.75} />,
          label: t('admin.users'),
        },
        {
          value: 'subscriptions',
          icon: <CreditCard className="h-4 w-4" strokeWidth={1.75} />,
          label: t('admin.subscriptions', 'Abonnements'),
        },
        {
          value: 'brokerConnections',
          icon: <Plug className="h-4 w-4" strokeWidth={1.75} />,
          label: t('admin.brokerConnections', 'Connexions'),
        },
      ],
    },
    {
      id: 'revenue',
      label: t('admin.section.revenue', 'Revenus'),
      items: [
        {
          value: 'billing',
          icon: <Wallet className="h-4 w-4" strokeWidth={1.75} />,
          label: t('admin.billing.title', 'Facturation'),
        },
        {
          value: 'promotions',
          icon: <Tag className="h-4 w-4" strokeWidth={1.75} />,
          label: t('admin.promotions', 'Promotions'),
        },
        {
          value: 'aiUsage',
          icon: <Sparkles className="h-4 w-4" strokeWidth={1.75} />,
          label: t('admin.aiUsageTab', 'AI Usage'),
        },
      ],
    },
    {
      id: 'mentors',
      label: t('admin.section.mentors', 'Mentors'),
      items: mentorshipEnabled
        ? [
            {
              value: 'mentorModeration',
              icon: <UserCheck className="h-4 w-4" strokeWidth={1.75} />,
              label: t('admin.mentorModeration', 'Modération'),
            },
            {
              value: 'mentorSuspensions',
              icon: <ShieldOff className="h-4 w-4" strokeWidth={1.75} />,
              label: t('admin.mentorSuspensions', 'Suspensions'),
            },
          ]
        : [],
    },
    {
      id: 'compliance',
      label: t('admin.section.compliance', 'Conformité'),
      // DAC7 + DSA only make sense when the mentor marketplace is live —
      // DAC7 reports mentor-as-vendor revenue to EU tax authorities, DSA
      // covers content-moderation transparency on the mentor surface. Both
      // hide when the mentorship master switch is OFF.
      items: [
        {
          value: 'auditLog',
          icon: <FileText className="h-4 w-4" strokeWidth={1.75} />,
          label: t('admin.auditLog'),
        },
        ...(mentorshipEnabled
          ? [
              {
                value: 'dac7',
                icon: <Receipt className="h-4 w-4" strokeWidth={1.75} />,
                label: t('admin.dac7.tab', 'DAC7'),
              },
              {
                value: 'dsa',
                icon: <Scale className="h-4 w-4" strokeWidth={1.75} />,
                label: t('admin.dsa.tab', 'DSA'),
              },
            ]
          : []),
      ],
    },
    {
      id: 'system',
      label: t('admin.section.system', 'Système'),
      items: [
        {
          value: 'system',
          icon: <ToggleLeft className="h-4 w-4" strokeWidth={1.75} />,
          label: t('admin.system', 'Système'),
        },
        {
          value: 'aiConfig',
          icon: <Sparkles className="h-4 w-4" strokeWidth={1.75} />,
          label: t('admin.ai.tabLabel', 'AI'),
        },
      ],
    },
  ];

  return (
    <DashboardLayout pageTitle={t('admin.administration')}>
      <PageTransition className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('admin.administration')}</h1>
            <p className="text-sm text-muted-foreground">{t('admin.administrationDescription')}</p>
          </div>
        </div>

        <Tabs
          orientation="vertical"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col lg:flex-row gap-6"
        >
          {/* Vertical sub-nav (Stripe/Linear-style). Falls back to a horizontal
              scrollable strip on narrow screens — admin is desktop-first. */}
          <aside
            className="lg:w-60 lg:shrink-0"
            aria-label={t('admin.adminNavigation', 'Navigation administration')}
          >
            <TabsList className="flex flex-row gap-1 overflow-x-auto bg-transparent p-0 h-auto items-stretch lg:flex-col lg:gap-y-0.5 lg:overflow-visible lg:sticky lg:top-4 lg:self-start lg:items-stretch lg:bg-muted/30 lg:border lg:border-border/40 lg:rounded-xl lg:p-2">
              {tabSections
                .filter((section) => section.items.length > 0)
                .map((section, idx) => (
                <React.Fragment key={section.id}>
                  {idx > 0 && <div className="hidden lg:block h-3" aria-hidden="true" />}
                  <div
                    className="hidden lg:block px-3 pt-1.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60"
                    aria-hidden="true"
                  >
                    {section.label}
                  </div>
                  {section.items.map((item) => (
                    <TabsTrigger
                      key={item.value}
                      value={item.value}
                      className="shrink-0 gap-2.5 px-3 py-1.5 text-sm transition-colors hover:bg-muted/40 lg:w-full lg:justify-start lg:rounded-md lg:data-[state=inactive]:text-muted-foreground"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </TabsTrigger>
                  ))}
                </React.Fragment>
              ))}
            </TabsList>
          </aside>

          {/* Content column */}
          <div className="flex-1 min-w-0">
            <TabsContent value="dashboard" className="mt-0">
              <DashboardTab />
            </TabsContent>

            <TabsContent value="users" className="mt-0">
              <UsersTab />
            </TabsContent>

            <TabsContent value="subscriptions" className="mt-0">
              <SubscriptionsTab />
            </TabsContent>

            <TabsContent value="auditLog" className="mt-0">
              <AuditLogsTab />
            </TabsContent>

            <TabsContent value="brokerConnections" className="mt-0">
              <BrokerConnectionsTab />
            </TabsContent>

            <TabsContent value="promotions" className="mt-0">
              <PromotionsTab />
            </TabsContent>

            <TabsContent value="billing" className="mt-0">
              <BillingTab />
            </TabsContent>

            <TabsContent value="aiUsage" className="mt-0">
              <AiUsageTab />
            </TabsContent>

            <TabsContent value="mentorModeration" className="mt-0">
              <div className="space-y-8">
                <AdminMentorVerificationQueue />
                <AdminMentorComplaintQueue />
              </div>
            </TabsContent>

            <TabsContent value="mentorSuspensions" className="mt-0">
              <AdminMentorSuspensionsTab />
            </TabsContent>

            <TabsContent value="dac7" className="mt-0">
              <AdminDac7Tab />
            </TabsContent>

            <TabsContent value="dsa" className="mt-0">
              <AdminDsaTab />
            </TabsContent>

            <TabsContent value="system" className="mt-0">
              <FeatureFlagsTab />
            </TabsContent>

            <TabsContent value="aiConfig" className="mt-0">
              <AdminAiTab />
            </TabsContent>
          </div>
        </Tabs>
      </PageTransition>
    </DashboardLayout>
  );
};

export default Administration;
