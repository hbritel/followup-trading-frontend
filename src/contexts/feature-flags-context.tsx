import { createContext, useContext, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { useAuth } from '@/contexts/auth-context';

// ── Types ────────────────────────────────────────────────────────────────────

type FeatureFlags = Record<string, boolean>;

interface FeatureFlagsContextValue {
  flags: FeatureFlags;
  isLoading: boolean;
  isEnabled: (key: string) => boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  flags: {},
  isLoading: false,
  isEnabled: () => true,
});

// ── Provider ─────────────────────────────────────────────────────────────────

const fetchFlags = async (): Promise<FeatureFlags> => {
  const response = await apiClient.get<FeatureFlags>('/features');
  return response.data;
};

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  const { data: flags = {}, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: fetchFlags,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    enabled: isAuthenticated, // Only fetch when user is logged in
  });

  const isEnabled = (key: string) => {
    if (isLoading) return true; // Don't block while loading
    return flags[key] !== false; // Default to enabled if flag doesn't exist
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, isLoading, isEnabled }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}

// ── Feature flag key constants ───────────────────────────────────────────────

export const FEATURES = {
  AI_CHAT: 'ai_chat',
  BACKTESTING: 'backtesting',
  TRADE_REPLAY: 'trade_replay',
  MARKET_FEED: 'market_feed',
  REPORTS: 'reports',
  ALERTS: 'alerts',
} as const;
