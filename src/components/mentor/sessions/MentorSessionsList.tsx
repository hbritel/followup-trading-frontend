import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarX, Loader2, Video, Clock, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  useMentorSessionBookings,
  useCancelSessionBookingAsMentor,
} from '@/hooks/useMentorRevenue';
import type { SessionBookingDto, SessionBookingStatus } from '@/types/dto';

const STATUS_COLORS: Record<SessionBookingStatus, string> = {
  PENDING_PAYMENT: 'text-amber-500 bg-amber-500/10',
  CONFIRMED: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  CANCELLED_BY_STUDENT: 'text-muted-foreground bg-muted',
  CANCELLED_BY_MENTOR: 'text-muted-foreground bg-muted',
  COMPLETED: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
  NO_SHOW: 'text-destructive bg-destructive/10',
  REFUNDED: 'text-muted-foreground bg-muted',
};

interface CancelDialogProps {
  booking: SessionBookingDto;
  onClose: () => void;
}

const CancelDialog: React.FC<CancelDialogProps> = ({ booking, onClose }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const cancel = useCancelSessionBookingAsMentor();

  const handleConfirm = () => {
    cancel.mutate(
      { id: booking.id, reason },
      { onSuccess: onClose }
    );
  };

  const fmtDate = new Date(booking.scheduledAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('mentor.sessions.cancelBookingTitle', 'Cancel booking')}
          </DialogTitle>
          <DialogDescription>
            {t('mentor.sessions.cancelBookingDesc', 'Session on {{date}}', {
              date: fmtDate,
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">
            {t('mentor.sessions.cancelReason', 'Reason (visible to student)')}
          </Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={t(
              'mentor.sessions.cancelReasonPlaceholder',
              'Briefly explain why you need to cancel…'
            )}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.back', 'Back')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={cancel.isPending || !reason.trim()}
          >
            {cancel.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('mentor.sessions.confirmCancel', 'Confirm cancellation')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface BookingCardProps {
  booking: SessionBookingDto;
  onCancel: (b: SessionBookingDto) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onCancel }) => {
  const { t } = useTranslation();
  const fmtDate = new Date(booking.scheduledAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const fmtPrice = (cents: number, currency: string) => {
    const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
    return `${sym}${(cents / 100).toFixed(2)}`;
  };

  const canCancel = booking.status === 'CONFIRMED' || booking.status === 'PENDING_PAYMENT';

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
        {booking.meetingUrl && (
          <a
            href={booking.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <Video className="w-3.5 h-3.5" />
            {t('mentor.sessions.joinMeeting', 'Join meeting')}
          </a>
        )}
        {canCancel && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-7 text-xs gap-1 text-destructive hover:text-destructive px-2"
            onClick={() => onCancel(booking)}
          >
            <Ban className="w-3.5 h-3.5" />
            {t('mentor.sessions.cancel', 'Cancel')}
          </Button>
        )}
      </div>
    </article>
  );
};

type BookingFilter = 'upcoming' | 'past' | 'cancelled' | 'pendingPayment' | 'all';

const TERMINAL_STATUSES: SessionBookingStatus[] = [
  'COMPLETED',
  'NO_SHOW',
  'REFUNDED',
];
const CANCELLED_STATUSES: SessionBookingStatus[] = [
  'CANCELLED_BY_STUDENT',
  'CANCELLED_BY_MENTOR',
];

const MentorSessionsList: React.FC = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<BookingFilter>('upcoming');
  const { data: bookings = [], isLoading } = useMentorSessionBookings();
  const [cancelTarget, setCancelTarget] = useState<SessionBookingDto | undefined>(undefined);

  // Per-filter counts so each tab shows how many rows match — cheap, comes
  // from a single fetched payload thanks to the cache rework on the hook.
  const counts = useMemo(() => {
    const now = Date.now();
    const isFuture = (b: SessionBookingDto) =>
      new Date(b.scheduledAt).getTime() > now;
    return {
      upcoming: bookings.filter(
        (b) =>
          (b.status === 'CONFIRMED' || b.status === 'PENDING_PAYMENT')
          && isFuture(b),
      ).length,
      past: bookings.filter(
        (b) =>
          TERMINAL_STATUSES.includes(b.status)
          || ((b.status === 'CONFIRMED' || b.status === 'PENDING_PAYMENT')
            && !isFuture(b)),
      ).length,
      cancelled: bookings.filter((b) => CANCELLED_STATUSES.includes(b.status))
        .length,
      pendingPayment: bookings.filter((b) => b.status === 'PENDING_PAYMENT')
        .length,
      all: bookings.length,
    };
  }, [bookings]);

  const visibleBookings = useMemo(() => {
    const now = Date.now();
    const isFuture = (b: SessionBookingDto) =>
      new Date(b.scheduledAt).getTime() > now;
    const sorted = [...bookings].sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
    );
    switch (filter) {
      case 'upcoming':
        return sorted
          .filter(
            (b) =>
              (b.status === 'CONFIRMED' || b.status === 'PENDING_PAYMENT')
              && isFuture(b),
          )
          .reverse(); // soonest first
      case 'past':
        return sorted.filter(
          (b) =>
            TERMINAL_STATUSES.includes(b.status)
            || ((b.status === 'CONFIRMED' || b.status === 'PENDING_PAYMENT')
              && !isFuture(b)),
        );
      case 'cancelled':
        return sorted.filter((b) => CANCELLED_STATUSES.includes(b.status));
      case 'pendingPayment':
        return sorted.filter((b) => b.status === 'PENDING_PAYMENT');
      case 'all':
      default:
        return sorted;
    }
  }, [bookings, filter]);

  const filterTabs: Array<{ key: BookingFilter; label: string }> = [
    { key: 'all', label: t('mentor.sessions.filter.all', 'All') },
    { key: 'upcoming', label: t('mentor.sessions.filter.upcoming', 'Upcoming') },
    { key: 'past', label: t('mentor.sessions.filter.past', 'Past') },
    { key: 'cancelled', label: t('mentor.sessions.filter.cancelled', 'Cancelled') },
    { key: 'pendingPayment', label: t('mentor.sessions.filter.pendingPayment', 'Pending payment') },
  ];

  const emptyLabel = (() => {
    switch (filter) {
      case 'upcoming':
        return t('mentor.sessions.emptyUpcoming', 'No upcoming bookings yet.');
      case 'past':
        return t('mentor.sessions.emptyPast', 'No past bookings found.');
      case 'cancelled':
        return t('mentor.sessions.emptyCancelled', 'No cancelled bookings.');
      case 'pendingPayment':
        return t(
          'mentor.sessions.emptyPendingPayment',
          'No bookings waiting for payment.',
        );
      case 'all':
      default:
        return t('mentor.sessions.emptyAll', 'No bookings yet.');
    }
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('mentor.sessions.bookingsTitle', 'Session bookings')}
        </h3>
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as BookingFilter)}
        >
          <TabsList className="h-8 flex-wrap">
            {filterTabs.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="text-xs px-3 h-7 gap-1.5"
              >
                {tab.label}
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {counts[tab.key]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : visibleBookings.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <CalendarX className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleBookings.map((b) => (
            <BookingCard key={b.id} booking={b} onCancel={setCancelTarget} />
          ))}
        </div>
      )}

      {cancelTarget && (
        <CancelDialog
          booking={cancelTarget}
          onClose={() => setCancelTarget(undefined)}
        />
      )}
    </div>
  );
};

export default MentorSessionsList;
