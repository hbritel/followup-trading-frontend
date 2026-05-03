import apiClient from './apiClient';
import type { MemorySearchResponse, MemorySourceType } from '@/types/ragMemory';

/**
 * REST client for Sprint 5 Tâche 5.4 — RAG memory search.
 */
export const ragMemoryService = {
  search: (query: string, topK?: number, sources?: MemorySourceType[]) => {
    const params = new URLSearchParams();
    params.set('q', query);
    if (topK) params.set('topK', String(topK));
    if (sources && sources.length > 0) params.set('sources', sources.join(','));
    return apiClient.get<MemorySearchResponse>(`/ai/memory/search?${params.toString()}`);
  },
};
