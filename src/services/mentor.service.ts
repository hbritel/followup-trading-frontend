import apiClient from './apiClient';
import { AxiosError } from 'axios';
import type {
  MentorInstanceDto,
  MentorStudentDto,
  CreateInstanceRequestDto,
  UpdateSharingRequestDto,
  MentorMetricsSummaryDto,
  MentorStudentTradeDto,
  MentorStudentPsychologyDto,
  MentorAnnouncementDto,
  CreateAnnouncementRequestDto,
  UpdateAnnouncementRequestDto,
  MentorStudentNoteDto,
  StudentMentorHubDto,
  MentorCohortDto,
  CreateCohortRequestDto,
  UpdateCohortRequestDto,
  MentorActivityEventDto,
  MentorPublicProfileDto,
  UpdatePublicProfileRequestDto,
  MentorTestimonialDto,
  StudentTestimonialRequestDto,
  MentorConnectStatusDto,
  MentorPricingDto,
  SetDefaultPricingRequestDto,
  MentorStudentPricingDto,
  SetStudentPricingRequestDto,
  MentorSubscriptionDto,
  MentorOnboardUrlDto,
  MentorCheckoutUrlDto,
  DisclaimerType,
  DisclaimerAckResponse,
  PublicCheckoutResponse,
  DirectoryQuery,
  DirectoryPageDto,
  MentorTagDto,
  MentorTagCategory,
  LanguageOptionsDto,
  MentorFaqDto,
  MentorFaqMutation,
  MentorPublicStatsDto,
  MentorCancellationPolicy,
  MentorContactLeadDto,
  MentorContactSubmission,
  MentorJurisdictionRuleDto,
  MentorComplaintSubmission,
} from '@/types/dto';

const MENTOR_BASE = '/mentor';

