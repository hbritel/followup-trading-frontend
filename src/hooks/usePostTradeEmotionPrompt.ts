import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { psychologyService } from '@/services/psychology.service';
import { tradeService } from '@/services/trade.service';

/**
 * LocalStorage key used by the user to opt out of post-trade emotion prompts
 * altogether. Stored as the literal string "true" when set.
 */
export const POST_TRADE_PROMPT_OPT_OUT_KEY = 'postTradeEmotionPrompt.optOut';

/** Identifies the trade for which a prompt is currently visible. */
export interface ActiveEmotionPrompt {
  tradeId: string;
}

interface UsePostTradeEmotionPromptResult {
  /** Currently-displayed prompt, or null when the queue is idle. */
  activePrompt: ActiveEmotionPrompt | null;
  /** Closes the current prompt without persisting anything. */
  dismissCurrent: () => void;
  /** Closes the current prompt and clears the entire pending queue. */
  skipAll: () => void;
}

interface SyncEventPayload {
  type: 'SYNC_STARTED' | 'SYNC_COMPLETE' | 'TRADE_IMPORTED' | 'REALTIME_TRADE';
  tradesImported: number;
  connectionId: string;
  success?: boolean | null;
  timestamp: string;
}

/** Window during which a closed trade is considered "newly closed". */
const RECENT_CLOSED_WINDOW_MS = 60 * 60 * 1000;

/** Delay between popups in the queue so the user is never spammed. */
const QUEUE_PROMPT_DELAY_MS = 3000;

/** Debounce window for rapid sync events (sidecar can fire several per second). */
const SYNC_DEBOUNCE_MS = 1500;

/** Internal helper: returns true if the user has opted out via localStorage. */
const hasOptedOut = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(POST_TRADE_PROMPT_OPT_OUT_KEY) === 'true';
  } catch {
    return false;
  }
};

/**
 * Subscribes to broker sync events and queues a post-trade emotion prompt for
 * each newly-closed trade that does not yet have a psychology entry.
 *
 * <ul>
 *   <li>One prompt is active at a time (FIFO queue).</li>
 *   <li>3-second delay between consecutive prompts so the user can breathe.</li>
 *   <li>Sync events arriving in rapid bursts are debounced (1.5 s).</li>
 *   <li>If the user has opted out (localStorage flag), the queue stays empty.</li>
 * </ul>
 *
 * <p>The hook is safe to mount once at the app root; it short-circuits when
 * the WebSocket is not connected or the user is not authenticated.</p>
 */
export function usePostTradeEmotionPrompt(): UsePostTradeEmotionPromptResult {
  const { user } = useAuth();
  const { subscribe, connected } = useWebSocket();

  const [activePrompt, setActivePrompt] = useState<ActiveEmotionPrompt | null>(null);
  const queueRef = useRef<string[]>([]);
  const seenTradeIdsRef = useRef<Set<string>>(new Set());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingRef = useRef(false);
  // Mirror of `activePrompt` for use inside callbacks that must not depend on
  // it (and re-create on every transition). Reads via the ref are always the
  // latest value because we update it synchronously on every state change.
  const activePromptRef = useRef<ActiveEmotionPrompt | null>(null);

  /** Pulls the next trade id off the queue and surfaces it as the active prompt. */
  const showNext = useCallback(() => {
    const next = queueRef.current.shift();
    if (!next) {
      activePromptRef.current = null;
      setActivePrompt(null);
      return;
    }
    const promptValue: ActiveEmotionPrompt = { tradeId: next };
    activePromptRef.current = promptValue;
    setActivePrompt(promptValue);
  }, []);

  const dismissCurrent = useCallback(() => {
    activePromptRef.current = null;
    setActivePrompt(null);
    if (queueRef.current.length === 0) return;
    if (advanceTimerRef.current !== null) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null;
      showNext();
    }, QUEUE_PROMPT_DELAY_MS);
  }, [showNext]);

  const skipAll = useCallback(() => {
    queueRef.current = [];
    if (advanceTimerRef.current !== null) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    activePromptRef.current = null;
    setActivePrompt(null);
  }, []);

  /**
   * Inspects recent closed trades and queues those without a psychology entry.
   * Runs at most once per debounce window per user, and skips trades we've
   * already enqueued (or popped) during this session.
   */
  const enqueueRecentlyClosedTrades = useCallback(async () => {
    if (processingRef.current) return;
    if (hasOptedOut()) return;
    processingRef.current = true;
    try {
      const page = await tradeService.getTrades({ page: 0, size: 25, status: 'CLOSED' });
      const cutoff = Date.now() - RECENT_CLOSED_WINDOW_MS;
      const candidates = page.content.filter((trade) => {
        if (!trade.id || !trade.exitDate) return false;
        if (seenTradeIdsRef.current.has(trade.id)) return false;
        const exitMs = new Date(trade.exitDate).getTime();
        if (Number.isNaN(exitMs)) return false;
        return exitMs >= cutoff;
      });

      for (const trade of candidates) {
        seenTradeIdsRef.current.add(trade.id);
        // Only enqueue trades without an existing psychology entry. A 404
        // means "no entry yet" and is the signal to prompt; any other error
        // is treated conservatively (skip the trade).
        try {
          await psychologyService.getByTradeId(trade.id);
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } } | null)?.response?.status;
          if (status === 404) {
            queueRef.current.push(trade.id);
          }
        }
      }

      // Kick off the first prompt if nothing is currently visible.
      if (
        activePromptRef.current === null &&
        advanceTimerRef.current === null &&
        queueRef.current.length > 0
      ) {
        showNext();
      }
    } catch {
      // Network or auth error — skip this batch silently. The next sync event
      // will retry. We intentionally do not surface a toast here; the user
      // doesn't care that the prompt failed to load.
    } finally {
      processingRef.current = false;
    }
  }, [showNext]);

  // Stash the latest enqueueRecentlyClosedTrades reference so the WebSocket
  // subscription effect can stay independent of state changes — re-subscribing
  // every time `activePrompt` flips would tear down our pending advance timer.
  const enqueueRef = useRef(enqueueRecentlyClosedTrades);
  useEffect(() => {
    enqueueRef.current = enqueueRecentlyClosedTrades;
  }, [enqueueRecentlyClosedTrades]);

  useEffect(() => {
    if (!connected || !user?.id) return;

    const topic = `/topic/trades/${user.id}`;
    const unsubscribe = subscribe(topic, (message) => {
      try {
        const payload = JSON.parse(message.body) as SyncEventPayload;
        const isCompletedSync =
          payload.type === 'SYNC_COMPLETE' &&
          payload.success !== false &&
          payload.tradesImported > 0;
        const isRealtime = payload.type === 'REALTIME_TRADE' && payload.tradesImported > 0;
        if (!isCompletedSync && !isRealtime) return;

        // Debounce rapid bursts so we hit the API once per logical batch.
        if (debounceTimerRef.current !== null) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          debounceTimerRef.current = null;
          void enqueueRef.current();
        }, SYNC_DEBOUNCE_MS);
      } catch {
        // Malformed payload — ignore.
      }
    });

    return () => {
      unsubscribe();
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      // We intentionally do NOT clear advanceTimerRef here: the WebSocket
      // effect tearing down on connection churn must not cancel a queue
      // advance the user is already waiting on.
    };
  }, [connected, user?.id, subscribe]);

  return {
    activePrompt,
    dismissCurrent,
    skipAll,
  };
}
