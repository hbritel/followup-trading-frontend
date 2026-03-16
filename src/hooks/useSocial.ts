import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialService } from '@/services/social.service';
import type { ShareStrategyRequestDto, SharedStrategyDto } from '@/types/dto';

const QUERY_KEYS = {
  followers: ['social', 'followers'] as const,
  following: ['social', 'following'] as const,
  traders: (search?: string) => ['social', 'traders', search ?? ''] as const,
  marketplace: (sort: string) => ['social', 'marketplace', sort] as const,
  feed: ['social', 'feed'] as const,
};

// ------------------------------------------------------------------
// Queries
// ------------------------------------------------------------------

export const useFollowers = () =>
  useQuery({
    queryKey: QUERY_KEYS.followers,
    queryFn: () => socialService.getFollowers(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useFollowing = () =>
  useQuery({
    queryKey: QUERY_KEYS.following,
    queryFn: () => socialService.getFollowing(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useTraders = (search?: string) =>
  useQuery({
    queryKey: QUERY_KEYS.traders(search),
    queryFn: () => socialService.getTraders(search),
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useMarketplace = (sort: 'popular' | 'recent' = 'popular') =>
  useQuery({
    queryKey: QUERY_KEYS.marketplace(sort),
    queryFn: () => socialService.getMarketplace(sort),
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useFeed = () =>
  useQuery({
    queryKey: QUERY_KEYS.feed,
    queryFn: () => socialService.getFeed(),
    staleTime: 1 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

// ------------------------------------------------------------------
// Mutations
// ------------------------------------------------------------------

export const useFollow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => socialService.follow(userId),
    onMutate: async (userId: string) => {
      // Optimistic update in traders list
      await queryClient.cancelQueries({ queryKey: ['social', 'traders'] });
      const previousData = queryClient.getQueriesData({ queryKey: ['social', 'traders'] });
      queryClient.setQueriesData(
        { queryKey: ['social', 'traders'] },
        (old: { id: string; isFollowing: boolean }[] | undefined) =>
          old?.map((t) => (t.id === userId ? { ...t, isFollowing: true } : t)),
      );
      return { previousData };
    },
    onError: (_err, _userId, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.following });
      queryClient.invalidateQueries({ queryKey: ['social', 'traders'] });
    },
  });
};

export const useUnfollow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => socialService.unfollow(userId),
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: ['social', 'traders'] });
      const previousData = queryClient.getQueriesData({ queryKey: ['social', 'traders'] });
      queryClient.setQueriesData(
        { queryKey: ['social', 'traders'] },
        (old: { id: string; isFollowing: boolean }[] | undefined) =>
          old?.map((t) => (t.id === userId ? { ...t, isFollowing: false } : t)),
      );
      return { previousData };
    },
    onError: (_err, _userId, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.following });
      queryClient.invalidateQueries({ queryKey: ['social', 'traders'] });
    },
  });
};

export const useLikeStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ strategyId, isLiked }: { strategyId: string; isLiked: boolean }) =>
      isLiked ? socialService.unlikeStrategy(strategyId) : socialService.likeStrategy(strategyId),
    onMutate: async ({ strategyId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['social', 'marketplace'] });
      const previousData = queryClient.getQueriesData({ queryKey: ['social', 'marketplace'] });
      queryClient.setQueriesData(
        { queryKey: ['social', 'marketplace'] },
        (old: SharedStrategyDto[] | undefined) =>
          old?.map((s) =>
            s.id === strategyId
              ? { ...s, isLiked: !isLiked, likes: isLiked ? s.likes - 1 : s.likes + 1 }
              : s,
          ),
      );
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['social', 'marketplace'] });
    },
  });
};

export const useCopyStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (strategyId: string) => socialService.copyStrategy(strategyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      queryClient.invalidateQueries({ queryKey: ['social', 'marketplace'] });
    },
  });
};

export const useShareStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ShareStrategyRequestDto) => socialService.shareStrategy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social', 'marketplace'] });
    },
  });
};
