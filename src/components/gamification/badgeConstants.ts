/**
 * Quantifiable trade-count targets for trade-count badges.
 * Shared between BadgeCard and Badges page to avoid circular imports.
 */
export const BADGE_TARGETS: Partial<Record<string, number>> = {
  TRADES_10: 10,
  TRADES_50: 50,
  TRADES_100: 100,
  TRADES_500: 500,
};
