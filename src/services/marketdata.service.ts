import apiClient from './apiClient';
import type { MarketHistoryResponseDto } from '@/types/dto';

export const marketDataService = {
  getHistory: async (
    symbol: string,
    interval: string,
    from: string,
    to: string,
    indicators?: string[]
  ): Promise<MarketHistoryResponseDto> => {
    const response = await apiClient.get<MarketHistoryResponseDto>('/market-data/history', {
      params: {
        symbol,
        interval,
        from,
        to,
        indicators: indicators?.length ? indicators.join(',') : undefined,
      },
    });
    return response.data;
  },
};
