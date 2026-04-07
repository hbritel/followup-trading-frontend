import apiClient from './apiClient';
import type {
  BehavioralAlertResponseDto,
  TiltScoreResponseDto,
  BriefingResponseDto,
  SessionDebriefResponseDto,
  SessionSummaryResponseDto,
  DisclaimerStatusDto,
} from '@/types/dto';

/** Builds a query string with an optional accountId parameter appended. */
const withAccount = (base: string, accountId?: string): string => {
  if (!accountId) return base;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}accountId=${accountId}`;
};

export const coachService = {
  // Alerts
  getActiveAlerts: (accountId?: string) =>
    apiClient.get<BehavioralAlertResponseDto[]>(withAccount('/ai/coach/alerts?status=active', accountId)),
  getTodayAlerts: (accountId?: string) =>
    apiClient.get<BehavioralAlertResponseDto[]>(withAccount('/ai/coach/alerts/today', accountId)),
  dismissAlert: (id: string) =>
    apiClient.post(`/ai/coach/alerts/${id}/dismiss`),
  getSessionSummary: (accountId?: string) =>
    apiClient.get<SessionSummaryResponseDto>(withAccount('/ai/coach/session-summary', accountId)),

  // Tilt
  getTiltScore: (accountId?: string) =>
    apiClient.get<TiltScoreResponseDto>(withAccount('/ai/coach/tilt-score', accountId)),
  getTiltHistory: (from: string, to: string) =>
    apiClient.get<TiltScoreResponseDto[]>(`/ai/coach/tilt-history?from=${from}&to=${to}`),

  // Briefing
  getTodayBriefing: (accountId?: string) =>
    apiClient.get<BriefingResponseDto>(withAccount('/ai/briefing/today', accountId)),
  getBriefings: (from: string, to: string) =>
    apiClient.get<BriefingResponseDto[]>(`/ai/briefings?from=${from}&to=${to}`),
  generateBriefing: (accountId?: string) =>
    apiClient.post<BriefingResponseDto>(withAccount('/ai/briefing/generate', accountId)),

  // Debrief
  getLatestDebrief: (accountId?: string) =>
    apiClient.get<SessionDebriefResponseDto>(withAccount('/ai/debrief/latest', accountId)),
  getDebriefs: (from: string, to: string) =>
    apiClient.get<SessionDebriefResponseDto[]>(`/ai/debriefs?from=${from}&to=${to}`),
  generateDebrief: (accountId?: string) =>
    apiClient.post<SessionDebriefResponseDto>(withAccount('/ai/debrief/generate', accountId)),

  // Disclaimer
  getDisclaimerStatus: () =>
    apiClient.get<DisclaimerStatusDto>('/ai/disclaimer/status'),
  acceptDisclaimer: () =>
    apiClient.post<DisclaimerStatusDto>('/ai/disclaimer/accept'),
};
