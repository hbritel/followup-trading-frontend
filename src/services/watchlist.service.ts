import apiClient from './apiClient';
import type { WatchlistResponseDto, WatchlistRequestDto, WatchlistItemRequestDto } from '@/types/dto';

export const watchlistService = {
  getWatchlists: async (): Promise<WatchlistResponseDto[]> => {
    const response = await apiClient.get<WatchlistResponseDto[]>('/watchlists');
    return response.data;
  },

  getWatchlist: async (id: string): Promise<WatchlistResponseDto> => {
    const response = await apiClient.get<WatchlistResponseDto>(`/watchlists/${id}`);
    return response.data;
  },

  createWatchlist: async (data: WatchlistRequestDto): Promise<WatchlistResponseDto> => {
    const response = await apiClient.post<WatchlistResponseDto>('/watchlists', data);
    return response.data;
  },

  updateWatchlist: async (id: string, data: WatchlistRequestDto): Promise<WatchlistResponseDto> => {
    const response = await apiClient.put<WatchlistResponseDto>(`/watchlists/${id}`, data);
    return response.data;
  },

  deleteWatchlist: async (id: string): Promise<void> => {
    await apiClient.delete(`/watchlists/${id}`);
  },

  addItem: async (watchlistId: string, data: WatchlistItemRequestDto): Promise<WatchlistResponseDto> => {
    const response = await apiClient.post<WatchlistResponseDto>(`/watchlists/${watchlistId}/items`, data);
    return response.data;
  },

  removeItem: async (watchlistId: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/watchlists/${watchlistId}/items/${itemId}`);
  },
};
