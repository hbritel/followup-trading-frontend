import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { useAuth } from '@/contexts/auth-context';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AlertTriggeredMessage {
  alertId: string;
  alertType: string;
  symbol: string;
  message: string;
  triggeredAt: string;
}

interface LiveAlertsResult {
  /** The most recently triggered alert, or null before the first message. */
  lastAlert: AlertTriggeredMessage | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Subscribes to `/topic/alerts/{userId}` via STOMP WebSocket.
 * On each triggered alert it:
 *  - Invalidates the `['alerts']` React Query cache.
 *  - Shows a warning sonner toast with the alert message.
 *
 * Falls back gracefully when the WebSocket is not connected.
 */
export const useLiveAlerts = (): LiveAlertsResult => {
  const { user } = useAuth();
  const { subscribe, connected } = useWebSocket();
  const queryClient = useQueryClient();

  const [lastAlert, setLastAlert] = useState<AlertTriggeredMessage | null>(null);

  useEffect(() => {
    if (!connected || !user?.id) return;

    const topic = `/topic/alerts/${user.id}`;

    const unsubscribe = subscribe(topic, (message) => {
      try {
        const payload = JSON.parse(message.body) as AlertTriggeredMessage;
        setLastAlert(payload);

        // Refresh the alerts list so the triggered status is reflected
        queryClient.invalidateQueries({ queryKey: ['alerts'] });

        toast.warning(`Alert: ${payload.message}`, {
          description: payload.symbol
            ? `${payload.alertType} — ${payload.symbol}`
            : payload.alertType,
        });
      } catch (err) {
        console.error('[useLiveAlerts] Failed to parse message:', err);
      }
    });

    return unsubscribe;
  }, [connected, user?.id, subscribe, queryClient]);

  return { lastAlert };
};
