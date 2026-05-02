import apiClient from './apiClient';
import type {
  TradePlanningRequest,
  TradePlanningResponse,
} from '@/types/tradePlanning';

/**
 * Pre-trade planning score (Sprint 3 of the AI-first roadmap).
 *
 * <p>Calls {@code POST /api/v1/ai/trade-planning/score} to get a 0-100 score
 * computed from the user's own historical trades plus the live tilt signal.
 * Returns {@code null} on 404 / 503 (feature flagged off server-side); throws
 * the original error otherwise so React Query can surface it.</p>
 */
export const tradePlanningService = {
  async score(request: TradePlanningRequest): Promise<TradePlanningResponse | null> {
    try {
      const res = await apiClient.post<TradePlanningResponse>(
        '/ai/trade-planning/score',
        request,
      );
      return res.data;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } } | null)?.response?.status;
      if (status === 404 || status === 503) {
        return null;
      }
      throw err;
    }
  },
};
