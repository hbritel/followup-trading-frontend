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

  downloadReport: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/reports/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  deleteReport: async (id: string): Promise<void> => {
    await apiClient.delete(`/reports/${id}`);
  },
};
