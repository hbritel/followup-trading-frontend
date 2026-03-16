import apiClient from './apiClient';
import type {
  SubscriptionDto,
  PlanDto,
  UsageDto,
  CheckoutResponseDto,
  PortalResponseDto,
} from '@/types/dto';

export const subscriptionService = {
  getSubscription: async (): Promise<SubscriptionDto> => {
    const response = await apiClient.get<SubscriptionDto>('/subscription');
    return response.data;
  },

  getPlans: async (): Promise<PlanDto[]> => {
    const response = await apiClient.get<PlanDto[]>('/subscription/plans');
    return response.data;
  },

  createCheckout: async (
    plan: string,
    interval: 'MONTHLY' | 'ANNUAL',
    successUrl: string,
    cancelUrl: string,
  ): Promise<CheckoutResponseDto> => {
    const response = await apiClient.post<CheckoutResponseDto>('/subscription/checkout', {
      plan,
      interval,
      successUrl,
      cancelUrl,
    });
    return response.data;
  },

  createPortal: async (returnUrl: string): Promise<PortalResponseDto> => {
    const response = await apiClient.post<PortalResponseDto>('/subscription/portal', {
      returnUrl,
    });
    return response.data;
  },

  getUsage: async (): Promise<UsageDto> => {
    const response = await apiClient.get<UsageDto>('/subscription/usage');
    return response.data;
  },
};
