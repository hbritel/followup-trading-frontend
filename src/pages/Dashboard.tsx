import React from 'react';
import { usePageFilter } from '@/contexts/page-filters-context';
import { useTrades } from '@/hooks/useTrades';
import { useAnalytics } from '@/hooks/useAnalytics';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TradingStats from '@/components/dashboard/TradingStats';
import TradeTable from '@/components/dashboard/TradeTable';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import AccountSummary from '@/components/dashboard/AccountSummary';
import TradingCalendar from '@/components/dashboard/Calendar';
import AccountSelector from '@/components/dashboard/AccountSelector';
import DashboardDateFilter, { computeDateRange } from '@/components/dashboard/DashboardDateFilter';
import { Skeleton } from '@/components/ui/skeleton';

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const Dashboard = () => {
  const [selectedAccountId, setSelectedAccountId] = usePageFilter('dashboard', 'accountId', 'all');
  const [datePreset, setDatePreset] = usePageFilter('dashboard', 'datePreset', 'all');
  const [customStart, setCustomStart] = usePageFilter<Date | null>('dashboard', 'customStart', null);
  const [customEnd, setCustomEnd] = usePageFilter<Date | null>('dashboard', 'customEnd', null);

  const apiAccountId = selectedAccountId === 'all' ? undefined : selectedAccountId;

  // Compute date range from preset or custom dates
  const dateRange = datePreset === 'custom'
    ? {
        startDate: customStart ? toISODate(customStart) : undefined,
        endDate: customEnd ? toISODate(customEnd) : undefined,
      }
    : computeDateRange(datePreset);

  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(
    apiAccountId, dateRange.startDate, dateRange.endDate
  );
  const { data: tradesResponse, isLoading: tradesLoading } = useTrades({
    page: 0,
    size: 10,
    accountIds: apiAccountId
  });

  const trades = tradesResponse?.content || [];
  const isLoading = analyticsLoading || tradesLoading;

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Dashboard">
        <div className="flex justify-end mb-4">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="space-y-6">
           <Skeleton className="h-32 w-full" />
           <Skeleton className="h-96 w-full" />
           <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Dashboard">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <DashboardDateFilter
          preset={datePreset}
          onPresetChange={setDatePreset}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={setCustomStart}
          onCustomEndChange={setCustomEnd}
        />
        <AccountSelector
          value={selectedAccountId}
          onChange={setSelectedAccountId}
          className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        />
      </div>

      <TradingStats analytics={analytics} />

      <div className="grid grid-cols-1 gap-6 mt-6">
        <PerformanceChart analytics={analytics} />
        <AccountSummary analytics={analytics} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <TradeTable trades={trades} />
          <TradingCalendar analytics={analytics} accountId={apiAccountId} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
