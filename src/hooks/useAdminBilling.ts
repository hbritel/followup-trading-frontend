import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminBillingService, type CreateCouponRequest } from '@/services/adminBilling.service';
import { toast } from '@/hooks/use-toast';

// ── Query keys ───────────────────────────────────────────────────────────────

const BILLING_REVENUE_KEY = ['admin', 'billing', 'revenue'];
const BILLING_INVOICES_KEY = ['admin', 'billing', 'invoices'];
const BILLING_DUNNING_KEY = ['admin', 'billing', 'dunning'];
const BILLING_COUPONS_KEY = ['admin', 'billing', 'coupons'];
const BILLING_METRICS_KEY = ['admin', 'billing', 'metrics'];

// ── Revenue ──────────────────────────────────────────────────────────────────

export const useAdminRevenue = () =>
  useQuery({
    queryKey: BILLING_REVENUE_KEY,
    queryFn: () => adminBillingService.getRevenue(),
    staleTime: 5 * 60 * 1000,
  });

// ── Invoices ─────────────────────────────────────────────────────────────────

export const useAdminInvoices = (limit = 20, startingAfter?: string) =>
  useQuery({
    queryKey: [...BILLING_INVOICES_KEY, { limit, startingAfter }],
    queryFn: () => adminBillingService.getInvoices(limit, startingAfter),
    staleTime: 30 * 1000,
  });

// ── Tax report ───────────────────────────────────────────────────────────────

export const useAdminTaxReport = (from: string, to: string) =>
  useQuery({
    queryKey: ['admin', 'billing', 'tax-report', { from, to }],
    queryFn: () => adminBillingService.getTaxReport(from, to),
    enabled: !!from && !!to,
    staleTime: 5 * 60 * 1000,
  });

// ── Dunning ──────────────────────────────────────────────────────────────────

export const useAdminDunning = () =>
  useQuery({
    queryKey: BILLING_DUNNING_KEY,
    queryFn: () => adminBillingService.getDunning(),
    staleTime: 30 * 1000,
  });

// ── Refund ───────────────────────────────────────────────────────────────────

export const useIssueRefund = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentIntentId, amount }: { paymentIntentId: string; amount?: number }) =>
      adminBillingService.issueRefund(paymentIntentId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_INVOICES_KEY });
      toast({ title: 'Refund issued', description: 'The refund has been processed.' });
    },
    onError: () => {
      toast({ title: 'Refund failed', description: 'Could not process refund.', variant: 'destructive' });
    },
  });
};

// ── Coupons ──────────────────────────────────────────────────────────────────

export const useAdminCoupons = () =>
  useQuery({
    queryKey: BILLING_COUPONS_KEY,
    queryFn: () => adminBillingService.getCoupons(),
    staleTime: 60 * 1000,
  });

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCouponRequest) => adminBillingService.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_COUPONS_KEY });
      toast({ title: 'Coupon created', description: 'The Stripe coupon has been created.' });
    },
    onError: () => {
      toast({ title: 'Creation failed', description: 'Could not create coupon.', variant: 'destructive' });
    },
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminBillingService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_COUPONS_KEY });
      toast({ title: 'Coupon deleted' });
    },
    onError: () => {
      toast({ title: 'Delete failed', description: 'Could not delete coupon.', variant: 'destructive' });
    },
  });
};

// ── Metrics ──────────────────────────────────────────────────────────────────

export const useAdminBillingMetrics = () =>
  useQuery({
    queryKey: BILLING_METRICS_KEY,
    queryFn: () => adminBillingService.getMetrics(),
    staleTime: 5 * 60 * 1000,
  });
