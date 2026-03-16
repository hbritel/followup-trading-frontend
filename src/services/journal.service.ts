import apiClient from './apiClient';
import type { JournalEntryResponseDto, JournalEntryRequestDto } from '@/types/dto';

interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const journalService = {
  getEntries: async (page = 0, size = 100): Promise<JournalEntryResponseDto[]> => {
    const response = await apiClient.get<PageResponse<JournalEntryResponseDto>>('/journal', {
      params: { page, size },
    });
    return response.data.content;
  },

  getEntryByDate: async (date: string): Promise<JournalEntryResponseDto> => {
    const response = await apiClient.get<JournalEntryResponseDto>(`/journal/date/${date}`);
    return response.data;
  },

  createEntry: async (data: JournalEntryRequestDto): Promise<JournalEntryResponseDto> => {
    const response = await apiClient.post<JournalEntryResponseDto>('/journal', data);
    return response.data;
  },

  updateEntry: async (id: string, data: JournalEntryRequestDto): Promise<JournalEntryResponseDto> => {
    const response = await apiClient.put<JournalEntryResponseDto>(`/journal/${id}`, data);
    return response.data;
  },

  deleteEntry: async (id: string): Promise<void> => {
    await apiClient.delete(`/journal/${id}`);
  },
};
