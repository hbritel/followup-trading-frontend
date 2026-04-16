import { createContext, useContext, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { useAuth } from '@/contexts/auth-context';
import type { SubscriptionDto } from '@/types/dto';

// ── Types ────────────────────────────────────────────────────────────────────

type FeatureFlags = Record<string, boolean>;

const PLAN_HIERARCHY: Record<string, number> = {
  FREE: 0,
  STARTER: 1,
  PRO: 2,
  ELITE: 3,
};

interface FeatureFlagsContextValue {
  flags: FeatureFlags;
  isLoading: boolean;
  isEnabled: (key: string) => boolean;
  currentPlan: string;
  hasPlan: (required: string) => boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  flags: {},
  isLoading: false,
  isEnabled: () => true,
  currentPlan: 'FREE',
  hasPlan: () => true,
});

// ── Provider ─────────────────────────────────────────────────────────────────

const fetchFlags = async (): Promise<FeatureFlags> => {
  const response = await apiClient.get<FeatureFlags>('/features');
  return response.data;
};

const fetchSubscription = async (): Promise<SubscriptionDto> => {
  const response = await apiClient.get<SubscriptionDto>('/subscription');
  return response.data;
};

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  const { data: flags = {}, isLoading: flagsLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: fetchFlags,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['subscription', 'me'],
    queryFn: fetchSubscription,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: false,
    enabled: isAuthenticated,
  });

  const isLoading = flagsLoading || subLoading;
  const currentPlan = subscription?.plan ?? 'FREE';

  const isEnabled = (key: string) => {
    if (flagsLoading) return true; // Don't block while loading
    return flags[key] !== false; // Default to enabled if flag doesn't exist
  };

  const hasPlan = (required: string): boolean => {
    return (PLAN_HIERARCHY[currentPlan] ?? 0) >= (PLAN_HIERARCHY[required] ?? 0);
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, isLoading, isEnabled, currentPlan, hasPlan }}>
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
  TAX_REPORTING: 'tax_reporting',
} as const;
