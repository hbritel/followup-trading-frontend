/**
 * Sprint 7 Tâche 7.4 — Smart goals types.
 *
 * Mirrors {@code SmartGoal} / {@code GoalProgress} on the backend.
 * The metric_type discriminator is stable across releases — frontends
 * may key i18n strings on the literal values.
 */

export type SmartGoalMetricType =
  | 'WIN_RATE_PCT'
  | 'AVG_R_MULTIPLE'
  | 'TRADES_JOURNALED'
  | 'RULE_COMPLIANCE_PCT'
  | 'MAX_DAILY_LOSS_USD'
  | 'TRADES_TAGGED_PCT';

export interface SmartGoal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  metricType: SmartGoalMetricType;
  targetValue: string;          // BigDecimal serialised as string
  measuredValue: string | null;
  weekStart: string;            // YYYY-MM-DD
  weekEnd: string;              // YYYY-MM-DD
  achieved: boolean;
  achievedAt: string | null;    // ISO 8601
  generatedAt: string;          // ISO 8601
}

export interface GoalProgress {
  goalId: string;
  targetValue: string;
  measuredValue: string | null;
  completionPct: string;        // 0..100
  achieved: boolean;
  atRisk: boolean;
}

/** Returns true when the metric is "lower is better" (only MAX_DAILY_LOSS_USD). */
export const isLowerBetter = (metric: SmartGoalMetricType): boolean =>
  metric === 'MAX_DAILY_LOSS_USD';
