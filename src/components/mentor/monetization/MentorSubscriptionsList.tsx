import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { useMentorSubscriptions } from '@/hooks/useMentor';
import type { MentorSubscriptionStatus } from '@/types/dto';

const STATUS_STYLES: Record<MentorSubscriptionStatus, string> = {
  ACTIVE:
    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
  PAST_DUE:
    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  CANCELED:
    'bg-muted text-muted-foreground border-border/40',
  INCOMPLETE:
    'bg-muted text-muted-foreground border-border/40',
};

const StatusChip: React.FC<{ status: MentorSubscriptionStatus }> = ({
  status,
}) => {
  const { t } = useTranslation();
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border',
        STATUS_STYLES[status],
      ].join(' ')}
    >
      {t(`mentor.monetization.status.${status.toLowerCase()}`, status)}
    </span>
  );
};

const MentorSubscriptionsList: React.FC = () => {
  const { t } = useTranslation();
  const { data: subs, isLoading } = useMentorSubscriptions();

  if (isLoading) {
    return <div className="h-20 rounded-xl bg-muted/20 animate-pulse" />;
  }

  const list = subs ?? [];

  if (list.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-muted/10 p-5 flex flex-col items-center gap-2 text-center">
        <Users className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          {t(
            'mentor.monetization.noSubscriptions',
            'No active subscriptions yet.'
          )}
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2" aria-label={t('mentor.monetization.subscriptions', 'Subscriptions')}>
      {list.map((sub) => (
        <li
          key={sub.id}
          className="rounded-xl border border-border/40 bg-muted/10 p-3 flex items-center gap-3 flex-wrap"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{sub.username}</p>
            <p className="text-xs text-muted-foreground">
              {sub.currentPeriodEnd ? (
                <>
                  {t(
                    'mentor.monetization.nextRenewal',
                    'Renews {{date}}',
                    { date: new Date(sub.currentPeriodEnd).toLocaleDateString() }
                  )}
                </>
              ) : (
                t('mentor.monetization.noRenewal', 'No renewal scheduled')
              )}
              {sub.canceledAt && (
                <>
                  {' · '}
                  {t('mentor.monetization.canceledOn', 'Canceled {{date}}', {
                    date: new Date(sub.canceledAt).toLocaleDateString(),
                  })}
                </>
              )}
            </p>
          </div>
          <StatusChip status={sub.status} />
        </li>
      ))}
    </ul>
  );
};

export default MentorSubscriptionsList;
