import apiClient from './apiClient';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface GrantBonusRequest {
  userIds: string[];
  amount: number;
  reason?: string;
}

export interface GrantBonusResponse {
  amount: number;
  usersGranted: number;
  usersSkipped: number;
}

export interface InspectResponse {
  userId: string;
  bonusAiMessagesRemaining: number;
}

// ── Service ────────────────────────────────────────────────────────────────────

export const adminAiUsageService = {
  async grant(req: GrantBonusRequest): Promise<GrantBonusResponse> {
    const response = await apiClient.post<GrantBonusResponse>('/admin/ai-usage/grant', req);
    return response.data;
  },
  async inspect(userId: string): Promise<InspectResponse> {
    const response = await apiClient.post<InspectResponse>('/admin/ai-usage/inspect', { userId });
    return response.data;
  },
};
