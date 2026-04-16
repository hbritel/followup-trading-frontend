import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propFirmAdminService } from '@/services/propFirmAdmin.service';
import type { AddTraderRequestDto } from '@/types/dto';

const QUERY_KEYS = {
  dashboard: ['propfirm-admin', 'dashboard'] as const,
  traders: ['propfirm-admin', 'traders'] as const,
};

export const usePropFirmDashboard = () =>
  useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: () => propFirmAdminService.getDashboard(),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const usePropFirmTraders = () =>
  useQuery({
    queryKey: QUERY_KEYS.traders,
    queryFn: () => propFirmAdminService.getTraders(),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useAddTrader = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddTraderRequestDto) => propFirmAdminService.addTrader(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.traders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
    },
  });
};

export const useRemoveTrader = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => propFirmAdminService.removeTrader(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.traders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
    },
  });
};
