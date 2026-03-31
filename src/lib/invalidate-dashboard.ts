import type { QueryClient } from '@tanstack/react-query';

/**
 * Invalidates all dashboard and metrics query caches.
 * Call after any operation that changes trade data (sync, disconnect, import).
 */
export function invalidateDashboardData(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  queryClient.invalidateQueries({ queryKey: ['advanced-risk-metrics'] });
  queryClient.invalidateQueries({ queryKey: ['trade-performance'] });
  queryClient.invalidateQueries({ queryKey: ['risk-distribution'] });
  queryClient.invalidateQueries({ queryKey: ['analytics'] });
}
