import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { tradePlanService } from '@/services/tradePlan.service';
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
