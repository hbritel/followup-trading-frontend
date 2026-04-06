// src/types/propfirm.ts

export type EvaluationStatus = 'ACTIVE' | 'PASSED' | 'FAILED' | 'EXPIRED' | 'FUNDED';

export interface EvaluationPhase {
  id: string;
  phaseName: string;
  phaseOrder: number;
  challengeType: string | null;
  profitTargetPercent: number | null;
  maxDrawdownPercent: number | null;
  dailyLossLimitPercent: number | null;
  minTradingDays: number;
  maxTradingDays: number | null;
  weekendHoldingAllowed: boolean;
  newsEventTradingAllowed: boolean;
  profitSplitPercent: number | null;
}

export interface PropFirmProfile {
  id: string;
  firmCode: string;
  firmName: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  country: string | null;
  challengeTypes: string[];
  phases: EvaluationPhase[];
}

export interface PropFirmEvaluation {
  id: string;
  propFirmProfileId: string;
  firmCode: string;
  firmName: string;
  displayName: string | null;
  challengeType: string | null;
  currentPhase: number;
  status: EvaluationStatus;
  simulationMode: boolean;
  startingBalance: number;
  currentBalance: number;
  totalPnl: number;
  totalPnlPercent: number;
  currentDrawdownPercent: number;
  maxDrawdownReached: number;
  tradingDaysCount: number;
  startDate: string;
  createdAt: string;
  brokerConnectionId: string | null;
  brokerConnectionDisplayName: string | null;
  customProfitTargetPercent: number | null;
  customMaxDrawdownPercent: number | null;
  customDailyLossLimitPercent: number | null;
}

export interface EvaluationDashboard {
  evaluationId: string;
  firmCode: string;
  firmName: string;
  displayName: string | null;
  challengeType: string | null;
  phaseName: string;
  currentPhase: number;
  totalPhases: number;
  status: EvaluationStatus;
  simulationMode: boolean;
  startingBalance: number;
  currentBalance: number;
  totalPnl: number;
  totalPnlPercent: number;
  dailyPnl: number;
  dailyPnlPercent: number;
  currentDrawdownPercent: number;
  maxDrawdownPercent: number;
  drawdownLimitPercent: number;
  dailyLossLimitPercent: number;
  profitTargetPercent: number;
  profitProgressPercent: number;
  tradingDaysCount: number;
  minTradingDays: number;
  maxTradingDays: number | null;
  weekendHoldingAllowed: boolean;
  newsEventTradingAllowed: boolean;
  brokerConnectionId: string | null;
  brokerConnectionDisplayName: string | null;
  customProfitTargetPercent: number | null;
  customMaxDrawdownPercent: number | null;
  customDailyLossLimitPercent: number | null;
  startDate: string | null;
}

export interface DailySummary {
  date: string;
  pnl: number;
  pnlPercent: number;
  cumulativePnl: number;
  cumulativePnlPercent: number;
  drawdownPercent: number;
  tradeCount: number;
  dailyLossCompliant: boolean;
  maxDrawdownCompliant: boolean;
}

export interface StartEvaluationRequest {
  propFirmCode: string;
  challengeType?: string;
  brokerConnectionId?: string;
  simulationMode: boolean;
  startingBalance: number;
  displayName?: string;
}

export interface UpdateEvaluationRulesRequest {
  profitTargetPercent?: number;
  maxDrawdownPercent?: number;
  dailyLossLimitPercent?: number;
  minTradingDays?: number;
  maxTradingDays?: number;
}

export interface EvaluationAlert {
  id: string;
  alertType: string;
  description: string;
  message: string;
  thresholdValue: string | null;
  currentValue: string | null;
  dismissed: boolean;
  createdAt: string;
}
