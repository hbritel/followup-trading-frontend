import { useQuery } from '@tanstack/react-query';
import { tradeReplayService } from '@/services/tradeReplay.service';

const TRADE_REPLAY_KEY = ['tradeReplay'];

export const useTradeReplay = (tradeId: string | null) => {
  return useQuery({
    queryKey: [...TRADE_REPLAY_KEY, tradeId],
    queryFn: () => tradeReplayService.getReplay(tradeId!),
    enabled: !!tradeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
