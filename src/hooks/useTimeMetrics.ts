import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { metricsService } from '@/services/metrics.service';

const TIME_METRICS_KEY = ['timeMetrics'];

export const useMonthlyPerformance = (startDate?: string, endDate?: string, accountIds?: string | string[]) => {
  return useQuery({
    queryKey: [...TIME_METRICS_KEY, 'monthly', startDate, endDate, accountIds],
    queryFn: () => metricsService.getMonthlyPerformance(startDate, endDate, accountIds),
    placeholderData: keepPreviousData,
  });
};

export const useDayOfWeekPerformance = (startDate?: string, endDate?: string, accountIds?: string | string[]) => {
  return useQuery({
    queryKey: [...TIME_METRICS_KEY, 'dayOfWeek', startDate, endDate, accountIds],
    queryFn: () => metricsService.getPerformanceByDayOfWeek(startDate, endDate, accountIds),
    placeholderData: keepPreviousData,
  });
};

export const useHourOfDayPerformance = (startDate?: string, endDate?: string, accountIds?: string | string[]) => {
  return useQuery({
    queryKey: [...TIME_METRICS_KEY, 'hourOfDay', startDate, endDate, accountIds],
    queryFn: () => metricsService.getPerformanceByHourOfDay(startDate, endDate, accountIds),
    placeholderData: keepPreviousData,
  });
};
