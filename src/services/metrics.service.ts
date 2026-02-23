// src/services/metrics.service.ts
import apiClient from './apiClient';

// --- TypeScript types matching backend domain models ---

/** Matches backend AdvancedRiskMetrics (core/domain/model/metrics) */
export interface AdvancedRiskMetrics {
  valueAtRisk: number;
  portfolioDiversityScore: number;
  marginUtilization: number;
  exposurePerSector: Record<string, number>;
  recoveryFactor: number;
  timeInMarket: number;
  profitConsistency: number;
}

/** Matches backend AdvancedTradeMetrics (core/domain/model/metrics) */
export interface AdvancedTradeMetrics {
  riskRewardRatio: number;
  holdingPeriodHours: number;
  pnlPercentage: number;
  returnOnRisk: number;
  payoffRatio: number;
  kellyPercentage: number;
  marketDirectionAlignment: number;
}

/** Matches backend DrawdownMetrics (core/domain/model/metrics) */
export interface DrawdownMetrics {
  maxDrawdownPercent: number;
  maxDrawdownAmount: number;
  maxDrawdownStartDate: string;
  maxDrawdownEndDate: string;
  maxDrawdownDuration: number;
  averageDrawdownPercent: number;
  averageDrawdownDuration: number;
  currentDrawdownPercent: number;
}

/** Matches backend TradePerformanceSummary (core/domain/model/metrics) */
export interface TradePerformanceSummary {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalProfitLoss: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  expectancy: number;
  largestWin: number;
  largestLoss: number;
}

/** Matches backend DashboardSummary (core/domain/model/metrics) */
export interface DashboardSummary {
  performanceSummary: TradePerformanceSummary;
  drawdownMetrics: DrawdownMetrics;
  sharpeRatio: number;
  sortinoRatio: number;
  valueAtRisk: number;
  portfolioDiversityScore: number;
  marginUtilization: number;
  exposurePerSector: Record<string, number>;
  recoveryFactor: number;
  timeInMarket: number;
  profitConsistency: number;
  performanceByAssetType: Record<string, number>;
  performanceByDirection: Record<string, number>;
  currentEquity: number;
  profitLossToday: number;
  profitLossThisWeek: number;
  profitLossThisMonth: number;
  profitLossThisYear: number;
}

// --- API service functions ---

export const metricsService = {
  /**
   * Get advanced risk metrics for the authenticated user.
   * Backend: GET /api/v1/metrics/advanced/risk
   */
  getAdvancedRiskMetrics: async (startDate?: string, endDate?: string): Promise<AdvancedRiskMetrics> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await apiClient.get<AdvancedRiskMetrics>('/metrics/advanced/risk', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return response.data;
  },

  /**
   * Get dashboard summary with all metrics (sharpe, sortino, drawdown, performance, etc.).
   * Backend: GET /api/v1/metrics/dashboard/summary
   */
  getDashboardSummary: async (startDate?: string, endDate?: string): Promise<DashboardSummary> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await apiClient.get<DashboardSummary>('/metrics/dashboard/summary', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return response.data;
  },

  /**
   * Get drawdown metrics for the authenticated user.
   * Backend: GET /api/v1/metrics/risk/drawdown
   */
  getDrawdownMetrics: async (startDate?: string, endDate?: string): Promise<DrawdownMetrics> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await apiClient.get<DrawdownMetrics>('/metrics/risk/drawdown', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return response.data;
  },

  /**
   * Get trade performance summary.
   * Backend: GET /api/v1/metrics/trade/performance
   */
  getTradePerformance: async (startDate?: string, endDate?: string): Promise<TradePerformanceSummary> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await apiClient.get<TradePerformanceSummary>('/metrics/trade/performance', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return response.data;
  },

  /**
   * Get advanced trade metrics for a specific trade.
   * Backend: GET /api/v1/metrics/advanced/trade/{tradeId}
   */
  getAdvancedTradeMetrics: async (tradeId: string): Promise<AdvancedTradeMetrics> => {
    const response = await apiClient.get<AdvancedTradeMetrics>(`/metrics/advanced/trade/${tradeId}`);
    return response.data;
  },
};
