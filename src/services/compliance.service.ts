import apiClient from './apiClient';
import type { RuleComplianceRequest, RuleComplianceResponse, StrategyComplianceStatsDto } from '@/types/dto';

export const complianceService = {
  getTradeCompliance: async (tradeId: string): Promise<RuleComplianceResponse[]> => {
    const response = await apiClient.get<RuleComplianceResponse[]>(`/trades/${tradeId}/compliance`);
    return response.data;
  },

  updateTradeCompliance: async (tradeId: string, entries: RuleComplianceRequest[]): Promise<RuleComplianceResponse[]> => {
    const response = await apiClient.put<RuleComplianceResponse[]>(`/trades/${tradeId}/compliance`, entries);
    return response.data;
  },

  getComplianceStats: async (strategyId: string): Promise<StrategyComplianceStatsDto> => {
    const response = await apiClient.get<StrategyComplianceStatsDto>(`/strategies/${strategyId}/compliance-stats`);
    return response.data;
  },
};
