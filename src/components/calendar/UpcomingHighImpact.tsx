import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import ImpactIndicator from './ImpactIndicator';
import CurrencyFlag from './CurrencyFlag';
import type { EconomicEvent } from '@/types/dto';

interface UpcomingHighImpactProps {
  events: EconomicEvent[];
}

/** Build a user-friendly relative time label for an event */
function getCountdownLabel(event: EconomicEvent): string {
  if (event.time === 'All Day') {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const tomorrowStr = new Date(today.getTime() + 86_400_000)
      .toISOString()
      .slice(0, 10);

    if (event.date === todayStr) return 'Today (All Day)';
    if (event.date === tomorrowStr) return 'Tomorrow (All Day)';
    return event.date;
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrowStr = new Date(now.getTime() + 86_400_000)
    .toISOString()
    .slice(0, 10);

  if (event.date === todayStr) {
    // Calculate "in Xh Ym"
    const [h, m] = event.time.split(':').map(Number);
    const eventMs = new Date(now).setHours(h, m, 0, 0);
    const diffMs = eventMs - now.getTime();
    if (diffMs <= 0) return `Today ${event.time}`;
    const diffMin = Math.round(diffMs / 60_000);
    if (diffMin < 60) return `in ${diffMin}m`;
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`;
  }

  if (event.date === tomorrowStr) {
    return `Tomorrow ${event.time}`;
  }

  // Further future: show date + time
  const [year, month, day] = event.date.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${label} ${event.time}`;
}

const UpcomingHighImpact = ({ events }: UpcomingHighImpactProps) => {
  const { t } = useTranslation();

  const topEvents = useMemo(() => events.slice(0, 5), [events]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Zap className="h-4 w-4 text-red-500" />
          {t('calendar.upcomingHighImpact')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {topEvents.length === 0 ? (
          <div className="px-4 pb-4 text-sm text-muted-foreground">
            {t('calendar.noHighImpactEvents')}
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {topEvents.map((event) => (
              <li
                key={event.id}
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/40 transition-colors"
              >
                {/* Impact bar on the far left */}
                <ImpactIndicator impact={event.impact} />

                {/* Currency badge */}
                <CurrencyFlag currency={event.currency} />

                {/* Event info */}
                <div className="flex flex-col flex-1 min-w-0">
                  <span
                    className={cn(
                      'text-sm font-medium leading-tight truncate',
                    )}
                    title={event.title}
                  >
                    {event.title}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {getCountdownLabel(event)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingHighImpact;
