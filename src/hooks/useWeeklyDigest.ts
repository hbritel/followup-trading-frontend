import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { aiService, type AiDigestResponse } from '@/services/ai.service';
import { AxiosError } from 'axios';

const DIGEST_KEY = ['ai', 'digest'];

/**
 * Fetches the latest weekly digest. Does NOT auto-fetch on mount to avoid
 * triggering expensive AI generation on every page load (the backend GET
 * endpoint always regenerates). Data is populated only via generateWeeklyDigest
 * or from cache.
 */
export const useWeeklyDigest = () => {
  return useQuery<AiDigestResponse | null>({
    queryKey: DIGEST_KEY,
    queryFn: () => null,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    enabled: false,
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
