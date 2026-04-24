import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mentorService } from '@/services/mentor.service';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { useWebSocket } from '@/providers/WebSocketProvider';
import type {
  CreateInstanceRequestDto,
  UpdateSharingRequestDto,
  CreateAnnouncementRequestDto,
  UpdateAnnouncementRequestDto,
  MentorActivityEventDto,
  DirectoryQuery,
  MentorTagCategory,
  MentorFaqMutation,
  MentorCancellationPolicy,
  MentorJurisdictionRuleDto,
  MentorContactSubmission,
  MentorComplaintSubmission,
} from '@/types/dto';

const INSTANCE_KEY = ['mentor', 'instance'];
const STUDENTS_KEY = ['mentor', 'students'];
const MY_MENTOR_KEY = ['mentor', 'my-instance'];
const ANNOUNCEMENTS_KEY = ['mentor', 'announcements'];
const MY_MENTOR_HUB_KEY = ['mentor', 'my-mentor-hub'];

// ── Mentor (teacher) hooks ──────────────────────────────────

export const useMentorInstance = () => {
  return useQuery({
    queryKey: INSTANCE_KEY,
    queryFn: async () => {
      try {
        return await mentorService.getMyInstance();
      } catch (error) {
        // 404 = no active instance (never created, or soft-deleted). Treat as "none",
        // not as an error, so the UI falls through to the onboarding card.
        if (error instanceof AxiosError && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};

export const useCreateInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInstanceRequestDto) => mentorService.createInstance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSTANCE_KEY });
      toast.success('Mentor instance created.');
    },
    onError: () => {
      toast.error('Failed to create mentor instance.');
    },
  });
};

export const useUpdateInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateInstanceRequestDto>) => mentorService.updateInstance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSTANCE_KEY });
      toast.success('Mentor instance updated.');
    },
    onError: () => {
      toast.error('Failed to update mentor instance.');
    },
  });
};

export const useDeleteInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => mentorService.deleteInstance(),
    onSuccess: () => {
      // Clear cached values eagerly so the UI flips to the onboarding state without
      // waiting for refetch, and without React Query holding on to stale "previous data".
      queryClient.setQueryData(INSTANCE_KEY, null);
      queryClient.setQueryData(STUDENTS_KEY, []);
      queryClient.setQueryData(['mentor', 'metrics-summary'], null);
      queryClient.setQueryData(ANNOUNCEMENTS_KEY, []);
      // Then invalidate so the next access refetches authoritative state.
      queryClient.invalidateQueries({ queryKey: INSTANCE_KEY });
      queryClient.invalidateQueries({ queryKey: STUDENTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['mentor', 'metrics-summary'] });
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_KEY });
      toast.success('Mentor space deleted.');
    },
    onError: () => {
      toast.error('Failed to delete mentor space.');
    },
  });
};

export const useMentorStudents = () => {
  return useQuery({
    queryKey: STUDENTS_KEY,
    queryFn: mentorService.getStudents,
    staleTime: 60 * 1000,
  });
};

export const useRemoveStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => mentorService.removeStudent(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENTS_KEY });
      toast.success('Student removed.');
    },
    onError: () => {
      toast.error('Failed to remove student.');
    },
  });
};

export const useStudentMetrics = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['mentor', 'student-metrics', userId],
    queryFn: () => mentorService.getStudentMetrics(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
};

export const useStudentTrades = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['mentor', 'student-trades', userId],
    queryFn: () => mentorService.getStudentTrades(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
};

export const useStudentPsychology = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['mentor', 'student-psychology', userId],
    queryFn: () => mentorService.getStudentPsychology(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
};

export const useMentorMetricsSummary = () => {
  return useQuery({
    queryKey: ['mentor', 'metrics-summary'],
    queryFn: async () => {
      try {
        return await mentorService.getMetricsSummary();
      } catch (error) {
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          if (status === 404 || status === 501) {
            return null;
          }
        }
        throw error;
      }
    },
    staleTime: 60 * 1000,
    retry: false,
  });
};

// ── Announcements (mentor side) ─────────────────────────────

