// src/hooks/useSymbolSpecifications.ts
import { useQuery } from '@tanstack/react-query';
import { symbolService, type SymbolSpecification } from '@/services/symbol.service';

export function useSymbolSpecifications() {
  return useQuery<SymbolSpecification[]>({
    queryKey: ['symbol-specifications'],
    queryFn: symbolService.getAll,
    staleTime: 30 * 60 * 1000, // 30 min - rarely changes
    gcTime: 60 * 60 * 1000,    // 1 hour
  });
}
