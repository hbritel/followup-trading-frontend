import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coachService } from '@/services/coach.service';
import type { BriefingResponseDto } from '@/types/dto';
import { toast } from 'sonner';

const briefingKey = (accountId?: string) => ['ai', 'briefing', 'today', accountId ?? 'all'];

export const useBriefing = (accountId?: string) => {
  return useQuery<BriefingResponseDto | null>({
    queryKey: briefingKey(accountId),
    queryFn: async () => {
      try {
        const res = await coachService.getTodayBriefing(accountId);
        return res.data;
      } catch (err: unknown) {
        // 404 means no briefing for today — return null
        if ((err as { response?: { status?: number } })?.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useGenerateBriefing = (accountId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await coachService.generateBriefing(accountId);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<BriefingResponseDto | null>(briefingKey(accountId), data);
    },
    onError: () => {
      toast.error('Failed to generate briefing. Please try again.');
    },
  });
};