export const useMentorAnnouncements = () => {
  return useQuery({
    queryKey: ANNOUNCEMENTS_KEY,
    queryFn: mentorService.getAnnouncements,
    staleTime: 60 * 1000,
  });
};

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAnnouncementRequestDto) =>
      mentorService.createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_KEY });
      toast.success('Announcement posted.');
    },
    onError: () => {
      toast.error('Failed to post announcement.');
    },
  });
};

export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAnnouncementRequestDto }) =>
      mentorService.updateAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_KEY });
      toast.success('Announcement updated.');
    },
    onError: () => {
      toast.error('Failed to update announcement.');
    },
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mentorService.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_KEY });
      toast.success('Announcement deleted.');
    },
    onError: () => {
      toast.error('Failed to delete announcement.');
    },
  });
};

// ── Student notes (mentor side) ─────────────────────────────

const notesKey = (userId: string) => ['mentor', 'student-notes', userId];

export const useStudentNotes = (userId: string | undefined) => {
  return useQuery({
    queryKey: notesKey(userId ?? ''),
    queryFn: () => mentorService.getStudentNotes(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
};

export const useAddStudentNote = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ body, visibleToStudent }: { body: string; visibleToStudent: boolean }) =>
      mentorService.addStudentNote(userId!, body, visibleToStudent),
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: notesKey(userId) });
      toast.success('Note saved.');
    },
    onError: () => {
      toast.error('Failed to save note.');
    },
  });
};

export const useUpdateStudentNote = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, body, visibleToStudent }: { noteId: string; body: string; visibleToStudent: boolean }) =>
      mentorService.updateStudentNote(userId!, noteId, body, visibleToStudent),
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: notesKey(userId) });
      toast.success('Note updated.');
    },
    onError: () => {
      toast.error('Failed to update note.');
    },
  });
};

export const useDeleteStudentNote = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => mentorService.deleteStudentNote(userId!, noteId),
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: notesKey(userId) });
      toast.success('Note deleted.');
    },
    onError: () => {
      toast.error('Failed to delete note.');
    },
  });
};

// ── Student hooks ───────────────────────────────────────────

export const useJoinInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) => mentorService.joinInstance(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_MENTOR_KEY });
      queryClient.invalidateQueries({ queryKey: MY_MENTOR_HUB_KEY });
      toast.success('Joined!');
    },
    onError: () => {
      toast.error('Failed to join mentor instance.');
    },
  });
};

export const useLeaveInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => mentorService.leaveInstance(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_MENTOR_KEY });
      queryClient.invalidateQueries({ queryKey: MY_MENTOR_HUB_KEY });
      toast.success('You have left the mentor instance.');
    },
    onError: () => {
      toast.error('Failed to leave mentor instance.');
    },
  });
};

export const useMyMentorInstance = () => {
  return useQuery({
    queryKey: MY_MENTOR_KEY,
    queryFn: async () => {
      try {
        return await mentorService.getMyMentorInstance();
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};

export const useMyMentorHub = () => {
  return useQuery({
    queryKey: MY_MENTOR_HUB_KEY,
    queryFn: async () => {
      try {
        return await mentorService.getMyMentorHub();
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 60 * 1000,
    retry: false,
  });
};

export const useUpdateSharing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSharingRequestDto) => mentorService.updateSharing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_MENTOR_KEY });
      queryClient.invalidateQueries({ queryKey: MY_MENTOR_HUB_KEY });
      toast.success('Sharing preferences updated.');
    },
    onError: () => {
      toast.error('Failed to update sharing preferences.');
    },
  });
};

// ── Public hook ─────────────────────────────────────────────

export const usePublicMentorInstance = (inviteCode: string | undefined) => {
  return useQuery({
    queryKey: ['mentor', 'public', inviteCode],
    queryFn: () => mentorService.getPublicInstance(inviteCode!),
    enabled: !!inviteCode,
    staleTime: 5 * 60 * 1000,
  });
};


// ── Cohorts (M5) ────────────────────────────────────────────

const COHORTS_KEY = ['mentor', 'cohorts'];
const studentCohortsKey = (userId: string) => ['mentor', 'student-cohorts', userId];

