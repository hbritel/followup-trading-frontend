import React from 'react';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import { Inbox, MessageSquareQuote, TrendingUp } from 'lucide-react';
import { useMentorTestimonials, useMyLeads } from '@/hooks/useMentor';
import { useFunnelReport } from '@/hooks/useMentorRevenue';

interface KpiCardProps {
  label: string;
  value: string;
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
        <p className="text-base font-bold tabular-nums leading-tight mt-0.5 truncate">
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
  showFunnel: boolean;
  showLeads: boolean;
}

const fmtDate = (d: Date) => format(d, 'yyyy-MM-dd');

const InsightsKpiRibbon: React.FC<Props> = ({ showFunnel, showLeads }) => {
  const { t } = useTranslation();
  const { data: testimonials = [] } = useMentorTestimonials();
  const { data: leads = [] } = useMyLeads();

  const from = fmtDate(subDays(new Date(), 30));
  const to = fmtDate(new Date());
  const { data: funnel } = useFunnelReport(from, to);

  const pending = testimonials.filter((t) => !t.approved).length;
  const unread = leads.filter((l) => !l.readAt).length;
  const impressions = funnel?.impressions ?? 0;
  const joins = funnel?.joins ?? 0;
  const conversionPct = impressions > 0
    ? ((joins / impressions) * 100).toFixed(1) + '%'
    : '—';

  // Determine column count based on visible KPIs
  const visibleCount = 1 + (showFunnel ? 1 : 0) + (showLeads ? 1 : 0);
  const gridClass = visibleCount === 3
    ? 'grid-cols-1 sm:grid-cols-3'
    : visibleCount === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-1';

  return (
    <div className={['grid gap-3', gridClass].join(' ')}>
      <KpiCard
        label={t('mentor.insights.kpi.pendingTestimonials', 'Pending reviews')}
        value={String(pending)}
        hint={testimonials.length > 0
          ? t('mentor.insights.kpi.totalTestimonials', '· {{n}} total', { n: testimonials.length })
          : undefined}
        icon={<MessageSquareQuote className="w-4 h-4" />}
        tone={pending > 0 ? 'amber' : 'primary'}
      />
      {showLeads && (
        <KpiCard
          label={t('mentor.insights.kpi.unreadLeads', 'Unread leads')}
          value={String(unread)}
          hint={leads.length > 0
            ? t('mentor.insights.kpi.totalLeads', '· {{n}} total', { n: leads.length })
            : undefined}
          icon={<Inbox className="w-4 h-4" />}
          tone={unread > 0 ? 'amber' : 'primary'}
        />
      )}
      {showFunnel && (
        <KpiCard
          label={t('mentor.insights.kpi.conversion30d', 'Conversion · 30d')}
          value={conversionPct}
          hint={impressions > 0
            ? t('mentor.insights.kpi.conversionHint', '{{joins}} of {{n}}', { joins, n: impressions })
            : t('mentor.insights.kpi.conversionEmpty', 'no traffic yet')}
          icon={<TrendingUp className="w-4 h-4" />}
          tone={joins > 0 ? 'emerald' : 'primary'}
        />
      )}
    </div>
  );
};

export default InsightsKpiRibbon;
