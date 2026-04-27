import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CalendarX, CreditCard, Video, Clock, XCircle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useMyBookings,
  useCancelMyBooking,
  useHideMyBooking,
  useResumeBookingCheckout,
  StripeNotConfiguredError,
} from '@/hooks/useMentorRevenue';
import type { SessionBookingStatus, StudentBookingDto } from '@/types/dto';

type ListMode = 'all' | 'active' | 'past';

const ACTIVE_STATUSES: SessionBookingStatus[] = ['PENDING_PAYMENT', 'CONFIRMED'];

const isTerminalStatus = (s: SessionBookingStatus): boolean =>
  s === 'CANCELLED_BY_STUDENT'
  || s === 'CANCELLED_BY_MENTOR'
  || s === 'COMPLETED'
  || s === 'NO_SHOW'
  || s === 'REFUNDED';

const STATUS_COLORS: Record<SessionBookingStatus, string> = {
  PENDING_PAYMENT: 'text-amber-500 bg-amber-500/10',
  CONFIRMED: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  CANCELLED_BY_STUDENT: 'text-muted-foreground bg-muted',
  CANCELLED_BY_MENTOR: 'text-muted-foreground bg-muted',
  COMPLETED: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
  NO_SHOW: 'text-destructive bg-destructive/10',
  REFUNDED: 'text-muted-foreground bg-muted',
};

const fmtPrice = (cents: number, currency: string) => {
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
  return `${sym}${(cents / 100).toFixed(2)}`;
};

interface BookingRowProps {
  booking: StudentBookingDto;
  onRequestCancel: (booking: StudentBookingDto) => void;
  onHide?: (booking: StudentBookingDto) => void;
  hidePending?: boolean;
}

const BookingRow: React.FC<BookingRowProps> = ({ booking, onRequestCancel, onHide, hidePending }) => {
  const { t } = useTranslation();
  const resumeCheckout = useResumeBookingCheckout();
  const [offlineNotice, setOfflineNotice] = useState(false);

  const fmtDate = new Date(booking.scheduledAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const activeStatus =
    booking.status === 'CONFIRMED' || booking.status === 'PENDING_PAYMENT';

  const sessionInPast = new Date(booking.scheduledAt).getTime() < Date.now();
  const canResumePayment =
    booking.status === 'PENDING_PAYMENT' && !sessionInPast;

  const handleResume = () => {
    setOfflineNotice(false);
    resumeCheckout.mutate(booking.id, {
      onSuccess: ({ checkoutUrl }) => {
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          toast.error(
            t(
              'mentor.sessions.resumePayment.unavailable',
              'Unable to start payment right now. Please try again later.'
            )
          );
        }
      },
      onError: (error) => {
        if (error instanceof StripeNotConfiguredError) {
          setOfflineNotice(true);
          return;
        }
        toast.error(
          t(
            'mentor.sessions.resumePayment.failed',
            'Could not resume payment. Please try again.'
          )
        );
      },
    });
  };

  const windowHint = booking.cancellable && booking.cancellationWindowHours
    ? t('mentor.sessions.cancelHint', {
        defaultValue: 'Free cancellation up to {{hours}} h before the session.',
        hours: booking.cancellationWindowHours,
      })
    : activeStatus && !booking.withinCancellationWindow
      ? t(
          'mentor.sessions.cancelTooLate',
          'The cancellation window has passed — contact the mentor for a discretionary refund.'
        )
      : null;

  return (
    <article className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/10 p-4 hover:bg-muted/20 transition-colors">
      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
        <Clock className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="font-medium text-sm">{fmtDate}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {booking.durationMinutes}
              {t('mentor.sessions.min', ' min')}
              {' · '}
              {fmtPrice(booking.priceCents, booking.currency)}
            </p>
          </div>
          <span
            className={[
              'text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0',
              STATUS_COLORS[booking.status],
            ].join(' ')}
          >
            {booking.status.replace(/_/g, ' ')}
          </span>
        </div>
        {booking.status === 'CONFIRMED' && booking.meetingUrl && (
          <a
            href={booking.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
          >
            <Video className="w-3.5 h-3.5" />
            {t('mentor.sessions.joinMeeting', 'Join meeting')}
          </a>
        )}

        {booking.status === 'PENDING_PAYMENT' && (
          <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300 leading-snug">
              {sessionInPast
                ? t(
                    'mentor.sessions.pendingPaymentExpired',
                    'This session has already started. The booking will be archived shortly.'
                  )
                : offlineNotice
                  ? t(
                      'mentor.sessions.resumePayment.offline',
                      "This mentor doesn't accept online payments yet. Contact them to settle the session, or cancel below."
                    )
                  : t(
                      'mentor.sessions.pendingPayment',
                      'Complete your payment to confirm this session.'
                    )}
            </p>
            {canResumePayment && !offlineNotice && (
              <Button
                size="sm"
                className="w-full sm:w-auto h-8 px-3 text-xs gap-1.5 bg-amber-600 hover:bg-amber-600/90 text-white"
                onClick={handleResume}
                disabled={resumeCheckout.isPending}
              >
                {resumeCheckout.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CreditCard className="w-3.5 h-3.5" />
                )}
                {t('mentor.sessions.resumePayment.cta', 'Pay now')}
              </Button>
            )}
          </div>
        )}

        {windowHint && (
          <p className="mt-1.5 text-xs text-muted-foreground">{windowHint}</p>
        )}
        {booking.cancellable && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onRequestCancel(booking)}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              {t('mentor.sessions.cancelBooking', 'Cancel booking')}
            </Button>
          </div>
        )}
        {onHide && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => onHide(booking)}
              disabled={hidePending}
            >
              {hidePending ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 mr-1" />
              )}
              {t('mentor.sessions.hideBooking', 'Remove from my view')}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
};

