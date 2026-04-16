import { useCallback, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { aiService, type AiDigestResponse, type GenerateDigestParams } from '@/services/ai.service';
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
 * Starts async digest generation and polls until complete.
 * Returns mutation state + isPolling flag for UI feedback.
 */
export const useGenerateWeeklyDigest = () => {
  const queryClient = useQueryClient();
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const mutation = useMutation({
    mutationFn: async (params?: GenerateDigestParams): Promise<AiDigestResponse> => {
      // 1. Start the async job
      const job = await aiService.startDigestGeneration(params);
      const jobId = job.jobId;

      setIsPolling(true);

      // 2. Poll until completed or failed (max 2 minutes)
      return new Promise<AiDigestResponse>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 60; // 60 * 2s = 2 minutes

        pollingRef.current = setInterval(async () => {
          attempts++;

          try {
            const status = await aiService.getDigestJobStatus(jobId);

            if (status.status === 'COMPLETED' && status.result) {
              stopPolling();
              resolve(status.result);
            } else if (status.status === 'FAILED') {
              stopPolling();
              reject(new Error(status.error ?? 'Digest generation failed'));
            } else if (attempts >= maxAttempts) {
              stopPolling();
              reject(new Error('Digest generation timed out'));
            }
          } catch (err) {
            stopPolling();
            reject(err);
          }
        }, 2000);
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData<AiDigestResponse | null>(DIGEST_KEY, data);
      queryClient.invalidateQueries({ queryKey: DIGEST_HISTORY_KEY });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      toast.success('Weekly digest generated successfully.');
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        toast.error('AI features are not enabled on the server.');
      } else {
        toast.error(error.message || 'Failed to generate weekly digest. Please try again.');
      }
    },
  });

  return {
    ...mutation,
    // isPending covers both the initial POST and the polling phase
    isPending: mutation.isPending || isPolling,
    isPolling,
    stopPolling,
  };
};
