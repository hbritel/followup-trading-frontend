
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
      <PageTransition className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('riskMetrics.title', 'Risk Metrics')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('riskMetrics.description', 'In-depth risk analysis of your trading portfolio')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DashboardDateFilter
              preset={datePreset}
              onPresetChange={setDatePreset}
              customStart={customStart}
              customEnd={customEnd}
              onCustomStartChange={setCustomStart}
              onCustomEndChange={setCustomEnd}
            />
            <AccountSelector value={accountId} onChange={setAccountId} className="w-48" />
          </div>
        </div>

        <PlanGatedSection requiredPlan="PRO" feature="Risk metrics">
          <RiskMetricsBoard startDate={dateRange.startDate} endDate={dateRange.endDate} accountId={effectiveAccountId} />
        </PlanGatedSection>
      </PageTransition>
    </DashboardLayout>
  );
};

export default RiskMetrics;
