import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminMentorService } from '@/services/admin-mentor.service';
import { toast } from 'sonner';
import type { MentorComplaintStatus } from '@/types/dto';

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
