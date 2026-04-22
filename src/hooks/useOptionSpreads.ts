import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { optionSpreadService } from '@/services/optionSpread.service';
import type { CreateSpreadRequestDto } from '@/types/dto';

const SPREADS_KEY = ['option-spreads'];
const ANALYTICS_KEY = ['option-spreads', 'analytics'];

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
      queryClient.invalidateQueries({ queryKey: ANALYTICS_KEY });
    },
  });
};

export const useCreateSpread = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSpreadRequestDto) =>
      optionSpreadService.createSpread(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SPREADS_KEY });
      queryClient.invalidateQueries({ queryKey: ANALYTICS_KEY });
    },
  });
};

export const useOptionSpreadAnalytics = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ANALYTICS_KEY,
    queryFn: () => optionSpreadService.getAnalytics(),
    enabled,
    staleTime: 15 * 60 * 1000,
  });
};

const PORTFOLIO_GREEKS_KEY = ['option-spreads', 'portfolio-greeks'];

export const usePortfolioGreeks = (enabled: boolean = true) => {
  return useQuery({
    queryKey: PORTFOLIO_GREEKS_KEY,
    queryFn: () => optionSpreadService.getPortfolioGreeks(),
    enabled,
    staleTime: 60 * 1000,
  });
};
