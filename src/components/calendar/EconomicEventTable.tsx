import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import ImpactIndicator from './ImpactIndicator';
import CurrencyFlag from './CurrencyFlag';
import type { EconomicEvent } from '@/types/dto';

interface EconomicEventTableProps {
  events: EconomicEvent[];
  isLoading: boolean;
}

/** Format "2026-03-24" to "Monday, March 24, 2026" */
function formatGroupDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Group events by date, preserving order */
function groupByDate(events: EconomicEvent[]): Map<string, EconomicEvent[]> {
  const map = new Map<string, EconomicEvent[]>();
  for (const event of events) {
    const existing = map.get(event.date);
    if (existing) {
      existing.push(event);
    } else {
      map.set(event.date, [event]);
    }
  }
  return map;
}

function ActualBadge({ actual }: { actual: string | null }) {
  if (!actual) {
    return <span className="text-muted-foreground font-mono tabular-nums">—</span>;
  }
  return (
    <span className="font-mono tabular-nums font-semibold text-foreground">
      {actual}
    </span>
  );
}

function ValueCell({ value }: { value: string | null }) {
  if (!value) {
    return <span className="text-muted-foreground font-mono tabular-nums">—</span>;
  }
  return <span className="font-mono tabular-nums text-muted-foreground">{value}</span>;
}

function EventNameCell({ title, description }: { title: string; description?: string }) {
  if (!description) {
    return <span className="font-medium truncate max-w-[180px] md:max-w-none">{title}</span>;
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="font-medium truncate max-w-[180px] md:max-w-none cursor-default underline decoration-dotted decoration-muted-foreground/50">
            {title}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const LoadingSkeleton = () => (
  <div className="space-y-0">
    {/* Fake date header */}
    <div className="px-4 py-2 bg-muted/30">
      <Skeleton className="h-4 w-48" />
    </div>
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 px-4 py-3 border-b border-border/50"
      >
        <Skeleton className="h-4 w-10 shrink-0" />
        <Skeleton className="h-5 w-8 rounded shrink-0" />
        <Skeleton className="h-5 w-3 shrink-0" />
        <Skeleton className="h-4 w-48 flex-1" />
        <Skeleton className="h-4 w-16 hidden md:block" />
        <Skeleton className="h-4 w-16 hidden md:block" />
        <Skeleton className="h-4 w-16" />
      </div>
    ))}
  </div>
);

const EconomicEventTable = ({ events, isLoading }: EconomicEventTableProps) => {
  const { t } = useTranslation();

  const grouped = useMemo(() => groupByDate(events), [events]);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card overflow-hidden">
        <LoadingSkeleton />
      </div>
    );
  }

  if (grouped.size === 0) {
    return (
      <div className="rounded-lg border bg-card flex flex-col items-center justify-center py-16 text-center">
        <CalendarX className="h-12 w-12 text-muted-foreground opacity-40 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">
          {t('calendar.noEvents')}
        </p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          {t('calendar.noEventsDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Table header — hidden on mobile */}
      <div className="hidden md:grid grid-cols-[80px_60px_20px_1fr_90px_90px_90px] gap-3 px-4 py-2 bg-muted/50 border-b text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>{t('calendar.time')}</span>
        <span>{t('calendar.currency')}</span>
        <span></span>
        <span>{t('calendar.event')}</span>
        <span className="text-right">{t('calendar.previous')}</span>
        <span className="text-right">{t('calendar.forecast')}</span>
        <span className="text-right">{t('calendar.actual')}</span>
      </div>

      {Array.from(grouped.entries()).map(([date, dateEvents]) => {
        const highImpactCount = dateEvents.filter((e) => e.impact === 'HIGH').length;

        return (
          <div key={date}>
            {/* Date group header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-t border-border/60 backdrop-blur-sm">
              <span className="text-sm font-semibold text-foreground">
                {formatGroupDate(date)}
              </span>
              {highImpactCount > 0 && (
                <Badge
                  variant="destructive"
                  className="h-5 px-1.5 text-[10px] font-bold"
                >
                  {highImpactCount} {t('calendar.highImpact')}
                </Badge>
              )}
            </div>

            {/* Events for this date */}
            {dateEvents.map((event) => (
              <div
                key={event.id}
                className={cn(
                  'border-b border-border/40 last:border-b-0',
                  'hover:bg-muted/50 transition-colors',
                  // Mobile: flex column-ish layout
                  'flex items-center gap-2 px-4 py-3',
                  // Desktop: grid layout matching header
                  'md:grid md:grid-cols-[80px_60px_20px_1fr_90px_90px_90px]',
                )}
              >
                {/* Time */}
                <span
                  className={cn(
                    'font-mono tabular-nums text-sm text-muted-foreground shrink-0',
                    'w-[72px] md:w-auto',
                  )}
                >
                  {event.time}
                </span>

                {/* Currency badge */}
                <div className="shrink-0">
                  <CurrencyFlag currency={event.currency} />
                </div>

                {/* Impact bar */}
                <div className="shrink-0 flex justify-center">
                  <ImpactIndicator impact={event.impact} />
                </div>

                {/* Event name — takes remaining space on mobile */}
                <div className="flex-1 min-w-0">
                  <EventNameCell
                    title={event.title}
                    description={event.description}
                  />
                </div>

                {/* Previous — hidden on mobile */}
                <div className="hidden md:flex justify-end">
                  <ValueCell value={event.previous} />
                </div>

                {/* Forecast — hidden on mobile */}
                <div className="hidden md:flex justify-end">
                  <ValueCell value={event.forecast} />
                </div>

                {/* Actual */}
                <div className="flex justify-end shrink-0">
                  <ActualBadge actual={event.actual} />
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default EconomicEventTable;
