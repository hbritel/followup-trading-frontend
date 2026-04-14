import apiClient from './apiClient';
import type { PlaybookSuggestionDto } from '@/types/dto';

export const playbookService = {
  getSuggestions: async (status?: string): Promise<PlaybookSuggestionDto[]> => {
    const response = await apiClient.get<PlaybookSuggestionDto[]>('/ai/playbook/suggestions', {
      params: { status },
    });
    return response.data;
  },

  generate: async (): Promise<PlaybookSuggestionDto[]> => {
    const response = await apiClient.post<PlaybookSuggestionDto[]>('/ai/playbook/generate');
    return response.data;
  },

  apply: async (id: string): Promise<void> => {
    await apiClient.post(`/ai/playbook/suggestions/${id}/apply`);
  },

  dismiss: async (id: string): Promise<void> => {
    await apiClient.post(`/ai/playbook/suggestions/${id}/dismiss`);
  },
};
