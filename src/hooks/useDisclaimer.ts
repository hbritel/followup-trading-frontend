import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coachService } from '@/services/coach.service';
import type { DisclaimerStatusDto } from '@/types/dto';

const DISCLAIMER_KEY = ['ai', 'disclaimer'];

export const useDisclaimer = () => {
  return useQuery<DisclaimerStatusDto>({
    queryKey: DISCLAIMER_KEY,
    queryFn: async () => {
      const res = await coachService.getDisclaimerStatus();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};

export const useAcceptDisclaimer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await coachService.acceptDisclaimer();
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<DisclaimerStatusDto>(DISCLAIMER_KEY, data);
    },
  });
};
