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
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
};
