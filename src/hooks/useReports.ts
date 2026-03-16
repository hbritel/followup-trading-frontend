import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { reportService } from '@/services/report.service';
import type { ReportRequestDto } from '@/types/dto';

const REPORTS_KEY = ['reports'];

export const useReports = () => {
  return useQuery({
    queryKey: REPORTS_KEY,
    queryFn: () => reportService.getReports(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
  });
};

export const useGenerateReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReportRequestDto) => reportService.generateReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
    },
  });
};

export const useDownloadReport = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const blob = await reportService.downloadReport(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportService.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
    },
  });
};
