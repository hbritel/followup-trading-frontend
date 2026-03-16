import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { strategyService } from '@/services/strategy.service';
import type { StrategyRequestDto } from '@/types/dto';

const STRATEGIES_KEY = ['strategies'];

export const useStrategies = () => {
  return useQuery({
    queryKey: STRATEGIES_KEY,
    queryFn: () => strategyService.getStrategies(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
  });
};

export const useCreateStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StrategyRequestDto) => strategyService.createStrategy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STRATEGIES_KEY });
    },
  });
};

export const useUpdateStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StrategyRequestDto }) =>
      strategyService.updateStrategy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STRATEGIES_KEY });
    },
  });
};

export const useDeleteStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => strategyService.deleteStrategy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STRATEGIES_KEY });
    },
  });
};
