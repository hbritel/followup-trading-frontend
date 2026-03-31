import type { EconomicEvent, EconomicCalendarFilters, EconomicEventImpact } from '@/types/dto';
import apiClient from './apiClient';

// ── Date range helpers ───────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function getMonday(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

function getDateRange(filters: EconomicCalendarFilters): { from: string; to: string } {
  const today = new Date();

  switch (filters.dateRange) {
    case 'today':
      return { from: toDateStr(today), to: toDateStr(today) };

    case 'tomorrow': {
      const tomorrow = addDays(today, 1);
      return { from: toDateStr(tomorrow), to: toDateStr(tomorrow) };
    }

    case 'this_week': {
      const monday = getMonday(today);
      const sunday = addDays(monday, 6);
      return { from: toDateStr(monday), to: toDateStr(sunday) };
    }

    case 'next_week': {
      const nextMonday = addDays(getMonday(today), 7);
      const nextSunday = addDays(nextMonday, 6);
      return { from: toDateStr(nextMonday), to: toDateStr(nextSunday) };
    }

    case 'custom':
      return {
        from: filters.startDate ?? toDateStr(today),
        to: filters.endDate ?? toDateStr(today),
      };

    default: {
      const mon = getMonday(today);
      return { from: toDateStr(mon), to: toDateStr(addDays(mon, 13)) };
    }
  }
}

// ── Backend API response type ────────────────────────────────────────────────

interface BackendEconomicEvent {
  title: string;
  country: string;
  currency: string;
  date: string;
  time: string;
  impact: string;
  previous: string | null;
  forecast: string | null;
  actual: string | null;
}

function mapBackendEvent(raw: BackendEconomicEvent, index: number): EconomicEvent {
  return {
    id: `ec-${raw.date}-${index}`,
    title: raw.title,
    country: raw.country,
    currency: raw.currency,
    date: raw.date,
    time: raw.time,
    impact: raw.impact as EconomicEventImpact,
    previous: raw.previous,
    forecast: raw.forecast,
    actual: raw.actual,
  };
}

// ── Service ──────────────────────────────────────────────────────────────────

export const economicCalendarService = {
  async getEvents(filters: EconomicCalendarFilters): Promise<EconomicEvent[]> {
    const { from, to } = getDateRange(filters);

    const { data } = await apiClient.get<BackendEconomicEvent[]>('/economic-calendar', {
      params: { from, to },
    });

    let events = data.map((raw, i) => mapBackendEvent(raw, i));

    // Apply client-side filters (currency + impact) — backend returns all
    if (filters.currencies.length > 0) {
      events = events.filter((e) => filters.currencies.includes(e.currency));
    }
    if (filters.impacts.length > 0) {
      events = events.filter((e) => filters.impacts.includes(e.impact));
    }

    return events;
  },

  getAvailableCurrencies(): string[] {
    return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'NZD', 'CNY'];
  },
};
