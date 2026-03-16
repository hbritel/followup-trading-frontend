import apiClient from './apiClient';
import type { AlertResponseDto, AlertRequestDto } from '@/types/dto';

export const alertService = {
  getAlerts: async (): Promise<AlertResponseDto[]> => {
    const response = await apiClient.get<AlertResponseDto[]>('/alerts');
    return response.data;
  },

  getAlert: async (id: string): Promise<AlertResponseDto> => {
    const response = await apiClient.get<AlertResponseDto>(`/alerts/${id}`);
    return response.data;
  },

  createAlert: async (data: AlertRequestDto): Promise<AlertResponseDto> => {
    const response = await apiClient.post<AlertResponseDto>('/alerts', data);
    return response.data;
  },

  updateAlert: async (id: string, data: AlertRequestDto): Promise<AlertResponseDto> => {
    const response = await apiClient.put<AlertResponseDto>(`/alerts/${id}`, data);
    return response.data;
  },

  deleteAlert: async (id: string): Promise<void> => {
    await apiClient.delete(`/alerts/${id}`);
  },
};
