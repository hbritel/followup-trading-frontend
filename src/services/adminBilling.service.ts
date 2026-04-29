import apiClient from './apiClient';
import { config } from '@/config';
import type {
  AdminRevenueDto,
  AdminRevenuePointDto,
  AdminInvoiceDto,
  AdminTaxLineDto,
  AdminDunningUserDto,
  AdminCouponDto,
  AdminMetricsDto,
} from '@/types/dto';

export type RevenuePeriod = '7d' | '30d' | '90d' | '1y';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CreateCouponRequest {
  percentOff?: number;
  amountOff?: number;
  currency?: string;
  duration: string;
  maxRedemptions?: number;
}

// ── Service ────────────────────────────────────────────────────────────────────

export const adminBillingService = {
  getRevenue: async (): Promise<AdminRevenueDto> => {
    const response = await apiClient.get<AdminRevenueDto>('/admin/billing/revenue');
    return response.data;
  },

  getRevenueSeries: async (period: RevenuePeriod): Promise<AdminRevenuePointDto[]> => {
    const response = await apiClient.get<AdminRevenuePointDto[]>('/admin/billing/revenue/series', {
      params: { period },
    });
    return response.data;
  },

  getInvoices: async (
    limit = 20,
    startingAfter?: string,
  ): Promise<{ data: AdminInvoiceDto[]; hasMore: boolean }> => {
    const response = await apiClient.get<{ data: AdminInvoiceDto[]; hasMore: boolean }>(
      '/admin/billing/invoices',
      {
        params: {
          limit,
          ...(startingAfter ? { startingAfter } : {}),
        },
      },
    );
    return response.data;
  },

  getInvoicePdfUrl: (id: string): string =>
    `${config.apiBaseUrl}/admin/billing/invoices/${id}/pdf`,

  getTaxReport: async (from: string, to: string): Promise<AdminTaxLineDto[]> => {
    const response = await apiClient.get<AdminTaxLineDto[]>('/admin/billing/tax-report', {
      params: { from, to },
    });
    return response.data;
  },

  exportTaxCsv: (from: string, to: string): void => {
    window.open(
      `${config.apiBaseUrl}/admin/billing/tax-report/export?from=${from}&to=${to}`,
      '_blank',
    );
  },

  getDunning: async (): Promise<AdminDunningUserDto[]> => {
    const response = await apiClient.get<AdminDunningUserDto[]>('/admin/billing/dunning');
    return response.data;
  },

  issueRefund: async (
    paymentIntentId: string,
    amount?: number,
  ): Promise<void> => {
    await apiClient.post('/admin/billing/refund', {
      paymentIntentId,
      ...(amount != null ? { amount } : {}),
    });
  },

  getCoupons: async (): Promise<AdminCouponDto[]> => {
    const response = await apiClient.get<AdminCouponDto[]>('/admin/billing/coupons');
    return response.data;
  },

  createCoupon: async (data: CreateCouponRequest): Promise<AdminCouponDto> => {
    const response = await apiClient.post<AdminCouponDto>('/admin/billing/coupons', data);
    return response.data;
  },

  deleteCoupon: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/billing/coupons/${id}`);
  },

  getMetrics: async (): Promise<AdminMetricsDto> => {
    const response = await apiClient.get<AdminMetricsDto>('/admin/billing/metrics');
    return response.data;
  },
};
