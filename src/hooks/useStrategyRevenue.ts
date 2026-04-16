import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { strategyRevenueService } from '@/services/strategyRevenue.service';

const PURCHASES_KEY = ['strategy-purchases'];
const SALES_KEY = ['strategy-sales'];
const EARNINGS_KEY = ['strategy-earnings'];
const MARKETPLACE_KEY = ['marketplace'];

export const usePurchaseStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sharedStrategyId: string) =>
      strategyRevenueService.purchaseStrategy(sharedStrategyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_KEY });
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEY });
    },
  });
};

export const useMyPurchases = () => {
  return useQuery({
    queryKey: PURCHASES_KEY,
    queryFn: () => strategyRevenueService.getMyPurchases(),
  });
};

export const useMySales = () => {
  return useQuery({
    queryKey: SALES_KEY,
    queryFn: () => strategyRevenueService.getMySales(),
  });
};

export const useEarnings = () => {
  return useQuery({
    queryKey: EARNINGS_KEY,
    queryFn: () => strategyRevenueService.getEarnings(),
  });
};
