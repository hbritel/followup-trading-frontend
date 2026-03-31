import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminService, type AuditLogFilters } from '@/services/admin.service';
import { toast } from '@/hooks/use-toast';

// ── Query keys ────────────────────────────────────────────────────────────────

const ADMIN_USERS_KEY = ['admin', 'users'];
const ADMIN_STATS_KEY = ['admin', 'stats'];
const ADMIN_ROLES_KEY = ['admin', 'roles'];
const ADMIN_AUDIT_LOGS_KEY = ['admin', 'audit-logs'];

// ── Users ─────────────────────────────────────────────────────────────────────

export const useAdminUsers = (page = 0, size = 20) => {
  return useQuery({
    queryKey: [...ADMIN_USERS_KEY, { page, size }],
    queryFn: () => adminService.getUsers(page, size),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
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
