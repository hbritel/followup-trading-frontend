import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { metricsService } from '@/services/metrics.service';

/**
 * Hook to fetch the full dashboard summary from
 * GET /api/v1/metrics/dashboard/summary.
 *
 * This returns sharpeRatio, sortinoRatio, drawdownMetrics,
 * performanceSummary (profitFactor, winRate, etc.),
 * advancedRiskMetrics (VaR, recoveryFactor, etc.), and more.
 */
export const useDashboardSummary = (startDate?: string, endDate?: string, accountId?: string | string[]) => {
  return useQuery({
    queryKey: ['dashboard-summary', startDate, endDate, accountId],
    queryFn: () => metricsService.getDashboardSummary(startDate, endDate, accountId),
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to fetch advanced risk metrics from
 * GET /api/v1/metrics/advanced/risk.
 *
 * Returns: valueAtRisk, portfolioDiversityScore, marginUtilization,
 * exposurePerSector, recoveryFactor, timeInMarket, profitConsistency.
 */
export const useAdvancedRiskMetrics = (startDate?: string, endDate?: string, accountId?: string | string[]) => {
  return useQuery({
    queryKey: ['advanced-risk-metrics', startDate, endDate, accountId],
    queryFn: () => metricsService.getAdvancedRiskMetrics(startDate, endDate, accountId),
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to fetch trade performance summary from
 * GET /api/v1/metrics/trade/performance.
 *
 * Returns: totalTrades, winRate, profitFactor, expectancy,
 * averageWin, averageLoss, largestWin, largestLoss, etc.
 */
export const useTradePerformance = (startDate?: string, endDate?: string, accountId?: string | string[]) => {
  return useQuery({
    queryKey: ['trade-performance', startDate, endDate, accountId],
    queryFn: () => metricsService.getTradePerformance(startDate, endDate, accountId),
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to fetch risk distribution from
 * GET /api/v1/metrics/risk/distribution.
 *
 * Returns: var95, var99, cvar95, standardDeviation, downside,
 * profitLossDistribution.
 */
export const useRiskDistribution = (startDate?: string, endDate?: string, accountId?: string | string[]) => {
  return useQuery({
    queryKey: ['risk-distribution', startDate, endDate, accountId],
    queryFn: () => metricsService.getRiskDistribution(startDate, endDate, accountId),
    placeholderData: keepPreviousData,
  });
};

/**
 * Margin-utilisation time series — replaces the fabricated 2024-01..06 series.
 * GET /api/v1/metrics/advanced/risk/margin-utilization/timeseries
 */
export const useMarginUtilizationTimeSeries = (
  startDate?: string,
  endDate?: string,
  accountId?: string | string[],
  granularity: 'DAY' | 'WEEK' | 'MONTH' = 'WEEK',
) => {
  return useQuery({
    queryKey: ['margin-utilization-timeseries', startDate, endDate, accountId, granularity],
    queryFn: () =>
      metricsService.getMarginUtilizationTimeSeries(startDate, endDate, accountId, granularity),
    placeholderData: keepPreviousData,
  });
};

/**
 * Holding-period distribution (<1h, 1-4h, 4-24h, 1-3d, 3d+).
 * GET /api/v1/metrics/advanced/risk/holding-period-distribution
 */
export const useHoldingPeriodDistribution = (
  startDate?: string,
  endDate?: string,
  accountId?: string | string[],
) => {
  return useQuery({
    queryKey: ['holding-period-distribution', startDate, endDate, accountId],
    queryFn: () => metricsService.getHoldingPeriodDistribution(startDate, endDate, accountId),
    placeholderData: keepPreviousData,
  });
};

/**
 * Kelly criterion per strategy.
 * GET /api/v1/metrics/advanced/risk/kelly
 */
export const useKellyByStrategy = (
  startDate?: string,
  endDate?: string,
  accountId?: string | string[],
) => {
  return useQuery({
    queryKey: ['strategy-kelly', startDate, endDate, accountId],
    queryFn: () => metricsService.getKellyByStrategy(startDate, endDate, accountId),
    placeholderData: keepPreviousData,
  });
};
