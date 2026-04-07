import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { coachService } from '@/services/coach.service';
import type { TiltScoreResponseDto } from '@/types/dto';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { useAuth } from '@/contexts/auth-context';

const TILT_KEY = ['ai', 'coach', 'tilt'];

export const useTiltScore = () => {
  const queryClient = useQueryClient();
  const { subscribe } = useWebSocket();
  const { user } = useAuth();

  const query = useQuery<TiltScoreResponseDto | null>({
    queryKey: TILT_KEY,
    queryFn: async () => {
      try {
        const res = await coachService.getTiltScore();
        return res.data;
      } catch (err: unknown) {
        if ((err as { response?: { status?: number } })?.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Real-time tilt updates
  useEffect(() => {
    if (!user?.id) return;
    const topic = `/topic/users/${user.id}/tilt`;
    const unsubscribe = subscribe(topic, () => {
      void queryClient.invalidateQueries({ queryKey: TILT_KEY });
    });
    return unsubscribe;
  }, [user?.id, subscribe, queryClient]);

  return query;
};
