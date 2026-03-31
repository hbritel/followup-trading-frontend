import apiClient from './apiClient';
import type { OnboardingStatusDto } from '@/types/dto';

export const onboardingService = {
  getStatus: async (): Promise<OnboardingStatusDto> => {
    const response = await apiClient.get<OnboardingStatusDto>('/onboarding');
    return response.data;
  },

  completeStep: async (step: string): Promise<OnboardingStatusDto> => {
    const response = await apiClient.post<OnboardingStatusDto>(`/onboarding/step/${step}`);
    return response.data;
  },

  skip: async (): Promise<void> => {
    await apiClient.post('/onboarding/skip');
  },
};
