import { useQuery } from '@tanstack/react-query';
import { psychologyService } from '@/services/psychology.service';
import type { PsychologyCorrelationResponseDto } from '@/types/dto';

const CORRELATION_KEY = ['ai', 'psychology', 'correlation'];

export const usePsychologyCorrelation = () => {
  return useQuery<PsychologyCorrelationResponseDto | null>({
    queryKey: CORRELATION_KEY,
    queryFn: async () => {
      try {
        const res = await psychologyService.getCorrelation();
        return res.data;
      } catch (err: unknown) {
        if ((err as { response?: { status?: number } })?.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 10 * 60 * 1000,
  });
};
