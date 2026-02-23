// src/contexts/page-filters-context.tsx
import React, { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type FilterMap = Record<string, unknown>;

interface PageFiltersContextType {
  getFilter: <T>(pageKey: string, filterKey: string, defaultValue: T) => T;
  setFilter: <T>(pageKey: string, filterKey: string, value: T) => void;
  resetPage: (pageKey: string) => void;
}

const PageFiltersContext = createContext<PageFiltersContextType | undefined>(undefined);

export const PageFiltersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use ref for storage to avoid re-rendering every consumer on any filter change.
  // Individual pages trigger their own re-renders via local state.
  const store = useRef<Record<string, FilterMap>>({});

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
  }, []);

  const resetPage = useCallback((pageKey: string): void => {
    delete store.current[pageKey];
  }, []);

  return (
    <PageFiltersContext.Provider value={{ getFilter, setFilter, resetPage }}>
      {children}
    </PageFiltersContext.Provider>
  );
};

/**
 * Hook for pages to persist filters across navigation.
 *
 * Usage:
 *   const [account, setAccount] = usePageFilter('trades', 'accountId', 'all');
 */
export function usePageFilter<T>(pageKey: string, filterKey: string, defaultValue: T): [T, (v: T) => void] {
  const ctx = useContext(PageFiltersContext);
  if (!ctx) throw new Error('usePageFilter must be used within PageFiltersProvider');

  // Initialize from stored value (survives remount) or use default
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
