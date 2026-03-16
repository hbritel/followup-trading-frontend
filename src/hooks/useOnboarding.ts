import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingService } from '@/services/onboarding.service';

const ONBOARDING_KEY = ['onboarding', 'status'];

export const useOnboardingStatus = () => {
  return useQuery({
    queryKey: ONBOARDING_KEY,
    queryFn: () => onboardingService.getStatus(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
};

export const useCompleteStep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (step: string) => onboardingService.completeStep(step),
    onSuccess: (data) => {
      queryClient.setQueryData(ONBOARDING_KEY, data);
    },
  });
};

export const useSkipOnboarding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => onboardingService.skip(),
    onSuccess: () => {
      queryClient.setQueryData(ONBOARDING_KEY, {
        completedSteps: [],
        currentStep: '',
        completed: true,
      });
    },
  });
};
