import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { psychologyService } from '@/services/psychology.service';
import type { PsychologyEntryRequestDto, PsychologyEntryResponseDto } from '@/types/dto';
import { toast } from 'sonner';

const emotionKey = (tradeId: string) => ['trades', tradeId, 'psychology'];

export const useEmotionLog = (tradeId: string | undefined) => {
  return useQuery<PsychologyEntryResponseDto | null>({
    queryKey: emotionKey(tradeId ?? ''),
    queryFn: async () => {
      if (!tradeId) return null;
      try {
        const res = await psychologyService.getByTradeId(tradeId);
        return res.data;
      } catch (err: unknown) {
        if ((err as { response?: { status?: number } })?.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!tradeId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useLogEmotion = (tradeId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PsychologyEntryRequestDto) => {
      if (!tradeId) throw new Error('No trade ID');
      const res = await psychologyService.logEmotion(tradeId, data);
      return res.data;
    },
    onSuccess: (data) => {
      if (tradeId) {
        queryClient.setQueryData<PsychologyEntryResponseDto | null>(
          emotionKey(tradeId),
          data
        );
      }
      toast.success('Psychology entry saved.');
    },
    onError: () => {
      toast.error('Failed to save psychology entry.');
    },
  });
};
