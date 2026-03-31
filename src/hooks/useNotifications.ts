import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificationService } from '@/services/notification.service';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { useAuth } from '@/contexts/auth-context';
import type { NotificationDto } from '@/types/dto';
import type { PageResponse } from '@/services/notification.service';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const NOTIFICATIONS_LIST_KEY = ['notifications', 'list'] as const;
const UNREAD_COUNT_KEY = ['notifications', 'unread-count'] as const;
const ALL_NOTIFICATIONS_KEY = ['notifications'] as const;

// ---------------------------------------------------------------------------
// Helper — guards setQueriesData callbacks against non-page shaped data
// ---------------------------------------------------------------------------

const isPageResponse = (data: unknown): data is PageResponse<NotificationDto> =>
  !!data && typeof data === 'object' && Array.isArray((data as any).content);

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const useNotifications = (page = 0, size = 20) => {
  return useQuery({
    queryKey: [...NOTIFICATIONS_LIST_KEY, page, size],
    queryFn: () => notificationService.getNotifications(page, size),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // poll every 30s as a safety net
    refetchOnWindowFocus: true,
  });
};

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    // Optimistic update — flip the `read` flag immediately
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_LIST_KEY });

      const previousData = queryClient.getQueriesData<PageResponse<NotificationDto>>({
        queryKey: NOTIFICATIONS_LIST_KEY,
      });

      queryClient.setQueriesData<PageResponse<NotificationDto>>(
        { queryKey: NOTIFICATIONS_LIST_KEY },
        (old) => {
          if (!isPageResponse(old)) return old;
          return {
            ...old,
            content: old.content.map((n) =>
              n.id === id ? { ...n, read: true } : n,
            ),
          };
        },
      );

      // Decrement unread count optimistically
      queryClient.setQueryData<{ count: number }>(UNREAD_COUNT_KEY, (old) => {
        if (!old) return old;
        return { count: Math.max(0, old.count - 1) };
      });

      return { previousData };
    },
    onError: (_err, _id, context) => {
      // Rollback on failure
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_LIST_KEY });

      const previousNotifications = queryClient.getQueriesData<PageResponse<NotificationDto>>({
        queryKey: NOTIFICATIONS_LIST_KEY,
      });
      const previousCount = queryClient.getQueryData<{ count: number }>(UNREAD_COUNT_KEY);

      queryClient.setQueriesData<PageResponse<NotificationDto>>(
        { queryKey: NOTIFICATIONS_LIST_KEY },
        (old) => {
          if (!isPageResponse(old)) return old;
          return {
            ...old,
            content: old.content.map((n) => ({ ...n, read: true })),
          };
        },
      );

      queryClient.setQueryData<{ count: number }>(UNREAD_COUNT_KEY, { count: 0 });

      return { previousNotifications, previousCount };
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
    },
    onError: (err, _vars, context) => {
      console.error('[useMarkAllAsRead] Error:', err);
      // Rollback on failure
      if (context?.previousNotifications) {
        context.previousNotifications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousCount) {
        queryClient.setQueryData(UNREAD_COUNT_KEY, context.previousCount);
      }
      toast.error('Failed to mark notifications as read');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
};

// ---------------------------------------------------------------------------
// Live WebSocket hook
// ---------------------------------------------------------------------------

/**
 * Subscribes to `/topic/notifications/{userId}` via STOMP.
 * On each message: invalidates notifications cache, increments unread count,
 * and shows a toast.
 */
export const useLiveNotifications = (): void => {
  const { user } = useAuth();
  const { subscribe, connected } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!connected || !user?.id) return;

    const topic = `/topic/notifications/${user.id}`;

    const unsubscribe = subscribe(topic, (message) => {
      try {
        const payload = JSON.parse(message.body) as NotificationDto;

        // Invalidate list so new notification appears at top
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_LIST_KEY });

        // Increment unread count in cache immediately
        queryClient.setQueryData<{ count: number }>(UNREAD_COUNT_KEY, (old) => ({
          count: (old?.count ?? 0) + 1,
        }));

        // Show toast notification
        const toastFn = payload.priority === 'HIGH' ? toast.error : toast.info;
        toastFn(payload.title, {
          description: payload.message,
        });
      } catch (err) {
        console.error('[useLiveNotifications] Failed to parse message:', err);
      }
    });

    return unsubscribe;
  }, [connected, user?.id, subscribe, queryClient]);
};
