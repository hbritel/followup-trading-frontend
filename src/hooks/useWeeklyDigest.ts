import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { aiService } from '@/services/ai.service';

const DIGEST_KEY = ['ai', 'digest'];

export const useWeeklyDigest = () => {
  return useQuery({
    queryKey: DIGEST_KEY,
    queryFn: () => aiService.getWeeklyDigest(),
    staleTime: 30 * 60 * 1000, // 30 minutes — digest changes rarely
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
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
    onError: () => {
      toast.error('Failed to generate weekly digest. Please try again.');
    },
  });
};
