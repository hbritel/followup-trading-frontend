import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarClock, Users, Video } from 'lucide-react';
import {
  useMySessionOfferings,
  useMentorSessionBookings,
  useMyWebinars,
} from '@/hooks/useMentorRevenue';

interface KpiCardProps {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ReactNode;
  tone?: 'primary' | 'emerald' | 'amber';
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, hint, icon, tone = 'primary' }) => {
  const toneClasses = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  }[tone];

  return (
    <div className="rounded-xl border border-border/40 bg-background/60 px-3 py-2.5 flex items-center gap-3">
      <span
        className={[
          'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          toneClasses,
        ].join(' ')}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-base font-bold tabular-nums leading-tight mt-0.5">
          {value}
          {hint && (
            <span className="ml-1 text-[11px] font-medium text-muted-foreground">
              {hint}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

interface Props {
  showWebinars: boolean;
}

const SessionsKpiRibbon: React.FC<Props> = ({ showWebinars }) => {
  const { t } = useTranslation();
  const { data: offerings = [] } = useMySessionOfferings();
  const { data: upcomingBookings = [] } = useMentorSessionBookings(true);
  const { data: webinars = [] } = useMyWebinars();

  const activeOfferings = offerings.filter((o) => o.active).length;
  const activeWebinars = webinars.filter((w) => w.status === 'PUBLISHED').length;

  return (
    <div
      className={[
        'grid gap-3',
        showWebinars ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2',
      ].join(' ')}
    >
      <KpiCard
        label={t('mentor.sessions.kpi.activeOfferings', 'Active offerings')}
        value={activeOfferings}
        hint={offerings.length > activeOfferings
          ? t('mentor.sessions.kpi.draftHint', '· {{n}} draft', { n: offerings.length - activeOfferings })
          : undefined}
        icon={<CalendarClock className="w-4 h-4" />}
        tone="primary"
      />
      <KpiCard
        label={t('mentor.sessions.kpi.upcomingBookings', 'Upcoming bookings')}
        value={upcomingBookings.length}
        icon={<Users className="w-4 h-4" />}
        tone={upcomingBookings.length > 0 ? 'emerald' : 'primary'}
      />
      {showWebinars && (
        <KpiCard
          label={t('mentor.sessions.kpi.activeWebinars', 'Published webinars')}
          value={activeWebinars}
          hint={webinars.length > activeWebinars
            ? t('mentor.sessions.kpi.draftHint', '· {{n}} draft', { n: webinars.length - activeWebinars })
            : undefined}
          icon={<Video className="w-4 h-4" />}
          tone="primary"
        />
      )}
    </div>
  );
};

export default SessionsKpiRibbon;
