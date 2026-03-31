import apiClient from './apiClient';
import type { StrategyResponseDto, StrategyRequestDto, StrategyStatsDto } from '@/types/dto';

export const strategyService = {
  getStrategies: async (): Promise<StrategyResponseDto[]> => {
    const response = await apiClient.get<StrategyResponseDto[]>('/strategies');
    return response.data;
  },

  getStrategyStats: async (): Promise<StrategyStatsDto[]> => {
    const response = await apiClient.get<StrategyStatsDto[]>('/strategies/with-stats');
    return response.data;
  },

  createStrategy: async (data: StrategyRequestDto): Promise<StrategyResponseDto> => {
    const response = await apiClient.post<StrategyResponseDto>('/strategies', data);
    return response.data;
  },

  updateStrategy: async (id: string, data: StrategyRequestDto): Promise<StrategyResponseDto> => {
    const response = await apiClient.put<StrategyResponseDto>(`/strategies/${id}`, data);
    return response.data;
  },

  deleteStrategy: async (id: string): Promise<void> => {
    await apiClient.delete(`/strategies/${id}`);
  },
};
