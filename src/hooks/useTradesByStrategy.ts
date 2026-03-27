import { useQuery } from '@tanstack/react-query';
import { tradeService } from '@/services/trade.service';

export const useTradesByStrategy = (strategyId: string | undefined) => {
  return useQuery({
    queryKey: ['trades', 'by-strategy', strategyId],
    queryFn: () => tradeService.getTradesByStrategy(strategyId!),
    enabled: !!strategyId,
  });
};
