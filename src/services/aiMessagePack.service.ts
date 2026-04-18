import apiClient from './apiClient';

/**
 * Wire DTO for an AI coach message pack. Mirrors {@code AiMessagePackResponseDto}
 * from the backend — the stripe price id and internal flags are deliberately
 * absent.
 */
export interface AiMessagePackDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  messageCount: number;
  priceCents: number;
  currency: string;
}

export interface AiMessagePackCheckoutDto {
  checkoutUrl: string;
  sessionId: string;
}

/**
 * Thin wrapper around {@code /api/v1/coach/packs}.
 *
 * The {@code checkout} call returns the hosted Stripe URL — the caller is
 * expected to redirect the browser (e.g. {@code window.location.assign}).
 */
export const aiMessagePackService = {
  list: () => apiClient.get<AiMessagePackDto[]>('/coach/packs'),

  checkout: (slug: string) =>
    apiClient.post<AiMessagePackCheckoutDto>(
      `/coach/packs/${encodeURIComponent(slug)}/checkout`,
    ),
};
