import apiClient from './apiClient';
import type { SkillNodeView } from '@/types/skillTree';

/**
 * REST client for Sprint 7 Tâche 7.5 — skill tree.
 *
 * <p>Read endpoint overlays the user's progress on the seeded catalogue.
 * Evaluate endpoint re-runs every criterion and persists progress —
 * deterministic compute, no quota debit.</p>
 */
export const skillTreeService = {
  list: () =>
    apiClient.get<SkillNodeView[]>('/ai/skill-tree'),

  evaluate: () =>
    apiClient.post<SkillNodeView[]>('/ai/skill-tree/evaluate'),
};
