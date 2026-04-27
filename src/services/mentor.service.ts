import apiClient from './apiClient';
import { AxiosError } from 'axios';
import type {
  MentorCohortPolicyDto,
  MentorCohortPricingDto,
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
  DirectoryCardDto,
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
  SessionOfferingDto,
  SessionBookingDto,
  StudentBookingDto,
  WebinarDto,
  WebinarTicketDto,
  FunnelReportDto,
  SearchAlertDto,
  CreateSessionOfferingDto,
  CreateWebinarDto,
  CreateSearchAlertDto,
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

  removeStudent: async (userId: string, reason: string): Promise<void> => {
    await apiClient.delete(`${MENTOR_BASE}/students/${userId}`, {
      data: { reason },
    });
  },

  getMyRemovalNotice: async (): Promise<{
    enrollmentId: string;
    instanceId: string;
    mentorBrandName: string | null;
    mentorLogoUrl: string | null;
    reason: string;
    removedAt: string;
  } | null> => {
    const res = await apiClient.get(`/me/mentor/removal-notice`);
    if (res.status === 204 || !res.data) return null;
    return res.data;
  },

  acknowledgeRemovalNotice: async (enrollmentId: string): Promise<void> => {
    await apiClient.post(`/me/mentor/removal-notice/${enrollmentId}/acknowledge`);
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

  getMonetizationSummary: async (): Promise<import('@/types/dto').MentorMonetizationSummaryDto> => {
    const res = await apiClient.get<import('@/types/dto').MentorMonetizationSummaryDto>(
      `${MENTOR_BASE}/monetization/summary`,
    );
    return res.data;
  },

  getDirectorySpotlight: async (limit = 5): Promise<DirectoryCardDto[]> => {
    const res = await apiClient.get<DirectoryCardDto[]>(
      `/public/mentors/spotlight`,
      { params: { limit } },
    );
    return res.data;
  },

  getMetricsSummary: async (cohortId?: string): Promise<MentorMetricsSummaryDto> => {
    const res = await apiClient.get<MentorMetricsSummaryDto>(
      `${MENTOR_BASE}/metrics/summary`,
      cohortId ? { params: { cohortId } } : undefined
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
    body: string,
    visibleToStudent: boolean = false
  ): Promise<MentorStudentNoteDto> => {
    const res = await apiClient.post<MentorStudentNoteDto>(
      `${MENTOR_BASE}/students/${userId}/notes`,
      { body, visibleToStudent }
    );
    return res.data;
  },

  updateStudentNote: async (
    userId: string,
    noteId: string,
    body: string,
    visibleToStudent: boolean = false
  ): Promise<MentorStudentNoteDto> => {
    const res = await apiClient.put<MentorStudentNoteDto>(
      `${MENTOR_BASE}/students/${userId}/notes/${noteId}`,
      { body, visibleToStudent }
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

  getCohortMembers: async (cohortId: string): Promise<MentorStudentDto[]> => {
    const res = await apiClient.get<MentorStudentDto[]>(
      `${MENTOR_BASE}/cohorts/${cohortId}/members`,
    );
    return res.data;
  },

  broadcastCohortNote: async (
    cohortId: string,
    data: { body: string; visibleToStudent?: boolean },
  ): Promise<{ sent: number }> => {
    const res = await apiClient.post<{ sent: number }>(
      `${MENTOR_BASE}/cohorts/${cohortId}/broadcast-note`,
      data,
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
    await apiClient.put(`${MENTOR_BASE}/jurisdictions`, rules);
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

  // ── Phase 4: Session offerings (mentor CRUD) ─────────────────────────────

  getMySessionOfferings: async (): Promise<SessionOfferingDto[]> => {
    const res = await apiClient.get<SessionOfferingDto[]>(`${MENTOR_BASE}/session-offerings`);
    return res.data;
  },

  createSessionOffering: async (data: CreateSessionOfferingDto): Promise<SessionOfferingDto> => {
    const res = await apiClient.post<SessionOfferingDto>(`${MENTOR_BASE}/session-offerings`, data);
    return res.data;
  },

  updateSessionOffering: async (id: string, data: Partial<CreateSessionOfferingDto>): Promise<SessionOfferingDto> => {
    const res = await apiClient.put<SessionOfferingDto>(`${MENTOR_BASE}/session-offerings/${id}`, data);
    return res.data;
  },

  deleteSessionOffering: async (id: string): Promise<void> => {
    await apiClient.delete(`${MENTOR_BASE}/session-offerings/${id}`);
  },

  // ── Phase 4: Session bookings (mentor view) ──────────────────────────────

  getMentorSessionBookings: async (): Promise<SessionBookingDto[]> => {
    const res = await apiClient.get<SessionBookingDto[]>(
      `${MENTOR_BASE}/session-bookings`,
    );
    return res.data;
  },

  cancelSessionBookingAsMentor: async (id: string, reason: string): Promise<void> => {
    await apiClient.post(`${MENTOR_BASE}/session-bookings/${id}/cancel`, { reason });
  },

  // ── Phase 4: Session offerings (public) ─────────────────────────────────

  getPublicSessionOfferings: async (slug: string): Promise<SessionOfferingDto[]> => {
    const res = await apiClient.get<SessionOfferingDto[]>(
      `/public/mentor/profile/${slug}/session-offerings`
    );
    return res.data;
  },

  bookSession: async (
    slug: string,
    offeringId: string,
    scheduledAt: string
  ): Promise<{ checkoutUrl: string; bookingId: string }> => {
    const res = await apiClient.post<{ checkoutUrl: string; bookingId: string }>(
      `/public/mentor/profile/${slug}/session-offerings/${offeringId}/book`,
      { scheduledAt }
    );
    return res.data;
  },

  // ── My Mentor catalog (enrolled students) ───────────────────────────────

  getMyMentorOfferings: async (): Promise<SessionOfferingDto[]> => {
    const res = await apiClient.get<SessionOfferingDto[]>(`/me/mentor/offerings`);
    return res.data;
  },

  getMyMentorWebinars: async (): Promise<WebinarDto[]> => {
    const res = await apiClient.get<WebinarDto[]>(`/me/mentor/webinars`);
    return res.data;
  },

  bookMyMentorSession: async (
    offeringId: string,
    scheduledAt: string,
  ): Promise<{ checkoutUrl: string | null; bookingId: string }> => {
    const res = await apiClient.post<{ checkoutUrl: string | null; bookingId: string }>(
      `/me/mentor/offerings/${offeringId}/book`,
      { scheduledAt },
    );
    return res.data;
  },

  buyMyMentorWebinarTicket: async (
    webinarId: string,
  ): Promise<{ checkoutUrl: string | null; ticketId: string }> => {
    const res = await apiClient.post<{ checkoutUrl: string | null; ticketId: string }>(
      `/me/mentor/webinars/${webinarId}/tickets`,
    );
    return res.data;
  },

  // ── Phase 4: Student bookings ────────────────────────────────────────────

  getMyBookings: async (): Promise<StudentBookingDto[]> => {
    const res = await apiClient.get<StudentBookingDto[]>(`/me/mentor/bookings`);
    return res.data;
  },

  cancelMyBooking: async (bookingId: string): Promise<StudentBookingDto> => {
    const res = await apiClient.post<StudentBookingDto>(
      `/me/mentor/bookings/${bookingId}/cancel`,
      {},
    );
    return res.data;
  },

  hideMyBooking: async (bookingId: string): Promise<void> => {
    await apiClient.delete(`/me/mentor/bookings/${bookingId}`);
  },

  hideMyTicket: async (ticketId: string): Promise<void> => {
    await apiClient.delete(`/me/mentor/tickets/${ticketId}`);
  },

  resumeBookingCheckout: async (
    bookingId: string,
  ): Promise<{ bookingId: string; checkoutUrl: string }> => {
    const res = await apiClient.post<{ bookingId: string; checkoutUrl: string }>(
      `/me/mentor/bookings/${bookingId}/resume-checkout`,
      {},
    );
    return res.data;
  },

  // ── Phase 4: Webinars (mentor CRUD) ─────────────────────────────────────

  getMyWebinars: async (): Promise<WebinarDto[]> => {
    const res = await apiClient.get<WebinarDto[]>(`${MENTOR_BASE}/webinars`);
    return res.data;
  },

  createWebinar: async (data: CreateWebinarDto): Promise<WebinarDto> => {
    const res = await apiClient.post<WebinarDto>(`${MENTOR_BASE}/webinars`, data);
    return res.data;
  },

  updateWebinar: async (id: string, data: Partial<CreateWebinarDto> & { status?: string }): Promise<WebinarDto> => {
    const res = await apiClient.put<WebinarDto>(`${MENTOR_BASE}/webinars/${id}`, data);
    return res.data;
  },

  deleteWebinar: async (id: string): Promise<void> => {
    await apiClient.delete(`${MENTOR_BASE}/webinars/${id}`);
  },

  getWebinarAttendees: async (id: string): Promise<WebinarTicketDto[]> => {
    const res = await apiClient.get<WebinarTicketDto[]>(`${MENTOR_BASE}/webinars/${id}/attendees`);
    return res.data;
  },

  // ── Phase 4: Webinars (public) ───────────────────────────────────────────

  getPublicWebinars: async (slug: string): Promise<WebinarDto[]> => {
    const res = await apiClient.get<WebinarDto[]>(
      `/public/mentor/profile/${slug}/webinars/published`
    );
    return res.data;
  },

  buyWebinarTicket: async (
    slug: string,
    webinarId: string
  ): Promise<{ checkoutUrl: string; ticketId: string }> => {
    const res = await apiClient.post<{ checkoutUrl: string; ticketId: string }>(
      `/public/mentor/profile/${slug}/webinars/${webinarId}/tickets`
    );
    return res.data;
  },

  // ── Phase 4: Student webinar tickets ────────────────────────────────────

  getMyWebinarTickets: async (): Promise<WebinarTicketDto[]> => {
    const res = await apiClient.get<WebinarTicketDto[]>(`/me/mentor/tickets`);
    return res.data;
  },

  // ── Phase 4: Funnel analytics ────────────────────────────────────────────

  getFunnelReport: async (from: string, to: string): Promise<FunnelReportDto> => {
    const res = await apiClient.get<FunnelReportDto>(
      `${MENTOR_BASE}/funnel?from=${from}&to=${to}`
    );
    return res.data;
  },

  // ── Phase 4: Search alerts ───────────────────────────────────────────────

  getMySearchAlerts: async (): Promise<SearchAlertDto[]> => {
    const res = await apiClient.get<SearchAlertDto[]>(`/me/mentor/search-alerts`);
    return res.data;
  },

  createSearchAlert: async (data: CreateSearchAlertDto): Promise<SearchAlertDto> => {
    const res = await apiClient.post<SearchAlertDto>(`/me/mentor/search-alerts`, data);
    return res.data;
  },

  updateSearchAlert: async (id: string, active: boolean): Promise<SearchAlertDto> => {
    const res = await apiClient.put<SearchAlertDto>(`/me/mentor/search-alerts/${id}`, { active });
    return res.data;
  },

  deleteSearchAlert: async (id: string): Promise<void> => {
    await apiClient.delete(`/me/mentor/search-alerts/${id}`);
  },

  // ── Cohort overrides (C4 + C5) ──────────────────────────────────────────

  getCohortPolicies: async (): Promise<MentorCohortPolicyDto[]> => {
    const res = await apiClient.get<MentorCohortPolicyDto[]>('/mentor/cohorts/policies');
    return res.data;
  },

  upsertCohortPolicy: async (
    cohortId: string,
    cancellationPolicy: string,
  ): Promise<MentorCohortPolicyDto> => {
    const res = await apiClient.put<MentorCohortPolicyDto>(
      `/mentor/cohorts/${cohortId}/policy`,
      { cancellationPolicy },
    );
    return res.data;
  },

  deleteCohortPolicy: async (cohortId: string): Promise<void> => {
    await apiClient.delete(`/mentor/cohorts/${cohortId}/policy`);
  },

  getCohortPricing: async (): Promise<MentorCohortPricingDto[]> => {
    const res = await apiClient.get<MentorCohortPricingDto[]>('/mentor/cohorts/pricing');
    return res.data;
  },

  upsertCohortPricing: async (
    cohortId: string,
    monthlyAmount: number,
    currency: string,
  ): Promise<MentorCohortPricingDto> => {
    const res = await apiClient.put<MentorCohortPricingDto>(
      `/mentor/cohorts/${cohortId}/pricing`,
      { monthlyAmount, currency },
    );
    return res.data;
  },

  deleteCohortPricing: async (cohortId: string): Promise<void> => {
    await apiClient.delete(`/mentor/cohorts/${cohortId}/pricing`);
  },
};
