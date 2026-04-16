import apiClient from './apiClient';
import type {
  VerifiedProfileDto,
  CreateProfileRequestDto,
  UpdateProfileRequestDto,
  EquityCurvePointDto,
} from '@/types/dto';

export const publicProfileService = {
  getMyProfile: async (): Promise<VerifiedProfileDto> => {
    const response = await apiClient.get<VerifiedProfileDto>('/social/profile');
    return response.data;
  },

  createProfile: async (data: CreateProfileRequestDto): Promise<VerifiedProfileDto> => {
    const response = await apiClient.post<VerifiedProfileDto>('/social/profile', data);
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequestDto): Promise<VerifiedProfileDto> => {
    const response = await apiClient.put<VerifiedProfileDto>('/social/profile', data);
    return response.data;
  },

  refreshMetrics: async (): Promise<VerifiedProfileDto> => {
    const response = await apiClient.post<VerifiedProfileDto>('/social/profile/refresh');
    return response.data;
  },

  browseProfiles: async (page: number, size: number, sort: string): Promise<VerifiedProfileDto[]> => {
    const response = await apiClient.get<VerifiedProfileDto[]>('/social/profiles', {
      params: { page, size, sort },
    });
    return response.data;
  },

  getPublicProfile: async (username: string): Promise<VerifiedProfileDto> => {
    const response = await apiClient.get<VerifiedProfileDto>(`/p/${username}`);
    return response.data;
  },

  getEquityCurve: async (username: string): Promise<EquityCurvePointDto[]> => {
    const response = await apiClient.get<EquityCurvePointDto[]>(`/p/${username}/equity`);
    return response.data;
  },
};
