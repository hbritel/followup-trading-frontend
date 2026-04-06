import apiClient from './apiClient';

export interface PromoCodeDto {
  id: string;
  code: string;
  name: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FEATURE_ACCESS' | 'PLAN_UPGRADE';
  discountValue: number | null;
  targetPlan: string | null;
  featureKeys: string | null;
  featureDurationDays: number | null;
  validFrom: string;
  validUntil: string | null;
  maxUses: number | null;
  maxUsesPerUser: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
}

export interface PromoUsageDto {
  id: string;
  userId: string;
  promoCodeId: string;
  appliedAt: string;
  expiresAt: string | null;
  discountAmount: number | null;
  grantedPlan: string | null;
  grantedFeatures: string | null;
  active: boolean;
}

export interface PromoValidationResult {
  valid: boolean;
  discountType: string;
  discountValue: number;
  name: string;
}

export const promoService = {
  // Admin endpoints
  listPromos: async (): Promise<PromoCodeDto[]> => {
    const r = await apiClient.get<PromoCodeDto[]>('/admin/promos');
    return r.data;
  },
  createPromo: async (data: Partial<PromoCodeDto>): Promise<PromoCodeDto> => {
    const r = await apiClient.post<PromoCodeDto>('/admin/promos', data);
    return r.data;
  },
  updatePromo: async (id: string, data: Partial<PromoCodeDto>): Promise<PromoCodeDto> => {
    const r = await apiClient.put<PromoCodeDto>(`/admin/promos/${id}`, data);
    return r.data;
  },
  deactivatePromo: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/promos/${id}`);
  },
  getPromoUsage: async (id: string): Promise<PromoUsageDto[]> => {
    const r = await apiClient.get<PromoUsageDto[]>(`/admin/promos/${id}/usage`);
    return r.data;
  },
  applyToUser: async (promoId: string, userId: string): Promise<PromoUsageDto> => {
    const r = await apiClient.post<PromoUsageDto>(`/admin/promos/${promoId}/apply`, { userId });
    return r.data;
  },
  applyBatch: async (promoId: string, userIds: string[]): Promise<PromoUsageDto[]> => {
    const r = await apiClient.post<PromoUsageDto[]>(`/admin/promos/${promoId}/apply-batch`, { userIds });
    return r.data;
  },
  // User endpoints
  validatePromo: async (code: string): Promise<PromoValidationResult> => {
    const r = await apiClient.get<PromoValidationResult>('/subscription/validate-promo', { params: { code } });
    return r.data;
  },
  applyPromo: async (code: string): Promise<PromoUsageDto> => {
    const r = await apiClient.post<PromoUsageDto>('/subscription/apply-promo', { code });
    return r.data;
  },
};
