// src/services/metrics.service.ts
import apiClient from './apiClient';
import type {
  DailyPerformanceDto, OpenPositionDto, MonthlyPerformanceDto,
  DayOfWeekPerformanceDto, HourOfDayPerformanceDto,
  SymbolPerformanceDto, HeatmapCellDto, SessionPerformanceDto,
  TradeFrequencyPointDto, RollingMetricPointDto, RollingMetric,
} from '@/types/dto';

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
  recentDailyPerformance?: DailyPerformanceDto[];
  openPositions?: OpenPositionDto[];
  // Account funding metrics
  totalDeposits?: number;
  totalWithdrawals?: number;
  netFunding?: number;
  realizedTradingPnl?: number;
  accountBalance?: number;
  returnOnInvestment?: number;
}

/** Matches backend RiskDistribution (core/domain/model/metrics) */
export interface RiskDistribution {
  profitLossDistribution: Record<string, number>;
  standardDeviation: number;
  downside: number;
  var95: number;
  var99: number;
  cvar95: number;
}

// --- API service functions ---

export const metricsService = {
  /**
   * Get advanced risk metrics for the authenticated user.
   * Backend: GET /api/v1/metrics/advanced/risk
   */
  getAdvancedRiskMetrics: async (startDate?: string, endDate?: string, accountIds?: string | string[]): Promise<AdvancedRiskMetrics> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (accountIds) params.accountIds = Array.isArray(accountIds) ? accountIds.join(',') : accountIds;
    const response = await apiClient.get<AdvancedRiskMetrics>('/metrics/advanced/risk', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return response.data;
  },

  /**
   * Get dashboard summary with all metrics (sharpe, sortino, drawdown, performance, etc.).
   * Backend: GET /api/v1/metrics/dashboard/summary
   */
  getDashboardSummary: async (startDate?: string, endDate?: string, accountIds?: string | string[]): Promise<DashboardSummary> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (accountIds) params.accountIds = Array.isArray(accountIds) ? accountIds.join(',') : accountIds;
    const response = await apiClient.get<DashboardSummary>('/metrics/dashboard/summary', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return response.data;
  },

  /**
   * Get drawdown metrics for the authenticated user.
   * Backend: GET /api/v1/metrics/risk/drawdown
   */
  getDrawdownMetrics: async (startDate?: string, endDate?: string, accountIds?: string | string[]): Promise<DrawdownMetrics> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (accountIds) params.accountIds = Array.isArray(accountIds) ? accountIds.join(',') : accountIds;
    const response = await apiClient.get<DrawdownMetrics>('/metrics/risk/drawdown', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return response.data;
  },

  /**
   * Get trade performance summary.
   * Backend: GET /api/v1/metrics/trade/performance
   */
  getTradePerformance: async (startDate?: string, endDate?: string, accountIds?: string | string[]): Promise<TradePerformanceSummary> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (accountIds) params.accountIds = Array.isArray(accountIds) ? accountIds.join(',') : accountIds;
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

  /**
   * Get risk distribution metrics (VaR95, VaR99, CVaR95, P&L distribution).
   * Backend: GET /api/v1/metrics/risk/distribution
   */
  getRiskDistribution: async (startDate?: string, endDate?: string, accountIds?: string | string[]): Promise<RiskDistribution> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (accountIds) params.accountIds = Array.isArray(accountIds) ? accountIds.join(',') : accountIds;
    const response = await apiClient.get<RiskDistribution>('/metrics/risk/distribution', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return response.data;
  },

  getMonthlyPerformance: async (startDate?: string, endDate?: string, accountIds?: string | string[]): Promise<MonthlyPerformanceDto[]> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (accountIds) params.accountIds = Array.isArray(accountIds) ? accountIds.join(',') : accountIds;
    const response = await apiClient.get<MonthlyPerformanceDto[]>('/metrics/time/monthly', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return response.data;
  },

  getPerformanceByDayOfWeek: async (startDate?: string, endDate?: string, accountIds?: string | string[]): Promise<DayOfWeekPerformanceDto[]> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (accountIds) params.accountIds = Array.isArray(accountIds) ? accountIds.join(',') : accountIds;
    const response = await apiClient.get<DayOfWeekPerformanceDto[]>('/metrics/time/by-day-of-week', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return response.data;
  },

  getPerformanceByHourOfDay: async (startDate?: string, endDate?: string, accountIds?: string | string[]): Promise<HourOfDayPerformanceDto[]> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (accountIds) params.accountIds = Array.isArray(accountIds) ? accountIds.join(',') : accountIds;
    const response = await apiClient.get<HourOfDayPerformanceDto[]>('/metrics/time/by-hour-of-day', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return response.data;
  },

  getPerformanceBySymbol: async (startDate?: string, endDate?: string, accountId?: string): Promise<SymbolPerformanceDto[]> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (accountId) params.accountId = accountId;
    const response = await apiClient.get<SymbolPerformanceDto[]>('/metrics/by-symbol', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return response.data;
  },

  getHeatmap: async (startDate?: string, endDate?: string, accountId?: string): Promise<HeatmapCellDto[]> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (accountId) params.accountId = accountId;
    const response = await apiClient.get<HeatmapCellDto[]>('/metrics/heatmap', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return response.data;
  },

  getPerformanceBySession: async (startDate?: string, endDate?: string, accountId?: string): Promise<SessionPerformanceDto[]> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (accountId) params.accountId = accountId;
    const response = await apiClient.get<SessionPerformanceDto[]>('/metrics/by-session', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return response.data;
  },

  getTradeFrequency: async (startDate?: string, endDate?: string, accountId?: string): Promise<TradeFrequencyPointDto[]> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (accountId) params.accountId = accountId;
    const response = await apiClient.get<TradeFrequencyPointDto[]>('/metrics/trade-frequency', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return response.data;
  },

  getRollingMetric: async (metric: RollingMetric, windowSize: number, startDate?: string, endDate?: string, accountId?: string): Promise<RollingMetricPointDto[]> => {
    const params: Record<string, string> = { metric, windowSize: String(windowSize) };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (accountId) params.accountId = accountId;
    const response = await apiClient.get<RollingMetricPointDto[]>('/metrics/rolling', { params });
    return response.data;
  },
};
