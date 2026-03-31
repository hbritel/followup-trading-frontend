import { useQuery } from '@tanstack/react-query';
import { marketDataService } from '@/services/marketdata.service';

export const useMarketHistory = (
  symbol: string | null,
  interval: string,
  from: string | null,
  to: string | null
) => {
  const query = useQuery({
    queryKey: ['market-candles', symbol, interval, from, to],
    queryFn: () => marketDataService.getHistory(symbol!, interval, from!, to!),
    enabled: !!symbol && !!from && !!to,
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: {
      candles: query.data?.candles ?? [],
    },
    isLoading: query.isLoading || query.isFetching,
  };
};
