import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminService, type AuditLogFilters } from '@/services/admin.service';
import { toast } from '@/hooks/use-toast';

// ── Query keys ────────────────────────────────────────────────────────────────

const ADMIN_USERS_KEY = ['admin', 'users'];
const ADMIN_STATS_KEY = ['admin', 'stats'];
const ADMIN_ROLES_KEY = ['admin', 'roles'];
const ADMIN_AUDIT_LOGS_KEY = ['admin', 'audit-logs'];
const ADMIN_PLAN_DIST_KEY = ['admin', 'plan-distribution'];
const ADMIN_SUBSCRIPTIONS_KEY = ['admin', 'subscriptions'];

// ── Users ─────────────────────────────────────────────────────────────────────

export const useAdminUsers = (page = 0, size = 20) => {
  return useQuery({
    queryKey: [...ADMIN_USERS_KEY, { page, size }],
    queryFn: () => adminService.getUsers(page, size),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
};

/**
 * Fetches a large batch of users (up to 500) for building a UUID→UserInfo
 * lookup map used by the audit logs tab to replace raw UUIDs with readable names.
 */
export const useAdminAllUsersForLookup = () => {
  return useQuery({
    queryKey: [...ADMIN_USERS_KEY, 'lookup', { size: 500 }],
    queryFn: () => adminService.getUsers(0, 500),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useAdminSearchUsers = (term: string, page = 0, size = 20) => {
  return useQuery({
    queryKey: [...ADMIN_USERS_KEY, 'search', { term, page, size }],
    queryFn: () => adminService.searchUsers(term, page, size),
    placeholderData: keepPreviousData,
    enabled: term.trim().length >= 2,
    staleTime: 15 * 1000,
  });
};

export const useSetUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enable }: { id: string; enable: boolean }) =>
      adminService.setUserStatus(id, enable),
    onSuccess: (_, { enable }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
      toast({
        title: enable ? 'User enabled' : 'User disabled',
        description: enable
          ? 'The user account has been enabled.'
          : 'The user account has been disabled.',
      });
    },
    onError: () => {
      toast({
        title: 'Action failed',
        description: 'Could not update user status. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useAddRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roleName }: { id: string; roleName: string }) =>
      adminService.addRole(id, roleName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
      toast({ title: 'Role added', description: 'The role has been assigned to the user.' });
    },
    onError: () => {
      toast({
        title: 'Action failed',
        description: 'Could not add role. The user may already have this role.',
        variant: 'destructive',
      });
    },
  });
};

export const useRemoveRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roleName }: { id: string; roleName: string }) =>
      adminService.removeRole(id, roleName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
      toast({ title: 'Role removed', description: 'The role has been removed from the user.' });
    },
    onError: () => {
      toast({
        title: 'Action failed',
        description: 'Could not remove role.',
        variant: 'destructive',
      });
    },
  });
};

// ── Stats ─────────────────────────────────────────────────────────────────────

