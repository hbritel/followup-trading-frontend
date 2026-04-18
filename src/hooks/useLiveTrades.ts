import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { useAuth } from '@/contexts/auth-context';
import { invalidateDashboardData } from '@/lib/invalidate-dashboard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TradeEventType = 'SYNC_STARTED' | 'SYNC_COMPLETE' | 'TRADE_IMPORTED' | 'REALTIME_TRADE';
type SyncMode = 'MANUAL' | 'SCHEDULED' | 'INITIAL' | 'REALTIME';

interface TradeEventMessage {
  type: TradeEventType;
  tradesImported: number;
  connectionId: string;
  accountLabel?: string | null;
  syncMode?: SyncMode | null;
  success?: boolean | null;
  errorMessage?: string | null;
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
 * Subscribes to `/topic/trades/{userId}` over STOMP and translates the broker
 * sync lifecycle into Sonner toasts:
 *
 * - SYNC_STARTED  → toast.loading with stable id `sync-<connectionId>`
 * - SYNC_COMPLETE → toast.success or toast.error with the SAME id (replaces the
 *                   loading toast — no toast pile-up across the lifecycle)
 * - TRADE_IMPORTED → no toast (cache invalidation only). The lifecycle toasts
 *                    above provide the user-facing summary.
 * - REALTIME_TRADE → keep the per-deal "Live: …" toast for ELITE realtime UX.
 *
 * React Query caches `['trades']` and the dashboard are invalidated on every
 * event so the underlying data refreshes without waiting for the next poll.
 */
export const useLiveTrades = (): LiveTradesResult => {
  const { user } = useAuth();
  const { subscribe, connected } = useWebSocket();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [lastEvent, setLastEvent] = useState<TradeEventMessage | null>(null);

  // Stash `t` in a ref so the subscription effect doesn't tear down/recreate
  // when the i18n function identity changes on locale switch.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    if (!connected || !user?.id) return;

    const topic = `/topic/trades/${user.id}`;

    const unsubscribe = subscribe(topic, (message) => {
      try {
        const payload = JSON.parse(message.body) as TradeEventMessage;
        setLastEvent(payload);

        // Always invalidate so the trades table picks up the new data.
        queryClient.invalidateQueries({ queryKey: ['trades'] });
        invalidateDashboardData(queryClient);

        const toastId = `sync-${payload.connectionId}`;
        const label = payload.accountLabel ?? payload.connectionId;

        switch (payload.type) {
          case 'SYNC_STARTED': {
            const startedKey =
              payload.syncMode === 'INITIAL'
                ? 'accounts.syncStartedInitial'
                : 'accounts.syncStarted';
            toast.loading(
              tRef.current(startedKey, { account: label, defaultValue: `Syncing ${label}…` }),
              { id: toastId },
            );
            break;
          }
          case 'SYNC_COMPLETE': {
            if (payload.success === false) {
              toast.error(
                tRef.current('accounts.syncFailedToast', {
                  account: label,
                  message: payload.errorMessage ?? '',
                  defaultValue: `Sync failed for ${label}: ${payload.errorMessage ?? ''}`,
                }),
                { id: toastId, duration: 6000 },
              );
            } else {
              toast.success(
                tRef.current('accounts.syncCompletedSummary', {
                  account: label,
                  count: payload.tradesImported,
                  defaultValue: `Sync complete: ${payload.tradesImported} trades imported on ${label}`,
                }),
                { id: toastId, duration: 5000 },
              );
            }
            break;
          }
          case 'REALTIME_TRADE': {
            // Live single-deal push (ELITE) — keep per-deal toast as designed.
            toast.success(
              tRef.current('accounts.liveTradeToast', {
                count: payload.tradesImported,
                defaultValue: `Live: ${payload.tradesImported} trade(s) updated`,
              }),
              { duration: 3000 },
            );
            break;
          }
          case 'TRADE_IMPORTED': {
            // No toast — handled by SYNC_COMPLETE summary. Cache invalidation above is enough.
            break;
          }
        }
      } catch (err) {
        console.error('[useLiveTrades] Failed to parse message:', err);
      }
    });

    return unsubscribe;
  }, [connected, user?.id, subscribe, queryClient]);

  return { lastEvent };
};
