import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { gamificationService } from '@/services/gamification.service';
import type { UpdatePublicProfileRequestDto } from '@/types/dto';

const PROFILE_KEY = ['gamification', 'profile'];
const BADGES_KEY = ['gamification', 'badges'];
const RECENT_BADGES_KEY = ['gamification', 'badges', 'recent'];

export const useGamificationProfile = () =>
  useQuery({
    queryKey: PROFILE_KEY,
    queryFn: () => gamificationService.getProfile(),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

export const useBadges = () =>
  useQuery({
    queryKey: BADGES_KEY,
    queryFn: () => gamificationService.getBadges(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

export const useRecentBadges = () =>
  useQuery({
    queryKey: RECENT_BADGES_KEY,
    queryFn: () => gamificationService.getRecentBadges(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

export const useLeaderboard = (
  period: 'week' | 'month' | 'all' = 'all',
  page = 0,
  size = 20,
) =>
  useQuery({
    queryKey: ['gamification', 'leaderboard', period, page, size],
    queryFn: () => gamificationService.getLeaderboard(period, page, size),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

export const useUpdatePublicProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePublicProfileRequestDto) =>
      gamificationService.updatePublicProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
    },
  });
};

export const usePublicProfile = (username: string | undefined) =>
  useQuery({
    queryKey: ['gamification', 'public-profile', username],
    queryFn: () => gamificationService.getPublicProfile(username!),
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
