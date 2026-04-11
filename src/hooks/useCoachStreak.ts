import { useQuery } from '@tanstack/react-query';
import { coachService } from '@/services/coach.service';

export interface CoachStreakData {
  streak: number;
  totalDays: number;
  last7Days: boolean[];
}

export const useCoachStreak = () => {
  return useQuery<CoachStreakData>({
    queryKey: ['coach-streak'],
    queryFn: async (): Promise<CoachStreakData> => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const from = thirtyDaysAgo.toISOString().split('T')[0];
      const to = new Date().toISOString().split('T')[0];

      const [briefingsResp, debriefsResp] = await Promise.all([
        coachService.getBriefings(from, to),
        coachService.getDebriefs(from, to),
      ]);

      // Extract data arrays from Axios responses
      const briefings = Array.isArray(briefingsResp) ? briefingsResp : (briefingsResp as any)?.data ?? [];
      const debriefs = Array.isArray(debriefsResp) ? debriefsResp : (debriefsResp as any)?.data ?? [];

      // Collect all unique dates where user engaged
      const engagedDates = new Set<string>();
      briefings.forEach((b: any) => {
        const d = b.briefingDate?.split('T')[0];
        if (d) engagedDates.add(d);
      });
      debriefs.forEach((d: any) => {
        const s = d.sessionDate?.split('T')[0];
        if (s) engagedDates.add(s);
      });

      // Count consecutive days from today backwards
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        if (engagedDates.has(dateStr)) {
          streak++;
        } else if (i > 0) {
          // Allow today to not count yet
          break;
        }
      }

      // Build last-7-days boolean array (index 0 = 6 days ago, index 6 = today)
      const last7Days: boolean[] = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        return engagedDates.has(d.toISOString().split('T')[0]);
      });

      return { streak, totalDays: engagedDates.size, last7Days };
    },
    staleTime: 5 * 60 * 1000,
  });
};
