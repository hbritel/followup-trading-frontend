import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { aiService, type AiDigestResponse } from '@/services/ai.service';
import { AxiosError } from 'axios';

const DIGEST_KEY = ['ai', 'digest', 'latest'];
const DIGEST_HISTORY_KEY = ['ai', 'digest', 'history'];

/**
 * Fetches the latest saved digest from the server.
 * Auto-fetches on mount — returns null if no digest exists yet.
 */
export const useWeeklyDigest = () => {
  return useQuery<AiDigestResponse | null>({
    queryKey: DIGEST_KEY,
    queryFn: () => aiService.getLatestDigest(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
};

/**
 * Fetches paginated digest history.
 */
export const useDigestHistory = (page = 0, size = 10) => {
  return useQuery<AiDigestResponse[]>({
    queryKey: [...DIGEST_HISTORY_KEY, page, size],
    queryFn: () => aiService.getDigestHistory(page, size),
    staleTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
};

/**
 * Generates a new weekly digest (with optional account filter).
 * On success, updates the latest digest cache and invalidates history.
 */
export const useGenerateWeeklyDigest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId?: string) => aiService.generateWeeklyDigest(accountId),
    onSuccess: (data) => {
      queryClient.setQueryData<AiDigestResponse | null>(DIGEST_KEY, data);
      queryClient.invalidateQueries({ queryKey: DIGEST_HISTORY_KEY });
      // Also invalidate insights since digest is stored as AI_DIGEST insight
      queryClient.invalidateQueries({ queryKey: ['insights'] });
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
