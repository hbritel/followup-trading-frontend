import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coachService } from '@/services/coach.service';
import type { BriefingResponseDto } from '@/types/dto';
import { toast } from 'sonner';

const BRIEFING_KEY = ['ai', 'briefing', 'today'];

export const useBriefing = () => {
  return useQuery<BriefingResponseDto | null>({
    queryKey: BRIEFING_KEY,
    queryFn: async () => {
      try {
        const res = await coachService.getTodayBriefing();
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

export const useGenerateBriefing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await coachService.generateBriefing();
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<BriefingResponseDto | null>(BRIEFING_KEY, data);
    },
    onError: () => {
      toast.error('Failed to generate briefing. Please try again.');
    },
  });
};
