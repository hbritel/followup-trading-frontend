import apiClient from './apiClient';
import type {
  PsychologyEntryRequestDto,
  PsychologyEntryResponseDto,
  PsychologyCorrelationResponseDto,
} from '@/types/dto';

/** Consent state for psychology tracking, returned by `/ai/psychology/consent`. */
export interface PsychologyConsentDto {
  enabled: boolean;
  consentAt: string | null;
}

export const psychologyService = {
  logEmotion: (tradeId: string, data: PsychologyEntryRequestDto) =>
    apiClient.post<PsychologyEntryResponseDto>(`/trades/${tradeId}/psychology`, data),
  getByTradeId: (tradeId: string) =>
    apiClient.get<PsychologyEntryResponseDto>(`/trades/${tradeId}/psychology`),
  getCorrelation: () =>
    apiClient.get<PsychologyCorrelationResponseDto>('/ai/psychology/correlation'),
  getConsent: () =>
    apiClient.get<PsychologyConsentDto>('/ai/psychology/consent'),
  setConsent: (enabled: boolean) =>
    apiClient.put<PsychologyConsentDto>('/ai/psychology/consent', { enabled }),
};
