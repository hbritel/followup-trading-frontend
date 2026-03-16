import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { backtestService } from '@/services/backtest.service';
import type { BacktestRequestDto } from '@/types/dto';

const BACKTESTS_KEY = ['backtests'];

export const useBacktests = () => {
  return useQuery({
    queryKey: BACKTESTS_KEY,
    queryFn: () => backtestService.getBacktests(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
  });
};

export const useBacktest = (id: string) => {
  return useQuery({
    queryKey: [...BACKTESTS_KEY, id],
    queryFn: () => backtestService.getBacktest(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useRunBacktest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BacktestRequestDto) => backtestService.runBacktest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BACKTESTS_KEY });
    },
  });
};

export const useDeleteBacktest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => backtestService.deleteBacktest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BACKTESTS_KEY });
    },
  });
};
