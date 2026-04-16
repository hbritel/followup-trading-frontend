import apiClient from './apiClient';
import type {
  DeveloperApiKeyDto,
  ApiKeyCreatedDto,
  CreateApiKeyRequestDto,
} from '@/types/dto';

export const developerApiService = {
  getKeys: async (): Promise<DeveloperApiKeyDto[]> => {
    const response = await apiClient.get<DeveloperApiKeyDto[]>('/developer/keys');
    return response.data;
  },

  createKey: async (data: CreateApiKeyRequestDto): Promise<ApiKeyCreatedDto> => {
    const response = await apiClient.post<ApiKeyCreatedDto>('/developer/keys', data);
    return response.data;
  },

  revokeKey: async (id: string): Promise<void> => {
    await apiClient.delete(`/developer/keys/${id}`);
  },
};
