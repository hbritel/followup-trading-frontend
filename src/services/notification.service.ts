import apiClient from './apiClient';
import type { NotificationDto, NotificationPreferenceDto } from '@/types/dto';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

export const notificationService = {
  getNotifications: async (page = 0, size = 20): Promise<PageResponse<NotificationDto>> => {
    const response = await apiClient.get<PageResponse<NotificationDto>>('/notifications', {
      params: { page, size },
    });
    return response.data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all', {});
  },

  getPreferences: async (): Promise<NotificationPreferenceDto[]> => {
    const response = await apiClient.get<NotificationPreferenceDto[]>('/notifications/preferences');
    return response.data;
  },

  updatePreference: async (
    eventType: string,
    inAppEnabled: boolean,
    emailEnabled: boolean,
    scheduledTime?: string | null,
  ): Promise<NotificationPreferenceDto> => {
    const response = await apiClient.put<NotificationPreferenceDto>(
      `/notifications/preferences/${eventType}`,
      { inAppEnabled, emailEnabled, ...(scheduledTime !== undefined ? { scheduledTime } : {}) },
    );
    return response.data;
  },
};
