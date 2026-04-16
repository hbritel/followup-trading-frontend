import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { developerApiService } from '@/services/developerApi.service';
import type { CreateApiKeyRequestDto } from '@/types/dto';

const KEYS_KEY = ['developer-api-keys'];

export const useApiKeys = () => {
  return useQuery({
    queryKey: KEYS_KEY,
    queryFn: () => developerApiService.getKeys(),
  });
};

export const useCreateApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateApiKeyRequestDto) => developerApiService.createKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS_KEY });
    },
  });
};

export const useRevokeApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => developerApiService.revokeKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS_KEY });
    },
  });
};
