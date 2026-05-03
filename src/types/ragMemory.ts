/**
 * Sprint 5 PR D — RAG memory types.
 *
 * Mirrors the backend's {@code Citation} record. The id is the
 * {@code user_memory} row id; sourceId points back to the originating
 * artefact (trade / journal / debrief / briefing) and may be null for
 * ad-hoc CHAT chunks.
 */

export type MemorySourceType = 'TRADE' | 'JOURNAL' | 'DEBRIEF' | 'BRIEFING' | 'CHAT';

export interface Citation {
  id: string;
  sourceType: MemorySourceType;
  sourceId: string | null;
  snippet: string;
  similarity: number;
}

export interface MemorySearchResponse {
  query: string;
  citations: Citation[];
}
