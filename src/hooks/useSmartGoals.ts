import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { smartGoalsService } from '@/services/smartGoals.service';
import type { GoalProgress, SmartGoal } from '@/types/smartGoals';
import { toast } from 'sonner';

const goalsKey = (weeks?: number) => ['ai', 'goals', weeks ?? 'default'];
const progressKey = () => ['ai', 'goals', 'progress'];

/** Reads the user's recent goal history. */
export const useSmartGoals = (weeks: number = 8, enabled: boolean = true) =>
  useQuery<SmartGoal[]>({
    queryKey: goalsKey(weeks),
    queryFn: async () => {
      const res = await smartGoalsService.list(weeks);
      return res.data ?? [];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

/** Reads live progress for the running week. */
export const useGoalsProgress = (enabled: boolean = true) =>
  useQuery<GoalProgress[]>({
    queryKey: progressKey(),
    queryFn: async () => {
      const res = await smartGoalsService.progress();
      return res.data ?? [];
    },
    enabled,
    staleTime: 60 * 1000,
  });

/** Manually re-generate this week's goals (PRO+, charges one quota slot). */
export const useGenerateGoals = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await smartGoalsService.generate()).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'goals'] });
    },
    onError: () => {
      toast.error('Failed to generate smart goals.');
    },
  });
};

/** Dismiss a goal. */
export const useDeleteGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (goalId: string) => smartGoalsService.remove(goalId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'goals'] });
    },
    onError: () => {
      toast.error('Failed to delete goal.');
    },
  });
};
