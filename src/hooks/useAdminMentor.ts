import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminMentorService } from '@/services/admin-mentor.service';
import { complianceService } from '@/services/compliance.service';
import { toast } from 'sonner';
import type { MentorComplaintStatus } from '@/types/dto';
import type { CookieConsentPreferences } from '@/lib/legal';

const VERIFICATION_CANDIDATES_KEY = ['admin', 'mentor', 'verification-candidates'];
const complaintsKey = (status?: MentorComplaintStatus) => [
  'admin',
  'mentor',
  'complaints',
  status ?? 'all',
];

// ── Verification queue ───────────────────────────────────────────────────────

export const useVerificationCandidates = () => {
  return useQuery({
    queryKey: VERIFICATION_CANDIDATES_KEY,
    queryFn: adminMentorService.listVerificationCandidates,
    staleTime: 30 * 1000,
  });
};

export const useVerifyMentor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instanceId: string) => adminMentorService.verifyMentor(instanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VERIFICATION_CANDIDATES_KEY });
      toast.success('Mentor verified.');
    },
    onError: () => {
      toast.error('Failed to verify mentor.');
    },
  });
};

export const useUnverifyMentor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceId, reason }: { instanceId: string; reason: string }) =>
      adminMentorService.unverifyMentor(instanceId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VERIFICATION_CANDIDATES_KEY });
      toast.success('Verification revoked.');
    },
    onError: () => {
      toast.error('Failed to revoke verification.');
    },
  });
};

// ── Complaint queue ──────────────────────────────────────────────────────────

export const useAdminComplaints = (status?: MentorComplaintStatus) => {
  return useQuery({
    queryKey: complaintsKey(status),
    queryFn: () => adminMentorService.listComplaints(status),
    staleTime: 30 * 1000,
  });
};

export const useTransitionComplaint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: MentorComplaintStatus;
      notes?: string;
    }) => adminMentorService.transitionComplaint(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentor', 'complaints'] });
      toast.success('Complaint status updated.');
    },
    onError: () => {
      toast.error('Failed to update complaint status.');
    },
  });
};

// ── DAC7 ─────────────────────────────────────────────────────────────────────

const dac7Key = (year: number) => ['admin', 'mentor', 'dac7', year];

export const useDac7Sellers = (year: number) =>
  useQuery({
    queryKey: dac7Key(year),
    queryFn: () => adminMentorService.getDac7Sellers(year),
    staleTime: 60 * 1000,
  });

export const useFinalizeDac7 = (year: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => adminMentorService.finalizeDac7(year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dac7Key(year) });
      toast.success(`DAC7 ${year} finalized.`);
    },
    onError: () => {
      toast.error('Failed to finalize DAC7 report.');
    },
  });
};

// ── DSA ───────────────────────────────────────────────────────────────────────

export const useDsaTransparency = (year: number) =>
  useQuery({
    queryKey: ['admin', 'mentor', 'dsa', year],
    queryFn: () => adminMentorService.getDsaTransparencyReport(year),
    staleTime: 5 * 60 * 1000,
  });

// ── Suspensions ──────────────────────────────────────────────────────────────

const SUSPENSIONS_KEY = ['admin', 'mentor', 'suspensions'];

export const useActiveSuspensions = () =>
  useQuery({
    queryKey: SUSPENSIONS_KEY,
    queryFn: adminMentorService.listActiveSuspensions,
    staleTime: 30 * 1000,
  });

export const useSuspendMentor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceId, reason }: { instanceId: string; reason: string }) =>
      adminMentorService.suspendMentor(instanceId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUSPENSIONS_KEY });
      queryClient.invalidateQueries({ queryKey: VERIFICATION_CANDIDATES_KEY });
      toast.success('Mentor suspended.');
    },
    onError: () => {
      toast.error('Failed to suspend mentor.');
    },
  });
};

export const useLiftSuspension = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instanceId: string) => adminMentorService.liftSuspension(instanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUSPENSIONS_KEY });
      toast.success('Suspension lifted.');
    },
    onError: () => {
      toast.error('Failed to lift suspension.');
    },
  });
};

export const useRescreenSanctions = () =>
  useMutation({
    mutationFn: (instanceId: string) => adminMentorService.rescreenSanctions(instanceId),
    onSuccess: () => toast.success('Sanctions re-screen triggered.'),
    onError: () => toast.error('Failed to trigger sanctions re-screen.'),
  });

// ── Cookie consent ────────────────────────────────────────────────────────────

export const useCookieConsentLatest = (enabled: boolean) =>
  useQuery({
    queryKey: ['compliance', 'cookie-consent', 'latest'],
    queryFn: () => complianceService.getLatestCookieConsent(),
    staleTime: 60 * 60 * 1000,
    enabled,
  });

export const useRecordCookieConsent = () =>
  useMutation({
    mutationFn: (prefs: CookieConsentPreferences) =>
      complianceService.recordCookieConsent(prefs),
  });
