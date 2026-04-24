import React, { useState } from 'react';
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

const MentorSessionsList: React.FC = () => {
  const { t } = useTranslation();
  const [upcoming, setUpcoming] = useState(true);
  const { data: bookings = [], isLoading } = useMentorSessionBookings(upcoming);
  const [cancelTarget, setCancelTarget] = useState<SessionBookingDto | undefined>(undefined);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('mentor.sessions.bookingsTitle', 'Session bookings')}
        </h3>
        <Tabs
          value={upcoming ? 'upcoming' : 'past'}
          onValueChange={(v) => setUpcoming(v === 'upcoming')}
        >
          <TabsList className="h-8">
            <TabsTrigger value="upcoming" className="text-xs px-3 h-7">
              {t('mentor.sessions.upcoming', 'Upcoming')}
            </TabsTrigger>
            <TabsTrigger value="past" className="text-xs px-3 h-7">
              {t('mentor.sessions.past', 'Past')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <CalendarX className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {upcoming
              ? t('mentor.sessions.emptyUpcoming', 'No upcoming bookings yet.')
              : t('mentor.sessions.emptyPast', 'No past bookings found.')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
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
