import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mentorService } from '@/services/mentor.service';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import type {
  CreateSessionOfferingDto,
  CreateWebinarDto,
  CreateSearchAlertDto,
  DirectoryQuery,
} from '@/types/dto';

// ── Query keys ──────────────────────────────────────────────────────────────

const SESSION_OFFERINGS_KEY = ['mentor', 'session-offerings'];
const MENTOR_BOOKINGS_KEY = ['mentor', 'session-bookings'];
const PUBLIC_OFFERINGS_KEY = (slug: string) => ['mentor', 'public-offerings', slug];
const PUBLIC_WEBINARS_KEY = (slug: string) => ['mentor', 'public-webinars', slug];
const WEBINARS_KEY = ['mentor', 'webinars'];
const webinarAttendeesKey = (id: string) => ['mentor', 'webinar-attendees', id];
const MY_BOOKINGS_KEY = ['mentor', 'my-bookings'];
const MY_TICKETS_KEY = ['mentor', 'my-tickets'];
const FUNNEL_KEY = (from: string, to: string) => ['mentor', 'funnel', from, to];
const SEARCH_ALERTS_KEY = ['mentor', 'search-alerts'];

// ── Session offerings — mentor CRUD ─────────────────────────────────────────

export const useMySessionOfferings = () => {
  return useQuery({
    queryKey: SESSION_OFFERINGS_KEY,
    queryFn: async () => {
      try {
        return await mentorService.getMySessionOfferings();
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

export const useCreateSessionOffering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSessionOfferingDto) =>
      mentorService.createSessionOffering(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_OFFERINGS_KEY });
      toast.success('Session offering created.');
    },
    onError: () => {
      toast.error('Failed to create session offering.');
    },
  });
};

export const useUpdateSessionOffering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateSessionOfferingDto>;
    }) => mentorService.updateSessionOffering(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_OFFERINGS_KEY });
      toast.success('Session offering updated.');
    },
    onError: () => {
      toast.error('Failed to update session offering.');
    },
  });
};

export const useDeleteSessionOffering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mentorService.deleteSessionOffering(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_OFFERINGS_KEY });
      toast.success('Session offering deleted.');
    },
    onError: () => {
      toast.error('Failed to delete session offering.');
    },
  });
};

// ── Session bookings — mentor view ───────────────────────────────────────────

export const useMentorSessionBookings = (upcoming?: boolean) => {
  return useQuery({
    queryKey: [...MENTOR_BOOKINGS_KEY, { upcoming }],
    queryFn: () => mentorService.getMentorSessionBookings(upcoming),
    staleTime: 30 * 1000,
  });
};

export const useCancelSessionBookingAsMentor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      mentorService.cancelSessionBookingAsMentor(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENTOR_BOOKINGS_KEY });
      toast.success('Booking cancelled.');
    },
    onError: () => {
      toast.error('Failed to cancel booking.');
    },
  });
};

// ── Session offerings — public / student ────────────────────────────────────

export const usePublicSessionOfferings = (slug: string | undefined) => {
  return useQuery({
    queryKey: PUBLIC_OFFERINGS_KEY(slug ?? ''),
    queryFn: () => mentorService.getPublicSessionOfferings(slug!),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000,
  });
};

export const useBookSession = () => {
  return useMutation({
    mutationFn: ({
      slug,
      offeringId,
      scheduledAt,
    }: {
      slug: string;
      offeringId: string;
      scheduledAt: string;
    }) => mentorService.bookSession(slug, offeringId, scheduledAt),
    onError: () => {
      toast.error('Failed to book session.');
    },
  });
};

// ── Student bookings ─────────────────────────────────────────────────────────

export const useMyBookings = () => {
  return useQuery({
    queryKey: MY_BOOKINGS_KEY,
    queryFn: async () => {
      try {
        return await mentorService.getMyBookings();
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

export const useCancelMyBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => mentorService.cancelMyBooking(bookingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_BOOKINGS_KEY });
      toast.success('Booking cancelled.');
    },
    onError: (error: unknown) => {
      const msg = error instanceof AxiosError && error.response?.data?.message
        ? String(error.response.data.message)
        : 'Failed to cancel booking.';
      toast.error(msg);
    },
  });
};

