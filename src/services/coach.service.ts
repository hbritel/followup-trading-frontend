import apiClient from './apiClient';
import type {
  BehavioralAlertResponseDto,
  TiltScoreResponseDto,
  BriefingResponseDto,
  SessionDebriefResponseDto,
  SessionSummaryResponseDto,
  DisclaimerStatusDto,
} from '@/types/dto';

export const coachService = {
  // Alerts
  getActiveAlerts: () =>
    apiClient.get<BehavioralAlertResponseDto[]>('/ai/coach/alerts?status=active'),
  getTodayAlerts: () =>
    apiClient.get<BehavioralAlertResponseDto[]>('/ai/coach/alerts/today'),
  dismissAlert: (id: string) =>
    apiClient.post(`/ai/coach/alerts/${id}/dismiss`),
  getSessionSummary: () =>
    apiClient.get<SessionSummaryResponseDto>('/ai/coach/session-summary'),

  // Tilt
  getTiltScore: () =>
    apiClient.get<TiltScoreResponseDto>('/ai/coach/tilt-score'),
  getTiltHistory: (from: string, to: string) =>
    apiClient.get<TiltScoreResponseDto[]>(`/ai/coach/tilt-history?from=${from}&to=${to}`),

  // Briefing
  getTodayBriefing: () =>
    apiClient.get<BriefingResponseDto>('/ai/briefing/today'),
  getBriefings: (from: string, to: string) =>
    apiClient.get<BriefingResponseDto[]>(`/ai/briefings?from=${from}&to=${to}`),
  generateBriefing: () =>
    apiClient.post<BriefingResponseDto>('/ai/briefing/generate'),

  // Debrief
  getLatestDebrief: () =>
    apiClient.get<SessionDebriefResponseDto>('/ai/debrief/latest'),
  getDebriefs: (from: string, to: string) =>
    apiClient.get<SessionDebriefResponseDto[]>(`/ai/debriefs?from=${from}&to=${to}`),
  generateDebrief: () =>
    apiClient.post<SessionDebriefResponseDto>('/ai/debrief/generate'),

  // Disclaimer
  getDisclaimerStatus: () =>
    apiClient.get<DisclaimerStatusDto>('/ai/disclaimer/status'),
  acceptDisclaimer: () =>
    apiClient.post<DisclaimerStatusDto>('/ai/disclaimer/accept'),
};
