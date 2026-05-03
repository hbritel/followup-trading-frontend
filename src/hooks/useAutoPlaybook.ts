import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { autoPlaybookService } from '@/services/autoPlaybook.service';
import type {
  GeneratePlaybookRequest,
  GeneratedPlaybookResponse,
} from '@/types/autoPlaybook';

const RECENT_KEY = ['auto-playbook', 'recent'] as const;
const ONE_KEY = (id: string) => ['auto-playbook', 'one', id] as const;

/**
 * Mutation hook for the auto-playbook generator.
 *
 * <p>Long-running call (5-15 s server-side) so callers should render a
 * skeleton while {@code isPending} is true. {@code data === null} signals
 * the feature is unavailable server-side.</p>
 */
export function useGenerateAutoPlaybook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['auto-playbook', 'generate'],
    mutationFn: (request: GeneratePlaybookRequest) => autoPlaybookService.generate(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-playbook'] });
    },
  });
}

export function useRecentAutoPlaybooks(limit = 20, enabled = true) {
  return useQuery({
    queryKey: [...RECENT_KEY, limit],
    queryFn: () => autoPlaybookService.listRecent(limit),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useAutoPlaybook(id: string | null) {
  return useQuery({
    queryKey: id ? ONE_KEY(id) : ['auto-playbook', 'one', 'none'],
    queryFn: () => (id ? autoPlaybookService.getById(id) : Promise.resolve(null)),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export type GenerateAutoPlaybookMutation = ReturnType<typeof useGenerateAutoPlaybook>;
export type AutoPlaybookData = GeneratedPlaybookResponse;
