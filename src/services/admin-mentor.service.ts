import apiClient from './apiClient';
import type {
  VerificationCandidateDto,
  MentorComplaintDto,
  MentorComplaintStatus,
} from '@/types/dto';

const ADMIN_MENTOR_BASE = '/admin/mentors';

export const adminMentorService = {
  // ── Verification queue ───────────────────────────────────────────────────────

  listVerificationCandidates: async (): Promise<VerificationCandidateDto[]> => {
    const res = await apiClient.get<VerificationCandidateDto[]>(
      `${ADMIN_MENTOR_BASE}/verification/candidates`
    );
    return res.data;
  },

  verifyMentor: async (instanceId: string): Promise<void> => {
    await apiClient.post(`${ADMIN_MENTOR_BASE}/${instanceId}/verify`);
  },

  unverifyMentor: async (instanceId: string, reason: string): Promise<void> => {
    await apiClient.post(`${ADMIN_MENTOR_BASE}/${instanceId}/unverify`, { reason });
  },

  // ── Complaint queue ──────────────────────────────────────────────────────────

  listComplaints: async (status?: MentorComplaintStatus): Promise<MentorComplaintDto[]> => {
    const qs = status ? `?status=${status}` : '';
    const res = await apiClient.get<MentorComplaintDto[]>(
      `${ADMIN_MENTOR_BASE}/complaints${qs}`
    );
    return res.data;
  },

  transitionComplaint: async (
    id: string,
    status: MentorComplaintStatus,
    notes?: string
  ): Promise<MentorComplaintDto> => {
    const res = await apiClient.post<MentorComplaintDto>(
      `${ADMIN_MENTOR_BASE}/complaints/${id}/transition`,
      { status, ...(notes ? { notes } : {}) }
    );
    return res.data;
  },
};
