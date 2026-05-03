import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { skillTreeService } from '@/services/skillTree.service';
import type { SkillNodeView } from '@/types/skillTree';
import { toast } from 'sonner';

const treeKey = () => ['ai', 'skill-tree'];

export const useSkillTree = (enabled: boolean = true) =>
  useQuery<SkillNodeView[]>({
    queryKey: treeKey(),
    queryFn: async () => {
      const res = await skillTreeService.list();
      return res.data ?? [];
    },
    enabled,
    staleTime: 10 * 60 * 1000,
  });

/** Re-runs evaluation server-side (deterministic, no quota cost). */
export const useEvaluateSkillTree = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await skillTreeService.evaluate()).data,
    onSuccess: (data) => {
      qc.setQueryData<SkillNodeView[]>(treeKey(), data ?? []);
    },
    onError: () => {
      toast.error('Failed to evaluate skill tree.');
    },
  });
};
