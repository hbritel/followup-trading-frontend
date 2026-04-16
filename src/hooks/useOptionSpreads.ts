import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { optionSpreadService } from '@/services/optionSpread.service';

const SPREADS_KEY = ['option-spreads'];

export const useOptionSpreads = (status?: string) => {
  return useQuery({
    queryKey: [...SPREADS_KEY, status],
    queryFn: () => optionSpreadService.getSpreads(status),
  });
};

export const useSpreadDetail = (id: string) => {
  return useQuery({
    queryKey: [...SPREADS_KEY, id],
    queryFn: () => optionSpreadService.getSpreadDetail(id),
    enabled: !!id,
  });
};

export const useDetectSpreads = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => optionSpreadService.detectSpreads(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SPREADS_KEY });
    },
  });
};
