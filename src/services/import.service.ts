// src/services/import.service.ts
import apiClient from './apiClient';

export interface TradeImportResult {
  totalParsed: number;
  imported: number;
  skippedDuplicates: number;
  errors: number;
  errorDetails: string[];
}

export const importService = {
  async importTrades(file: File, format: string = 'AUTO'): Promise<TradeImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);
    const { data } = await apiClient.post<TradeImportResult>('/trades/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
