import apiClient from './apiClient';
import type {
  UserFollowDto,
  SharedStrategyDto,
  FeedItemDto,
  ShareStrategyRequestDto,
} from '@/types/dto';

export const socialService = {
  // Follow / unfollow
  follow: async (userId: string): Promise<void> => {
    await apiClient.post(`/social/follow/${userId}`);
  },

  unfollow: async (userId: string): Promise<void> => {
    await apiClient.delete(`/social/follow/${userId}`);
  },

  getFollowers: async (): Promise<UserFollowDto[]> => {
    const response = await apiClient.get<UserFollowDto[]>('/social/followers');
    return response.data;
  },

  getFollowing: async (): Promise<UserFollowDto[]> => {
    const response = await apiClient.get<UserFollowDto[]>('/social/following');
    return response.data;
  },

  // Traders directory
  getTraders: async (search?: string): Promise<UserFollowDto[]> => {
    const response = await apiClient.get<UserFollowDto[]>('/social/traders', {
      params: search ? { search } : undefined,
    });
    return response.data;
  },

  // Strategy marketplace
  getMarketplace: async (sort: 'popular' | 'recent' = 'popular', page = 0, size = 20): Promise<SharedStrategyDto[]> => {
    const response = await apiClient.get<SharedStrategyDto[]>('/marketplace/strategies', {
      params: { sort, page, size },
    });
    return response.data;
  },

  shareStrategy: async (data: ShareStrategyRequestDto): Promise<SharedStrategyDto> => {
    const response = await apiClient.post<SharedStrategyDto>('/marketplace/strategies', data);
    return response.data;
  },

  toggleLike: async (strategyId: string): Promise<{ liked: boolean }> => {
    const response = await apiClient.post<{ liked: boolean }>(`/marketplace/strategies/${strategyId}/like`);
    return response.data;
  },

  copyStrategy: async (strategyId: string): Promise<void> => {
    await apiClient.post(`/marketplace/strategies/${strategyId}/copy`);
  },

  getMyStrategies: async (): Promise<SharedStrategyDto[]> => {
    const response = await apiClient.get<SharedStrategyDto[]>('/marketplace/my-strategies');
    return response.data;
  },

  getStrategyDetail: async (id: string): Promise<SharedStrategyDto> => {
    const response = await apiClient.get<SharedStrategyDto>(`/marketplace/strategies/${id}`);
    return response.data;
  },

  updateStrategy: async (id: string, data: Partial<ShareStrategyRequestDto>): Promise<SharedStrategyDto> => {
    const response = await apiClient.put<SharedStrategyDto>(`/marketplace/strategies/${id}`, data);
    return response.data;
  },

  deleteStrategy: async (id: string): Promise<void> => {
    await apiClient.delete(`/marketplace/strategies/${id}`);
  },

  // Feed
  getFeed: async (page = 0, size = 20): Promise<FeedItemDto[]> => {
    const response = await apiClient.get<FeedItemDto[]>('/social/feed', {
      params: { page, size },
    });
    return response.data;
  },
};