interface StudentSessionsListProps {
  /** Filter mode: 'active' shows pending/confirmed, 'past' shows terminal statuses, 'all' shows everything. */
  mode?: ListMode;
  /** When true, render a "Remove from my view" action on terminal rows. */
  showHide?: boolean;
  /** Hide internal heading + empty illustration; the parent owns the section chrome. */
  bare?: boolean;
}

const StudentSessionsList: React.FC<StudentSessionsListProps> = ({
  mode = 'all',
  showHide = false,
  bare = false,
}) => {
  const { t } = useTranslation();
  const { data: allBookings = [], isLoading } = useMyBookings();
  const cancelMutation = useCancelMyBooking();
  const hideMutation = useHideMyBooking();
  const [target, setTarget] = useState<StudentBookingDto | null>(null);
  const [hidingId, setHidingId] = useState<string | null>(null);

  const bookings = allBookings.filter((b) => {
    if (mode === 'active') return ACTIVE_STATUSES.includes(b.status);
    if (mode === 'past') return isTerminalStatus(b.status);
    return true;
  });

  const handleConfirm = () => {
    if (!target) return;
    cancelMutation.mutate(target.id, {
      onSuccess: () => setTarget(null),
      onError: () => setTarget(null),
    });
  };

  const handleHide = (b: StudentBookingDto) => {
    setHidingId(b.id);
    hideMutation.mutate(b.id, {
      onSettled: () => setHidingId(null),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    if (bare) {
      return (
        <p className="text-xs text-muted-foreground py-2">
          {mode === 'past'
            ? t('mentor.sessions.studentEmptyPast', 'No past or cancelled sessions to display.')
            : mode === 'active'
              ? t('mentor.sessions.studentEmptyActive', 'No upcoming sessions.')
              : t('mentor.sessions.studentEmpty', "You haven't booked any sessions yet.")}
        </p>
      );
    }
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <CalendarX className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {mode === 'past'
            ? t('mentor.sessions.studentEmptyPast', 'No past or cancelled sessions to display.')
            : mode === 'active'
              ? t('mentor.sessions.studentEmptyActive', 'No upcoming sessions.')
              : t('mentor.sessions.studentEmpty', "You haven't booked any sessions yet.")}
        </p>
      </div>
    );
  }

  return (
    <>
      <section aria-labelledby="my-sessions-heading" className="space-y-3">
        {!bare && (
          <h3
            id="my-sessions-heading"
            className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
          >
            {t('mentor.sessions.myBookings', 'My booked sessions')}
          </h3>
        )}
        <div className="space-y-2">
          {bookings.map((b) => (
            <BookingRow
              key={b.id}
              booking={b}
              onRequestCancel={setTarget}
              onHide={showHide && isTerminalStatus(b.status) ? handleHide : undefined}
              hidePending={hidingId === b.id}
            />
          ))}
        </div>
      </section>

      <AlertDialog open={!!target} onOpenChange={(o) => { if (!o) setTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('mentor.sessions.cancelConfirmTitle', 'Cancel this session?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {target && target.withinCancellationWindow
                ? t('mentor.sessions.cancelConfirmInWindow', {
                    defaultValue:
                      'You are within the free-cancellation window ({{hours}} h before the session). The payment will be refunded.',
                    hours: target.cancellationWindowHours ?? '?',
                  })
                : t(
                    'mentor.sessions.cancelConfirmOutOfWindow',
                    'The cancellation window has passed. You will forfeit the payment — contact the mentor if you need a discretionary refund.'
                  )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>
              {t('common.back', 'Back')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={cancelMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              )}
              {t('mentor.sessions.cancelConfirmAction', 'Cancel booking')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StudentSessionsList;
