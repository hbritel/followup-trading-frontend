import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { symbolService, type SymbolSearchResult } from '@/services/symbol.service';

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function useSymbolSearch(query: string) {
  const debouncedQuery = useDebounce(query.trim(), 300);

  return useQuery<SymbolSearchResult[]>({
    queryKey: ['symbol-search', debouncedQuery],
    queryFn: () => symbolService.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,  // 5 min
    gcTime: 10 * 60 * 1000,    // 10 min
    placeholderData: (prev) => prev, // keep previous results while loading
  });
}
