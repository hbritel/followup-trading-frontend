import { useQuery, useQueryClient } from '@tanstack/react-query';
import { economicCalendarService } from '@/services/economicCalendar.service';
import type { EconomicCalendarFilters } from '@/types/dto';

const ECONOMIC_CALENDAR_KEY = 'economic-calendar';

export function useEconomicCalendar(filters: EconomicCalendarFilters) {
  return useQuery({
    queryKey: [ECONOMIC_CALENDAR_KEY, filters],
    queryFn: () => economicCalendarService.getEvents(filters),
    staleTime: 60_000,          // 1 min — aligned with backend Redis cache TTL
    gcTime: 30 * 60 * 1000,     // 30 min
    refetchInterval: 60_000,     // auto-refetch every minute to pick up new actuals
    refetchOnWindowFocus: true,  // refresh when user returns to tab
  });
}

/** Force-refresh the economic calendar from all query caches */
export function useRefreshEconomicCalendar() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [ECONOMIC_CALENDAR_KEY] });
}
