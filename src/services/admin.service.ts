import apiClient from './apiClient';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AiProviderEntry {
  name: string;
  displayName?: string;
  available: boolean;
  custom?: boolean;
}

export interface AiDefaultProviderDto {
  current: string;
  available: AiProviderEntry[];
}

export type AiProviderTypeValue =
  | 'OLLAMA'
  | 'OPENAI_COMPATIBLE'
  | 'GEMINI'
  | 'ANTHROPIC'
  | 'OPENROUTER';

export interface SystemAiProviderDto {
  id: string;
  name: string;
  displayName: string;
  providerType: AiProviderTypeValue;
  baseUrl: string | null;
  modelName: string;
  maxTokens: number | null;
  temperature: number | null;
  timeoutSeconds: number | null;
  active: boolean;
  hasApiKey: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSystemAiProviderRequest {
  name: string;
  displayName?: string;
  providerType: AiProviderTypeValue;
  baseUrl?: string;
  apiKey?: string;
  modelName: string;
  maxTokens?: number;
  temperature?: number;
  timeoutSeconds?: number;
  active?: boolean;
}

export interface TestSystemAiProviderResponse {
  available: boolean;
  models: string[];
  modelMismatch: boolean;
  configuredModel: string | null;
  error?: string;
}

export interface UpdateSystemAiProviderRequest {
  displayName?: string;
  providerType?: AiProviderTypeValue;
  baseUrl?: string;
  apiKey?: string;
  modelName?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutSeconds?: number;
  active?: boolean;
}

export interface AdminUserDto {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  profilePictureUrl: string | null;
  enabled: boolean;
  mfaEnabled: boolean;
  roles: string[];
  plan: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  grantedByAdmin: boolean | null;
  planExpiresAt: string | null;
}

export interface DailyCountDto {
  date: string;
  count: number;
}

export interface TopUserDto {
  userId: string;
  username: string;
  fullName: string | null;
  tradeCount: number;
  lastLoginAt: string | null;
}

export interface SubscriptionStatsDto {
  mrr: number;
  churnRate: number;
  conversionRate: number;
  totalPaid: number;
  totalFree: number;
}

export interface ServiceHealthDto {
  name: string;
  status: 'UP' | 'DOWN';
  latencyMs: number;
  error: string | null;
}

export interface HealthResponseDto {
  services: ServiceHealthDto[];
}

export interface ScheduledTaskDto {
  name: string;
  description: string;
  cronExpression: string;
}

export interface UserFeatureOverrideDto {
  featureKey: string;
  enabled: boolean;
  changedBy: string | null;
  changedAt: string | null;
}

export interface RecentAdminActionDto {
  timestamp: string;
  adminUsername: string;
  eventType: string;
  details: string;
}

export interface DashboardStatsDto {
  // KPIs
  totalUsers: number;
  activeToday: number;
  newThisWeek: number;
  totalTrades: number;
  totalConnections: number;
  mfaEnabledUsers: number;
  disabledUsers: number;
  tradesToday: number;
  connectionsInError: number;
  // Revenue
  mrr: number;
  arr: number;
  arpu: number;
  conversionRate: number;
  churnRate: number;
  totalPaid: number;
  totalFree: number;
  // User Activity
  retentionRate: number;
  // System
  uptimeSeconds: number;
  postgresStatus: string;
  postgresLatencyMs: number;
  redisStatus: string;
  redisLatencyMs: number;
  // Broker Connections
  connectionsByStatus: Record<string, number>;
  connectionsByBroker: Record<string, number>;
  failedSyncsLast24h: number;
  // Audit & Security
  auditEventsToday: number;
  failedLoginsLast24h: number;
  recentAdminActions: RecentAdminActionDto[];
  // Granted subscriptions
  grantedSubscriptionsCount: number | null;
}

export interface AdminBrokerConnectionDto {
  id: string;
  userId: string;
  username: string;
  brokerCode: string;
  brokerDisplayName: string | null;
  protocol: string;
  status: string;
  accountIdentifier: string | null;
  displayName: string | null;
  lastSyncTime: string | null;
  createdAt: string;
  enabled: boolean;
}

export interface AdminStatsDto {
  totalUsers: number;
  activeToday: number;
  totalTrades: number;
  newThisWeek: number;
  totalConnections: number;
  disabledUsers: number;
  mfaEnabledUsers: number;
}

export interface AdminSubscriptionDto {
  userId: string;
  username: string;
  email: string;
  plan: string;
  status: string;
  billingInterval: string | null;
  currentPeriodEnd: string | null;
  grantedByAdmin: boolean | null;
  planExpiresAt: string | null;
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

  // ── AI default provider ────────────────────────────────────────────────────

  getAiDefaultProvider: async (): Promise<AiDefaultProviderDto> => {
    const response = await apiClient.get<AiDefaultProviderDto>('/admin/ai/default-provider');
    return response.data;
  },

