import apiClient from './apiClient';
import type {
  ChartAnalysisList,
  ChartAnalysisRequest,
  ChartAnalysisResponse,
} from '@/types/visionAnalysis';

/**
 * Vision chart analysis service — Sprint 4 of the AI-first roadmap.
 *
 * <p>Calls {@code POST /api/v1/ai/vision/analyze-chart} (multipart) for chart
 * analysis and the matching read endpoints for history / single lookup.
 * Returns {@code null} on 404 / 503 (feature flagged off server-side or no
 * provider configured) so the caller can render an "unavailable" state.
 * Throws on 4xx other than the not-found / locked codes so React Query can
 * surface validation errors and the PRO upgrade prompt.</p>
 */
export const visionAnalysisService = {
  async analyze(request: ChartAnalysisRequest): Promise<ChartAnalysisResponse | null> {
    const form = new FormData();
    form.append('image', request.image);
    if (request.tradeId) {
      form.append('tradeId', request.tradeId);
    }
    if (request.tradeContext) {
      form.append('tradeContext', request.tradeContext);
    }
    if (request.prompt) {
      form.append('prompt', request.prompt);
    }
    if (request.locale) {
      form.append('locale', request.locale);
    }
    try {
      const res = await apiClient.post<ChartAnalysisResponse>(
        '/ai/vision/analyze-chart',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
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

  async listRecent(limit = 20): Promise<ChartAnalysisResponse[]> {
    const res = await apiClient.get<ChartAnalysisList>('/ai/vision/analyses', {
      params: { limit },
    });
    return res.data?.analyses ?? [];
  },

  async getById(id: string): Promise<ChartAnalysisResponse | null> {
    try {
      const res = await apiClient.get<ChartAnalysisResponse>(`/ai/vision/analyses/${id}`);
      return res.data;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } } | null)?.response?.status;
      if (status === 404) {
        return null;
      }
      throw err;
    }
  },
};
