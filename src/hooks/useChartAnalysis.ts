import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { visionAnalysisService } from '@/services/visionAnalysis.service';
import type {
  ChartAnalysisRequest,
  ChartAnalysisResponse,
} from '@/types/visionAnalysis';

const RECENT_KEY = ['vision-analyses', 'recent'] as const;
const ONE_KEY = (id: string) => ['vision-analyses', 'one', id] as const;

/**
 * Mutation hook for the chart analysis endpoint.
 *
 * <p>On success we invalidate the recent listing so a fresh analysis bubbles
 * to the top of any list views the user has open. {@code null} data signals
 * the feature is disabled server-side; the {@code ChartAnalyzer} renders an
 * unavailable state in that case.</p>
 */
export function useAnalyzeChart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['vision-analyses', 'analyze'],
    mutationFn: (request: ChartAnalysisRequest) => visionAnalysisService.analyze(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vision-analyses'] });
    },
  });
}

export function useRecentChartAnalyses(limit = 20, enabled = true) {
  return useQuery({
    queryKey: [...RECENT_KEY, limit],
    queryFn: () => visionAnalysisService.listRecent(limit),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useChartAnalysis(id: string | null) {
  return useQuery({
    queryKey: id ? ONE_KEY(id) : ['vision-analyses', 'one', 'none'],
    queryFn: () => (id ? visionAnalysisService.getById(id) : Promise.resolve(null)),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

/** Convenience export typed as the hook return shape — handy for downstream props. */
export type AnalyzeChartMutation = ReturnType<typeof useAnalyzeChart>;
export type ChartAnalysisData = ChartAnalysisResponse;
