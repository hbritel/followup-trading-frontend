// src/contexts/page-filters-context.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './auth-context';

type FilterMap = Record<string, unknown>;

const STORAGE_KEY = 'ft_page_filters';

/** ISO-date string pattern produced by Date.toISOString() */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function loadStore(): Record<string, FilterMap> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw, (_key, value) => {
      // Revive ISO date strings back to Date objects
      if (typeof value === 'string' && ISO_DATE_RE.test(value)) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d;
      }
      return value;
    });
  } catch {
    return {};
  }
}

function persistStore(store: Record<string, FilterMap>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch { /* quota exceeded — ignore */ }
}

interface PageFiltersContextType {
  getFilter: <T>(pageKey: string, filterKey: string, defaultValue: T) => T;
  setFilter: <T>(pageKey: string, filterKey: string, value: T) => void;
  resetPage: (pageKey: string) => void;
}

const PageFiltersContext = createContext<PageFiltersContextType | undefined>(undefined);

export const PageFiltersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const store = useRef<Record<string, FilterMap>>(loadStore());
  const { user } = useAuth();
  const prevUserId = useRef<string | undefined>(user?.id);

  // Clear all page filters only when the user actually changes (not on initial mount)
  useEffect(() => {
    if (prevUserId.current !== undefined && prevUserId.current !== user?.id) {
      store.current = {};
      persistStore(store.current);
    }
    prevUserId.current = user?.id;
  }, [user?.id]);

  const getFilter = useCallback(<T,>(pageKey: string, filterKey: string, defaultValue: T): T => {
    const pageFilters = store.current[pageKey];
    if (!pageFilters || !(filterKey in pageFilters)) return defaultValue;
    return pageFilters[filterKey] as T;
  }, []);

  const setFilter = useCallback(<T,>(pageKey: string, filterKey: string, value: T): void => {
    if (!store.current[pageKey]) {
      store.current[pageKey] = {};
    }
    store.current[pageKey][filterKey] = value;
    persistStore(store.current);
  }, []);

  const resetPage = useCallback((pageKey: string): void => {
    delete store.current[pageKey];
    persistStore(store.current);
  }, []);

  return (
    <PageFiltersContext.Provider value={{ getFilter, setFilter, resetPage }}>
      {children}
    </PageFiltersContext.Provider>
  );
};

/**
 * Hook for pages to persist filters across navigation and page refreshes.
 *
 * Usage:
 *   const [account, setAccount] = usePageFilter('trades', 'accountId', 'all');
 */
export function usePageFilter<T>(pageKey: string, filterKey: string, defaultValue: T): [T, (v: T) => void] {
  const ctx = useContext(PageFiltersContext);
  if (!ctx) throw new Error('usePageFilter must be used within PageFiltersProvider');

  // Initialize from stored value (survives remount AND page refresh) or use default
  const [value, setValue] = useState<T>(() => ctx.getFilter(pageKey, filterKey, defaultValue));

  const set = useCallback((v: T) => {
    ctx.setFilter(pageKey, filterKey, v);
    setValue(v);
  }, [ctx, pageKey, filterKey, setValue]);

  return [value, set];
}

export function useResetPageFilters() {
  const ctx = useContext(PageFiltersContext);
  if (!ctx) throw new Error('useResetPageFilters must be used within PageFiltersProvider');
  return ctx.resetPage;
}
