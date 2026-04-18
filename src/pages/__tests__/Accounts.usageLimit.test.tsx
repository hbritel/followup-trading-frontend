import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock i18n: pass through key text or use defaultValue
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, optsOrDefault?: unknown) => {
      if (typeof optsOrDefault === 'string') return optsOrDefault;
      const opts = optsOrDefault as { defaultValue?: string } | undefined;
      return opts?.defaultValue ?? key;
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// Mock subscription hook — STARTER plan with 2 used / 2 max → at limit
vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    data: { plan: 'STARTER', usage: { connectionsUsed: 2, connectionsMax: 2 } },
    isLoading: false,
  }),
}));

// Mock auth + websocket so the page boots
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'u@x.com' } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/providers/WebSocketProvider', () => ({
  useWebSocket: () => ({ connected: false, subscribe: () => () => {} }),
}));

// Mock the broker service to return 2 accounts (at limit for STARTER)
// Use vi.hoisted so the data is initialized before vi.mock is evaluated.
const { TWO_REAL_ACCOUNTS } = vi.hoisted(() => ({
  TWO_REAL_ACCOUNTS: [
    {
      id: 'a',
      accountType: 'REAL',
      enabled: true,
      status: 'CONNECTED',
      brokerCode: 'XM',
      brokerType: 'XM',
      displayName: 'XM 1',
      protocol: 'MT5_CLOUD',
      syncFrequency: 'DAILY',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'b',
      accountType: 'REAL',
      enabled: true,
      status: 'CONNECTED',
      brokerCode: 'FTMO',
      brokerType: 'FTMO',
      displayName: 'FTMO',
      protocol: 'MT5_CLOUD',
      syncFrequency: 'DAILY',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ],
}));
vi.mock('@/services/broker.service', () => ({
  brokerService: {
    getConnections: vi.fn().mockResolvedValue(TWO_REAL_ACCOUNTS),
    getBrokers: vi.fn().mockResolvedValue([]),
    getCredentialSchema: vi.fn().mockResolvedValue({ fields: [] }),
    syncConnection: vi.fn().mockResolvedValue({ tradesImported: 0 }),
    syncAll: vi.fn().mockResolvedValue([]),
    connectBroker: vi.fn(),
    createManualAccount: vi.fn(),
    disconnectBroker: vi.fn(),
    updateSettings: vi.fn(),
    getSyncHistory: vi.fn().mockResolvedValue([]),
    getSupportedBrokers: vi.fn().mockResolvedValue([]),
    getAllowedSyncFrequencies: vi.fn().mockResolvedValue(['DAILY']),
  },
}));

vi.mock('@/lib/invalidate-dashboard', () => ({ invalidateDashboardData: vi.fn() }));

// Mock allowed-sync-frequencies hook
vi.mock('@/hooks/useBrokers', () => ({
  useAllowedSyncFrequencies: () => ({ data: ['DAILY', 'WEEKLY', 'MONTHLY'] }),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock layout to avoid pulling sidebar/auth
vi.mock('@/components/layout/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import Accounts from '../Accounts';

const renderPage = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Accounts />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('Accounts — broker-account usage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "2 / 2" usage indicator at the limit', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/2\s*\/\s*2/)).toBeInTheDocument();
    });
  });

  it('disables the Add account button when at limit', async () => {
    renderPage();
    // The i18n mock above returns the key (e.g. "accounts.addAccount") when no
    // defaultValue is supplied — match either the key or the English label.
    await waitFor(() => {
      const addBtn = screen.getByRole('button', { name: /accounts\.addAccount|add account|ajouter un compte/i });
      expect(addBtn).toBeDisabled();
    });
  });
});
