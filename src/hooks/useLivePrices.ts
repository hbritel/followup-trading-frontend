import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { useAuth } from '@/contexts/auth-context';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PriceUpdateMessage {
  prices: Record<string, number>;
  timestamp: string;
}

interface LivePricesResult {
  /** Map of symbol → latest price. Empty until first WS message arrives. */
  prices: Record<string, number>;
  /** ISO timestamp of the last received price update, or null if none yet. */
  lastUpdate: string | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Subscribes to `/topic/prices/{userId}` via STOMP WebSocket.
 * Stores received prices in local state and also patches the React Query
 * cache for `['dashboardSummary']` so live data flows into dashboard cards.
 *
 * Falls back gracefully when the WebSocket is not connected.
 */
export const useLivePrices = (): LivePricesResult => {
  const { user } = useAuth();
  const { subscribe, connected } = useWebSocket();
  const queryClient = useQueryClient();

  const [prices, setPrices] = useState<Record<string, number>>({});
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // Keep a ref to the latest prices so we can merge without stale closure
  const pricesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!connected || !user?.id) return;

    const topic = `/topic/prices/${user.id}`;

    const unsubscribe = subscribe(topic, (message) => {
      try {
        const payload = JSON.parse(message.body) as PriceUpdateMessage;

        // Merge new prices on top of existing ones
        const merged = { ...pricesRef.current, ...payload.prices };
        pricesRef.current = merged;
        setPrices(merged);
        setLastUpdate(payload.timestamp);

        // Patch the dashboard summary cache so KPI cards reflect live prices
        // without triggering a full network refetch.
        queryClient.setQueriesData(
          { queryKey: ['dashboard-summary'] },
          (oldData: unknown) => {
            if (!oldData || typeof oldData !== 'object') return oldData;
            return {
              ...(oldData as Record<string, unknown>),
              livePrices: merged,
              priceLastUpdate: payload.timestamp,
            };
          }
        );
      } catch (err) {
        console.error('[useLivePrices] Failed to parse message:', err);
      }
    });

    return unsubscribe;
  }, [connected, user?.id, subscribe, queryClient]);

  return { prices, lastUpdate };
};
