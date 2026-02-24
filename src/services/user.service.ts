// src/services/user.service.ts
import apiClient from './apiClient';
import type { UserProfileDto, UserPreferencesDto, ChangePasswordRequestDto, ActivityPageDto } from '@/types/dto';
import { authService } from './auth.service';

interface UpdateProfileRequest {
    fullName?: string;
    profilePictureUrl?: string;
    preferredCurrency?: string;
    timezone?: string;
    mfaEnabled?: boolean;
    phone?: string;
    tradingBio?: string;
}

const getUserProfile = async (): Promise<UserProfileDto> => {
    try {
        const response = await apiClient.get<UserProfileDto>('/users/me');
        return response.data;
    } catch (error) {
        console.error('Get user profile service error:', error);
        throw error;
    }
};

const getUserPreferences = async (): Promise<UserPreferencesDto> => {
    try {
        const response = await apiClient.get<UserPreferencesDto>('/users/me/preferences');
        return response.data;
    } catch (error) {
        console.error('Get user preferences service error:', error);
        throw error;
    }
};

const updateUserPreferences = async (preferences: Partial<UserPreferencesDto>): Promise<UserPreferencesDto> => {
    try {
        const response = await apiClient.put<UserPreferencesDto>('/users/me/preferences', preferences);
        return response.data;
    } catch (error) {
        console.error('Update user preferences service error:', error);
        throw error;
    }
};

const changePassword = async (passwords: ChangePasswordRequestDto): Promise<void> => {
    try {
        await apiClient.post('/users/me/change-password', passwords);
    } catch (error) {
        console.error('Change password service error:', error);
        throw error;
    }
};

const updateProfile = async (data: UpdateProfileRequest): Promise<UserProfileDto> => {
    const response = await apiClient.put<UserProfileDto>('/users/me', data);
    return response.data;
};

const uploadAvatar = async (file: File): Promise<UserProfileDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<UserProfileDto>('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

const deleteAvatar = async (): Promise<UserProfileDto> => {
    const response = await apiClient.delete<UserProfileDto>('/users/me/avatar');
    return response.data;
};

const getActivity = async (page = 0, size = 20, type = 'all'): Promise<ActivityPageDto> => {
    const response = await apiClient.get<ActivityPageDto>('/users/me/activity', {
        params: { page, size, type },
    });
    return response.data;
};

export const userService = {
    getUserProfile,
    getUserPreferences,
    updateUserPreferences,
    changePassword,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    getActivity,
    getErrorMessage: authService.getErrorMessage,
};
