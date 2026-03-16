import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { metricsService } from '@/services/metrics.service';

const TIME_METRICS_KEY = ['timeMetrics'];

export const useDayOfWeekPerformance = (startDate?: string, endDate?: string, accountIds?: string) => {
  return useQuery({
    queryKey: [...TIME_METRICS_KEY, 'dayOfWeek', startDate, endDate, accountIds],
    queryFn: () => metricsService.getPerformanceByDayOfWeek(startDate, endDate, accountIds),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
  });
};

export const useHourOfDayPerformance = (startDate?: string, endDate?: string, accountIds?: string) => {
  return useQuery({
    queryKey: [...TIME_METRICS_KEY, 'hourOfDay', startDate, endDate, accountIds],
    queryFn: () => metricsService.getPerformanceByHourOfDay(startDate, endDate, accountIds),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
  });
};