export const useMentorCohorts = () => {
  return useQuery({
    queryKey: COHORTS_KEY,
    queryFn: mentorService.getCohorts,
    staleTime: 60 * 1000,
  });
};

export const useCreateCohort = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color?: string; description?: string }) =>
      mentorService.createCohort(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COHORTS_KEY });
      toast.success('Cohort created.');
    },
    onError: () => {
      toast.error('Failed to create cohort.');
    },
  });
};

export const useUpdateCohort = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; color?: string; description?: string };
    }) => mentorService.updateCohort(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COHORTS_KEY });
      toast.success('Cohort updated.');
    },
    onError: () => {
      toast.error('Failed to update cohort.');
    },
  });
};

export const useDeleteCohort = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mentorService.deleteCohort(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COHORTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['mentor', 'student-cohorts'] });
      toast.success('Cohort deleted.');
    },
    onError: () => {
      toast.error('Failed to delete cohort.');
    },
  });
};

export const useAddStudentToCohort = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cohortId,
      studentUserId,
    }: {
      cohortId: string;
      studentUserId: string;
    }) => mentorService.addStudentToCohort(cohortId, studentUserId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: COHORTS_KEY });
      queryClient.invalidateQueries({
        queryKey: studentCohortsKey(vars.studentUserId),
      });
    },
    onError: () => {
      toast.error('Failed to add student to cohort.');
    },
  });
};

export const useRemoveStudentFromCohort = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cohortId,
      studentUserId,
    }: {
      cohortId: string;
      studentUserId: string;
    }) => mentorService.removeStudentFromCohort(cohortId, studentUserId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: COHORTS_KEY });
      queryClient.invalidateQueries({
        queryKey: studentCohortsKey(vars.studentUserId),
      });
    },
    onError: () => {
      toast.error('Failed to remove student from cohort.');
    },
  });
};

export const useStudentCohorts = (studentUserId: string | undefined) => {
  return useQuery({
    queryKey: studentCohortsKey(studentUserId ?? ''),
    queryFn: () => mentorService.getStudentCohorts(studentUserId!),
    enabled: !!studentUserId,
    staleTime: 60 * 1000,
  });
};

// ── Activity feed (M7) ──────────────────────────────────────

const ACTIVITY_KEY = ['mentor', 'activity'];

export const useMentorActivity = (opts?: { limit?: number }) => {
  const queryClient = useQueryClient();
  const { subscribe, connected } = useWebSocket();

  const query = useQuery({
    queryKey: ACTIVITY_KEY,
    queryFn: () => mentorService.getActivity({ limit: opts?.limit ?? 50 }),
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!connected) return;
    const unsubscribe = subscribe('/user/queue/mentor-activity', (message) => {
      try {
        const event = JSON.parse(message.body) as MentorActivityEventDto;
        queryClient.setQueryData<MentorActivityEventDto[]>(
          ACTIVITY_KEY,
          (prev) => {
            const list = prev ?? [];
            if (list.some((e) => e.id === event.id)) return list;
            return [event, ...list];
          }
        );
      } catch (err) {
        console.error('[useMentorActivity] Failed to parse message:', err);
      }
    });
    return unsubscribe;
  }, [connected, subscribe, queryClient]);

  return query;
};

export const useLoadMoreActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (before: string) => mentorService.getActivity({ limit: 50, before }),
    onSuccess: (older) => {
      queryClient.setQueryData<MentorActivityEventDto[]>(ACTIVITY_KEY, (prev) => {
        const list = prev ?? [];
        const seen = new Set(list.map((e) => e.id));
        const merged = [...list];
        for (const item of older) {
          if (!seen.has(item.id)) merged.push(item);
        }
        return merged;
      });
    },
    onError: () => {
      toast.error('Failed to load more activity.');
    },
  });
};

// ── M9: Public profile ──────────────────────────────────────

const TESTIMONIALS_KEY = ['mentor', 'testimonials'];
const MY_TESTIMONIAL_KEY = ['mentor', 'my-testimonial'];

