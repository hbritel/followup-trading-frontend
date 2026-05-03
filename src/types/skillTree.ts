/**
 * Sprint 7 Tâche 7.5 — Skill tree types.
 *
 * Mirrors the backend's {@code SkillNode} / {@code UserSkillProgress} /
 * {@code SkillNodeView} shapes. The {@code unlockCriterion} is a
 * polymorphic Jackson payload — we keep it as a discriminated union here
 * so the frontend can render explanatory text without hardcoding logic.
 */

export type SkillCategory = 'DISCIPLINE' | 'PERFORMANCE' | 'STRATEGY' | 'RISK';

export type SkillCriterionType =
  | 'TRADE_COUNT_AT_LEAST'
  | 'JOURNALED_TRADES_AT_LEAST'
  | 'WIN_RATE_AT_LEAST'
  | 'AVG_R_AT_LEAST'
  | 'STRATEGIES_DEFINED_AT_LEAST'
  | 'DISTINCT_TAGS_AT_LEAST'
  | 'NO_LOSS_DAYS_STREAK'
  | 'RULE_COMPLIANCE_AT_LEAST';

export interface SkillUnlockCriterion {
  type: SkillCriterionType;
  params: Record<string, number>;
}

export interface SkillNode {
  id: string;
  code: string;
  name: string;
  category: SkillCategory;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  unlockCriterion: SkillUnlockCriterion;
}

export interface SkillNodeView {
  node: SkillNode;
  progressPct: string;          // 0..100
  unlockedAt: string | null;    // ISO 8601
  lastEvaluatedAt: string | null;
  unlocked?: boolean;           // computed in some serializations
}
