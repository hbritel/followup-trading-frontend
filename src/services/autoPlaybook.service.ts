import apiClient from './apiClient';
import type {
  GeneratePlaybookRequest,
  GeneratedPlaybookList,
  GeneratedPlaybookResponse,
} from '@/types/autoPlaybook';

/**
 * Auto-playbook generator service — Sprint 4 of the AI-first roadmap.
 *
 * <p>Calls {@code POST /api/v1/ai/playbook/generate} (synchronous, 5-15 s
 * round-trip). Returns {@code null} on 404 / 503 (feature flagged off
 * server-side or LLM provider unavailable) so callers can render an
 * "unavailable" state. Throws on 4xx with structured server bodies so
 * React Query can surface the validation message and the upgrade prompt.</p>
 */
export const autoPlaybookService = {
  async generate(request: GeneratePlaybookRequest): Promise<GeneratedPlaybookResponse | null> {
    try {
      const res = await apiClient.post<GeneratedPlaybookResponse>(
        '/ai/playbook/generate',
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

  async listRecent(limit = 20): Promise<GeneratedPlaybookResponse[]> {
    const res = await apiClient.get<GeneratedPlaybookList>('/ai/playbook', {
      params: { limit },
    });
    return res.data?.playbooks ?? [];
  },

  async getById(id: string): Promise<GeneratedPlaybookResponse | null> {
    try {
      const res = await apiClient.get<GeneratedPlaybookResponse>(`/ai/playbook/${id}`);
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
