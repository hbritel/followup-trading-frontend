import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock sonner before importing the hook (use vi.hoisted so `toastFn`
// is initialized before vi.mock is evaluated)
const { toastFn } = vi.hoisted(() => ({
  toastFn: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));
vi.mock('sonner', () => ({ toast: toastFn }));

// Mock i18n: return key for assertions, ignore options
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && 'count' in opts) return `${key}:${opts.count}`;
      if (opts && 'account' in opts) return `${key}:${opts.account}`;
      if (opts && 'message' in opts) return `${key}:${opts.message}`;
      return key;
    },
  }),
}));

// Mock auth + websocket providers
let triggerMessage: ((m: { body: string }) => void) | null = null;
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));
vi.mock('@/providers/WebSocketProvider', () => ({
  useWebSocket: () => ({
    connected: true,
    subscribe: (_topic: string, cb: (m: { body: string }) => void) => {
      triggerMessage = cb;
      return () => {
        triggerMessage = null;
      };
    },
  }),
}));
vi.mock('@/lib/invalidate-dashboard', () => ({ invalidateDashboardData: vi.fn() }));

import { useLiveTrades } from '../useLiveTrades';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

describe('useLiveTrades toast strategy', () => {
  beforeEach(() => {
    toastFn.loading.mockClear();
    toastFn.success.mockClear();
    toastFn.error.mockClear();
    toastFn.info.mockClear();
    triggerMessage = null;
  });

  it('SYNC_STARTED triggers toast.loading with stable id keyed on connectionId', () => {
    renderHook(() => useLiveTrades(), { wrapper });
    act(() => {
      triggerMessage!({
        body: JSON.stringify({
          type: 'SYNC_STARTED',
          connectionId: 'conn-1',
          accountLabel: 'XM Real',
          syncMode: 'INITIAL',
          tradesImported: 0,
          timestamp: '2026-04-18T12:00:00Z',
        }),
      });
    });
    expect(toastFn.loading).toHaveBeenCalledTimes(1);
    expect(toastFn.loading.mock.calls[0][1]).toMatchObject({ id: 'sync-conn-1' });
  });

  it('SYNC_COMPLETE success triggers toast.success with same id', () => {
    renderHook(() => useLiveTrades(), { wrapper });
    act(() => {
      triggerMessage!({
        body: JSON.stringify({
          type: 'SYNC_COMPLETE',
          connectionId: 'conn-1',
          accountLabel: 'XM Real',
          syncMode: 'INITIAL',
          tradesImported: 3000,
          success: true,
          timestamp: '2026-04-18T12:01:00Z',
        }),
      });
    });
    expect(toastFn.success).toHaveBeenCalledTimes(1);
    expect(toastFn.success.mock.calls[0][1]).toMatchObject({ id: 'sync-conn-1' });
  });

  it('SYNC_COMPLETE failure triggers toast.error with errorMessage', () => {
    renderHook(() => useLiveTrades(), { wrapper });
    act(() => {
      triggerMessage!({
        body: JSON.stringify({
          type: 'SYNC_COMPLETE',
          connectionId: 'conn-1',
          accountLabel: 'XM Real',
          syncMode: 'MANUAL',
          tradesImported: 0,
          success: false,
          errorMessage: 'auth failed',
          timestamp: '2026-04-18T12:01:00Z',
        }),
      });
    });
    expect(toastFn.error).toHaveBeenCalledTimes(1);
  });

  it('TRADE_IMPORTED never fires a toast', () => {
    renderHook(() => useLiveTrades(), { wrapper });
    act(() => {
      triggerMessage!({
        body: JSON.stringify({
          type: 'TRADE_IMPORTED',
          connectionId: 'conn-1',
          tradesImported: 1,
          timestamp: '2026-04-18T12:01:00Z',
        }),
      });
    });
    expect(toastFn.success).not.toHaveBeenCalled();
    expect(toastFn.info).not.toHaveBeenCalled();
    expect(toastFn.loading).not.toHaveBeenCalled();
    expect(toastFn.error).not.toHaveBeenCalled();
  });

  it('REALTIME_TRADE still fires per-deal toast (ELITE live UX preserved)', () => {
    renderHook(() => useLiveTrades(), { wrapper });
    act(() => {
      triggerMessage!({
        body: JSON.stringify({
          type: 'REALTIME_TRADE',
          connectionId: 'conn-1',
          tradesImported: 1,
          timestamp: '2026-04-18T12:01:00Z',
        }),
      });
    });
    expect(toastFn.success).toHaveBeenCalledTimes(1);
  });
});
