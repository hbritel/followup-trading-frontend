import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscription.service';

const SUBSCRIPTION_KEY = ['subscription'];
const PLANS_KEY = ['subscription', 'plans'];

export const useSubscription = () => {
  return useQuery({
    queryKey: SUBSCRIPTION_KEY,
    queryFn: () => subscriptionService.getSubscription(),
    staleTime: 30 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

export const usePlans = () => {
  return useQuery({
    queryKey: PLANS_KEY,
    queryFn: () => subscriptionService.getPlans(),
    staleTime: 60 * 60 * 1000, // 1 hour — plans rarely change
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateCheckout = () => {
  return useMutation({
    mutationFn: ({
      plan,
      interval,
      successUrl,
      cancelUrl,
    }: {
      plan: string;
      interval: 'MONTHLY' | 'ANNUAL';
      successUrl: string;
      cancelUrl: string;
    }) => subscriptionService.createCheckout(plan, interval, successUrl, cancelUrl),
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
  });
};

export const useCreatePortal = () => {
  return useMutation({
    mutationFn: ({ returnUrl }: { returnUrl: string }) =>
      subscriptionService.createPortal(returnUrl),
    onSuccess: (data) => {
      window.location.href = data.portalUrl;
    },
  });
};

export const useInvalidateSubscription = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEY });
};
