import apiClient from './apiClient';
import { mapApiResponseToTrade, type TradeApiResponse } from './trade.service';
import type { Trade } from '@/components/trades/TradesTableWrapper';
import type { TradePlanRequestDto, TradePlanScoreResponseDto } from '@/types/dto';

export interface ExecutePlannedTradeOverrides {
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export const tradePlanService = {
  score: (data: TradePlanRequestDto) =>
    apiClient.post<TradePlanScoreResponseDto>('/ai/trade-plan/score', data),

  createPlannedTrade: async (data: TradePlanRequestDto): Promise<Trade> => {
    const response = await apiClient.post<TradeApiResponse>('/ai/trade-plan/create', data);
    return mapApiResponseToTrade(response.data);
  },

  executePlannedTrade: async (tradeId: string, overrides?: ExecutePlannedTradeOverrides): Promise<Trade> => {
    const response = await apiClient.put<TradeApiResponse>(
      `/ai/trade-plan/${tradeId}/execute`,
      overrides ?? {},
    );
    return mapApiResponseToTrade(response.data);
  },

  cancelPlannedTrade: async (tradeId: string): Promise<void> => {
    await apiClient.put(`/ai/trade-plan/${tradeId}/cancel-plan`);
  },
};
