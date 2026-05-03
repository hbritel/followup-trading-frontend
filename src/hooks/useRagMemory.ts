import { useQuery } from '@tanstack/react-query';
import { ragMemoryService } from '@/services/ragMemory.service';
import type { MemorySearchResponse, MemorySourceType } from '@/types/ragMemory';

/**
 * Sprint 5 PR D — fetches the user's long-term memory chunks for a
 * natural-language query. PRO+ only on the backend; non-PRO returns 403
 * which surfaces here as the standard React Query error state.
 */
export const useRagMemorySearch = (
  query: string | undefined,
  topK: number = 6,
  sources?: MemorySourceType[],
  enabled: boolean = true,
) =>
  useQuery<MemorySearchResponse | null>({
    queryKey: ['ai', 'memory', 'search', query, topK, sources?.join(',')],
    queryFn: async () => {
      if (!query || !query.trim()) return null;
      try {
        const res = await ragMemoryService.search(query, topK, sources);
        return res.data;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 403 || status === 400) return null;
        throw err;
      }
    },
    enabled: Boolean(query && query.trim()) && enabled,
    staleTime: 5 * 60 * 1000,
  });
