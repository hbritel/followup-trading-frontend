import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { insightService } from '@/services/insight.service';

const INSIGHTS_KEY = ['insights'];

export const useInsights = () => {
  return useQuery({
    queryKey: INSIGHTS_KEY,
    queryFn: () => insightService.getInsights(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
  });
};

export const useActiveInsights = () => {
  return useQuery({
    queryKey: [...INSIGHTS_KEY, 'active'],
    queryFn: () => insightService.getActiveInsights(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
  });
};

export const useDismissInsight = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => insightService.dismissInsight(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSIGHTS_KEY });
    },
  });
};
