import React from 'react';
import { useTranslation } from 'react-i18next';
import { Inbox, MailOpen, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyLeads, useMarkLeadRead } from '@/hooks/useMentor';

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat(
    document.documentElement.lang || navigator.language || 'en-US',
    { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  ).format(new Date(iso));
}

const MentorLeadsInbox: React.FC = () => {
  const { t } = useTranslation();
  const { data: leads = [], isLoading } = useMyLeads();
  const markRead = useMarkLeadRead();

  const sorted = [...leads].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const unreadCount = sorted.filter((l) => !l.readAt).length;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">
            {t('mentor.contact.inbox.title', 'Contact leads')}
          </h3>
          {unreadCount > 0 && (
            <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
          <Inbox className="w-8 h-8 opacity-40" aria-hidden="true" />
          <p className="text-sm">{t('mentor.contact.inbox.empty', 'No contact leads yet.')}</p>
          <p className="text-xs max-w-xs">
            {t(
              'mentor.contact.inbox.emptyDesc',
              'When visitors fill out your contact form, their messages will appear here.'
            )}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((lead) => {
            const isUnread = !lead.readAt;
            return (
              <li
                key={lead.id}
                className={[
                  'rounded-xl border p-4 space-y-2',
                  isUnread
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border/50 bg-background/40',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {isUnread ? (
                      <Mail className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    ) : (
                      <MailOpen className="w-4 h-4 text-muted-foreground/60 shrink-0" aria-hidden="true" />
                    )}
                    <span className="text-sm font-medium truncate">
                      {lead.visitorEmail}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {fmtDate(lead.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 pl-6">
                  {lead.message}
                </p>

                {isUnread && (
                  <div className="pl-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1.5 px-2"
                      onClick={() => markRead.mutate(lead.id)}
                      disabled={markRead.isPending}
                    >
                      <MailOpen className="w-3 h-3" />
                      {t('mentor.contact.inbox.markRead', 'Mark as read')}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default MentorLeadsInbox;
