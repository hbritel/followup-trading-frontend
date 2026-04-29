import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---- Hoisted mocks ------------------------------------------------------

const { tradeServiceMock, psychologyServiceMock, wsMock } = vi.hoisted(() => {
  const trades = {
    getTrades: vi.fn(),
  };
  const psychology = {
    getByTradeId: vi.fn(),
    getConsent: vi.fn(),
    setConsent: vi.fn(),
  };
  const ws = {
    triggerMessage: null as ((m: { body: string }) => void) | null,
  };
  return { tradeServiceMock: trades, psychologyServiceMock: psychology, wsMock: ws };
});

vi.mock('@/services/trade.service', () => ({
  tradeService: tradeServiceMock,
}));
vi.mock('@/services/psychology.service', () => ({
  psychologyService: psychologyServiceMock,
}));
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));
vi.mock('@/providers/WebSocketProvider', () => ({
  useWebSocket: () => ({
    connected: true,
    subscribe: (_topic: string, cb: (m: { body: string }) => void) => {
      wsMock.triggerMessage = cb;
      return () => {
        wsMock.triggerMessage = null;
      };
    },
  }),
}));

import {
  usePostTradeEmotionPrompt,
  POST_TRADE_PROMPT_OPT_OUT_KEY,
} from '../usePostTradeEmotionPrompt';

// ---- Helpers -----------------------------------------------------------

const SYNC_DEBOUNCE_MS = 1500;
const QUEUE_PROMPT_DELAY_MS = 3000;

const fireSyncCompletePayload = (overrides?: Partial<Record<string, unknown>>) => ({
  type: 'SYNC_COMPLETE',
  tradesImported: 2,
  connectionId: 'conn-1',
  success: true,
  timestamp: '2026-04-29T12:00:00Z',
  ...overrides,
});

const fireMessage = (payload: Record<string, unknown>) => {
  if (!wsMock.triggerMessage) throw new Error('Subscription not registered');
  wsMock.triggerMessage({ body: JSON.stringify(payload) });
};

const tradeAt = (id: string, exitDate: string) => ({
  id,
  exitDate,
  status: 'closed',
});

const noEntryError = { response: { status: 404 } };

beforeEach(() => {
  vi.useFakeTimers();
  tradeServiceMock.getTrades.mockReset();
  psychologyServiceMock.getByTradeId.mockReset();
  psychologyServiceMock.getConsent.mockReset();
  psychologyServiceMock.setConsent.mockReset();
  // Default: consent enabled (queue allowed). Individual tests override.
  psychologyServiceMock.getConsent.mockResolvedValue({
    data: { enabled: true, consentAt: '2026-04-29T12:00:00Z' },
  });
  psychologyServiceMock.setConsent.mockResolvedValue({
    data: { enabled: false, consentAt: null },
  });
  wsMock.triggerMessage = null;
  try {
    window.localStorage.removeItem(POST_TRADE_PROMPT_OPT_OUT_KEY);
  } catch {
    /* localStorage may not be available */
  }
});

afterEach(() => {
  vi.useRealTimers();
});

/**
 * Drives the fake-timers clock past every scheduled callback and lets all
 * resulting microtasks settle. Used after firing a sync event when we want
 * to observe the post-debounce state.
 */
const flushAll = async () => {
  await act(async () => {
    await vi.runAllTimersAsync();
  });
};

// ---- Tests --------------------------------------------------------------

