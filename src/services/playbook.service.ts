import apiClient from './apiClient';
import type { PlaybookSuggestionDto } from '@/types/dto';

export const playbookService = {
  getSuggestions: async (status?: string): Promise<PlaybookSuggestionDto[]> => {
    const response = await apiClient.get<PlaybookSuggestionDto[]>('/ai/playbook/suggestions', {
      params: { status },
    });
    return response.data;
  },

  generate: async (accountIds?: string[]): Promise<PlaybookSuggestionDto[]> => {
    const body = accountIds && accountIds.length > 0 ? { accountIds } : undefined;
    const response = await apiClient.post<PlaybookSuggestionDto[]>('/ai/playbook/generate', body);
    return response.data;
  },

  apply: async (id: string): Promise<void> => {
    await apiClient.post(`/ai/playbook/suggestions/${id}/apply`);
  },

  dismiss: async (id: string): Promise<void> => {
    await apiClient.post(`/ai/playbook/suggestions/${id}/dismiss`);
  },

  unapply: async (id: string): Promise<void> => {
    await apiClient.post(`/ai/playbook/suggestions/${id}/unapply`);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/ai/playbook/suggestions/${id}`);
  },
};
