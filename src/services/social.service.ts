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
    const response = await apiClient.get<SharedStrategyDto[]>('/social/marketplace', {
      params: { sort, page, size },
    });
    return response.data;
  },

  shareStrategy: async (data: ShareStrategyRequestDto): Promise<SharedStrategyDto> => {
    const response = await apiClient.post<SharedStrategyDto>('/social/marketplace', data);
    return response.data;
  },

  likeStrategy: async (strategyId: string): Promise<void> => {
    await apiClient.post(`/social/marketplace/${strategyId}/like`);
  },

  unlikeStrategy: async (strategyId: string): Promise<void> => {
    await apiClient.delete(`/social/marketplace/${strategyId}/like`);
  },

  copyStrategy: async (strategyId: string): Promise<void> => {
    await apiClient.post(`/social/marketplace/${strategyId}/copy`);
  },

  // Feed
  getFeed: async (page = 0, size = 20): Promise<FeedItemDto[]> => {
    const response = await apiClient.get<FeedItemDto[]>('/social/feed', {
      params: { page, size },
    });
    return response.data;
  },
};
