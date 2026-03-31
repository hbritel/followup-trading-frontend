import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { useAuth } from '@/contexts/auth-context';
import { invalidateDashboardData } from '@/lib/invalidate-dashboard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TradeEventType = 'SYNC_COMPLETE' | 'TRADE_IMPORTED';

interface TradeEventMessage {
  type: TradeEventType;
  tradesImported: number;
  connectionId: string;
  timestamp: string;
}

interface LiveTradesResult {
  /** The most recently received trade event, or null before the first message. */
  lastEvent: TradeEventMessage | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Subscribes to `/topic/trades/{userId}` via STOMP WebSocket.
 * On each event it:
 *  - Invalidates the `['trades']` React Query cache so the trade list refreshes.
 *  - Shows a sonner toast notification with the number of imported trades.
 *
 * Falls back gracefully when the WebSocket is not connected.
 */
export const useLiveTrades = (): LiveTradesResult => {
  const { user } = useAuth();
  const { subscribe, connected } = useWebSocket();
  const queryClient = useQueryClient();

  const [lastEvent, setLastEvent] = useState<TradeEventMessage | null>(null);

  useEffect(() => {
    if (!connected || !user?.id) return;

    const topic = `/topic/trades/${user.id}`;

    const unsubscribe = subscribe(topic, (message) => {
      try {
        const payload = JSON.parse(message.body) as TradeEventMessage;
        setLastEvent(payload);

        // Always invalidate so the trades table picks up the new data
        queryClient.invalidateQueries({ queryKey: ['trades'] });
        invalidateDashboardData(queryClient);

        if (payload.type === 'SYNC_COMPLETE') {
          toast.success(
            `Sync complete: ${payload.tradesImported} trade${payload.tradesImported !== 1 ? 's' : ''} imported`
          );
        } else if (payload.type === 'TRADE_IMPORTED') {
          toast.info(
            `Trade imported from connection ${payload.connectionId}`
          );
        }
      } catch (err) {
        console.error('[useLiveTrades] Failed to parse message:', err);
      }
    });

    return unsubscribe;
  }, [connected, user?.id, subscribe, queryClient]);

  return { lastEvent };
};
