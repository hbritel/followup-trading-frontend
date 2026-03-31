import React, { useState, useDeferredValue } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
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
  Server,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import {
  useAdminUsers,
  useAdminSearchUsers,
  useSetUserStatus,
  useAddRole,
  useRemoveRole,
  useAdminStats,
  useAdminRoles,
  useAuditLogs,
} from '@/hooks/useAdmin';
import type { AdminUserDto, AuditLogFilters } from '@/services/admin.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function roleBadgeVariant(name: string) {
  if (name.includes('ADMIN')) return 'destructive' as const;
  if (name.includes('PREMIUM')) return 'default' as const;
  return 'outline' as const;
}

// ── Sub-components ────────────────────────────────────────────────────────────

const USER_SKELETON_IDS = ['u-sk-1', 'u-sk-2', 'u-sk-3', 'u-sk-4', 'u-sk-5'];
const STATS_SKELETON_IDS = ['s-sk-1', 's-sk-2', 's-sk-3'];
const AUDIT_SKELETON_IDS = ['a-sk-1', 'a-sk-2', 'a-sk-3', 'a-sk-4', 'a-sk-5', 'a-sk-6', 'a-sk-7', 'a-sk-8'];

function UsersSkeleton() {
  return (
    <div className="space-y-3">
      {USER_SKELETON_IDS.map((id) => (
        <Skeleton key={id} className="h-12 w-full rounded-md" />
      ))}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {STATS_SKELETON_IDS.map((id) => (
        <Skeleton key={id} className="h-28 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ── Pagination controls ────────────────────────────────────────────────────────

interface PaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly onPrev: () => void;
  readonly onNext: () => void;
}

function Pagination({ page, totalPages, onPrev, onNext }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      <Button variant="outline" size="sm" onClick={onPrev} disabled={page === 0}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-muted-foreground">
        {page + 1} / {totalPages}
      </span>
      <Button variant="outline" size="sm" onClick={onNext} disabled={page >= totalPages - 1}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ── Users tab ──────────────────────────────────────────────────────────────────

// ── Confirm action dialog (extracted to reduce UsersTab complexity) ────────────

type ConfirmActionState = {
  type: 'toggle' | 'removeRole';
  user: AdminUserDto;
  roleName?: string;
};

interface ConfirmActionDialogProps {
  readonly confirmAction: ConfirmActionState | null;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
}

function ConfirmActionDialog({ confirmAction, onConfirm, onClose }: ConfirmActionDialogProps) {
  const { t } = useTranslation();

  let title: string;
  let description: string;

  if (confirmAction === null) {
    title = '';
    description = '';
  } else if (confirmAction.type === 'toggle') {
    title = confirmAction.user.enabled ? t('admin.disableUser') : t('admin.enableUser');
    description = t('admin.confirmToggleStatus', {
      name: confirmAction.user.fullName ?? confirmAction.user.username,
      action: confirmAction.user.enabled ? t('admin.disable') : t('admin.enable'),
    });
  } else {
    title = t('admin.removeRole');
    description = t('admin.confirmRemoveRole', {
      role: confirmAction.roleName,
      name: confirmAction.user.fullName ?? confirmAction.user.username,
    });
  }

  return (
    <AlertDialog open={confirmAction !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
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

// ── Users tab ──────────────────────────────────────────────────────────────────

interface UsersTabProps {
  readonly searchQuery: string;
}

function UsersTab({ searchQuery }: UsersTabProps) {
  const { t } = useTranslation();
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

  const rolesQuery = useAdminRoles();

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState | null>(null);

  // Role assignment dialog
  const [roleDialogUser, setRoleDialogUser] = useState<AdminUserDto | null>(null);
  const [selectedRoleName, setSelectedRoleName] = useState('');

  const handleToggleStatus = (user: AdminUserDto) => {
    setConfirmAction({ type: 'toggle', user });
  };

  const handleRemoveRole = (user: AdminUserDto, roleName: string) => {
    setConfirmAction({ type: 'removeRole', user, roleName });
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

  if (isLoading) return <UsersSkeleton />;
  if (isError) {
    return (
      <p className="text-sm text-destructive py-4">{t('common.errorLoadingData')}</p>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.name')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.email')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.roles')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.status')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.lastLogin')}</th>
              <th className="px-4 py-3 text-right text-sm font-medium">{t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {t('admin.noUsersFound')}
                </td>
              </tr>
            ) : (
              data.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium">{user.fullName ?? user.username}</div>
                    <div className="text-xs text-muted-foreground">{user.username}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>{user.email}</div>
                    {user.mfaEnabled && (
                      <Badge variant="outline" className="mt-1 text-xs">MFA</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-1">
                      {(user.roles ?? []).map((role) => (
                        <Badge key={role} variant={roleBadgeVariant(role)} className="text-xs">
                          {role.replace('ROLE_', '')}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.enabled}
                        onCheckedChange={() => handleToggleStatus(user)}
                        disabled={setStatusMutation.isPending}
                        aria-label={user.enabled ? t('admin.disableUser') : t('admin.enableUser')}
                      />
                      <Badge variant={user.enabled ? 'default' : 'secondary'}>
                        {user.enabled ? t('admin.active') : t('admin.inactive')}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDate(user.lastLoginAt)}
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
                        <DropdownMenuItem onClick={() => { setRoleDialogUser(user); setSelectedRoleName(''); }}>
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          {t('admin.assignRole')}
                        </DropdownMenuItem>
                        {(user.roles ?? []).map((role) => (
                          <DropdownMenuItem
                            key={role}
                            className="text-destructive"
                            onClick={() => handleRemoveRole(user, role)}
                          >
                            <ShieldAlert className="mr-2 h-4 w-4" />
                            {t('admin.removeRole')} {role.replace('ROLE_', '')}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
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

      <ConfirmActionDialog
        confirmAction={confirmAction}
        onConfirm={handleConfirm}
        onClose={() => setConfirmAction(null)}
      />

      {/* Assign role dialog */}
      <Dialog open={roleDialogUser !== null} onOpenChange={(open) => { if (!open) setRoleDialogUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.assignRole')}</DialogTitle>
            <DialogDescription>
              {t('admin.assignRoleDescription', {
                name: roleDialogUser?.fullName ?? roleDialogUser?.username,
              })}
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
    </>
  );
}

// ── Stats tab ──────────────────────────────────────────────────────────────────

function StatsTab() {
  const { t } = useTranslation();
  const { data: stats, isLoading, isError, refetch, isFetching } = useAdminStats();

  if (isLoading) return <StatsSkeleton />;
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

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('admin.totalUsers')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalUsers ?? '—'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('admin.activeToday')}
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.activeToday ?? '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('admin.last24h')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('admin.totalTrades')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalTrades ?? '—'}</div>
          </CardContent>
        </Card>
      </div>

      {/* System info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4" />
              {t('admin.systemInfo')}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-muted-foreground">{t('admin.javaVersion')}</dt>
              <dd className="font-medium mt-0.5">{stats?.javaVersion ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('admin.activeProfile')}</dt>
              <dd className="font-medium mt-0.5">
                <Badge variant="outline">{stats?.springProfile ?? '—'}</Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Audit logs tab ─────────────────────────────────────────────────────────────

function AuditLogsTab() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [filterEventType, setFilterEventType] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  const { data, isLoading, isError, refetch, isFetching } = useAuditLogs(page, 20, filters);

  const handleApplyFilters = () => {
    setPage(0);
    setFilters({
      eventType: filterEventType || undefined,
      start: filterStart ? new Date(filterStart).toISOString() : undefined,
      end: filterEnd ? new Date(filterEnd + 'T23:59:59').toISOString() : undefined,
    });
  };

  const handleClearFilters = () => {
    setFilterEventType('');
    setFilterStart('');
    setFilterEnd('');
    setFilters({});
    setPage(0);
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border p-3 bg-muted/30">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">{t('admin.eventType')}</Label>
          <Input
            className="h-8 w-44"
            placeholder="e.g. TRADE_CREATED"
            value={filterEventType}
            onChange={(e) => setFilterEventType(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">{t('common.from')}</Label>
          <Input
            type="date"
            className="h-8 w-36"
            value={filterStart}
            onChange={(e) => setFilterStart(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">{t('common.to')}</Label>
          <Input
            type="date"
            className="h-8 w-36"
            value={filterEnd}
            onChange={(e) => setFilterEnd(e.target.value)}
          />
        </div>
        <Button size="sm" onClick={handleApplyFilters}>{t('common.apply')}</Button>
        {(filters.eventType || filters.start || filters.end) && (
          <Button size="sm" variant="outline" onClick={handleClearFilters}>{t('common.clearFilters')}</Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {AUDIT_SKELETON_IDS.map((id) => (
            <Skeleton key={id} className="h-10 w-full rounded" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive py-4">{t('common.errorLoadingData')}</p>
      )}

      {!isLoading && !isError && (
        <>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">{t('admin.timestamp')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('admin.principal')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('admin.eventType')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('admin.resource')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('admin.details')}</th>
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
                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs truncate max-w-[140px]" title={log.principal}>
                        {log.principal}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className="text-xs font-mono">
                          {log.eventType}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-xs">
                        <span className="font-medium">{log.resourceType}</span>
                        {log.resourceId && (
                          <span className="text-muted-foreground ml-1 truncate block max-w-[100px]" title={log.resourceId}>
                            {log.resourceId}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground max-w-[220px] truncate" title={log.details ?? ''}>
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
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const Administration = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <DashboardLayout pageTitle={t('admin.administration')}>
      <PageTransition>
        <div className="space-y-6">
          {/* Page header */}
          <div>
            <h1 className="text-2xl font-bold">{t('admin.administration')}</h1>
            <p className="text-muted-foreground">{t('admin.administrationDescription')}</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>{t('admin.systemManagement')}</CardTitle>
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
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearchQuery(''); }}>
                <TabsList className="mb-6">
                  <TabsTrigger value="users" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {t('admin.users')}
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    {t('admin.stats')}
                  </TabsTrigger>
                  <TabsTrigger value="auditLog" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {t('admin.auditLog')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                  <UsersTab searchQuery={searchQuery} />
                </TabsContent>

                <TabsContent value="stats">
                  <StatsTab />
                </TabsContent>

                <TabsContent value="auditLog">
                  <AuditLogsTab />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default Administration;
