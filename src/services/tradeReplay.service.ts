import apiClient from './apiClient';
import type { TradeReplayResponseDto } from '@/types/dto';

export const tradeReplayService = {
  getReplay: async (tradeId: string): Promise<TradeReplayResponseDto> => {
    const response = await apiClient.get<TradeReplayResponseDto>(`/trades/${tradeId}/replay`);
    return response.data;
  },
};
