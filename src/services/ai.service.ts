import apiClient from './apiClient';

export interface AiChatMessageResponse {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

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

export interface ChatJobResponse {
  jobId: string;
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  content: string | null;
  error: string | null;
  createdAt: string;
}

export interface GenerateDigestParams {
  accountId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Sends a chat message to the AI coach — returns a raw Response for SSE streaming.
 * Use fetch (not axios) because axios does not support streaming response bodies.
 */
const sendChatMessage = async (message: string): Promise<Response> => {
  const token = localStorage.getItem('accessToken');
  return fetch('/api/v1/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });
};

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

const getChatHistory = async (): Promise<AiChatMessageResponse[]> => {
  const response = await apiClient.get<AiChatMessageResponse[]>('/ai/history');
  return response.data;
};

const clearChatHistory = async (): Promise<void> => {
  await apiClient.delete('/ai/history');
};

// ---- Async chat (survives client disconnect) ----

const startChatJob = async (message: string): Promise<ChatJobResponse> => {
  const response = await apiClient.post<ChatJobResponse>('/ai/chat/start', { message });
  return response.data;
};

const getChatJobStatus = async (jobId: string): Promise<ChatJobResponse> => {
  const response = await apiClient.get<ChatJobResponse>(`/ai/chat/jobs/${jobId}`);
  return response.data;
};

const getPendingChatJobs = async (): Promise<ChatJobResponse[]> => {
  const response = await apiClient.get<ChatJobResponse[]>('/ai/chat/pending');
  return response.data;
};

export const aiService = {
  sendChatMessage,
  getLatestDigest,
  getDigestHistory,
  startDigestGeneration,
  getDigestJobStatus,
  generateWeeklyDigest,
  analyzeTradeById,
  getChatHistory,
  clearChatHistory,
  startChatJob,
  getChatJobStatus,
  getPendingChatJobs,
};
