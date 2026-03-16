import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxService } from '@/services/tax.service';
import type { TaxJurisdiction } from '@/types/dto';

const TAX_REPORT_KEY = (year: number, jurisdiction: TaxJurisdiction) => [
  'tax',
  'report',
  year,
  jurisdiction,
];
const TAX_LOTS_KEY = (year: number) => ['tax', 'lots', year];
const WASH_SALES_KEY = (year: number) => ['tax', 'wash-sales', year];

export const useTaxReport = (year: number, jurisdiction: TaxJurisdiction) => {
  return useQuery({
    queryKey: TAX_REPORT_KEY(year, jurisdiction),
    queryFn: () => taxService.getReport(year, jurisdiction),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
};

export const useGenerateTaxReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      year,
      jurisdiction,
    }: {
      year: number;
      jurisdiction: TaxJurisdiction;
    }) => taxService.generateReport(year, jurisdiction),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: TAX_REPORT_KEY(variables.year, variables.jurisdiction),
      });
      queryClient.invalidateQueries({ queryKey: TAX_LOTS_KEY(variables.year) });
      queryClient.invalidateQueries({ queryKey: WASH_SALES_KEY(variables.year) });
    },
  });
};

export const useTaxLots = (year: number) => {
  return useQuery({
    queryKey: TAX_LOTS_KEY(year),
    queryFn: () => taxService.getLots(year),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useWashSales = (year: number) => {
  return useQuery({
    queryKey: WASH_SALES_KEY(year),
    queryFn: () => taxService.getWashSales(year),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
