import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { tradePlanService, type ExecutePlannedTradeOverrides } from '@/services/tradePlan.service';
import type { Trade } from '@/components/trades/TradesTableWrapper';
import type { TradePlanRequestDto, TradePlanScoreResponseDto } from '@/types/dto';

export const useTradePlanScore = () => {
  return useMutation<TradePlanScoreResponseDto, AxiosError, TradePlanRequestDto>({
    mutationFn: async (data: TradePlanRequestDto) => {
      const res = await tradePlanService.score(data);
      return res.data;
    },
    onError: (error: AxiosError) => {
      if (error.response?.status === 429) {
        toast.error('Daily limit reached. Upgrade your plan for more trade plan scores.');
      } else {
        toast.error('Failed to score trade plan. Please try again.');
      }
    },
  });
};

export const useCreatePlannedTrade = () => {
  const queryClient = useQueryClient();
  return useMutation<Trade, AxiosError, TradePlanRequestDto>({
    mutationFn: (data) => tradePlanService.createPlannedTrade(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
    onError: (error: AxiosError) => {
      if (error.response?.status === 429) {
        toast.error('Daily limit reached. Upgrade your plan for more planned trades.');
      } else {
        toast.error('Failed to create planned trade. Please try again.');
      }
    },
  });
};

export const useExecutePlannedTrade = () => {
  const queryClient = useQueryClient();
  return useMutation<Trade, AxiosError, { tradeId: string; overrides?: ExecutePlannedTradeOverrides }>({
    mutationFn: ({ tradeId, overrides }) => tradePlanService.executePlannedTrade(tradeId, overrides),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast.success('Trade executed successfully.');
    },
    onError: () => {
      toast.error('Failed to execute trade. Please try again.');
    },
  });
};

export const useCancelPlannedTrade = () => {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, string>({
    mutationFn: (tradeId) => tradePlanService.cancelPlannedTrade(tradeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast.success('Trade plan cancelled.');
    },
    onError: () => {
      toast.error('Failed to cancel trade plan. Please try again.');
    },
  });
};
