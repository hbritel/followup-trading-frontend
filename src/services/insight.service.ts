import apiClient from './apiClient';
import type { InsightResponseDto } from '@/types/dto';

export const insightService = {
  getInsights: async (): Promise<InsightResponseDto[]> => {
    const response = await apiClient.get<InsightResponseDto[]>('/insights');
    return response.data;
  },

  getActiveInsights: async (): Promise<InsightResponseDto[]> => {
    const response = await apiClient.get<InsightResponseDto[]>('/insights/active');
    return response.data;
  },

  dismissInsight: async (id: string): Promise<void> => {
    await apiClient.put(`/insights/${id}/dismiss`);
  },
};
