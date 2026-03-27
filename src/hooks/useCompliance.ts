import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complianceService } from '@/services/compliance.service';
import type { RuleComplianceRequest } from '@/types/dto';

const TRADE_COMPLIANCE_KEY = 'trade-compliance';
const COMPLIANCE_STATS_KEY = 'compliance-stats';

export const useTradeCompliance = (tradeId: string | null) =>
  useQuery({
    queryKey: [TRADE_COMPLIANCE_KEY, tradeId],
    queryFn: () => complianceService.getTradeCompliance(tradeId!),
    enabled: !!tradeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const useUpdateTradeCompliance = (tradeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entries: RuleComplianceRequest[]) =>
      complianceService.updateTradeCompliance(tradeId, entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRADE_COMPLIANCE_KEY, tradeId] });
      queryClient.invalidateQueries({ queryKey: [COMPLIANCE_STATS_KEY] });
    },
  });
};

export const useComplianceStats = (strategyId: string | null) =>
  useQuery({
    queryKey: [COMPLIANCE_STATS_KEY, strategyId],
    queryFn: () => complianceService.getComplianceStats(strategyId!),
    enabled: !!strategyId,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
