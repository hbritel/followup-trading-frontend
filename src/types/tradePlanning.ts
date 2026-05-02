/**
 * Pre-trade planning score types — Sprint 3 of the AI-first roadmap.
 *
 * <p>Mirror the Spring Boot {@code TradePlanningRequest}/{@code TradePlanningResponse}
 * DTOs. Sub-score weights are exposed here as constants so the indicator can
 * scale each value into its 0-100% gauge without an extra round-trip.</p>
 */

export type TradeDirection = 'LONG' | 'SHORT';

export interface TradePlanningRequest {
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSize?: number;
  strategyId?: string;
  setupReason?: string;
}

export interface TradePlanningBreakdown {
  playbookCompliance: number;
  currentTilt: number;
  favorableHour: number;
  symbolHistory: number;
  rrRatio: number;
}

export interface TradePlanningResponse {
  score: number;
  breakdown: TradePlanningBreakdown;
  recommendation: string;
  warnings: string[];
  strengths: string[];
}

/** Maximum points each factor can contribute, mirroring TradePlanningScore. */
export const TRADE_PLANNING_WEIGHTS = {
  playbookCompliance: 30,
  currentTilt: 25,
  favorableHour: 15,
  symbolHistory: 15,
  rrRatio: 15,
} as const;
