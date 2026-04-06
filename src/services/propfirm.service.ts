import apiClient from './apiClient';
import type {
  PropFirmProfile,
  PropFirmEvaluation,
  EvaluationDashboard,
  DailySummary,
  EvaluationAlert,
  StartEvaluationRequest,
  UpdateEvaluationRulesRequest,
} from '@/types/propfirm';

const BASE = '/prop-firms';
const EVAL_BASE = '/evaluations';

export const propFirmService = {
  // Catalog
  getAllPropFirms: async (): Promise<PropFirmProfile[]> => {
    const response = await apiClient.get<PropFirmProfile[]>(BASE);
    return response.data;
  },

  getPropFirm: async (code: string): Promise<PropFirmProfile> => {
    const response = await apiClient.get<PropFirmProfile>(`${BASE}/${code}`);
    return response.data;
  },

  // Evaluations — CRUD
  startEvaluation: async (data: StartEvaluationRequest): Promise<PropFirmEvaluation> => {
    const response = await apiClient.post<PropFirmEvaluation>(EVAL_BASE, data);
    return response.data;
  },

  getEvaluations: async (): Promise<PropFirmEvaluation[]> => {
    const response = await apiClient.get<PropFirmEvaluation[]>(EVAL_BASE);
    return response.data;
  },

  getEvaluation: async (id: string): Promise<PropFirmEvaluation> => {
    const response = await apiClient.get<PropFirmEvaluation>(`${EVAL_BASE}/${id}`);
    return response.data;
  },

  cancelEvaluation: (id: string): Promise<void> =>
    apiClient.delete(`${EVAL_BASE}/${id}`).then(() => undefined),

  deleteEvaluation: (id: string): Promise<void> =>
    apiClient.delete(`${EVAL_BASE}/${id}/permanent`).then(() => undefined),

  // Evaluation management
  linkAccount: (id: string, brokerConnectionId: string): Promise<PropFirmEvaluation> =>
    apiClient.put<PropFirmEvaluation>(`${EVAL_BASE}/${id}/account`, { brokerConnectionId }).then((r) => r.data),

  unlinkAccount: (id: string): Promise<PropFirmEvaluation> =>
    apiClient.delete<PropFirmEvaluation>(`${EVAL_BASE}/${id}/account`).then((r) => r.data),

  renameEvaluation: (id: string, displayName: string): Promise<PropFirmEvaluation> =>
    apiClient.put<PropFirmEvaluation>(`${EVAL_BASE}/${id}/name`, { displayName }).then((r) => r.data),

  updateRules: (id: string, rules: UpdateEvaluationRulesRequest): Promise<PropFirmEvaluation> =>
    apiClient.put<PropFirmEvaluation>(`${EVAL_BASE}/${id}/rules`, rules).then((r) => r.data),

  // Dashboard & analytics
  getDashboard: async (id: string): Promise<EvaluationDashboard> => {
    const response = await apiClient.get<EvaluationDashboard>(`${EVAL_BASE}/${id}/dashboard`);
    return response.data;
  },

  getDailySummary: async (id: string): Promise<DailySummary[]> => {
    const response = await apiClient.get<DailySummary[]>(`${EVAL_BASE}/${id}/daily-summary`);
    return response.data;
  },

  forceCheck: async (id: string): Promise<PropFirmEvaluation> => {
    const response = await apiClient.post<PropFirmEvaluation>(`${EVAL_BASE}/${id}/check`);
    return response.data;
  },

  recordSimulatedTrade: (
    evaluationId: string,
    data: { pnl: number; date: string; note?: string },
  ) =>
    apiClient
      .post(`${EVAL_BASE}/${evaluationId}/simulated-trade`, data)
      .then((r) => r.data),

  // Alerts
  getAlerts: (evaluationId: string) =>
    apiClient.get<EvaluationAlert[]>(`${EVAL_BASE}/${evaluationId}/alerts`).then((r) => r.data),

  dismissAlert: (evaluationId: string, alertId: string) =>
    apiClient
      .post(`${EVAL_BASE}/${evaluationId}/alerts/${alertId}/dismiss`)
      .then((r) => r.data),
};
