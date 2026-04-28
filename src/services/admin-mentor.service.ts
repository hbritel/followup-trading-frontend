import apiClient from './apiClient';
import type {
  AdminMentorListItemDto,
  AdminSuspensionDto,
  Dac7SellerDto,
  DsaTransparencyReportDto,
  MentorComplaintDto,
  MentorComplaintStatus,
  MentorStrikeCategory,
  MentorSuspensionType,
  MentorSuspensionImpactDto,
  VerificationCandidateDto,
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

  // ── DAC7 ─────────────────────────────────────────────────────────────────────

  getDac7Sellers: async (year: number): Promise<Dac7SellerDto[]> => {
    const res = await apiClient.get<Dac7SellerDto[]>(
      `${ADMIN_MENTOR_BASE}/dac7/sellers/${year}`
    );
    return res.data;
  },

  finalizeDac7: async (year: number): Promise<void> => {
    await apiClient.post(`${ADMIN_MENTOR_BASE}/dac7/sellers/${year}/finalize`);
  },

  /** Returns the raw XML blob URL for browser download. */
  getDac7ExportUrl: (year: number): string =>
    `${apiClient.defaults.baseURL ?? '/api/v1'}${ADMIN_MENTOR_BASE}/dac7/sellers/${year}/export.xml`,

  // ── DSA transparency ─────────────────────────────────────────────────────────

  getDsaTransparencyReport: async (year: number): Promise<DsaTransparencyReportDto> => {
    const res = await apiClient.get<DsaTransparencyReportDto>(
      `${ADMIN_MENTOR_BASE}/dsa/transparency/${year}`
    );
    return res.data;
  },

  // ── Suspensions ──────────────────────────────────────────────────────────────

  suspendMentor: async (
    instanceId: string,
    reason: string,
    category: MentorStrikeCategory = 'TOS_VIOLATION',
    type: MentorSuspensionType = 'TEMPORARY',
  ): Promise<AdminSuspensionDto> => {
    const res = await apiClient.post<AdminSuspensionDto>(
      `${ADMIN_MENTOR_BASE}/${instanceId}/suspend`,
      { reason, category, type },
    );
    return res.data;
  },

  /**
   * Pre-suspension impact preview — returns the count of subscriptions that
   * will be cancelled, bookings/tickets that will be refunded, and the total
   * refund amount. Powers the SuspendDialog "X students affected, Y €" panel.
   */
  getSuspensionImpact: async (
    instanceId: string,
    category: MentorStrikeCategory,
    type: MentorSuspensionType,
  ): Promise<MentorSuspensionImpactDto> => {
    const res = await apiClient.get<MentorSuspensionImpactDto>(
      `${ADMIN_MENTOR_BASE}/${instanceId}/suspend/impact`,
      { params: { category, type } },
    );
    return res.data;
  },

  liftSuspension: async (instanceId: string): Promise<void> => {
    await apiClient.post(`${ADMIN_MENTOR_BASE}/${instanceId}/suspend/lift`);
  },

  rescreenSanctions: async (instanceId: string): Promise<void> => {
    await apiClient.post(`${ADMIN_MENTOR_BASE}/${instanceId}/sanctions-rescreen`);
  },

  listActiveSuspensions: async (): Promise<AdminSuspensionDto[]> => {
    const res = await apiClient.get<AdminSuspensionDto[]>(
      `${ADMIN_MENTOR_BASE}/suspensions`
    );
    return res.data;
  },

  listAllMentors: async (): Promise<AdminMentorListItemDto[]> => {
    const res = await apiClient.get<AdminMentorListItemDto[]>(
      `${ADMIN_MENTOR_BASE}/list`
    );
    return res.data;
  },
};
