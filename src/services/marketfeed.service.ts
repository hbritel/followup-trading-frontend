import apiClient from './apiClient';
import type { MarketFeedItemDto, MarketFeedSourceConfig, MarketFeedCategory, MarketFeedSource } from '@/types/dto';

export interface RecommendedSourceDto {
  source: MarketFeedSource;
  sourceKey: string;
  label: string;
  reason: string;
  categories: MarketFeedCategory[];
  relevanceScore: number;
}

export const marketFeedService = {
  getFeed: async (params: {
    category?: MarketFeedCategory;
    sources?: string[];
    page?: number;
    size?: number;
    refresh?: boolean;
  }): Promise<{ items: MarketFeedItemDto[]; totalPages: number }> => {
    const response = await apiClient.get('/market-feed', { params });
    return response.data;
  },

  getSources: async (): Promise<MarketFeedSourceConfig[]> => {
    const response = await apiClient.get<MarketFeedSourceConfig[]>('/market-feed/sources');
    return response.data;
  },

  toggleSource: async (sourceId: string, enabled: boolean): Promise<void> => {
    await apiClient.patch(`/market-feed/sources/${sourceId}`, { enabled });
  },

  deleteSource: async (sourceId: string): Promise<void> => {
    await apiClient.delete(`/market-feed/sources/${sourceId}`);
  },

  getRecommendedSources: async (): Promise<RecommendedSourceDto[]> => {
    const response = await apiClient.get<RecommendedSourceDto[]>('/market-feed/recommended');
    return response.data;
  },

  subscribeToSource: async (params: {
    source: MarketFeedSource;
    sourceKey: string;
    label: string;
    categories: MarketFeedCategory[];
  }): Promise<MarketFeedSourceConfig> => {
    const response = await apiClient.post<MarketFeedSourceConfig>('/market-feed/sources/subscribe', params);
    return response.data;
  },
};
