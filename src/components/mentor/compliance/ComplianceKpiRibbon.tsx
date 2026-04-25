import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart2, Globe, MessageSquareQuote, ShieldCheck } from 'lucide-react';
import { useMentorInstance, useMyMentorFaq, useMyJurisdictions } from '@/hooks/useMentor';
import {
  useCohortPolicies,
  useCohortPricing,
} from '@/hooks/useMentorCohortOverrides';

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone?: 'primary' | 'emerald' | 'amber' | 'muted';
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, hint, icon, tone = 'primary' }) => {
  const toneClasses = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    muted: 'bg-muted/40 text-muted-foreground',
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
        <p className="text-sm font-bold tabular-nums leading-tight mt-0.5 truncate">
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

/**
 * ComplianceKpiRibbon — at-a-glance summary of the mentor's compliance posture.
 * Surfaces 4 statuses in a single ribbon at the top of the Compliance tab.
 */
const ComplianceKpiRibbon: React.FC = () => {
  const { t } = useTranslation();
  const { data: instance } = useMentorInstance();
  const { data: faq = [] } = useMyMentorFaq();
  const { data: jurisdictionRules = [] } = useMyJurisdictions();
  const { data: cohortPolicies = [] } = useCohortPolicies();
  const { data: cohortPricing = [] } = useCohortPricing();

  const statsOn = !!(instance as { showStatsPublicly?: boolean })?.showStatsPublicly;
  const policyKey = (instance as { cancellationPolicy?: string })?.cancellationPolicy;
  const policyLabel = !policyKey || policyKey === 'PLATFORM_DEFAULT'
    ? t('mentor.compliance.kpi.policyDefault', 'Platform default')
    : policyKey.replace(/_/g, ' ').toLowerCase();

  const allowedCount = jurisdictionRules.filter((r) => r.mode === 'ALLOW').length;
  const blockedCount = jurisdictionRules.filter((r) => r.mode === 'DENY').length;
  const restrictedCount = allowedCount + blockedCount;
  const overridesCount = cohortPolicies.length + cohortPricing.length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard
        label={t('mentor.compliance.kpi.publicStats', 'Public stats')}
        value={statsOn
          ? t('mentor.compliance.kpi.shown', 'Shown')
          : t('mentor.compliance.kpi.hidden', 'Hidden')}
        icon={<BarChart2 className="w-4 h-4" />}
        tone={statsOn ? 'emerald' : 'muted'}
      />
      <KpiCard
        label={t('mentor.compliance.kpi.cancellationPolicy', 'Cancellation')}
        value={policyLabel}
        icon={<ShieldCheck className="w-4 h-4" />}
        tone={policyKey && policyKey !== 'PLATFORM_DEFAULT' ? 'primary' : 'muted'}
      />
      <KpiCard
        label={t('mentor.compliance.kpi.jurisdictions', 'Jurisdictions')}
        value={restrictedCount === 0
          ? t('mentor.compliance.kpi.unrestricted', 'Unrestricted')
          : String(restrictedCount)}
        hint={restrictedCount > 0
          ? t('mentor.compliance.kpi.jurisdictionsHint', '{{a}} allow · {{b}} block', {
              a: allowedCount,
              b: blockedCount,
            })
          : undefined}
        icon={<Globe className="w-4 h-4" />}
        tone={restrictedCount > 0 ? 'amber' : 'muted'}
      />
      <KpiCard
        label={t('mentor.compliance.kpi.faq', 'FAQ entries')}
        value={String(faq.length)}
        hint={overridesCount > 0
          ? t('mentor.compliance.kpi.overridesHint', '· {{n}} cohort overrides', { n: overridesCount })
          : undefined}
        icon={<MessageSquareQuote className="w-4 h-4" />}
        tone={faq.length > 0 ? 'primary' : 'muted'}
      />
    </div>
  );
};

export default ComplianceKpiRibbon;
