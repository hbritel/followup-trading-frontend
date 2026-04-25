import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarX, Video, Clock, XCircle, Loader2 } from 'lucide-react';
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
import { useMyBookings, useCancelMyBooking } from '@/hooks/useMentorRevenue';
import type { SessionBookingStatus, StudentBookingDto } from '@/types/dto';

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
}

const BookingRow: React.FC<BookingRowProps> = ({ booking, onRequestCancel }) => {
  const { t } = useTranslation();
  const fmtDate = new Date(booking.scheduledAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const activeStatus =
    booking.status === 'CONFIRMED' || booking.status === 'PENDING_PAYMENT';

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
          <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
            {t(
              'mentor.sessions.pendingPayment',
              'Complete your payment to confirm this session.'
            )}
          </p>
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
      </div>
    </article>
  );
};

const StudentSessionsList: React.FC = () => {
  const { t } = useTranslation();
  const { data: bookings = [], isLoading } = useMyBookings();
  const cancelMutation = useCancelMyBooking();
  const [target, setTarget] = useState<StudentBookingDto | null>(null);

  const handleConfirm = () => {
    if (!target) return;
    cancelMutation.mutate(target.id, {
      onSuccess: () => setTarget(null),
      onError: () => setTarget(null),
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
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <CalendarX className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {t(
            'mentor.sessions.studentEmpty',
            "You haven't booked any sessions yet."
          )}
        </p>
      </div>
    );
  }

  return (
    <>
      <section aria-labelledby="my-sessions-heading" className="space-y-3">
        <h3
          id="my-sessions-heading"
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
        >
          {t('mentor.sessions.myBookings', 'My booked sessions')}
        </h3>
        <div className="space-y-2">
          {bookings.map((b) => (
            <BookingRow key={b.id} booking={b} onRequestCancel={setTarget} />
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
