import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMyWebinars, useWebinarAttendees } from '@/hooks/useMentorRevenue';
import type { WebinarDto, WebinarTicketDto, WebinarTicketStatus } from '@/types/dto';

const TICKET_STATUS_COLORS: Record<WebinarTicketStatus, string> = {
  PENDING_PAYMENT: 'text-amber-500 bg-amber-500/10',
  PAID: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  REFUNDED: 'text-muted-foreground bg-muted',
  CANCELLED: 'text-destructive bg-destructive/10',
};

interface WebinarAttendeesRowProps {
  webinar: WebinarDto;
}

const WebinarAttendeesRow: React.FC<WebinarAttendeesRowProps> = ({ webinar }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const { data: attendees = [], isLoading } = useWebinarAttendees(
    expanded ? webinar.id : undefined
  );

  const fmtDate = new Date(webinar.startsAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="min-w-0 flex-1">
          <span className="font-medium text-sm">{webinar.title}</span>
          <p className="text-xs text-muted-foreground mt-0.5">{fmtDate}</p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border/40 px-4 py-3">
          {isLoading ? (
            <div className="space-y-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 rounded-lg bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : attendees.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              {t('mentor.webinars.noAttendees', 'No tickets purchased yet.')}
            </p>
          ) : (
            <div className="space-y-1.5">
              {attendees.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))}
              <p className="text-xs text-muted-foreground pt-1">
                {t('mentor.webinars.attendeeCount', '{{n}} ticket(s)', {
                  n: attendees.filter((a) => a.status === 'PAID').length,
                })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TicketRow: React.FC<{ ticket: WebinarTicketDto }> = ({ ticket }) => {
  const { t } = useTranslation();
  const display = ticket.attendeeEmail ?? ticket.attendeeUserId ?? t('mentor.webinars.anonymousAttendee', 'Anonymous');

  return (
    <div className="flex items-center justify-between gap-3 text-sm py-1">
      <span className="text-muted-foreground truncate max-w-[60%]">{display}</span>
      <span
        className={[
          'text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full',
          TICKET_STATUS_COLORS[ticket.status],
        ].join(' ')}
      >
        {ticket.status}
      </span>
    </div>
  );
};

const WebinarAttendeesList: React.FC = () => {
  const { t } = useTranslation();
  const { data: webinars = [], isLoading } = useMyWebinars();

  const publishedOrCompleted = webinars.filter(
    (w) => w.status === 'PUBLISHED' || w.status === 'COMPLETED'
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (publishedOrCompleted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        {t('mentor.webinars.noPublishedWebinars', 'Publish a webinar to see attendees here.')}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {t('mentor.webinars.attendeesTitle', 'Attendees by webinar')}
      </h3>
      {publishedOrCompleted.map((w) => (
        <WebinarAttendeesRow key={w.id} webinar={w} />
      ))}
    </div>
  );
};

export default WebinarAttendeesList;
