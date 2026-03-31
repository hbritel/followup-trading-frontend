import { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useTranslation } from 'react-i18next';
import { useEconomicCalendar } from '@/hooks/useEconomicCalendar';
import { economicCalendarService } from '@/services/economicCalendar.service';
import type { EconomicCalendarFilters } from '@/types/dto';
import CalendarFilters from '@/components/calendar/CalendarFilters';
import EconomicEventTable from '@/components/calendar/EconomicEventTable';
import UpcomingHighImpact from '@/components/calendar/UpcomingHighImpact';

const CalendarPage = () => {
  const { t } = useTranslation();
  const availableCurrencies = useMemo(
    () => economicCalendarService.getAvailableCurrencies(),
    [],
  );

  const [filters, setFilters] = useState<EconomicCalendarFilters>({
    dateRange: 'this_week',
    currencies: [],
    impacts: [],
  });

  const { data: events = [], isLoading } = useEconomicCalendar(filters);

  // High-impact upcoming events for sidebar
  const upcomingHigh = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    return events
      .filter((e) => e.impact === 'HIGH')
      .filter((e) => {
        if (e.date > todayStr) return true;
        if (e.date === todayStr && e.time !== 'All Day') {
          const [h, m] = e.time.split(':').map(Number);
          const eventTime = new Date(now);
          eventTime.setHours(h, m, 0, 0);
          return eventTime > now;
        }
        return false;
      })
      .slice(0, 5);
  }, [events]);

  return (
    <DashboardLayout pageTitle={t('calendar.tradingCalendar')}>
      <div className="space-y-4">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('calendar.tradingCalendar')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('calendar.description')}
          </p>
        </div>

        {/* Filters */}
        <CalendarFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableCurrencies={availableCurrencies}
        />

        {/* Main content: table + sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Event table — 3/4 width on xl */}
          <div className="xl:col-span-3">
            <EconomicEventTable events={events} isLoading={isLoading} />
          </div>

          {/* Sidebar — 1/4 width on xl, full on mobile */}
          <div className="space-y-4">
            <UpcomingHighImpact events={upcomingHigh} />

            {/* Impact legend */}
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold">{t('calendar.impact')}</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-[3px] h-6 rounded-full bg-red-500" />
                  <span className="text-sm">{t('calendar.impactHigh')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-[3px] h-4 rounded-full bg-amber-500" />
                  <span className="text-sm">{t('calendar.impactMedium')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-[3px] h-2 rounded-full bg-yellow-400" />
                  <span className="text-sm">{t('calendar.impactLow')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;
