import React from 'react';
import { useTranslation } from 'react-i18next';
import { Ticket, Video, CalendarX } from 'lucide-react';
import { useMyWebinarTickets } from '@/hooks/useMentorRevenue';
import type { WebinarTicketDto, WebinarTicketStatus } from '@/types/dto';

const STATUS_COLORS: Record<WebinarTicketStatus, string> = {
  PENDING_PAYMENT: 'text-amber-500 bg-amber-500/10',
  PAID: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  REFUNDED: 'text-muted-foreground bg-muted',
  CANCELLED: 'text-destructive bg-destructive/10',
};

const TicketCard: React.FC<{ ticket: WebinarTicketDto }> = ({ ticket }) => {
  const { t } = useTranslation();
  const fmtDate = new Date(ticket.createdAt).toLocaleDateString(undefined, {
    dateStyle: 'medium',
  });

  return (
    <article className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/10 p-4 hover:bg-muted/20 transition-colors">
      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
        <Ticket className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="font-medium text-sm">
              {t('mentor.webinars.ticket', 'Webinar ticket')}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('mentor.webinars.purchasedOn', 'Purchased {{date}}', { date: fmtDate })}
            </p>
          </div>
          <span
            className={[
              'text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0',
              STATUS_COLORS[ticket.status],
            ].join(' ')}
          >
            {ticket.status}
          </span>
        </div>
        {ticket.status === 'PAID' && (
          <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
            {t(
              'mentor.webinars.ticketPaidHint',
              'Meeting link will be shared by the mentor before the event.'
            )}
          </p>
        )}
      </div>
    </article>
  );
};

const StudentWebinarTicketsList: React.FC = () => {
  const { t } = useTranslation();
  const { data: tickets = [], isLoading } = useMyWebinarTickets();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <CalendarX className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {t('mentor.webinars.studentEmpty', "You haven't purchased any webinar tickets yet.")}
        </p>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="my-tickets-heading"
      className="space-y-3"
    >
      <h3
        id="my-tickets-heading"
        className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
      >
        {t('mentor.webinars.myTickets', 'My webinar tickets')}
      </h3>
      <div className="space-y-2">
        {tickets.map((tk) => (
          <TicketCard key={tk.id} ticket={tk} />
        ))}
      </div>
    </section>
  );
};

export default StudentWebinarTicketsList;
