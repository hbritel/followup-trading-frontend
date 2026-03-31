import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { metricsService } from '@/services/metrics.service';
import type { RollingMetric } from '@/types/dto';

const KEY = ['insightsMetrics'];

export const useSymbolPerformance = (startDate?: string, endDate?: string, accountId?: string) =>
  useQuery({
    queryKey: [...KEY, 'bySymbol', startDate, endDate, accountId],
    queryFn: () => metricsService.getPerformanceBySymbol(startDate, endDate, accountId),
    placeholderData: keepPreviousData,
  });

export const useHeatmap = (startDate?: string, endDate?: string, accountId?: string) =>
  useQuery({
    queryKey: [...KEY, 'heatmap', startDate, endDate, accountId],
    queryFn: () => metricsService.getHeatmap(startDate, endDate, accountId),
    placeholderData: keepPreviousData,
  });

export const useSessionPerformance = (startDate?: string, endDate?: string, accountId?: string) =>
  useQuery({
    queryKey: [...KEY, 'bySession', startDate, endDate, accountId],
    queryFn: () => metricsService.getPerformanceBySession(startDate, endDate, accountId),
    placeholderData: keepPreviousData,
  });

export const useTradeFrequency = (startDate?: string, endDate?: string, accountId?: string) =>
  useQuery({
    queryKey: [...KEY, 'tradeFrequency', startDate, endDate, accountId],
    queryFn: () => metricsService.getTradeFrequency(startDate, endDate, accountId),
    placeholderData: keepPreviousData,
  });

export const useRollingMetric = (
  metric: RollingMetric,
  windowSize: number,
  startDate?: string,
  endDate?: string,
  accountId?: string,
) =>
  useQuery({
    queryKey: [...KEY, 'rolling', metric, windowSize, startDate, endDate, accountId],
    queryFn: () => metricsService.getRollingMetric(metric, windowSize, startDate, endDate, accountId),
    placeholderData: keepPreviousData,
  });
