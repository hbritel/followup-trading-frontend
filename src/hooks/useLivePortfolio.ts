import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { useAuth } from '@/contexts/auth-context';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LivePosition {
  symbol: string;
  currentPrice: number;
  unrealizedPnl: number;
  changePercent: number;
}

interface PortfolioUpdateMessage {
  totalUnrealizedPnl: number;
  equity: number;
  positions: LivePosition[];
  timestamp: string;
}

interface LivePortfolioResult {
  /** Latest portfolio snapshot, or null before the first WS message. */
  portfolio: PortfolioUpdateMessage | null;
  /** ISO timestamp of the last received update, or null if none yet. */
  lastUpdate: string | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Subscribes to `/topic/portfolio/{userId}` via STOMP WebSocket.
 * Writes incoming data directly into the `['dashboardSummary']` React Query
 * cache so the dashboard reflects live P&L without a network request.
 *
 * Falls back gracefully when the WebSocket is not connected.
 */
export const useLivePortfolio = (): LivePortfolioResult => {
  const { user } = useAuth();
  const { subscribe, connected } = useWebSocket();
  const queryClient = useQueryClient();

  const [portfolio, setPortfolio] = useState<PortfolioUpdateMessage | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    if (!connected || !user?.id) return;

    const topic = `/topic/portfolio/${user.id}`;

    const unsubscribe = subscribe(topic, (message) => {
      try {
        const payload = JSON.parse(message.body) as PortfolioUpdateMessage;
        setPortfolio(payload);
        setLastUpdate(payload.timestamp);

        // Patch the ['dashboardSummary'] cache entries (all param variants)
        // so the open-positions panel and equity cards update in real-time.
        queryClient.setQueriesData(
          { queryKey: ['dashboard-summary'] },
          (oldData: unknown) => {
            if (!oldData || typeof oldData !== 'object') return oldData;

            return {
              ...(oldData as Record<string, unknown>),
              totalUnrealizedPnl: payload.totalUnrealizedPnl,
              equity: payload.equity,
              // Map to the shape expected by OpenPositionsPanel
              openPositions: payload.positions.map((pos) => ({
                symbol: pos.symbol,
                currentPrice: pos.currentPrice,
                unrealizedPnl: pos.unrealizedPnl,
                changePercent: pos.changePercent,
              })),
            };
          }
        );
      } catch (err) {
        console.error('[useLivePortfolio] Failed to parse message:', err);
      }
    });

    return unsubscribe;
  }, [connected, user?.id, subscribe, queryClient]);

  return { portfolio, lastUpdate };
};
