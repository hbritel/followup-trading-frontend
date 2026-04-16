import apiClient from './apiClient';
import type { OptionSpreadDto } from '@/types/dto';

export const optionSpreadService = {
  detectSpreads: async (): Promise<OptionSpreadDto[]> => {
    const response = await apiClient.post<OptionSpreadDto[]>('/options/detect');
    return response.data;
  },

  getSpreads: async (status?: string): Promise<OptionSpreadDto[]> => {
    const response = await apiClient.get<OptionSpreadDto[]>('/options/spreads', {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  getSpreadDetail: async (id: string): Promise<OptionSpreadDto> => {
    const response = await apiClient.get<OptionSpreadDto>(`/options/spreads/${id}`);
    return response.data;
  },
};
