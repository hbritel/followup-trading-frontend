import { useQuery } from '@tanstack/react-query';
import { featureConfigService, type RuntimeFeatureConfig } from '@/services/featureConfig.service';

const FEATURE_CONFIG_KEY = ['runtime', 'feature-config'];

const SAFE_FALLBACK: RuntimeFeatureConfig = {
  mentorship: { enabled: false },
};

/**
 * Loads the runtime feature flags exposed by the backend. Cached aggressively
 * (10 min) since these change at most on a deployment. On error we fall back
 * to a safe `everything off` config — never expose a feature we cannot
 * confirm is enabled.
 */
export const useFeatureConfig = () => {
  return useQuery({
    queryKey: FEATURE_CONFIG_KEY,
    queryFn: featureConfigService.getRuntimeConfig,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    placeholderData: SAFE_FALLBACK,
  });
};

/**
 * Convenience hook for the mentor marketplace master switch. Returns `false`
 * while the config is loading or if the call has failed — callers can hide
 * UI safely without flicker.
 */
export const useMentorshipEnabled = (): boolean => {
  const { data } = useFeatureConfig();
  return data?.mentorship?.enabled ?? false;
};
