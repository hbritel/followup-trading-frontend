import { useQuery } from '@tanstack/react-query';
import { counterfactualService } from '@/services/counterfactual.service';
import type { ClosingScenario, RulesScenario } from '@/types/counterfactual';

const closingKey = (tradeId: string) => ['ai', 'counterfactual', 'closing', tradeId];
const rulesKey = (lookbackDays?: number) => ['ai', 'counterfactual', 'rules', lookbackDays ?? 'default'];

/** Per-trade exit-at-MFE projection. PRO+ only — non-PRO returns 403. */
export const useClosingScenario = (tradeId: string | undefined, enabled: boolean = true) =>
  useQuery<ClosingScenario | null>({
    queryKey: closingKey(tradeId ?? ''),
    queryFn: async () => {
      if (!tradeId) return null;
      try {
        const res = await counterfactualService.closingForTrade(tradeId);
        return res.data;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 403 || status === 404) return null;
        throw err;
      }
    },
    enabled: Boolean(tradeId) && enabled,
    staleTime: 60 * 60 * 1000,
  });

/** Cross-rule potential-gain projection. */
export const useRulesScenario = (lookbackDays?: number, enabled: boolean = true) =>
  useQuery<RulesScenario | null>({
    queryKey: rulesKey(lookbackDays),
    queryFn: async () => {
      try {
        const res = await counterfactualService.rules(lookbackDays);
        return res.data;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 403) return null;
        throw err;
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
