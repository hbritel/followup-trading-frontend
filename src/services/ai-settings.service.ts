import apiClient from './apiClient';
import type {
  UserAiConfigRequestDto,
  UserAiConfigResponseDto,
  AiProviderTestResultDto,
} from '@/types/dto';

export const aiSettingsService = {
  getConfig: () =>
    apiClient.get<UserAiConfigResponseDto>('/settings/ai-provider'),
  saveConfig: (data: UserAiConfigRequestDto) =>
    apiClient.put<UserAiConfigResponseDto>('/settings/ai-provider', data),
  deleteConfig: () =>
    apiClient.delete('/settings/ai-provider'),
  testConnection: (data: UserAiConfigRequestDto) =>
    apiClient.post<AiProviderTestResultDto>('/settings/ai-provider/test', data),
  toggleActive: (active: boolean) =>
    apiClient.patch<UserAiConfigResponseDto>(`/settings/ai-provider/toggle?active=${active}`),
  getActiveProvider: () =>
    apiClient.get<{
      displayName: string;
      usingByok: boolean;
      fallbackUsed: boolean;
      fallbackReason?: string;
      platformProviderInfo: string;
    }>('/settings/ai-provider/active'),
};
