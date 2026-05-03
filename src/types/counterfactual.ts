/**
 * Sprint 7 Tâche 7.3 — Counter-factual analysis types.
 *
 * Mirrors {@code ClosingScenario} / {@code RulesScenario} on the backend.
 * Fields are persisted as BigDecimal — serialised as strings on the wire.
 */

export interface ClosingScenario {
  tradeId: string;
  symbol: string;
  actualPnl: string;
  mfeBasedPnl: string | null;
  missedGain: string | null;
  capturedPct: string | null;
  mfePrice: string | null;
  computable: boolean;
}

export interface RuleImpact {
  ruleId: string;
  ruleText: string;
  strategyId: string;
  strategyName: string;
  followedCount: number;
  notFollowedCount: number;
  avgPnlFollowed: string;
  avgPnlBroken: string;
  perTradeDelta: string;
  potentialGain: string;
}

export interface RulesScenario {
  lookbackDays: number;
  totalActualPnl: string;
  hypotheticalPnl: string;
  gap: string;
  perRule: RuleImpact[];
}
