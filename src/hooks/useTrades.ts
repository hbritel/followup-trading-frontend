import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { tradeService, TradeListParams } from '@/services/trade.service';

/**
 * Global hook to fetch and cache paginated trades.
 * Sends all filter parameters to the backend for server-side filtering.
 * Pass `enabled: false` or `undefined` params to skip the query.
 */
export const useTrades = (params?: TradeListParams, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['trades', params],
    queryFn: () => tradeService.getTrades(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
};