export const usePublicMentorProfile = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['mentor', 'public-profile', slug],
    queryFn: async () => {
      try {
        return await mentorService.getPublicProfile(slug!);
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};

export const useUpdatePublicProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mentorService.updatePublicProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSTANCE_KEY });
      toast.success('Public profile updated.');
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 409) {
        toast.error('That slug is already taken. Choose another.');
        return;
      }
      toast.error('Failed to update public profile.');
    },
  });
};

export const useMentorTestimonials = () => {
  return useQuery({
    queryKey: TESTIMONIALS_KEY,
    queryFn: mentorService.getTestimonials,
    staleTime: 60 * 1000,
  });
};

export const useApproveTestimonial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      mentorService.approveTestimonial(id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TESTIMONIALS_KEY });
    },
    onError: () => {
      toast.error('Failed to update testimonial.');
    },
  });
};

export const useDeleteTestimonialByMentor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mentorService.deleteTestimonialByMentor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TESTIMONIALS_KEY });
      toast.success('Testimonial deleted.');
    },
    onError: () => {
      toast.error('Failed to delete testimonial.');
    },
  });
};

export const useMyTestimonial = () => {
  return useQuery({
    queryKey: MY_TESTIMONIAL_KEY,
    queryFn: async () => {
      try {
        return await mentorService.getMyTestimonial();
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 60 * 1000,
    retry: false,
  });
};

export const useSubmitTestimonial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { rating: number; body: string }) =>
      mentorService.submitTestimonial(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_TESTIMONIAL_KEY });
      toast.success('Thanks for your review!');
    },
    onError: () => {
      toast.error('Failed to submit review.');
    },
  });
};

export const useUpdateMyTestimonial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mentorService.updateMyTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_TESTIMONIAL_KEY });
      toast.success('Review updated.');
    },
    onError: () => {
      toast.error('Failed to update review.');
    },
  });
};

export const useDeleteMyTestimonial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mentorService.deleteMyTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_TESTIMONIAL_KEY });
      toast.success('Review removed.');
    },
    onError: () => {
      toast.error('Failed to remove review.');
    },
  });
};

// ── M10: Stripe Connect ─────────────────────────────────────

const CONNECT_STATUS_KEY = ['mentor', 'connect', 'status'];
const DEFAULT_PRICING_KEY = ['mentor', 'pricing', 'default'];
const SUBSCRIPTIONS_KEY = ['mentor', 'subscriptions'];

export const useConnectStatus = () => {
  return useQuery({
    queryKey: CONNECT_STATUS_KEY,
    queryFn: mentorService.getConnectStatus,
    staleTime: 30 * 1000,
    retry: false,
  });
};

export const useStartConnectOnboarding = () => {
  return useMutation({
    mutationFn: mentorService.startConnectOnboarding,
    onError: () => {
      toast.error('Failed to start Stripe onboarding.');
    },
  });
};

export const useDefaultPricing = () => {
  return useQuery({
    queryKey: DEFAULT_PRICING_KEY,
    queryFn: async () => {
      try {
        return await mentorService.getDefaultPricing();
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 60 * 1000,
    retry: false,
  });
};

export const useSetDefaultPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { priceCents: number; currency: string }) =>
      mentorService.setDefaultPricing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEFAULT_PRICING_KEY });
      toast.success('Pricing saved.');
    },
    onError: () => {
      toast.error('Failed to save pricing.');
    },
  });
};

export const useRemoveDefaultPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mentorService.removeDefaultPricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEFAULT_PRICING_KEY });
      toast.success('Pricing removed. Access is now free.');
    },
    onError: () => {
      toast.error('Failed to remove pricing.');
    },
  });
};

export const useSetStudentPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      studentUserId,
      data,
    }: {
      studentUserId: string;
      data: { priceCents?: number; waived?: boolean };
    }) => mentorService.setStudentPricing(studentUserId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENTS_KEY });
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_KEY });
      toast.success('Student pricing updated.');
    },
    onError: () => {
      toast.error('Failed to update student pricing.');
    },
  });
};

export const useRemoveStudentPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mentorService.removeStudentPricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENTS_KEY });
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_KEY });
      toast.success('Override removed.');
    },
    onError: () => {
      toast.error('Failed to remove override.');
    },
  });
};

