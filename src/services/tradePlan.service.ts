import apiClient from './apiClient';
import type { TradePlanRequestDto, TradePlanScoreResponseDto } from '@/types/dto';

export const tradePlanService = {
  score: (data: TradePlanRequestDto) =>
    apiClient.post<TradePlanScoreResponseDto>('/ai/trade-plan/score', data),
};
