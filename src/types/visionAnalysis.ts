/**
 * Vision chart analysis types — Sprint 4 of the AI-first roadmap.
 *
 * <p>Mirror the Spring Boot {@code VisionAnalysisRequest} / {@code ChartAnalysis}
 * shapes returned by {@code POST /api/v1/ai/vision/analyze-chart}. Field names
 * match the backend exactly so the JSON deserialises with no mapping layer.</p>
 */

/** Input payload for the multipart upload — sent as FormData parts. */
export interface ChartAnalysisRequest {
  image: File;
  tradeId?: string;
  tradeContext?: string;
  prompt?: string;
  locale?: string;
}

/** Persisted chart analysis returned by the backend. */
export interface ChartAnalysisResponse {
  id: string;
  tradeId: string | null;
  imageUrl: string;
  mimeType: string;
  setupIdentified: string | null;
  keyLevels: string[];
  stopAnalysis: string | null;
  targetAnalysis: string | null;
  playbookMatch: string | null;
  complianceScore: number;
  recommendation: string | null;
  tokensUsed: number;
  providerName: string;
  modelName: string | null;
  createdAt: string;
}

/** Listing endpoint envelope. */
export interface ChartAnalysisList {
  analyses: ChartAnalysisResponse[];
  count: number;
}

/** Upload constraints — kept in sync with backend {@code TradeChartAnalysisService}. */
export const CHART_ANALYSIS_MAX_BYTES = 5 * 1024 * 1024;
export const CHART_ANALYSIS_ALLOWED_MIME = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
] as const;

export type ChartAnalysisMime = (typeof CHART_ANALYSIS_ALLOWED_MIME)[number];

/** Returns null when the file is acceptable, otherwise an i18n key for the violation. */
export function validateChartUpload(file: File | null | undefined): string | null {
  if (!file) {
    return 'visionAnalysis.errors.fileRequired';
  }
  if (file.size > CHART_ANALYSIS_MAX_BYTES) {
    return 'visionAnalysis.errors.fileTooLarge';
  }
  if (!CHART_ANALYSIS_ALLOWED_MIME.includes(file.type as ChartAnalysisMime)) {
    return 'visionAnalysis.errors.fileBadMime';
  }
  return null;
}
