import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tradeService, CreateTradeRequest } from '@/services/trade.service';

/**
 * Mutation hook for creating a new trade via POST /api/v1/trades.
 * On success, invalidates both 'trades' and 'analytics' query caches
 * so the UI reflects the newly created trade immediately.
 */
export const useCreateTrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTradeRequest) => tradeService.createTrade(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};
