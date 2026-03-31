import apiClient from './apiClient';
import type { BacktestResponseDto, BacktestRequestDto, BacktestUpdateRequestDto, BacktestSaveStateRequestDto } from '@/types/dto';

export const backtestService = {
  getBacktests: async (): Promise<BacktestResponseDto[]> => {
    const response = await apiClient.get<BacktestResponseDto[]>('/backtests');
    return response.data;
  },

  getBacktest: async (id: string): Promise<BacktestResponseDto> => {
    const response = await apiClient.get<BacktestResponseDto>(`/backtests/${id}`);
    return response.data;
  },

  runBacktest: async (data: BacktestRequestDto): Promise<BacktestResponseDto> => {
    const response = await apiClient.post<BacktestResponseDto>('/backtests', data);
    return response.data;
  },

  updateBacktest: async (id: string, data: BacktestUpdateRequestDto): Promise<BacktestResponseDto> => {
    const response = await apiClient.put<BacktestResponseDto>(`/backtests/${id}`, data);
    return response.data;
  },

  saveState: async (id: string, data: BacktestSaveStateRequestDto): Promise<BacktestResponseDto> => {
    const response = await apiClient.put<BacktestResponseDto>(`/backtests/${id}/state`, data);
    return response.data;
  },

  deleteBacktest: async (id: string): Promise<void> => {
    await apiClient.delete(`/backtests/${id}`);
  },
};
