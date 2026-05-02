import { useMutation } from '@tanstack/react-query';
import { tradePlanningService } from '@/services/tradePlanning.service';
import type { TradePlanningRequest } from '@/types/tradePlanning';

/**
 * Mutation hook for the pre-trade planning score endpoint.
 *
 * <p>Manages the loading / error states and exposes a {@code mutate} action
 * the {@link TradePlanningModal} fires from its form submit. Returns the
 * full {@code data} payload so callers can render the breakdown without
 * re-fetching.</p>
 */
export function useTradePlanningScore() {
  return useMutation({
    mutationKey: ['trade-planning-score'],
    mutationFn: (request: TradePlanningRequest) => tradePlanningService.score(request),
  });
}
