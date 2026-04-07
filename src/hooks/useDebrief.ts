import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coachService } from '@/services/coach.service';
import type { SessionDebriefResponseDto } from '@/types/dto';
import { toast } from 'sonner';

const DEBRIEF_KEY = ['ai', 'debrief', 'latest'];

export const useDebrief = () => {
  return useQuery<SessionDebriefResponseDto | null>({
    queryKey: DEBRIEF_KEY,
    queryFn: async () => {
      try {
        const res = await coachService.getLatestDebrief();
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

export const useGenerateDebrief = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await coachService.generateDebrief();
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<SessionDebriefResponseDto | null>(DEBRIEF_KEY, data);
    },
    onError: () => {
      toast.error('Failed to generate session debrief. Please try again.');
    },
  });
};