export const mentorService = {
  // ── Mentor (teacher) endpoints ───────────────────────────

  createInstance: async (data: CreateInstanceRequestDto): Promise<MentorInstanceDto> => {
    const res = await apiClient.post<MentorInstanceDto>(`${MENTOR_BASE}/instance`, data);
    return res.data;
  },

  updateInstance: async (data: Partial<CreateInstanceRequestDto>): Promise<MentorInstanceDto> => {
    const res = await apiClient.put<MentorInstanceDto>(`${MENTOR_BASE}/instance`, data);
    return res.data;
  },

  deleteInstance: async (): Promise<void> => {
    await apiClient.delete(`${MENTOR_BASE}/instance`);
  },

  getMyInstance: async (): Promise<MentorInstanceDto> => {
    const res = await apiClient.get<MentorInstanceDto>(`${MENTOR_BASE}/instance`);
    return res.data;
  },

  getStudents: async (): Promise<MentorStudentDto[]> => {
    const res = await apiClient.get<MentorStudentDto[]>(`${MENTOR_BASE}/students`);
    return res.data;
  },

  removeStudent: async (userId: string): Promise<void> => {
    await apiClient.delete(`${MENTOR_BASE}/students/${userId}`);
  },

  getStudentMetrics: async (userId: string): Promise<Record<string, unknown>> => {
    const res = await apiClient.get<Record<string, unknown>>(
      `${MENTOR_BASE}/students/${userId}/metrics`
    );
    return res.data;
  },

  getStudentTrades: async (userId: string): Promise<MentorStudentTradeDto[]> => {
    const res = await apiClient.get<MentorStudentTradeDto[]>(
      `${MENTOR_BASE}/students/${userId}/trades`
    );
    return res.data;
  },

  getStudentPsychology: async (userId: string): Promise<MentorStudentPsychologyDto[]> => {
    const res = await apiClient.get<MentorStudentPsychologyDto[]>(
      `${MENTOR_BASE}/students/${userId}/psychology`
    );
    return res.data;
  },

  getMetricsSummary: async (): Promise<MentorMetricsSummaryDto> => {
    const res = await apiClient.get<MentorMetricsSummaryDto>(
      `${MENTOR_BASE}/metrics/summary`
    );
    return res.data;
  },

  // ── Announcements (mentor side) ──────────────────────────

  getAnnouncements: async (): Promise<MentorAnnouncementDto[]> => {
    const res = await apiClient.get<MentorAnnouncementDto[]>(
      `${MENTOR_BASE}/announcements`
    );
    return res.data;
  },

  createAnnouncement: async (
    data: CreateAnnouncementRequestDto
  ): Promise<MentorAnnouncementDto> => {
    const res = await apiClient.post<MentorAnnouncementDto>(
      `${MENTOR_BASE}/announcements`,
      data
    );
    return res.data;
  },

  updateAnnouncement: async (
    id: string,
    data: UpdateAnnouncementRequestDto
  ): Promise<MentorAnnouncementDto> => {
    const res = await apiClient.put<MentorAnnouncementDto>(
      `${MENTOR_BASE}/announcements/${id}`,
      data
    );
    return res.data;
  },

  deleteAnnouncement: async (id: string): Promise<void> => {
    await apiClient.delete(`${MENTOR_BASE}/announcements/${id}`);
  },

  // ── Student notes (mentor side, private) ─────────────────

  getStudentNotes: async (userId: string): Promise<MentorStudentNoteDto[]> => {
    const res = await apiClient.get<MentorStudentNoteDto[]>(
      `${MENTOR_BASE}/students/${userId}/notes`
    );
    return res.data;
  },

  addStudentNote: async (
    userId: string,
    body: string
  ): Promise<MentorStudentNoteDto> => {
    const res = await apiClient.post<MentorStudentNoteDto>(
      `${MENTOR_BASE}/students/${userId}/notes`,
      { body }
    );
    return res.data;
  },

  updateStudentNote: async (
    userId: string,
    noteId: string,
    body: string
  ): Promise<MentorStudentNoteDto> => {
    const res = await apiClient.put<MentorStudentNoteDto>(
      `${MENTOR_BASE}/students/${userId}/notes/${noteId}`,
      { body }
    );
    return res.data;
  },

  deleteStudentNote: async (userId: string, noteId: string): Promise<void> => {
    await apiClient.delete(`${MENTOR_BASE}/students/${userId}/notes/${noteId}`);
  },

  // ── Cohorts (M5) ─────────────────────────────────────────

  getCohorts: async (): Promise<MentorCohortDto[]> => {
    const res = await apiClient.get<MentorCohortDto[]>(`${MENTOR_BASE}/cohorts`);
    return res.data;
  },

  createCohort: async (data: CreateCohortRequestDto): Promise<MentorCohortDto> => {
    const res = await apiClient.post<MentorCohortDto>(
      `${MENTOR_BASE}/cohorts`,
      data
    );
    return res.data;
  },

  updateCohort: async (
    id: string,
    data: UpdateCohortRequestDto
  ): Promise<MentorCohortDto> => {
    const res = await apiClient.put<MentorCohortDto>(
      `${MENTOR_BASE}/cohorts/${id}`,
      data
    );
    return res.data;
  },

  deleteCohort: async (id: string): Promise<void> => {
    await apiClient.delete(`${MENTOR_BASE}/cohorts/${id}`);
  },

  addStudentToCohort: async (
    cohortId: string,
    studentUserId: string
  ): Promise<void> => {
    await apiClient.post(
      `${MENTOR_BASE}/cohorts/${cohortId}/members/${studentUserId}`
    );
  },

  removeStudentFromCohort: async (
    cohortId: string,
    studentUserId: string
  ): Promise<void> => {
    await apiClient.delete(
      `${MENTOR_BASE}/cohorts/${cohortId}/members/${studentUserId}`
    );
  },

  getStudentCohorts: async (studentUserId: string): Promise<MentorCohortDto[]> => {
    const res = await apiClient.get<MentorCohortDto[]>(
      `${MENTOR_BASE}/students/${studentUserId}/cohorts`
    );
    return res.data;
  },

  // ── Activity feed (M7) ───────────────────────────────────

  getActivity: async (opts?: {
    limit?: number;
    before?: string;
  }): Promise<MentorActivityEventDto[]> => {
    const params = new URLSearchParams();
    if (opts?.limit != null) params.set('limit', String(opts.limit));
    if (opts?.before) params.set('before', opts.before);
    const qs = params.toString();
    const res = await apiClient.get<MentorActivityEventDto[]>(
      `${MENTOR_BASE}/activity${qs ? `?${qs}` : ''}`
    );
    return res.data;
  },

  // ── Student endpoints ────────────────────────────────────

  joinInstance: async (inviteCode: string): Promise<void> => {
    await apiClient.post(`${MENTOR_BASE}/join`, { inviteCode });
  },

  leaveInstance: async (): Promise<void> => {
    await apiClient.post(`${MENTOR_BASE}/leave`);
  },

  getMyMentorInstance: async (): Promise<MentorInstanceDto> => {
    const res = await apiClient.get<MentorInstanceDto>(`${MENTOR_BASE}/my-instance`);
    return res.data;
  },

  getMyMentorHub: async (): Promise<StudentMentorHubDto> => {
    const res = await apiClient.get<StudentMentorHubDto>(
      `${MENTOR_BASE}/my-mentor/hub`
    );
    return res.data;
  },

  getMyMentorAnnouncements: async (): Promise<MentorAnnouncementDto[]> => {
    const res = await apiClient.get<MentorAnnouncementDto[]>(
      `${MENTOR_BASE}/my-mentor/announcements`
    );
    return res.data;
  },

  updateSharing: async (data: UpdateSharingRequestDto): Promise<void> => {
    await apiClient.put(`${MENTOR_BASE}/sharing`, data);
  },

  // ── Public ───────────────────────────────────────────────

  getPublicInstance: async (inviteCode: string): Promise<MentorInstanceDto> => {
    const res = await apiClient.get<MentorInstanceDto>(`/public/mentor/${inviteCode}`);
    return res.data;
  },

  // ── M9: Public profile ───────────────────────────────────

  getPublicProfile: async (slug: string): Promise<MentorPublicProfileDto> => {
    const res = await apiClient.get<MentorPublicProfileDto>(
      `/public/mentor/profile/${slug}`
    );
    return res.data;
  },

  updatePublicProfile: async (
    data: UpdatePublicProfileRequestDto
  ): Promise<MentorInstanceDto> => {
    const res = await apiClient.put<MentorInstanceDto>(
      `${MENTOR_BASE}/public-profile`,
      data
    );
    return res.data;
  },

  // Testimonials (mentor-side moderation)
  getTestimonials: async (): Promise<MentorTestimonialDto[]> => {
    const res = await apiClient.get<MentorTestimonialDto[]>(
      `${MENTOR_BASE}/testimonials`
    );
    return res.data;
  },

  approveTestimonial: async (
    id: string,
    approved: boolean
  ): Promise<MentorTestimonialDto> => {
    const res = await apiClient.put<MentorTestimonialDto>(
      `${MENTOR_BASE}/testimonials/${id}/approve`,
      { approved }
    );
    return res.data;
  },

  deleteTestimonialByMentor: async (id: string): Promise<void> => {
    await apiClient.delete(`${MENTOR_BASE}/testimonials/${id}`);
  },

  // Testimonials (student-side)
  getMyTestimonial: async (): Promise<MentorTestimonialDto> => {
    const res = await apiClient.get<MentorTestimonialDto>(
      `${MENTOR_BASE}/my-mentor/testimonial`
    );
    return res.data;
  },

  submitTestimonial: async (
    data: { rating: number; body: string }
  ): Promise<MentorTestimonialDto> => {
    const res = await apiClient.post<MentorTestimonialDto>(
      `${MENTOR_BASE}/my-mentor/testimonial`,
      data
    );
    return res.data;
  },

  updateMyTestimonial: async (
    data: StudentTestimonialRequestDto
  ): Promise<MentorTestimonialDto> => {
    const res = await apiClient.put<MentorTestimonialDto>(
      `${MENTOR_BASE}/my-mentor/testimonial`,
      data
    );
    return res.data;
  },

  deleteMyTestimonial: async (): Promise<void> => {
    await apiClient.delete(`${MENTOR_BASE}/my-mentor/testimonial`);
  },

  // ── M10: Stripe Connect ──────────────────────────────────

  getConnectStatus: async (): Promise<MentorConnectStatusDto> => {
    const res = await apiClient.get<MentorConnectStatusDto>(
      `${MENTOR_BASE}/connect/status`
    );
    return res.data;
  },

  startConnectOnboarding: async (): Promise<MentorOnboardUrlDto> => {
    const res = await apiClient.post<MentorOnboardUrlDto>(
      `${MENTOR_BASE}/connect/onboard`
    );
    return res.data;
  },

  getDefaultPricing: async (): Promise<MentorPricingDto> => {
    const res = await apiClient.get<MentorPricingDto>(
      `${MENTOR_BASE}/pricing/default`
    );
    return res.data;
  },

  setDefaultPricing: async (
    data: SetDefaultPricingRequestDto
  ): Promise<MentorPricingDto> => {
    const res = await apiClient.put<MentorPricingDto>(
      `${MENTOR_BASE}/pricing/default`,
      data
    );
    return res.data;
  },

  removeDefaultPricing: async (): Promise<void> => {
    await apiClient.delete(`${MENTOR_BASE}/pricing/default`);
  },

  setStudentPricing: async (
    studentUserId: string,
    data: SetStudentPricingRequestDto
  ): Promise<MentorStudentPricingDto> => {
    const res = await apiClient.put<MentorStudentPricingDto>(
      `${MENTOR_BASE}/pricing/students/${studentUserId}`,
      data
    );
    return res.data;
  },

  removeStudentPricing: async (studentUserId: string): Promise<void> => {
    await apiClient.delete(
      `${MENTOR_BASE}/pricing/students/${studentUserId}`
    );
  },

  getMentorSubscriptions: async (): Promise<MentorSubscriptionDto[]> => {
    const res = await apiClient.get<MentorSubscriptionDto[]>(
      `${MENTOR_BASE}/subscriptions`
    );
    return res.data;
  },

  subscribeToMentor: async (): Promise<MentorCheckoutUrlDto> => {
    const res = await apiClient.post<MentorCheckoutUrlDto>(
      `${MENTOR_BASE}/my-mentor/subscribe`
    );
    return res.data;
  },

  cancelMentorSubscription: async (): Promise<void> => {
    await apiClient.post(`${MENTOR_BASE}/my-mentor/subscription/cancel`);
  },

  // ── Public disclaimer + checkout (Phase 0) ──────────────────────────────

  acknowledgeDisclaimer: async (
    slug: string,
    types: DisclaimerType[]
  ): Promise<DisclaimerAckResponse> => {
    const res = await apiClient.post<DisclaimerAckResponse>(
      `/public/mentor/profile/${slug}/disclaimer`,
      { types }
    );
    return res.data;
  },

  createPublicCheckout: async (
    slug: string,
    acknowledgmentIds: string[]
  ): Promise<PublicCheckoutResponse> => {
    const res = await apiClient.post<PublicCheckoutResponse>(
      `/public/mentor/profile/${slug}/checkout`,
      { acknowledgmentIds }
    );
    return res.data;
  },

  // ── Phase 1: Directory ───────────────────────────────────────────────────

  searchDirectory: async (query: DirectoryQuery): Promise<DirectoryPageDto> => {
    const params = new URLSearchParams();
    if (query.q) params.set('q', query.q);
    if (query.tags?.length) params.set('tags', query.tags.join(','));
    if (query.langs?.length) params.set('langs', query.langs.join(','));
    if (query.minPrice != null) params.set('minPrice', String(query.minPrice));
    if (query.maxPrice != null) params.set('maxPrice', String(query.maxPrice));
    if (query.acceptsNew != null) params.set('acceptsNew', String(query.acceptsNew));
    if (query.monetizedOnly != null) params.set('monetizedOnly', String(query.monetizedOnly));
    if (query.verifiedOnly != null) params.set('verifiedOnly', String(query.verifiedOnly));
    if (query.sort) params.set('sort', query.sort);
    if (query.page != null) params.set('page', String(query.page));
    if (query.size != null) params.set('size', String(query.size));
    const qs = params.toString();
    const res = await apiClient.get<DirectoryPageDto>(
      `/public/mentors${qs ? `?${qs}` : ''}`
    );
    return res.data;
  },

  listDirectoryTags: async (category?: MentorTagCategory): Promise<MentorTagDto[]> => {
    const params = category ? `?category=${category}` : '';
    const res = await apiClient.get<MentorTagDto[]>(`/public/mentors/tags${params}`);
    return res.data;
  },

  listDirectoryLanguages: async (): Promise<LanguageOptionsDto> => {
    const res = await apiClient.get<LanguageOptionsDto>('/public/mentors/languages');
    return res.data;
  },

  getMyTags: async (): Promise<string[]> => {
    const res = await apiClient.get<string[]>(`${MENTOR_BASE}/tags`);
    return res.data;
  },

  setMyTags: async (slugs: string[]): Promise<string[]> => {
    const res = await apiClient.put<string[]>(`${MENTOR_BASE}/tags`, { slugs });
    return res.data;
  },

  getMyLanguages: async (): Promise<string[]> => {
    const res = await apiClient.get<string[]>(`${MENTOR_BASE}/languages`);
    return res.data;
  },

  setMyLanguages: async (codes: string[]): Promise<string[]> => {
    const res = await apiClient.put<string[]>(`${MENTOR_BASE}/languages`, { codes });
    return res.data;
  },

  // ── Phase 2: FAQ (mentor-side) ───────────────────────────────────────────────

  listMyFaq: async (): Promise<MentorFaqDto[]> => {
    const res = await apiClient.get<MentorFaqDto[]>(`${MENTOR_BASE}/faq`);
    return res.data;
  },

  createFaq: async (data: MentorFaqMutation): Promise<MentorFaqDto> => {
    const res = await apiClient.post<MentorFaqDto>(`${MENTOR_BASE}/faq`, data);
    return res.data;
  },

  updateFaq: async (id: string, data: MentorFaqMutation): Promise<MentorFaqDto> => {
    const res = await apiClient.put<MentorFaqDto>(`${MENTOR_BASE}/faq/${id}`, data);
    return res.data;
  },

  deleteFaq: async (id: string): Promise<void> => {
    await apiClient.delete(`${MENTOR_BASE}/faq/${id}`);
  },

  reorderFaq: async (ids: string[]): Promise<void> => {
    await apiClient.put(`${MENTOR_BASE}/faq/reorder`, { ids });
  },

  // ── Phase 2: Leads inbox ─────────────────────────────────────────────────────

  listMyLeads: async (): Promise<MentorContactLeadDto[]> => {
    const res = await apiClient.get<MentorContactLeadDto[]>(`${MENTOR_BASE}/leads`);
    return res.data;
  },

  markLeadRead: async (id: string): Promise<MentorContactLeadDto> => {
    const res = await apiClient.put<MentorContactLeadDto>(`${MENTOR_BASE}/leads/${id}/read`);
    return res.data;
  },

  // ── Phase 2: Jurisdictions ──────────────────────────────────────────────────

  getMyJurisdictions: async (): Promise<MentorJurisdictionRuleDto[]> => {
    const res = await apiClient.get<MentorJurisdictionRuleDto[]>(`${MENTOR_BASE}/jurisdictions`);
    return res.data;
  },

  setMyJurisdictions: async (rules: MentorJurisdictionRuleDto[]): Promise<void> => {
    await apiClient.put(`${MENTOR_BASE}/jurisdictions`, { rules });
  },

  // ── Phase 2: Trust settings ──────────────────────────────────────────────────

  setPublicStatsOptIn: async (enabled: boolean): Promise<void> => {
    await apiClient.put(`${MENTOR_BASE}/public-stats`, { enabled });
  },

  setCancellationPolicy: async (policy: MentorCancellationPolicy): Promise<void> => {
    await apiClient.put(`${MENTOR_BASE}/cancellation-policy`, { policy });
  },

  setAcceptNewEnabled: async (enabled: boolean): Promise<void> => {
    await apiClient.put(`${MENTOR_BASE}/accept-new`, { enabled });
  },

  // ── Phase 2: Public endpoints ────────────────────────────────────────────────

  getPublicFaq: async (slug: string): Promise<MentorFaqDto[]> => {
    const res = await apiClient.get<MentorFaqDto[]>(
      `/public/mentor/profile/${slug}/faq`
    );
    return res.data;
  },

  getPublicStats: async (slug: string): Promise<MentorPublicStatsDto | null> => {
    try {
      const res = await apiClient.get<MentorPublicStatsDto>(
        `/public/mentor/profile/${slug}/stats`
      );
      return res.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  submitContact: async (slug: string, submission: MentorContactSubmission): Promise<void> => {
    await apiClient.post(`/public/mentor/profile/${slug}/contact`, submission);
  },

  submitComplaint: async (slug: string, submission: MentorComplaintSubmission): Promise<void> => {
    await apiClient.post(`/public/mentor/profile/${slug}/complaint`, submission);
  },
};
