import apiClient from './apiClient';
import type { TagResponseDto, TagRequestDto } from '@/types/dto';

export const tagService = {
  getTags: async (): Promise<TagResponseDto[]> => {
    const response = await apiClient.get<TagResponseDto[]>('/tags');
    return response.data;
  },

  createTag: async (data: TagRequestDto): Promise<TagResponseDto> => {
    const response = await apiClient.post<TagResponseDto>('/tags', data);
    return response.data;
  },

  updateTag: async (id: number, data: TagRequestDto): Promise<TagResponseDto> => {
    const response = await apiClient.put<TagResponseDto>(`/tags/${id}`, data);
    return response.data;
  },

  deleteTag: async (id: number): Promise<void> => {
    await apiClient.delete(`/tags/${id}`);
  },
};
