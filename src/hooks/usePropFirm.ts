import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propFirmService } from '@/services/propfirm.service';
import type { StartEvaluationRequest, UpdateEvaluationRulesRequest } from '@/types/propfirm';

const PROP_FIRMS_KEY = ['prop-firms'];
const EVALUATIONS_KEY = ['evaluations'];

export const usePropFirms = () => {
  return useQuery({
    queryKey: PROP_FIRMS_KEY,
    queryFn: () => propFirmService.getAllPropFirms(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const usePropFirm = (code: string) => {
  return useQuery({
    queryKey: [...PROP_FIRMS_KEY, code],
    queryFn: () => propFirmService.getPropFirm(code),
    enabled: !!code,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useEvaluations = () => {
  return useQuery({
    queryKey: EVALUATIONS_KEY,
    queryFn: () => propFirmService.getEvaluations(),
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useEvaluation = (id: string) => {
  return useQuery({
    queryKey: [...EVALUATIONS_KEY, id],
    queryFn: () => propFirmService.getEvaluation(id),
    enabled: !!id,
  });
};

export const useEvaluationDashboard = (id: string) => {
  return useQuery({
    queryKey: [...EVALUATIONS_KEY, id, 'dashboard'],
    queryFn: () => propFirmService.getDashboard(id),
    enabled: !!id,
    refetchInterval: 30_000,
  });
};

export const useEvaluationDailySummary = (id: string) => {
  return useQuery({
    queryKey: [...EVALUATIONS_KEY, id, 'daily-summary'],
    queryFn: () => propFirmService.getDailySummary(id),
    enabled: !!id,
  });
};

export const useStartEvaluation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StartEvaluationRequest) => propFirmService.startEvaluation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVALUATIONS_KEY });
    },
  });
};

export const useForceComplianceCheck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => propFirmService.forceCheck(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [...EVALUATIONS_KEY, id] });
    },
  });
};

export const useCancelEvaluation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => propFirmService.cancelEvaluation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVALUATIONS_KEY });
    },
  });
};

export const useDeleteEvaluation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => propFirmService.deleteEvaluation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVALUATIONS_KEY });
    },
  });
};

export const useRenameEvaluation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, displayName }: { id: string; displayName: string }) =>
      propFirmService.renameEvaluation(id, displayName),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: EVALUATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: [...EVALUATIONS_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [...EVALUATIONS_KEY, id, 'dashboard'] });
    },
  });
};

export const useLinkAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, brokerConnectionId }: { id: string; brokerConnectionId: string }) =>
      propFirmService.linkAccount(id, brokerConnectionId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: EVALUATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: [...EVALUATIONS_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [...EVALUATIONS_KEY, id, 'dashboard'] });
    },
  });
};

export const useUnlinkAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => propFirmService.unlinkAccount(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: EVALUATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: [...EVALUATIONS_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [...EVALUATIONS_KEY, id, 'dashboard'] });
    },
  });
};

export const useUpdateRules = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rules }: { id: string; rules: UpdateEvaluationRulesRequest }) =>
      propFirmService.updateRules(id, rules),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: EVALUATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: [...EVALUATIONS_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [...EVALUATIONS_KEY, id, 'dashboard'] });
    },
  });
};

export function useEvaluationAlerts(evaluationId: string) {
  return useQuery({
    queryKey: [...EVALUATIONS_KEY, evaluationId, 'alerts'],
    queryFn: () => propFirmService.getAlerts(evaluationId),
    enabled: !!evaluationId,
    refetchInterval: 30000,
  });
}

export function useDismissAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ evaluationId, alertId }: { evaluationId: string; alertId: string }) =>
      propFirmService.dismissAlert(evaluationId, alertId),
    onSuccess: (_, { evaluationId }) => {
      queryClient.invalidateQueries({ queryKey: [...EVALUATIONS_KEY, evaluationId, 'alerts'] });
    },
  });
}

export function useRecordSimulatedTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      evaluationId,
      ...data
    }: {
      evaluationId: string;
      pnl: number;
      date: string;
      note?: string;
    }) => propFirmService.recordSimulatedTrade(evaluationId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evaluations', variables.evaluationId] });
      queryClient.invalidateQueries({
        queryKey: ['evaluations', variables.evaluationId, 'dashboard'],
      });
      queryClient.invalidateQueries({
        queryKey: ['evaluations', variables.evaluationId, 'daily-summary'],
      });
    },
  });
}
