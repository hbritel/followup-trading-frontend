import apiClient from './apiClient';
import type {
  CreateSpreadRequestDto,
  OptionPortfolioGreeksDto,
  OptionSpreadAnalyticsDto,
  OptionSpreadDto,
} from '@/types/dto';
// TODO(cleanup): clean mocked data on options page
// Remove everything between this TODO and the matching "END TODO" marker once
// the backend is populated with real option spread data. Steps:
//   1. Delete the import from '@/data/optionSpreadsMock' below.
//   2. Delete the USE_MOCK_FALLBACK constant.
//   3. Delete each `catch` block + empty-response check in the service methods
//      (just return `response.data` directly).
//   4. Delete the file src/data/optionSpreadsMock.ts.
import {
  getEnrichedMockSpreads,
  getMockAnalytics,
  getMockPortfolioGreeks,
} from '@/data/optionSpreadsMock';

const BASE = '/options';

/**
 * TEMPORARY — set to false to bypass mock fallbacks entirely. When true the
 * service returns mock data on empty responses AND on any error (so the page
 * is demoable even without a running backend). Flip off once Phase 2/3 data
 * is flowing end-to-end. See TODO above.
 */
const USE_MOCK_FALLBACK = true;

function filterByStatus(status: string | undefined, list: OptionSpreadDto[]): OptionSpreadDto[] {
  if (!status) return list;
  return list.filter((s) => s.status === status);
}

export const optionSpreadService = {
  detectSpreads: async (): Promise<OptionSpreadDto[]> => {
    try {
      const response = await apiClient.post<OptionSpreadDto[]>(`${BASE}/detect`);
      if (response.data && response.data.length > 0) return response.data;
    } catch (err) {
      if (!USE_MOCK_FALLBACK) throw err;
    }
    return USE_MOCK_FALLBACK ? getEnrichedMockSpreads() : [];
  },

  getSpreads: async (status?: string): Promise<OptionSpreadDto[]> => {
    try {
      const response = await apiClient.get<OptionSpreadDto[]>(`${BASE}/spreads`, {
        params: status ? { status } : undefined,
      });
      if (response.data && response.data.length > 0) return response.data;
    } catch (err) {
      if (!USE_MOCK_FALLBACK) throw err;
    }
    return USE_MOCK_FALLBACK ? filterByStatus(status, getEnrichedMockSpreads()) : [];
  },

  getSpreadDetail: async (id: string): Promise<OptionSpreadDto> => {
    try {
      const response = await apiClient.get<OptionSpreadDto>(`${BASE}/spreads/${id}`);
      return response.data;
    } catch (err) {
      if (!USE_MOCK_FALLBACK) throw err;
      const mock = getEnrichedMockSpreads().find((s) => s.id === id);
      if (!mock) throw err;
      return mock;
    }
  },

  createSpread: async (payload: CreateSpreadRequestDto): Promise<OptionSpreadDto> => {
    const response = await apiClient.post<OptionSpreadDto>(`${BASE}/spreads`, payload);
    return response.data;
  },

  getAnalytics: async (): Promise<OptionSpreadAnalyticsDto> => {
    try {
      const response = await apiClient.get<OptionSpreadAnalyticsDto>(`${BASE}/analytics`);
      if (response.data && response.data.overall && response.data.overall.total > 0) {
        return response.data;
      }
    } catch (err) {
      if (!USE_MOCK_FALLBACK) throw err;
    }
    return USE_MOCK_FALLBACK
      ? getMockAnalytics()
      : ({ overall: { total: 0, openCount: 0, closedCount: 0, expiredCount: 0, totalRealized: 0, winRate: null }, perType: [], perUnderlying: [] });
  },

  getPortfolioGreeks: async (): Promise<OptionPortfolioGreeksDto> => {
    try {
      const response = await apiClient.get<OptionPortfolioGreeksDto>(`${BASE}/portfolio-greeks`);
      if (response.data && response.data.legsWithGreeks > 0) return response.data;
    } catch (err) {
      if (!USE_MOCK_FALLBACK) throw err;
    }
    return USE_MOCK_FALLBACK
      ? getMockPortfolioGreeks()
      : ({ openSpreadCount: 0, legsWithGreeks: 0, totalDelta: 0, totalGamma: 0, totalTheta: 0, totalVega: 0 });
  },

  exportCsv: async (): Promise<Blob> => {
    const response = await apiClient.get<Blob>(`${BASE}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
