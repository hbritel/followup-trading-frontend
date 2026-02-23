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
export const useDashboardSummary = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['dashboard-summary', startDate, endDate],
    queryFn: () => metricsService.getDashboardSummary(startDate, endDate),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
export const useAdvancedRiskMetrics = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['advanced-risk-metrics', startDate, endDate],
    queryFn: () => metricsService.getAdvancedRiskMetrics(startDate, endDate),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
export const useTradePerformance = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['trade-performance', startDate, endDate],
    queryFn: () => metricsService.getTradePerformance(startDate, endDate),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
  });
};
