import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coachService } from '@/services/coach.service';
import type { BehavioralAlertResponseDto } from '@/types/dto';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

const ALERTS_KEY = ['ai', 'coach', 'alerts'];

export const useBehavioralAlerts = () => {
  const queryClient = useQueryClient();
  const { subscribe } = useWebSocket();
  const { user } = useAuth();

  const query = useQuery<BehavioralAlertResponseDto[]>({
    queryKey: ALERTS_KEY,
    queryFn: async () => {
      const res = await coachService.getActiveAlerts();
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!user?.id) return;
    const topic = `/topic/users/${user.id}/coach`;
    const unsubscribe = subscribe(topic, () => {
      void queryClient.invalidateQueries({ queryKey: ALERTS_KEY });
    });
    return unsubscribe;
  }, [user?.id, subscribe, queryClient]);

  return query;
};

export const useDismissAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await coachService.dismissAlert(id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<BehavioralAlertResponseDto[]>(ALERTS_KEY, (prev) =>
        prev ? prev.filter((a) => a.id !== id) : []
      );
    },
    onError: () => {
      toast.error('Failed to dismiss alert.');
    },
  });
};
