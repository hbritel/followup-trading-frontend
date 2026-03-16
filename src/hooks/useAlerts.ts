import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { alertService } from '@/services/alert.service';
import type { AlertRequestDto } from '@/types/dto';

const ALERTS_KEY = ['alerts'];

export const useAlerts = () => {
  return useQuery({
    queryKey: ALERTS_KEY,
    queryFn: () => alertService.getAlerts(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
  });
};

export const useCreateAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AlertRequestDto) => alertService.createAlert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALERTS_KEY });
    },
  });
};

export const useUpdateAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AlertRequestDto }) =>
      alertService.updateAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALERTS_KEY });
    },
  });
};

export const useDeleteAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertService.deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALERTS_KEY });
    },
  });
};
