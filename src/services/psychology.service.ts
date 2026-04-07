import apiClient from './apiClient';
import type {
  PsychologyEntryRequestDto,
  PsychologyEntryResponseDto,
  PsychologyCorrelationResponseDto,
} from '@/types/dto';

export const psychologyService = {
  logEmotion: (tradeId: string, data: PsychologyEntryRequestDto) =>
    apiClient.post<PsychologyEntryResponseDto>(`/trades/${tradeId}/psychology`, data),
  getByTradeId: (tradeId: string) =>
    apiClient.get<PsychologyEntryResponseDto>(`/trades/${tradeId}/psychology`),
  getCorrelation: () =>
    apiClient.get<PsychologyCorrelationResponseDto>('/ai/psychology/correlation'),
};
