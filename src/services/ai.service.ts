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

const getWeeklyDigest = async (): Promise<AiDigestResponse> => {
  const response = await apiClient.get<AiDigestResponse>('/ai/digest');
  return response.data;
};

const generateWeeklyDigest = async (): Promise<AiDigestResponse> => {
  const response = await apiClient.post<AiDigestResponse>('/ai/digest/generate');
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

export const aiService = {
  sendChatMessage,
  getWeeklyDigest,
  generateWeeklyDigest,
  analyzeTradeById,
  getChatHistory,
  clearChatHistory,
};
