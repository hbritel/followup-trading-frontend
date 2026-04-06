
import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePageFilter } from '@/contexts/page-filters-context';
import { useDefaultDatePreset } from '@/hooks/useDefaultDatePreset';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import DashboardDateFilter, { computeDateRange } from '@/components/dashboard/DashboardDateFilter';
import AccountSelector from '@/components/dashboard/AccountSelector';
import { useAccountFilter } from '@/hooks/useAccountFilter';
import RiskMetricsBoard from '@/components/risk/RiskMetricsBoard';
import PlanGatedSection from '@/components/subscription/PlanGatedSection';

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const RiskMetrics = () => {
  const { t } = useTranslation();
  const [datePreset, setDatePreset] = useDefaultDatePreset('risk-metrics');
  const [customStart, setCustomStart] = usePageFilter<Date | null>('risk-metrics', 'customStart', null);
  const [customEnd, setCustomEnd] = usePageFilter<Date | null>('risk-metrics', 'customEnd', null);
  const [accountId, setAccountId] = usePageFilter('risk-metrics', 'accountId', 'all');

  const { accountIds: effectiveAccountId } = useAccountFilter(accountId);

  const dateRange = datePreset === 'custom'
    ? {
        startDate: customStart ? toISODate(customStart) : undefined,
        endDate: customEnd ? toISODate(customEnd) : undefined,
      }
    : computeDateRange(datePreset);

  return (
    <DashboardLayout pageTitle={t('pages.riskMetrics', 'Risk Metrics')}>
      <PageTransition>
        <div className="flex items-center justify-between mb-6 gap-4">
          <DashboardDateFilter
            preset={datePreset}
            onPresetChange={setDatePreset}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
          />
          <AccountSelector value={accountId} onChange={setAccountId} className="w-[200px]" />
        </div>
        <PlanGatedSection requiredPlan="PRO" feature="Risk metrics">
          <RiskMetricsBoard startDate={dateRange.startDate} endDate={dateRange.endDate} accountId={effectiveAccountId} />
        </PlanGatedSection>
      </PageTransition>
    </DashboardLayout>
  );
};

export default RiskMetrics;
