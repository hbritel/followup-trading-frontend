import apiClient from './apiClient';
import type { ClosingScenario, RulesScenario } from '@/types/counterfactual';

/**
 * REST client for Sprint 7 Tâche 7.3 — counter-factual analysis.
 *
 * <p>Closing endpoint projects a single trade's exit-at-MFE P&L; rules
 * endpoint sums per-rule potential gains across the user's recent
 * trades. Pure compute, no quota debit, PRO+ only.</p>
 */
export const counterfactualService = {
  closingForTrade: (tradeId: string) =>
    apiClient.get<ClosingScenario>(`/ai/counterfactual/closing/${tradeId}`),

  rules: (lookbackDays?: number) =>
    apiClient.get<RulesScenario>(
      lookbackDays
        ? `/ai/counterfactual/rules?lookbackDays=${lookbackDays}`
        : '/ai/counterfactual/rules',
    ),
};
