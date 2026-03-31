import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { watchlistService } from '@/services/watchlist.service';
import type { WatchlistResponseDto, WatchlistRequestDto, WatchlistItemRequestDto } from '@/types/dto';

const WATCHLISTS_KEY = ['watchlists'];

export const useWatchlists = () => {
  return useQuery({
    queryKey: WATCHLISTS_KEY,
    queryFn: () => watchlistService.getWatchlists(),
  });
};

export const useWatchlist = (id: string) => {
  return useQuery({
    queryKey: [...WATCHLISTS_KEY, id],
    queryFn: () => watchlistService.getWatchlist(id),
    enabled: !!id,
  });
};

export const useCreateWatchlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: WatchlistRequestDto) => watchlistService.createWatchlist(data),
    onSuccess: (created) => {
      queryClient.setQueryData<WatchlistResponseDto[]>(WATCHLISTS_KEY, (old = []) => [
        ...old,
        created,
      ]);
    },
  });
};

export const useUpdateWatchlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WatchlistRequestDto }) =>
      watchlistService.updateWatchlist(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: WATCHLISTS_KEY });
      const previous = queryClient.getQueryData<WatchlistResponseDto[]>(WATCHLISTS_KEY);
      queryClient.setQueryData<WatchlistResponseDto[]>(WATCHLISTS_KEY, (old = []) =>
        old.map((w) => (w.id === id ? { ...w, name: data.name, description: data.description ?? null, icon: data.icon ?? null } : w))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(WATCHLISTS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLISTS_KEY });
    },
  });
};

export const useDeleteWatchlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => watchlistService.deleteWatchlist(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: WATCHLISTS_KEY });
      const previous = queryClient.getQueryData<WatchlistResponseDto[]>(WATCHLISTS_KEY);
      queryClient.setQueryData<WatchlistResponseDto[]>(WATCHLISTS_KEY, (old = []) =>
        old.filter((w) => w.id !== id)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(WATCHLISTS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLISTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

export const useAddWatchlistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ watchlistId, data }: { watchlistId: string; data: WatchlistItemRequestDto }) =>
      watchlistService.addItem(watchlistId, data),
    onMutate: async ({ watchlistId, data }) => {
      await queryClient.cancelQueries({ queryKey: WATCHLISTS_KEY });
      const previous = queryClient.getQueryData<WatchlistResponseDto[]>(WATCHLISTS_KEY);
      const optimisticItem = {
        id: `temp-${Date.now()}`,
        symbol: data.symbol.toUpperCase(),
        notes: data.notes ?? null,
        alertPrice: data.alertPrice ?? null,
        alertId: null,
        alertCondition: data.alertCondition ?? null,
        activeAlertCount: 0,
        addedAt: new Date().toISOString(),
      };
      queryClient.setQueryData<WatchlistResponseDto[]>(WATCHLISTS_KEY, (old = []) =>
        old.map((w) =>
          w.id === watchlistId ? { ...w, items: [...w.items, optimisticItem] } : w
        )
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(WATCHLISTS_KEY, context.previous);
      }
    },
    onSettled: (_data, _err, { data }) => {
      queryClient.invalidateQueries({ queryKey: WATCHLISTS_KEY });
      if (data.alertPrice) {
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
      }
    },
  });
};

export const useRemoveWatchlistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ watchlistId, itemId }: { watchlistId: string; itemId: string }) =>
      watchlistService.removeItem(watchlistId, itemId),
    onMutate: async ({ watchlistId, itemId }) => {
      await queryClient.cancelQueries({ queryKey: WATCHLISTS_KEY });
      const previous = queryClient.getQueryData<WatchlistResponseDto[]>(WATCHLISTS_KEY);
      queryClient.setQueryData<WatchlistResponseDto[]>(WATCHLISTS_KEY, (old = []) =>
        old.map((w) =>
          w.id === watchlistId ? { ...w, items: w.items.filter((i) => i.id !== itemId) } : w
        )
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(WATCHLISTS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLISTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

export const useCreateAlertFromItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ watchlistId, itemId }: { watchlistId: string; itemId: string }) =>
      watchlistService.createAlertFromItem(watchlistId, itemId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLISTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};
