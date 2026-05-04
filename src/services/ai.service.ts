import apiClient from './apiClient';

export interface AiDigestResponse {
  id: string;
  content: string;
  weekStart: string;
  weekEnd: string;
  generatedAt: string;
}

export interface AiAnalysisResponse {
  tradeId: string;
  analysis: string;
  generatedAt: string;
}

export interface DigestJobResponse {
  jobId: string;
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  result: AiDigestResponse | null;
  error: string | null;
  createdAt: string;
}

export interface GenerateDigestParams {
  accountId?: string;
  startDate?: string;
  endDate?: string;
}

const getLatestDigest = async (): Promise<AiDigestResponse | null> => {
  const response = await apiClient.get<AiDigestResponse>('/ai/digest/latest');
  // 204 No Content → null
  return response.status === 204 ? null : response.data;
};

const getDigestHistory = async (page = 0, size = 10): Promise<AiDigestResponse[]> => {
  const response = await apiClient.get<AiDigestResponse[]>(`/ai/digest/history?page=${page}&size=${size}`);
  return response.data;
};

/**
 * Starts async digest generation. Returns a job ID for polling.
 */
const startDigestGeneration = async (params?: GenerateDigestParams): Promise<DigestJobResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.accountId) searchParams.set('accountId', params.accountId);
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);
  const qs = searchParams.toString();
  const response = await apiClient.post<DigestJobResponse>(`/ai/digest/generate${qs ? `?${qs}` : ''}`);
  return response.data;
};

/**
 * Polls the status of an async digest generation job.
 */
const getDigestJobStatus = async (jobId: string): Promise<DigestJobResponse> => {
  const response = await apiClient.get<DigestJobResponse>(`/ai/digest/jobs/${jobId}`);
  return response.data;
};

/** @deprecated Use startDigestGeneration + polling instead */
const generateWeeklyDigest = async (accountId?: string): Promise<AiDigestResponse> => {
  const params = accountId ? `?accountId=${accountId}` : '';
  const response = await apiClient.post<AiDigestResponse>(`/ai/digest/generate${params}`);
  return response.data;
};

const analyzeTradeById = async (tradeId: string): Promise<AiAnalysisResponse> => {
  const response = await apiClient.post<AiAnalysisResponse>(`/ai/analyze/${tradeId}`);
  return response.data;
};

export interface BackfillReport {
  trades: number;
  journals: number;
  briefings: number;
  debriefs: number;
}

/**
 * Re-indexes the current user's recent trades / journal entries / briefings
 * / debriefs into the coach's RAG vector store. Useful when historical data
 * was created before the indexer was wired (or while the embedding provider
 * was off) and the coach answers "I can't see your journal entry…".
 * Idempotent — entries already in the index are skipped server-side.
 */
const backfillMyEmbeddings = async (): Promise<BackfillReport> => {
  const response = await apiClient.post<BackfillReport>('/me/embeddings/backfill');
  return response.data;
};

export const aiService = {
  getLatestDigest,
  getDigestHistory,
  startDigestGeneration,
  getDigestJobStatus,
  generateWeeklyDigest,
  analyzeTradeById,
  backfillMyEmbeddings,
};
