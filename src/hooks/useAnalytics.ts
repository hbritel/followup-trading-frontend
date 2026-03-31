import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { tradeService } from '@/services/trade.service';

/**
 * Global hook to fetch and cache user analytics dashboard data.
 * Supports optional date range filtering for time-scoped views.
 */
export const useAnalytics = (accountIds?: string | string[], startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['analytics', accountIds, startDate, endDate],
    queryFn: () => tradeService.getAnalytics(accountIds, startDate, endDate),
    placeholderData: keepPreviousData,
  });
};