export const useMentorSubscriptions = () => {
  return useQuery({
    queryKey: SUBSCRIPTIONS_KEY,
    queryFn: mentorService.getMentorSubscriptions,
    staleTime: 60 * 1000,
  });
};

export const useSubscribeToMentor = () => {
  return useMutation({
    mutationFn: mentorService.subscribeToMentor,
    onError: () => {
      toast.error('Failed to start checkout.');
    },
  });
};

export const useCancelMentorSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mentorService.cancelMentorSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_MENTOR_HUB_KEY });
      toast.success('Subscription will cancel at period end.');
    },
    onError: () => {
      toast.error('Failed to cancel subscription.');
    },
  });
};

// ── Phase 1: Directory hooks ─────────────────────────────────────────────────

const dirQueryKey = (query: DirectoryQuery) => ['mentor', 'directory', query];
const DIR_TAGS_KEY = (category?: MentorTagCategory) => ['mentor', 'directory-tags', category];
const DIR_LANGS_KEY = ['mentor', 'directory-languages'];
const MY_TAGS_KEY = ['mentor', 'my-tags'];
const MY_LANGS_KEY = ['mentor', 'my-languages'];

export const useMentorDirectory = (query: DirectoryQuery) => {
  return useQuery({
    queryKey: dirQueryKey(query),
    queryFn: () => mentorService.searchDirectory(query),
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
};

export const useDirectoryTags = (category?: MentorTagCategory) => {
  return useQuery({
    queryKey: DIR_TAGS_KEY(category),
    queryFn: () => mentorService.listDirectoryTags(category),
    staleTime: 5 * 60 * 1000,
  });
};

export const useDirectoryLanguages = () => {
  return useQuery({
    queryKey: DIR_LANGS_KEY,
    queryFn: mentorService.listDirectoryLanguages,
    staleTime: 5 * 60 * 1000,
  });
};

export const useMyMentorTags = () => {
  return useQuery({
    queryKey: MY_TAGS_KEY,
    queryFn: async () => {
      try {
        return await mentorService.getMyTags();
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          return [] as string[];
        }
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
};

export const useSetMyMentorTags = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slugs: string[]) => mentorService.setMyTags(slugs),
    onMutate: async (slugs) => {
      await queryClient.cancelQueries({ queryKey: MY_TAGS_KEY });
      const prev = queryClient.getQueryData<string[]>(MY_TAGS_KEY);
      queryClient.setQueryData(MY_TAGS_KEY, slugs);
      return { prev };
    },
    onError: (_err, _slugs, ctx) => {
      if (ctx?.prev != null) queryClient.setQueryData(MY_TAGS_KEY, ctx.prev);
      toast.error('Failed to save tags.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_TAGS_KEY });
      toast.success('Tags saved.');
    },
  });
};

export const useMyMentorLanguages = () => {
  return useQuery({
    queryKey: MY_LANGS_KEY,
    queryFn: async () => {
      try {
        return await mentorService.getMyLanguages();
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          return [] as string[];
        }
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
};

export const useSetMyMentorLanguages = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (codes: string[]) => mentorService.setMyLanguages(codes),
    onMutate: async (codes) => {
      await queryClient.cancelQueries({ queryKey: MY_LANGS_KEY });
      const prev = queryClient.getQueryData<string[]>(MY_LANGS_KEY);
      queryClient.setQueryData(MY_LANGS_KEY, codes);
      return { prev };
    },
    onError: (_err, _codes, ctx) => {
      if (ctx?.prev != null) queryClient.setQueryData(MY_LANGS_KEY, ctx.prev);
      toast.error('Failed to save languages.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_LANGS_KEY });
      toast.success('Languages saved.');
    },
  });
};

// ── Phase 2: FAQ hooks ──────────────────────────────────────────────────────

const MY_FAQ_KEY = ['mentor', 'my-faq'];

export const useMyMentorFaq = () => {
  return useQuery({
    queryKey: MY_FAQ_KEY,
    queryFn: async () => {
      try {
        return await mentorService.listMyFaq();
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    staleTime: 60 * 1000,
    retry: false,
  });
};

export const useCreateFaq = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MentorFaqMutation) => mentorService.createFaq(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_FAQ_KEY });
      toast.success('FAQ entry added.');
    },
    onError: () => {
      toast.error('Failed to add FAQ entry.');
    },
  });
};