describe('usePostTradeEmotionPrompt', () => {
  it('queues newly closed trades without psychology entries', async () => {
    const now = Date.now();
    tradeServiceMock.getTrades.mockResolvedValue({
      content: [
        tradeAt('trade-1', new Date(now - 60 * 1000).toISOString()),
        tradeAt('trade-2', new Date(now - 120 * 1000).toISOString()),
      ],
      pageNumber: 0,
      pageSize: 25,
      totalElements: 2,
      totalPages: 1,
      last: true,
    });
    psychologyServiceMock.getByTradeId.mockRejectedValue(noEntryError);

    const { result } = renderHook(() => usePostTradeEmotionPrompt());
    act(() => {
      fireMessage(fireSyncCompletePayload());
    });

    await flushAll();
    expect(tradeServiceMock.getTrades).toHaveBeenCalledTimes(1);
    expect(psychologyServiceMock.getByTradeId).toHaveBeenCalledTimes(2);
    expect(result.current.activePrompt?.tradeId).toBe('trade-1');
  });

  it('shows one popup at a time and advances after a 3 s delay', async () => {
    const now = Date.now();
    tradeServiceMock.getTrades.mockResolvedValue({
      content: [
        tradeAt('trade-A', new Date(now - 30 * 1000).toISOString()),
        tradeAt('trade-B', new Date(now - 90 * 1000).toISOString()),
      ],
      pageNumber: 0,
      pageSize: 25,
      totalElements: 2,
      totalPages: 1,
      last: true,
    });
    psychologyServiceMock.getByTradeId.mockRejectedValue(noEntryError);

    const { result } = renderHook(() => usePostTradeEmotionPrompt());
    act(() => fireMessage(fireSyncCompletePayload()));

    await flushAll();
    expect(result.current.activePrompt?.tradeId).toBe('trade-A');

    // Dismiss → no popup until 3 s pass.
    act(() => result.current.dismissCurrent());
    expect(result.current.activePrompt).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(QUEUE_PROMPT_DELAY_MS - 1);
    });
    expect(result.current.activePrompt).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2);
    });
    expect(result.current.activePrompt?.tradeId).toBe('trade-B');
  });

  it('debounces rapid sync events into a single fetch', async () => {
    tradeServiceMock.getTrades.mockResolvedValue({
      content: [],
      pageNumber: 0,
      pageSize: 25,
      totalElements: 0,
      totalPages: 0,
      last: true,
    });

    renderHook(() => usePostTradeEmotionPrompt());

    act(() => {
      fireMessage(fireSyncCompletePayload({ connectionId: 'a' }));
      fireMessage(fireSyncCompletePayload({ connectionId: 'b' }));
      fireMessage(fireSyncCompletePayload({ connectionId: 'c' }));
    });

    // Before the debounce window closes, no API call yet.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SYNC_DEBOUNCE_MS - 1);
    });
    expect(tradeServiceMock.getTrades).not.toHaveBeenCalled();

    await flushAll();
    expect(tradeServiceMock.getTrades).toHaveBeenCalledTimes(1);
  });

  it('skips the entire flow when the user has opted out', async () => {
    window.localStorage.setItem(POST_TRADE_PROMPT_OPT_OUT_KEY, 'true');
    tradeServiceMock.getTrades.mockResolvedValue({
      content: [tradeAt('trade-x', new Date().toISOString())],
      pageNumber: 0,
      pageSize: 25,
      totalElements: 1,
      totalPages: 1,
      last: true,
    });
    psychologyServiceMock.getByTradeId.mockRejectedValue(noEntryError);

    const { result } = renderHook(() => usePostTradeEmotionPrompt());
    act(() => fireMessage(fireSyncCompletePayload()));

    await flushAll();
    expect(tradeServiceMock.getTrades).not.toHaveBeenCalled();
    expect(result.current.activePrompt).toBeNull();
  });

  it('does not enqueue trades that already have a psychology entry', async () => {
    tradeServiceMock.getTrades.mockResolvedValue({
      content: [tradeAt('trade-with-entry', new Date().toISOString())],
      pageNumber: 0,
      pageSize: 25,
      totalElements: 1,
      totalPages: 1,
      last: true,
    });
    psychologyServiceMock.getByTradeId.mockResolvedValue({
      data: { id: 'p-1', emotionAfter: 'CALM', notes: '', confidence: 4 },
    });

    const { result } = renderHook(() => usePostTradeEmotionPrompt());
    act(() => fireMessage(fireSyncCompletePayload()));

    await flushAll();
    expect(psychologyServiceMock.getByTradeId).toHaveBeenCalled();
    expect(result.current.activePrompt).toBeNull();
  });

  it('skipAll empties the queue immediately', async () => {
    const now = Date.now();
    tradeServiceMock.getTrades.mockResolvedValue({
      content: [
        tradeAt('t-1', new Date(now - 1000).toISOString()),
        tradeAt('t-2', new Date(now - 2000).toISOString()),
      ],
      pageNumber: 0,
      pageSize: 25,
      totalElements: 2,
      totalPages: 1,
      last: true,
    });
    psychologyServiceMock.getByTradeId.mockRejectedValue(noEntryError);

    const { result } = renderHook(() => usePostTradeEmotionPrompt());
    act(() => fireMessage(fireSyncCompletePayload()));

    await flushAll();
    expect(result.current.activePrompt).not.toBeNull();

    act(() => result.current.skipAll());
    expect(result.current.activePrompt).toBeNull();

    // Even after the queue advance delay, no new prompt appears.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(QUEUE_PROMPT_DELAY_MS + 100);
    });
    expect(result.current.activePrompt).toBeNull();
  });
});
