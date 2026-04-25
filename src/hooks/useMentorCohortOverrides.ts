import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mentorService } from '@/services/mentor.service';
import type { MentorCohortPolicyDto, MentorCohortPricingDto } from '@/types/dto';

const POLICY_KEY = ['mentor', 'cohort-policies'];
const PRICING_KEY = ['mentor', 'cohort-pricing'];

// ── Cancellation policy overrides ─────────────────────────────────────────

export const useCohortPolicies = () =>
  useQuery<MentorCohortPolicyDto[]>({
    queryKey: POLICY_KEY,
    queryFn: () => mentorService.getCohortPolicies(),
    staleTime: 60 * 1000,
  });

export const useUpsertCohortPolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cohortId, cancellationPolicy }: { cohortId: string; cancellationPolicy: string }) =>
      mentorService.upsertCohortPolicy(cohortId, cancellationPolicy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: POLICY_KEY });
      toast.success('Cohort policy saved.');
    },
    onError: () => toast.error('Could not save cohort policy.'),
  });
};

export const useDeleteCohortPolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cohortId: string) => mentorService.deleteCohortPolicy(cohortId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: POLICY_KEY });
      toast.success('Cohort policy removed.');
    },
    onError: () => toast.error('Could not remove cohort policy.'),
  });
};

// ── Pricing overrides ─────────────────────────────────────────────────────

export const useCohortPricing = () =>
  useQuery<MentorCohortPricingDto[]>({
    queryKey: PRICING_KEY,
    queryFn: () => mentorService.getCohortPricing(),
    staleTime: 60 * 1000,
  });

export const useUpsertCohortPricing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      cohortId,
      monthlyAmount,
      currency,
    }: {
      cohortId: string;
      monthlyAmount: number;
      currency: string;
    }) => mentorService.upsertCohortPricing(cohortId, monthlyAmount, currency),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRICING_KEY });
      toast.success('Cohort pricing saved.');
    },
    onError: () => toast.error('Could not save cohort pricing.'),
  });
};

export const useDeleteCohortPricing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cohortId: string) => mentorService.deleteCohortPricing(cohortId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRICING_KEY });
      toast.success('Cohort pricing removed.');
    },
    onError: () => toast.error('Could not remove cohort pricing.'),
  });
};