export const useUpdateFaq = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MentorFaqMutation }) =>
      mentorService.updateFaq(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_FAQ_KEY });
      toast.success('FAQ entry updated.');
    },
    onError: () => {
      toast.error('Failed to update FAQ entry.');
    },
  });
};

export const useDeleteFaq = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mentorService.deleteFaq(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_FAQ_KEY });
      toast.success('FAQ entry deleted.');
    },
    onError: () => {
      toast.error('Failed to delete FAQ entry.');
    },
  });
};

export const useReorderFaq = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => mentorService.reorderFaq(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_FAQ_KEY });
    },
    onError: () => {
      toast.error('Failed to reorder FAQ.');
    },
  });
};

// ── Phase 2: Leads hooks ────────────────────────────────────────────────────

const MY_LEADS_KEY = ['mentor', 'my-leads'];

export const useMyLeads = () => {
  return useQuery({
    queryKey: MY_LEADS_KEY,
    queryFn: async () => {
      try {
        return await mentorService.listMyLeads();
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    staleTime: 30 * 1000,
    retry: false,
  });
};

export const useMarkLeadRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mentorService.markLeadRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_LEADS_KEY });
    },
    onError: () => {
      toast.error('Failed to mark lead as read.');
    },
  });
};

// ── Phase 2: Jurisdiction hooks ─────────────────────────────────────────────

const MY_JURISDICTIONS_KEY = ['mentor', 'my-jurisdictions'];

export const useMyJurisdictions = () => {
  return useQuery({
    queryKey: MY_JURISDICTIONS_KEY,
    queryFn: async () => {
      try {
        return await mentorService.getMyJurisdictions();
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          return [] as MentorJurisdictionRuleDto[];
        }
        throw error;
      }
    },
    staleTime: 60 * 1000,
    retry: false,
  });
};

export const useSetMyJurisdictions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rules: MentorJurisdictionRuleDto[]) => mentorService.setMyJurisdictions(rules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_JURISDICTIONS_KEY });
      toast.success('Jurisdiction rules saved.');
    },
    onError: () => {
      toast.error('Failed to save jurisdiction rules.');
    },
  });
};

// ── Phase 2: Trust settings hooks ───────────────────────────────────────────

export const useSetPublicStatsOptIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => mentorService.setPublicStatsOptIn(enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSTANCE_KEY });
      toast.success('Public stats setting saved.');
    },
    onError: () => {
      toast.error('Failed to update public stats setting.');
    },
  });
};

export const useSetCancellationPolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (policy: MentorCancellationPolicy) => mentorService.setCancellationPolicy(policy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSTANCE_KEY });
      toast.success('Cancellation policy saved.');
    },
    onError: () => {
      toast.error('Failed to save cancellation policy.');
    },
  });
};

export const useSetAcceptNewEnabled = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => mentorService.setAcceptNewEnabled(enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSTANCE_KEY });
      toast.success(
        'Accept new students setting updated.'
      );
    },
    onError: () => {
      toast.error('Failed to update accept-new setting.');
    },
  });
};

// ── Phase 2: Public stats hook (for preview) ────────────────────────────────

export const usePublicMentorStats = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['mentor', 'public-stats', slug],
    queryFn: () => mentorService.getPublicStats(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};

// ── Phase 2: Contact / Complaint mutations ──────────────────────────────────

export const useSubmitContact = (slug: string) => {
  return useMutation({
    mutationFn: (submission: MentorContactSubmission) =>
      mentorService.submitContact(slug, submission),
    onError: () => {
      toast.error('Failed to send message.');
    },
  });
};

export const useSubmitComplaint = (slug: string) => {
  return useMutation({
    mutationFn: (submission: MentorComplaintSubmission) =>
      mentorService.submitComplaint(slug, submission),
    onError: () => {
      toast.error('Failed to submit report.');
    },
  });
};
