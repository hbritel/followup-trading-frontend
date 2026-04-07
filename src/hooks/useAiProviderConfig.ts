import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiSettingsService } from '@/services/ai-settings.service';
import type {
  UserAiConfigRequestDto,
  UserAiConfigResponseDto,
  AiProviderTestResultDto,
} from '@/types/dto';
import { toast } from 'sonner';

const CONFIG_KEY = ['settings', 'ai-provider'];

export const useAiProviderConfig = () => {
  return useQuery<UserAiConfigResponseDto | null>({
    queryKey: CONFIG_KEY,
    queryFn: async () => {
      try {
        const res = await aiSettingsService.getConfig();
        return res.data;
      } catch (err: unknown) {
        if ((err as { response?: { status?: number } })?.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useSaveAiConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UserAiConfigRequestDto) => {
      const res = await aiSettingsService.saveConfig(data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<UserAiConfigResponseDto | null>(CONFIG_KEY, data);
      toast.success('AI provider configuration saved.');
    },
    onError: () => {
      toast.error('Failed to save AI provider configuration.');
    },
  });
};

export const useDeleteAiConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await aiSettingsService.deleteConfig();
    },
    onSuccess: () => {
      queryClient.setQueryData<UserAiConfigResponseDto | null>(CONFIG_KEY, null);
      toast.success('AI provider configuration removed.');
    },
    onError: () => {
      toast.error('Failed to remove AI provider configuration.');
    },
  });
};

export const useTestAiConfig = () => {
  return useMutation<AiProviderTestResultDto, Error, UserAiConfigRequestDto>({
    mutationFn: async (data: UserAiConfigRequestDto) => {
      const res = await aiSettingsService.testConnection(data);
      return res.data;
    },
  });
};
