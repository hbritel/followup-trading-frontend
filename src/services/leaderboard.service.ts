import apiClient from './apiClient';
import type { LeaderboardResponseDto, LeaderboardEntryDto } from '@/types/dto';

export const leaderboardService = {
  getLeaderboard: (type: string, page = 0, size = 20) =>
    apiClient.get<LeaderboardResponseDto>(`/social/leaderboards/${type}`, { params: { page, size } }),

  getSummary: () =>
    apiClient.get<Record<string, LeaderboardEntryDto[]>>('/social/leaderboards'),
};