export class StripeNotConfiguredError extends Error {
  constructor() {
    super('STRIPE_CONNECT_NOT_CONFIGURED');
    this.name = 'StripeNotConfiguredError';
  }
}

export const useResumeBookingCheckout = () => {
  return useMutation({
    mutationFn: async (bookingId: string) => {
      try {
        return await mentorService.resumeBookingCheckout(bookingId);
      } catch (error) {
        if (
          error instanceof AxiosError &&
          error.response?.status === 409 &&
          error.response?.data?.error === 'STRIPE_CONNECT_NOT_CONFIGURED'
        ) {
          throw new StripeNotConfiguredError();
        }
        throw error;
      }
    },
  });
};

// ── Webinars — mentor CRUD ───────────────────────────────────────────────────

export const useMyWebinars = () => {
  return useQuery({
    queryKey: WEBINARS_KEY,
    queryFn: async () => {
      try {
        return await mentorService.getMyWebinars();
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

export const useCreateWebinar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWebinarDto) => mentorService.createWebinar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBINARS_KEY });
      toast.success('Webinar created.');
    },
    onError: () => {
      toast.error('Failed to create webinar.');
    },
  });
};

export const useUpdateWebinar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateWebinarDto> & { status?: string };
    }) => mentorService.updateWebinar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBINARS_KEY });
      toast.success('Webinar updated.');
    },
    onError: () => {
      toast.error('Failed to update webinar.');
    },
  });
};

export const useDeleteWebinar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mentorService.deleteWebinar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBINARS_KEY });
      toast.success('Webinar deleted.');
    },
    onError: () => {
      toast.error('Failed to delete webinar.');
    },
  });
};

export const useWebinarAttendees = (id: string | undefined) => {
  return useQuery({
    queryKey: webinarAttendeesKey(id ?? ''),
    queryFn: () => mentorService.getWebinarAttendees(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
};

// ── Webinars — public / student ──────────────────────────────────────────────

export const usePublicWebinars = (slug: string | undefined) => {
  return useQuery({
    queryKey: PUBLIC_WEBINARS_KEY(slug ?? ''),
    queryFn: () => mentorService.getPublicWebinars(slug!),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000,
  });
};

export const useBuyWebinarTicket = () => {
  return useMutation({
    mutationFn: ({ slug, webinarId }: { slug: string; webinarId: string }) =>
      mentorService.buyWebinarTicket(slug, webinarId),
    onError: () => {
      toast.error('Failed to purchase ticket.');
    },
  });
};

// ── Student webinar tickets ──────────────────────────────────────────────────

export const useMyWebinarTickets = () => {
  return useQuery({
    queryKey: MY_TICKETS_KEY,
    queryFn: async () => {
      try {
        return await mentorService.getMyWebinarTickets();
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

// ── Funnel analytics ─────────────────────────────────────────────────────────

export const useFunnelReport = (from: string, to: string) => {
  return useQuery({
    queryKey: FUNNEL_KEY(from, to),
    queryFn: () => mentorService.getFunnelReport(from, to),
    staleTime: 5 * 60 * 1000,
    enabled: !!from && !!to,
  });
};

// ── Search alerts ────────────────────────────────────────────────────────────

export const useMySearchAlerts = () => {
  return useQuery({
    queryKey: SEARCH_ALERTS_KEY,
    queryFn: async () => {
      try {
        return await mentorService.getMySearchAlerts();
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

export const useCreateSearchAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSearchAlertDto) => mentorService.createSearchAlert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEARCH_ALERTS_KEY });
      toast.success('Search alert saved.');
    },
    onError: () => {
      toast.error('Failed to save search alert.');
    },
  });
};

export const useUpdateSearchAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      mentorService.updateSearchAlert(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEARCH_ALERTS_KEY });
    },
    onError: () => {
      toast.error('Failed to update search alert.');
    },
  });
};

export const useDeleteSearchAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mentorService.deleteSearchAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEARCH_ALERTS_KEY });
      toast.success('Alert removed.');
    },
    onError: () => {
      toast.error('Failed to remove alert.');
    },
  });
};

// Re-export DirectoryQuery type for consumers
export type { DirectoryQuery };
