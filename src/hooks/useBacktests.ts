import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { backtestService } from '@/services/backtest.service';
import type { BacktestRequestDto, BacktestUpdateRequestDto, BacktestSaveStateRequestDto } from '@/types/dto';

const BACKTESTS_KEY = ['backtests'];

export const useBacktests = () => {
  return useQuery({
    queryKey: BACKTESTS_KEY,
    queryFn: () => backtestService.getBacktests(),
    placeholderData: keepPreviousData,
  });
};

export const useBacktest = (id: string) => {
  return useQuery({
    queryKey: [...BACKTESTS_KEY, id],
    queryFn: () => backtestService.getBacktest(id),
    enabled: !!id,
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

export const useUpdateBacktest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BacktestUpdateRequestDto }) =>
      backtestService.updateBacktest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BACKTESTS_KEY });
    },
  });
};

export const useSaveBacktestState = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BacktestSaveStateRequestDto }) =>
      backtestService.saveState(id, data),
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
