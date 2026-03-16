import apiClient from './apiClient';
import type { TaxReportDto, TaxLotDto, WashSaleDto, TaxJurisdiction } from '@/types/dto';

export const taxService = {
  generateReport: async (year: number, jurisdiction: TaxJurisdiction): Promise<TaxReportDto> => {
    const response = await apiClient.post<TaxReportDto>('/tax/reports/generate', {
      year,
      jurisdiction,
    });
    return response.data;
  },

  getReport: async (year: number, jurisdiction: TaxJurisdiction): Promise<TaxReportDto> => {
    const response = await apiClient.get<TaxReportDto>('/tax/reports', {
      params: { year, jurisdiction },
    });
    return response.data;
  },

  getLots: async (year: number): Promise<TaxLotDto[]> => {
    const response = await apiClient.get<TaxLotDto[]>('/tax/lots', {
      params: { year },
    });
    return response.data;
  },

  getWashSales: async (year: number): Promise<WashSaleDto[]> => {
    const response = await apiClient.get<WashSaleDto[]>('/tax/wash-sales', {
      params: { year },
    });
    return response.data;
  },

  exportForm8949: async (year: number, jurisdiction: TaxJurisdiction): Promise<Blob> => {
    const response = await apiClient.get('/tax/export/form-8949', {
      params: { year, jurisdiction },
      responseType: 'blob',
    });
    return response.data;
  },

  exportScheduleD: async (year: number, jurisdiction: TaxJurisdiction): Promise<Blob> => {
    const response = await apiClient.get('/tax/export/schedule-d', {
      params: { year, jurisdiction },
      responseType: 'blob',
    });
    return response.data;
  },

  exportSummary: async (year: number, jurisdiction: TaxJurisdiction): Promise<Blob> => {
    const response = await apiClient.get('/tax/export/summary', {
      params: { year, jurisdiction },
      responseType: 'blob',
    });
    return response.data;
  },
};