export const useAdminStats = () => {
  return useQuery({
    queryKey: ADMIN_STATS_KEY,
    queryFn: () => adminService.getStats(),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// ── Roles ─────────────────────────────────────────────────────────────────────

export const useAdminRoles = () => {
  return useQuery({
    queryKey: ADMIN_ROLES_KEY,
    queryFn: () => adminService.getRoles(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// ── Audit logs ────────────────────────────────────────────────────────────────

export const useAuditLogs = (
  page = 0,
  size = 20,
  filters: AuditLogFilters = {}
) => {
  return useQuery({
    queryKey: [...ADMIN_AUDIT_LOGS_KEY, { page, size, ...filters }],
    queryFn: () => adminService.getAuditLogs(page, size, filters),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
};

// ── Plan distribution ────────────────────────────────────────────────────────

export const useAdminAuditEventTypes = () => {
  return useQuery({
    queryKey: ['admin', 'audit-event-types'],
    queryFn: () => adminService.getAuditEventTypes(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useAdminDashboardStats = () => {
  return useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: () => adminService.getDashboardStats(),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useAdminPlanDistribution = () => {
  return useQuery({
    queryKey: ADMIN_PLAN_DIST_KEY,
    queryFn: () => adminService.getPlanDistribution(),
    staleTime: 60 * 1000,
  });
};

// ── Subscriptions ────────────────────────────────────────────────────────────

export const useAdminSubscriptions = (page = 0, size = 20) => {
  return useQuery({
    queryKey: [...ADMIN_SUBSCRIPTIONS_KEY, { page, size }],
    queryFn: () => adminService.getSubscriptions(page, size),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
};

export const useChangeUserPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, plan, durationDays }: { userId: string; plan: string; durationDays?: number | null }) =>
      adminService.changeUserPlan(userId, plan, durationDays ?? null),
    onSuccess: () => {
      // Invalidate admin caches
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_SUBSCRIPTIONS_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_PLAN_DIST_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_STATS_KEY });
      // Invalidate current user's subscription + feature flags + ALL data queries
      // so plan changes take effect immediately (trade visibility, metrics, etc.)
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['performance'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['risk-metrics'] });
      toast({ title: 'Plan changed', description: 'User subscription plan has been updated.' });
    },
    onError: () => {
      toast({ title: 'Action failed', description: 'Could not change user plan.', variant: 'destructive' });
    },
  });
};

export const useAdminResetPassword = () => {
  return useMutation({
    mutationFn: (userId: string) => adminService.resetUserPassword(userId),
    onSuccess: (data) => {
      toast({
        title: 'Password reset',
        description: data.temporaryPassword
          ? `Temporary password: ${data.temporaryPassword}`
          : data.message,
      });
    },
    onError: () => {
      toast({ title: 'Action failed', description: 'Could not reset password.', variant: 'destructive' });
    },
  });
};

export const useAdminUserGrowth = () => {
  return useQuery({
    queryKey: ['admin', 'user-growth'],
    queryFn: () => adminService.getUserGrowth(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useAdminTopUsers = (limit = 5) => {
  return useQuery({
    queryKey: ['admin', 'top-users', limit],
    queryFn: () => adminService.getTopUsers(limit),
    staleTime: 60 * 1000,
  });
};

export const useAdminSubscriptionStats = () => {
  return useQuery({
    queryKey: ['admin', 'subscription-stats'],
    queryFn: () => adminService.getSubscriptionStats(),
    staleTime: 60 * 1000,
  });
};

export const useAdminHealth = () => {
  return useQuery({
    queryKey: ['admin', 'health'],
    queryFn: () => adminService.getHealth(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

export const useAdminFeatureFlags = () => {
  return useQuery({
    queryKey: ['admin', 'feature-flags'],
    queryFn: () => adminService.getFeatureFlags(),
    staleTime: 30 * 1000,
  });
};

export const useSetFeatureFlag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      adminService.setFeatureFlag(key, enabled),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
      // Optimistically update the public feature-flags cache without triggering a refetch
      queryClient.setQueryData<Record<string, boolean>>(['feature-flags'], (old) =>
        old ? { ...old, [variables.key]: variables.enabled } : old
      );
      toast({ title: 'Feature flag updated' });
    },
    onError: () => {
      toast({ title: 'Action failed', description: 'Could not update feature flag.', variant: 'destructive' });
    },
  });
};

export const useAdminScheduledTasks = () => {
  return useQuery({
    queryKey: ['admin', 'scheduled-tasks'],
    queryFn: () => adminService.getScheduledTasks(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useAdminBrokerConnections = (page = 0, size = 20, status?: string, brokerCode?: string) => {
  return useQuery({
    queryKey: ['admin', 'broker-connections', { page, size, status, brokerCode }],
    queryFn: () => adminService.getBrokerConnections(page, size, status, brokerCode),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
};

export const useAdminForceDisconnect = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => adminService.forceDisconnectConnection(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'broker-connections'] });
      toast({ title: 'Connection disconnected' });
    },
    onError: () => {
      toast({ title: 'Action failed', description: 'Could not disconnect.', variant: 'destructive' });
    },
  });
};

// ── Per-user feature overrides ───────────────────────────────────────────────

export const useUserFeatureOverrides = (userId: string | null) => {
  return useQuery({
    queryKey: ['admin', 'user-feature-overrides', userId],
    queryFn: () => adminService.getUserFeatureOverrides(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
};

export const useSetUserFeatureOverride = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, featureKey, enabled }: { userId: string; featureKey: string; enabled: boolean }) =>
      adminService.setUserFeatureOverride(userId, featureKey, enabled),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-feature-overrides', variables.userId] });
      // Optimistically update the public feature-flags cache for the admin's own session
      queryClient.setQueryData<Record<string, boolean>>(['feature-flags'], (old) =>
        old ? { ...old, [variables.featureKey]: variables.enabled } : old
      );
      toast({ title: 'Feature override updated' });
    },
    onError: () => {
      toast({ title: 'Action failed', description: 'Could not update feature override.', variant: 'destructive' });
    },
  });
};

export const useRemoveUserFeatureOverride = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, featureKey }: { userId: string; featureKey: string }) =>
      adminService.removeUserFeatureOverride(userId, featureKey),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-feature-overrides', variables.userId] });
      // Refetch public flags to get the effective value after override removal
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast({ title: 'Feature override removed' });
    },
    onError: () => {
      toast({ title: 'Action failed', description: 'Could not remove feature override.', variant: 'destructive' });
    },
  });
};
