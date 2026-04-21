import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playbookService } from '@/services/playbook.service';
import type { PlaybookSuggestionDto } from '@/types/dto';
import { toast } from 'sonner';

const PLAYBOOK_KEY = ['ai', 'playbook', 'suggestions'];

export const usePlaybookSuggestions = (status?: string) => {
  return useQuery({
    queryKey: [...PLAYBOOK_KEY, status],
    queryFn: () => playbookService.getSuggestions(status),
    staleTime: 60 * 1000,
  });
};

export const useGeneratePlaybook = () => {
  const queryClient = useQueryClient();
  return useMutation<PlaybookSuggestionDto[], Error, string[] | undefined>({
    mutationFn: (accountIds) => playbookService.generate(accountIds),
    onSuccess: (generated) => {
      queryClient.invalidateQueries({ queryKey: PLAYBOOK_KEY });

      const total = generated.length;
      const fallbackCount = generated.filter((s) => s.aiGenerated === false).length;

      if (total === 0) {
        toast('No new suggestions found — keep trading and try again later.');
        return;
      }
      if (fallbackCount === total) {
        toast.warning('AI provider unavailable — suggestions generated in degraded mode.', {
          description:
            'Metrics are real, but the wording comes from templates. Check your AI provider in Settings.',
        });
      } else if (fallbackCount > 0) {
        toast.warning(
          `${fallbackCount} of ${total} suggestions generated in degraded mode (AI provider partially unavailable).`,
        );
      } else {
        toast.success('Playbook suggestions generated.');
      }
    },
    onError: () => {
      toast.error('Failed to generate playbook suggestions. Please try again.');
    },
  });
};

export const useApplySuggestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => playbookService.apply(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAYBOOK_KEY });
      toast.success('Suggestion applied to your playbook.');
    },
    onError: () => {
      toast.error('Failed to apply suggestion. Please try again.');
    },
  });
};

export const useDismissSuggestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => playbookService.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAYBOOK_KEY });
      toast('Suggestion dismissed.');
    },
    onError: () => {
      toast.error('Failed to dismiss suggestion. Please try again.');
    },
  });
};

export const useUnapplySuggestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => playbookService.unapply(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAYBOOK_KEY });
      toast.success('Suggestion unapplied.');
    },
    onError: () => {
      toast.error('Failed to unapply suggestion. Please try again.');
    },
  });
};

export const useDeleteSuggestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => playbookService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAYBOOK_KEY });
      toast.success('Suggestion deleted.');
    },
    onError: () => {
      toast.error('Failed to delete suggestion. Please try again.');
    },
  });
};
