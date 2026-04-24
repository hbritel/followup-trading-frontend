import apiClient from './apiClient';
import type {
  CookieConsentDto,
  RuleComplianceRequest,
  RuleComplianceResponse,
  StrategyComplianceStatsDto,
} from '@/types/dto';
import type { CookieConsentPreferences } from '@/lib/legal';
import { COOKIE_POLICY_VERSION } from '@/lib/legal';

export const complianceService = {
  // ── Trade rule compliance ────────────────────────────────────────────────────

  getTradeCompliance: async (tradeId: string): Promise<RuleComplianceResponse[]> => {
    const response = await apiClient.get<RuleComplianceResponse[]>(`/trades/${tradeId}/compliance`);
    return response.data;
  },

  updateTradeCompliance: async (tradeId: string, entries: RuleComplianceRequest[]): Promise<RuleComplianceResponse[]> => {
    const response = await apiClient.put<RuleComplianceResponse[]>(`/trades/${tradeId}/compliance`, entries);
    return response.data;
  },

  getComplianceStats: async (strategyId: string): Promise<StrategyComplianceStatsDto> => {
    const response = await apiClient.get<StrategyComplianceStatsDto>(`/strategies/${strategyId}/compliance-stats`);
    return response.data;
  },

  // ── Cookie consent ───────────────────────────────────────────────────────────

  recordCookieConsent: async (prefs: CookieConsentPreferences): Promise<void> => {
    await apiClient.post('/compliance/cookie-consent', {
      policyVersion: COOKIE_POLICY_VERSION,
      essential: prefs.essential,
      analytics: prefs.analytics,
      marketing: prefs.marketing,
    });
  },

  getLatestCookieConsent: async (): Promise<CookieConsentDto | null> => {
    const response = await apiClient.get<CookieConsentDto | null>(
      '/compliance/cookie-consent/latest'
    );
    return response.data;
  },
};
