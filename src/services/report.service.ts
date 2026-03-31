import apiClient from './apiClient';
import type { ReportResponseDto, ReportRequestDto } from '@/types/dto';

export const reportService = {
  getReports: async (): Promise<ReportResponseDto[]> => {
    const response = await apiClient.get<ReportResponseDto[]>('/reports');
    return response.data;
  },

  getReport: async (id: string): Promise<ReportResponseDto> => {
    const response = await apiClient.get<ReportResponseDto>(`/reports/${id}`);
    return response.data;
  },

  generateReport: async (data: ReportRequestDto): Promise<ReportResponseDto> => {
    const response = await apiClient.post<ReportResponseDto>('/reports/generate', data);
    return response.data;
  },

  downloadReport: async (id: string): Promise<{ blob: Blob; filename: string }> => {
    const response = await apiClient.get(`/reports/${id}/download`, {
      responseType: 'blob',
    });
    // Extract filename from Content-Disposition header
    const disposition = response.headers['content-disposition'] || '';
    const match = disposition.match(/filename="?(.+?)"?$/);
    const filename = match?.[1] || `report-${id}.pdf`;
    return { blob: response.data, filename };
  },

  deleteReport: async (id: string): Promise<void> => {
    await apiClient.delete(`/reports/${id}`);
  },
};
