import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { psychologyService } from '@/services/psychology.service';
import { tradeService } from '@/services/trade.service';

/**
 * LocalStorage key kept as a session-local fast path so the queue stays empty
 * across reloads even before the backend consent fetch resolves. The
 * authoritative state lives server-side at `/ai/psychology/consent` and the
 * hook syncs both directions automatically.
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
  /** Closes the current prompt and clears the queue; persists opt-out backend-side. */
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

/** Persists the opt-out flag locally so reloads short-circuit before the consent fetch. */
const persistLocalOptOut = (optedOut: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    if (optedOut) {
      window.localStorage.setItem(POST_TRADE_PROMPT_OPT_OUT_KEY, 'true');
    } else {
      window.localStorage.removeItem(POST_TRADE_PROMPT_OPT_OUT_KEY);
    }
  } catch {
    // Storage disabled — rely on in-memory state only.
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
  // Server-authoritative opt-out flag, hydrated on mount from
  // GET /ai/psychology/consent. Defaults to localStorage value until the
  // fetch resolves so reloads stay coherent. `true` means tracking is
  // disabled — i.e. the queue should remain empty.
  const optedOutRef = useRef<boolean>(hasOptedOut());
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
    // Persist disable backend-side. Mirror in localStorage so reloads
    // before the fetch resolves still skip the popup.
    optedOutRef.current = true;
    persistLocalOptOut(true);
    void psychologyService.setConsent(false).catch(() => {
      // If the backend rejects we keep the local flag — user-visible
      // behaviour stays consistent until the next reload re-fetches.
    });
  }, []);

  /**
   * Inspects recent closed trades and queues those without a psychology entry.
   * Runs at most once per debounce window per user, and skips trades we've
   * already enqueued (or popped) during this session.
   */
  const enqueueRecentlyClosedTrades = useCallback(async () => {
    if (processingRef.current) return;
    if (optedOutRef.current) return;
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

  // Hydrate the server-authoritative consent state on mount and on user
  // change. The local cache stays as a fast path for the very first render.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    psychologyService.getConsent().then(
      (response) => {
        if (cancelled) return;
        const enabled = response?.data?.enabled ?? false;
        optedOutRef.current = !enabled;
        persistLocalOptOut(!enabled);
      },
      () => {
        // Network error — keep the local cache value. The next mount
        // will retry; queued prompts remain blocked if the cache says so.
      },
    );
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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
