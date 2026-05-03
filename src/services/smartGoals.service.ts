import apiClient from './apiClient';
import type { SmartGoal, GoalProgress } from '@/types/smartGoals';

/**
 * REST client for Sprint 7 Tâche 7.4 — smart goals.
 *
 * <p>All endpoints return the standard backend envelope (200 / 403
 * PLAN_FEATURE_LOCKED / 402 quota / 404 / 400). The hooks layer translates
 * those into UI states.</p>
 */
export const smartGoalsService = {
  /** Manually trigger weekly generation. Charges one quota slot. */
  generate: () =>
    apiClient.post<SmartGoal[]>('/ai/goals/generate'),

  /** Recent goals across the last `weeks` ISO weeks (default 8). */
  list: (weeks?: number) =>
    apiClient.get<SmartGoal[]>(weeks ? `/ai/goals?weeks=${weeks}` : '/ai/goals'),

  /** Live progress for the running week. */
  progress: () =>
    apiClient.get<GoalProgress[]>('/ai/goals/progress'),

  /** Dismiss a goal. */
  remove: (goalId: string) =>
    apiClient.delete(`/ai/goals/${goalId}`),
};
