import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { watchlistService } from '@/services/watchlist.service';
import type { WatchlistRequestDto, WatchlistItemRequestDto } from '@/types/dto';

const WATCHLISTS_KEY = ['watchlists'];

export const useWatchlists = () => {
  return useQuery({
    queryKey: WATCHLISTS_KEY,
    queryFn: () => watchlistService.getWatchlists(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
  });
};

export const useWatchlist = (id: string) => {
  return useQuery({
    queryKey: [...WATCHLISTS_KEY, id],
    queryFn: () => watchlistService.getWatchlist(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateWatchlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: WatchlistRequestDto) => watchlistService.createWatchlist(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLISTS_KEY });
    },
  });
};

export const useUpdateWatchlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WatchlistRequestDto }) =>
      watchlistService.updateWatchlist(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLISTS_KEY });
    },
  });
};

export const useDeleteWatchlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => watchlistService.deleteWatchlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLISTS_KEY });
    },
  });
};

export const useAddWatchlistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ watchlistId, data }: { watchlistId: string; data: WatchlistItemRequestDto }) =>
      watchlistService.addItem(watchlistId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLISTS_KEY });
    },
  });
};

export const useRemoveWatchlistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ watchlistId, itemId }: { watchlistId: string; itemId: string }) =>
      watchlistService.removeItem(watchlistId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLISTS_KEY });
    },
  });
};
