import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketFeedService } from '@/services/marketfeed.service';
import type { MarketFeedCategory, MarketFeedSource } from '@/types/dto';

export const useMarketFeed = (category: MarketFeedCategory = 'ALL', page = 0, size = 30) =>
  useQuery({
    queryKey: ['market-feed', category, page, size],
    queryFn: () => marketFeedService.getFeed({ category, page, size }),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

export const useMarketFeedSources = () =>
  useQuery({
    queryKey: ['market-feed', 'sources'],
    queryFn: () => marketFeedService.getSources(),
    staleTime: 10 * 60 * 1000,
  });

export const useRecommendedSources = () =>
  useQuery({
    queryKey: ['market-feed', 'recommended'],
    queryFn: () => marketFeedService.getRecommendedSources(),
    staleTime: 10 * 60 * 1000,
  });

export const useDeleteFeedSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sourceId: string) => marketFeedService.deleteSource(sourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-feed', 'sources'] });
      queryClient.invalidateQueries({ queryKey: ['market-feed', 'recommended'] });
      queryClient.invalidateQueries({ queryKey: ['market-feed'] });
    },
  });
};

export const useToggleFeedSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceId, enabled }: { sourceId: string; enabled: boolean }) =>
      marketFeedService.toggleSource(sourceId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-feed', 'sources'] });
      queryClient.invalidateQueries({ queryKey: ['market-feed'] });
    },
  });
};

export const useSubscribeToSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      source: MarketFeedSource;
      sourceKey: string;
      label: string;
      categories: MarketFeedCategory[];
    }) => marketFeedService.subscribeToSource(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-feed', 'sources'] });
      queryClient.invalidateQueries({ queryKey: ['market-feed', 'recommended'] });
      queryClient.invalidateQueries({ queryKey: ['market-feed'] });
    },
  });
};
