/**
 * Auto-playbook generator types — Sprint 4 of the AI-first roadmap.
 *
 * <p>Mirror the Spring Boot {@code AutoPlaybookController.GenerateRequestDto}
 * and {@code GeneratedPlaybook} shapes returned by
 * {@code POST /api/v1/ai/playbook/generate}.</p>
 */

export interface GeneratePlaybookRequest {
  lookbackDays?: number;
  minTrades?: number;
  filterStrategyId?: string | null;
}

export interface GeneratedPlaybookStructure {
  entryConditions?: string[];
  stopLossHeuristic?: string;
  targetHeuristic?: string;
  preferredMarketContext?: string;
  preferredTimeOfDay?: string;
  rrTarget?: number;
  [extra: string]: unknown;
}

export interface GeneratedPlaybookResponse {
  id: string;
  name: string;
  description: string | null;
  basedOnTradesCount: number;
  lookbackDays: number;
  filterStrategyId: string | null;
  structure: GeneratedPlaybookStructure;
  markdownVersion: string;
  promotedToStrategyId: string | null;
  generatedAt: string;
}

export interface GeneratedPlaybookList {
  playbooks: GeneratedPlaybookResponse[];
  count: number;
}

/** Validation bounds — kept in sync with backend constants. */
export const PLAYBOOK_LOOKBACK_MIN = 7;
export const PLAYBOOK_LOOKBACK_MAX = 365;
export const PLAYBOOK_LOOKBACK_DEFAULT = 90;
export const PLAYBOOK_MIN_TRADES_FLOOR = 5;
export const PLAYBOOK_MIN_TRADES_DEFAULT = 20;
export const PLAYBOOK_MIN_TRADES_CEILING = 200;
