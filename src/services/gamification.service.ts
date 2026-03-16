import apiClient from './apiClient';
import type {
  GamificationProfileDto,
  BadgeDto,
  LeaderboardEntryDto,
  PublicProfileDto,
  UpdatePublicProfileRequestDto,
} from '@/types/dto';

export interface LeaderboardPageDto {
  content: LeaderboardEntryDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const gamificationService = {
  getProfile: async (): Promise<GamificationProfileDto> => {
    const response = await apiClient.get<GamificationProfileDto>('/gamification/profile');
    return response.data;
  },

  getBadges: async (): Promise<BadgeDto[]> => {
    const response = await apiClient.get<BadgeDto[]>('/gamification/badges');
    return response.data;
  },

  getRecentBadges: async (): Promise<BadgeDto[]> => {
    const response = await apiClient.get<BadgeDto[]>('/gamification/badges/recent');
    return response.data;
  },

  getLeaderboard: async (
    period: 'week' | 'month' | 'all',
    page = 0,
    size = 20,
  ): Promise<LeaderboardPageDto> => {
    const response = await apiClient.get<LeaderboardPageDto>('/gamification/leaderboard', {
      params: { period, page, size },
    });
    return response.data;
  },

  updatePublicProfile: async (
    payload: UpdatePublicProfileRequestDto,
  ): Promise<GamificationProfileDto> => {
    const response = await apiClient.put<GamificationProfileDto>(
      '/gamification/profile/public',
      payload,
    );
    return response.data;
  },

  getPublicProfile: async (username: string): Promise<PublicProfileDto> => {
    const response = await apiClient.get<PublicProfileDto>(`/p/${username}`);
    return response.data;
  },

  getProfileCardUrl: (username: string): string =>
    `/api/v1/p/${username}/card.png`,
};
