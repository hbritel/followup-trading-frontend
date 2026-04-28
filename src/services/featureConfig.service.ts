import apiClient from './apiClient';

export interface RuntimeFeatureConfig {
  mentorship: {
    enabled: boolean;
  };
}

/**
 * Public, unauthenticated runtime feature flags consumed by the frontend on
 * boot. Backed by `GET /api/v1/config/features` — see backend
 * `PublicFeatureConfigController`.
 *
 * Used to decide whether the mentor surface (sidebar entries, routes,
 * command palette categories) should render. Default-safe: if the call
 * fails, the consumer must treat every flag as `false`.
 */
export const featureConfigService = {
  async getRuntimeConfig(): Promise<RuntimeFeatureConfig> {
    const res = await apiClient.get<RuntimeFeatureConfig>('/config/features');
    return res.data;
  },
};
