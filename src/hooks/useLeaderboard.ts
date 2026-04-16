import { useQuery } from '@tanstack/react-query';
import { leaderboardService } from '@/services/leaderboard.service';
import { toast } from 'sonner';

const LEADERBOARD_KEY = ['leaderboard'];
const LEADERBOARD_SUMMARY_KEY = ['leaderboard', 'summary'];

export const useLeaderboard = (type: string, page = 0, size = 20) => {
  return useQuery({
    queryKey: [...LEADERBOARD_KEY, type, page, size],
    queryFn: async () => {
      try {
        const { data } = await leaderboardService.getLeaderboard(type, page, size);
        return data;
      } catch (error) {
        toast.error('Failed to load leaderboard');
        throw error;
      }
    },
    staleTime: 60 * 1000,
    enabled: !!type,
  });
};

export const useLeaderboardSummary = () => {
  return useQuery({
    queryKey: LEADERBOARD_SUMMARY_KEY,
    queryFn: async () => {
      try {
        const { data } = await leaderboardService.getSummary();
        return data;
      } catch (error) {
        toast.error('Failed to load leaderboard summary');
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};
