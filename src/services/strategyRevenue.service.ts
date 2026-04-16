import apiClient from './apiClient';
import type { StrategyPurchaseDto, EarningsDto } from '@/types/dto';

export const strategyRevenueService = {
  purchaseStrategy: async (sharedStrategyId: string): Promise<StrategyPurchaseDto> => {
    const response = await apiClient.post<StrategyPurchaseDto>(
      `/marketplace/revenue/purchase/${sharedStrategyId}`,
    );
    return response.data;
  },

  getMyPurchases: async (): Promise<StrategyPurchaseDto[]> => {
    const response = await apiClient.get<StrategyPurchaseDto[]>(
      '/marketplace/revenue/purchases',
    );
    return response.data;
  },

  getMySales: async (): Promise<StrategyPurchaseDto[]> => {
    const response = await apiClient.get<StrategyPurchaseDto[]>(
      '/marketplace/revenue/sales',
    );
    return response.data;
  },

  getEarnings: async (): Promise<EarningsDto> => {
    const response = await apiClient.get<EarningsDto>('/marketplace/revenue/earnings');
    return response.data;
  },
};
