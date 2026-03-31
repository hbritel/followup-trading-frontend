import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { aiService } from '@/services/ai.service';
import { AxiosError } from 'axios';

const DIGEST_KEY = ['ai', 'digest'];

export const useWeeklyDigest = () => {
  return useQuery({
    queryKey: DIGEST_KEY,
    queryFn: () => aiService.getWeeklyDigest(),
    staleTime: 30 * 60 * 1000, // 30 minutes — digest changes rarely
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false, // don't retry — 404 means AI is disabled on the server
    enabled: false, // don't auto-fetch — AI is gated behind app.ai.enabled; trigger manually via generate
  });
};

export const useGenerateWeeklyDigest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => aiService.generateWeeklyDigest(),
    onSuccess: (data) => {
      queryClient.setQueryData(DIGEST_KEY, data);
      toast.success('Weekly digest generated successfully.');
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        toast.error('AI features are not enabled on the server.');
      } else {
        toast.error('Failed to generate weekly digest. Please try again.');
      }
    },
  });
};
