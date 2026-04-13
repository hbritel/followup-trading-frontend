import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface MarketSession {
  id: string;
  city: string;
  timezone: string;
  flag: string;
  localOpen: number;   // Local hour when market opens (in the market's own timezone)
  localClose: number;  // Local hour when market closes
}

const SESSIONS: MarketSession[] = [
  { id: 'tokyo',   city: 'Tokyo',    timezone: 'Asia/Tokyo',       flag: '🇯🇵', localOpen: 9,  localClose: 15 },
  { id: 'london',  city: 'London',   timezone: 'Europe/London',    flag: '🇬🇧', localOpen: 8,  localClose: 16 },
  { id: 'paris',   city: 'Paris',    timezone: 'Europe/Paris',     flag: '🇫🇷', localOpen: 9,  localClose: 17 },
  { id: 'newyork', city: 'New York', timezone: 'America/New_York', flag: '🇺🇸', localOpen: 9,  localClose: 16 },
];

function getTimeInTimezone(tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz,
    hour12: false,
  }).format(new Date());
}

/** Get the current hour and day-of-week in a given timezone. */
function getLocalTime(tz: string): { hour: number; minute: number; day: number } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  }).formatToParts(now);

  const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
  const dayStr = parts.find(p => p.type === 'weekday')?.value ?? '';
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const day = dayMap[dayStr] ?? new Date().getDay();

  return { hour, minute, day };
}

function isMarketOpen(session: MarketSession): boolean {
  const { hour, day } = getLocalTime(session.timezone);

  // Markets closed on weekends (in the market's local timezone)
  if (day === 0 || day === 6) return false;

  return hour >= session.localOpen && hour < session.localClose;
}

function getActiveSessionLabel(sessions: MarketSession[]): string {
  const active = sessions.filter(isMarketOpen);
  if (active.length === 0) return 'Closed';
  // Show short codes for active sessions
  const codes: Record<string, string> = {
    tokyo: 'TYO',
    london: 'LDN',
    paris: 'PAR',
    newyork: 'NY',
  };
  return active.map(s => codes[s.id] || s.city.substring(0, 3).toUpperCase()).join(' · ');
}

function getOverlapInfo(sessions: MarketSession[]): string | null {
  const active = sessions.filter(isMarketOpen);
  const ids = new Set(active.map(s => s.id));

  if (ids.has('london') && ids.has('newyork')) return 'London + New York overlap';
  if (ids.has('tokyo') && ids.has('london')) return 'Tokyo + London overlap';
  if (ids.has('paris') && ids.has('newyork')) return 'Paris + New York overlap';
  return null;
}

export default function MarketClocks() {
  const { t } = useTranslation();
  const [now, setNow] = useState(new Date());

  // Update every 30 seconds (don't need per-second precision for this)
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const sessionData = useMemo(() => {
    return SESSIONS.map(session => ({
      ...session,
      time: getTimeInTimezone(session.timezone),
      open: isMarketOpen(session),
    }));
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeLabel = useMemo(() => getActiveSessionLabel(SESSIONS), [now]); // eslint-disable-line react-hooks/exhaustive-deps
  const overlap = useMemo(() => getOverlapInfo(SESSIONS), [now]); // eslint-disable-line react-hooks/exhaustive-deps
  const hasActiveSession = sessionData.some(s => s.open);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'hidden md:flex items-center gap-1.5 h-8 rounded-lg px-2.5',
            'text-xs font-medium',
            'border border-border/50 bg-transparent',
            'hover:bg-accent/50 hover:border-border',
            'transition-colors duration-150 cursor-pointer',
            hasActiveSession ? 'text-foreground' : 'text-muted-foreground',
          )}
          title={t('marketClocks.title', 'Market Sessions')}
        >
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="tabular-nums">{activeLabel}</span>
          {hasActiveSession && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-64 p-0" sideOffset={8}>
        <div className="px-4 py-3 border-b border-border/50">
          <h4 className="text-sm font-semibold">{t('marketClocks.title', 'Market Sessions')}</h4>
          {overlap && (
            <p className="text-[10px] text-emerald-400 font-medium mt-0.5">{overlap}</p>
          )}
        </div>
        <div className="p-2">
          {sessionData.map(session => (
            <div
              key={session.id}
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
                session.open ? 'bg-emerald-500/5' : '',
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base leading-none">{session.flag}</span>
                <span className={cn(
                  'text-sm font-medium',
                  session.open ? 'text-foreground' : 'text-muted-foreground',
                )}>
                  {session.city}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-sm font-mono tabular-nums',
                  session.open ? 'text-foreground' : 'text-muted-foreground/70',
                )}>
                  {session.time}
                </span>
                <span className={cn(
                  'h-2 w-2 rounded-full',
                  session.open ? 'bg-emerald-500' : 'bg-muted-foreground/30',
                )} />
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
