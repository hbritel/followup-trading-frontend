import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { reportService } from '@/services/report.service';
import type { ReportRequestDto } from '@/types/dto';

const REPORTS_KEY = ['reports'];

export const useReports = () => {
  return useQuery({
    queryKey: REPORTS_KEY,
    queryFn: () => reportService.getReports(),
    placeholderData: keepPreviousData,
    // Poll every 3s while any report is still PENDING or GENERATING, stop when all are done
    refetchInterval: (query) => {
      const reports = query.state.data;
      if (!reports || !Array.isArray(reports)) return false;
      const hasPending = reports.some(
        (r: { status: string }) => r.status === 'PENDING' || r.status === 'GENERATING'
      );
      return hasPending ? 3000 : false;
    },
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
      const { blob, filename } = await reportService.downloadReport(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
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
