import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coachService } from '@/services/coach.service';
import type { SessionDebriefResponseDto } from '@/types/dto';
import { toast } from 'sonner';

const debriefKey = (accountId?: string) => ['ai', 'debrief', 'latest', accountId ?? 'all'];

export const useDebrief = (accountId?: string) => {
  return useQuery<SessionDebriefResponseDto | null>({
    queryKey: debriefKey(accountId),
    queryFn: async () => {
      try {
        const res = await coachService.getLatestDebrief(accountId);
        return res.data;
      } catch (err: unknown) {
        if ((err as { response?: { status?: number } })?.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useGenerateDebrief = (accountId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await coachService.generateDebrief(accountId);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<SessionDebriefResponseDto | null>(debriefKey(accountId), data);
    },
    onError: () => {
      toast.error('Failed to generate session debrief. Please try again.');
    },
  });
};