  updateAiDefaultProvider: async (provider: string): Promise<AiDefaultProviderDto> => {
    const response = await apiClient.put<AiDefaultProviderDto>('/admin/ai/default-provider', { provider });
    return response.data;
  },

  // ── Custom (admin-managed) AI providers ────────────────────────────────────

  listSystemAiProviders: async (): Promise<SystemAiProviderDto[]> => {
    const response = await apiClient.get<SystemAiProviderDto[]>('/admin/ai/providers');
    return response.data;
  },

  createSystemAiProvider: async (req: CreateSystemAiProviderRequest): Promise<SystemAiProviderDto> => {
    const response = await apiClient.post<SystemAiProviderDto>('/admin/ai/providers', req);
    return response.data;
  },

  updateSystemAiProvider: async (id: string, req: UpdateSystemAiProviderRequest): Promise<SystemAiProviderDto> => {
    const response = await apiClient.put<SystemAiProviderDto>(`/admin/ai/providers/${id}`, req);
    return response.data;
  },

  deleteSystemAiProvider: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/ai/providers/${id}`);
  },

  testSystemAiProvider: async (id: string): Promise<TestSystemAiProviderResponse> => {
    const response = await apiClient.post<TestSystemAiProviderResponse>(`/admin/ai/providers/${id}/test`);
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

  getPlanDistribution: async (): Promise<Record<string, number>> => {
    const response = await apiClient.get<Record<string, number>>('/admin/plan-distribution');
    return response.data;
  },

  getSubscriptions: async (page = 0, size = 20): Promise<PageResponse<AdminSubscriptionDto>> => {
    const response = await apiClient.get<PageResponse<AdminSubscriptionDto>>('/admin/subscriptions', {
      params: { page, size },
    });
    return response.data;
  },

  changeUserPlan: async (userId: string, plan: string, durationDays: number | null = null): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/plan`, { plan, durationDays });
  },

  resetUserPassword: async (userId: string): Promise<{ message: string; temporaryPassword?: string }> => {
    const response = await apiClient.post<{ message: string; temporaryPassword?: string }>(`/admin/users/${userId}/reset-password`);
    return response.data;
  },

  getUserGrowth: async (): Promise<DailyCountDto[]> => {
    const response = await apiClient.get<DailyCountDto[]>('/admin/user-growth');
    return response.data;
  },

  getTopUsers: async (limit = 5): Promise<TopUserDto[]> => {
    const response = await apiClient.get<TopUserDto[]>('/admin/top-users', { params: { limit } });
    return response.data;
  },

  getSubscriptionStats: async (): Promise<SubscriptionStatsDto> => {
    const response = await apiClient.get<SubscriptionStatsDto>('/admin/subscription-stats');
    return response.data;
  },

  getHealth: async (): Promise<HealthResponseDto> => {
    const response = await apiClient.get<HealthResponseDto>('/admin/health');
    return response.data;
  },

  getFeatureFlags: async (): Promise<Record<string, boolean>> => {
    const response = await apiClient.get<Record<string, boolean>>('/admin/feature-flags');
    return response.data;
  },

  setFeatureFlag: async (key: string, enabled: boolean): Promise<void> => {
    await apiClient.put(`/admin/feature-flags/${key}`, { enabled });
  },

  getScheduledTasks: async (): Promise<ScheduledTaskDto[]> => {
    const response = await apiClient.get<ScheduledTaskDto[]>('/admin/scheduled-tasks');
    return response.data;
  },

  getDashboardStats: async (): Promise<DashboardStatsDto> => {
    const response = await apiClient.get<DashboardStatsDto>('/admin/dashboard-stats');
    return response.data;
  },

  getAuditEventTypes: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/admin/audit-event-types');
    return response.data;
  },

  getBrokerConnections: async (page = 0, size = 20, status?: string, brokerCode?: string): Promise<PageResponse<AdminBrokerConnectionDto>> => {
    const response = await apiClient.get<PageResponse<AdminBrokerConnectionDto>>('/admin/broker-connections', {
      params: { page, size, ...(status ? { status } : {}), ...(brokerCode ? { brokerCode } : {}) },
    });
    return response.data;
  },

  forceDisconnectConnection: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/broker-connections/${id}/force-disconnect`);
  },

  getUserFeatureOverrides: async (userId: string): Promise<UserFeatureOverrideDto[]> => {
    const response = await apiClient.get<UserFeatureOverrideDto[]>(`/admin/users/${userId}/feature-overrides`);
    return response.data;
  },

  setUserFeatureOverride: async (userId: string, featureKey: string, enabled: boolean): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/feature-overrides/${featureKey}`, { enabled });
  },

  removeUserFeatureOverride: async (userId: string, featureKey: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}/feature-overrides/${featureKey}`);
  },
};
