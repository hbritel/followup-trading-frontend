import apiClient from './apiClient';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AdminUserDto {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  profilePictureUrl: string | null;
  enabled: boolean;
  mfaEnabled: boolean;
  roles: string[];
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminStatsDto {
  totalUsers: number;
  activeToday: number;
  totalTrades: number;
  javaVersion: string;
  springProfile: string;
}

export interface RoleDto {
  id: number;
  name: string;
  description: string | null;
  level: number;
}

export interface AuditLogDto {
  id: string;
  principal: string;
  eventType: string;
  resourceType: string;
  resourceId: string;
  details: string | null;
  timestamp: string;
}

export interface AuditLogFilters {
  principal?: string;
  eventType?: string;
  start?: string;
  end?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// ── Service ────────────────────────────────────────────────────────────────────

export const adminService = {
  /**
   * Returns a paginated list of all users (admin only).
   */
  getUsers: async (page = 0, size = 20): Promise<AdminUserDto[]> => {
    const response = await apiClient.get<AdminUserDto[]>('/users', {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Searches users by username, email, or full name (admin only).
   */
  searchUsers: async (term: string, page = 0, size = 20): Promise<AdminUserDto[]> => {
    const response = await apiClient.get<AdminUserDto[]>('/users/search', {
      params: { term, page, size },
    });
    return response.data;
  },

  /**
   * Returns a single user by their ID (admin only).
   */
  getUserById: async (id: string): Promise<AdminUserDto> => {
    const response = await apiClient.get<AdminUserDto>(`/users/${id}`);
    return response.data;
  },

  /**
   * Enables or disables a user account (admin only).
   */
  setUserStatus: async (id: string, enable: boolean): Promise<void> => {
    await apiClient.put(`/users/${id}/status`, null, { params: { enable } });
  },

  /**
   * Adds a role to a user (admin only).
   */
  addRole: async (id: string, roleName: string): Promise<void> => {
    await apiClient.post(`/users/${id}/roles`, null, { params: { roleName } });
  },

  /**
   * Removes a role from a user (admin only).
   */
  removeRole: async (id: string, roleName: string): Promise<void> => {
    await apiClient.delete(`/users/${id}/roles`, { params: { roleName } });
  },

  /**
   * Returns admin dashboard stats.
   */
  getStats: async (): Promise<AdminStatsDto> => {
    const response = await apiClient.get<AdminStatsDto>('/admin/stats');
    return response.data;
  },

  /**
   * Returns all system roles ordered by level.
   */
  getRoles: async (): Promise<RoleDto[]> => {
    const response = await apiClient.get<RoleDto[]>('/admin/roles');
    return response.data;
  },

  /**
   * Returns a paginated, filtered view of the audit log.
   */
  getAuditLogs: async (
    page = 0,
    size = 20,
    filters: AuditLogFilters = {}
  ): Promise<PageResponse<AuditLogDto>> => {
    const response = await apiClient.get<PageResponse<AuditLogDto>>('/admin/audit-logs', {
      params: { page, size, ...filters },
    });
    return response.data;
  },
};
