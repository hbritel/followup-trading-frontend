import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart2,
  DollarSign,
  PercentIcon,
  TrendingUp,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { usePageFilter } from '@/contexts/page-filters-context';
import { useDefaultDatePreset } from '@/hooks/useDefaultDatePreset';
import { useTrades } from '@/hooks/useTrades';
import { useAnalytics } from '@/hooks/useAnalytics';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TradeTable from '@/components/dashboard/TradeTable';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import AccountSummary, { TradeStatistics } from '@/components/dashboard/AccountSummary';
import AccountFundingCard from '@/components/dashboard/AccountFundingCard';
import TradingCalendar from '@/components/dashboard/Calendar';
import AccountSelector from '@/components/dashboard/AccountSelector';
import DashboardDateFilter, { computeDateRange } from '@/components/dashboard/DashboardDateFilter';
import { DashboardSkeleton } from '@/components/skeletons';
import { useDashboardSummary } from '@/hooks/useAdvancedMetrics';
import PageError from '@/components/ui/page-error';
// TODO: re-enable once real-time positions are ready
// import OpenPositionsPanel from '@/components/dashboard/OpenPositionsPanel';

import KpiCard from '@/components/dashboard/KpiCard';
import PageTransition from '@/components/ui/page-transition';
import ConnectionIndicator from '@/components/ui/connection-indicator';
import { useLivePrices } from '@/hooks/useLivePrices';
import { useLivePortfolio } from '@/hooks/useLivePortfolio';
import { useLiveTrades } from '@/hooks/useLiveTrades';
import { useLiveAlerts } from '@/hooks/useLiveAlerts';
import XpProgressBar from '@/components/gamification/XpProgressBar';
import { useAccountFilter } from '@/hooks/useAccountFilter';

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const Dashboard = () => {
  const { t } = useTranslation();
  const [selectedAccountId, setSelectedAccountId] = usePageFilter('dashboard', 'accountId', 'all');
  const [datePreset, setDatePreset] = useDefaultDatePreset('dashboard');
  const [customStart, setCustomStart] = usePageFilter<Date | null>('dashboard', 'customStart', null);
  const [customEnd, setCustomEnd] = usePageFilter<Date | null>('dashboard', 'customEnd', null);

  const { accountIds, accountId: apiAccountId } = useAccountFilter(selectedAccountId);

  // Compute date range from preset or custom dates
  const dateRange = datePreset === 'custom'
    ? {
        startDate: customStart ? toISODate(customStart) : undefined,
        endDate: customEnd ? toISODate(customEnd) : undefined,
      }
    : computeDateRange(datePreset);

  // Live WebSocket subscriptions — gracefully degrade when WS is offline
  // useLiveTrades() and useLivePortfolio() are now mounted globally in GlobalLiveListeners
  useLivePrices();
  useLiveAlerts();

  const queryClient = useQueryClient();

  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError } = useAnalytics(
    accountIds, dateRange.startDate, dateRange.endDate
  );
  const { data: tradesResponse, isLoading: tradesLoading, isError: tradesError } = useTrades({
    page: 0,
    size: 10,
    accountIds: accountIds
  });
  const { data: dashboardSummary } = useDashboardSummary(
    dateRange.startDate, dateRange.endDate, accountIds
  );

  const trades = tradesResponse?.content || [];
  const isLoading = analyticsLoading || tradesLoading;
  const isError = analyticsError || tradesError;

  // Show a "taking longer than expected" banner after 15 s of loading
  const [isSlowLoad, setIsSlowLoad] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      setIsSlowLoad(false);
      return;
    }
    const timer = setTimeout(() => setIsSlowLoad(true), 15000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    queryClient.invalidateQueries({ queryKey: ['trades'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  };

  // Build sparkline from backend-computed cumulative equity
  const equitySparkline: number[] = React.useMemo(() => {
    if (!analytics?.equityCurve || analytics.equityCurve.length === 0) return [];
    return analytics.equityCurve.map(p => p.cumulativeEquity);
  }, [analytics]);

  const pnlSparkline: number[] = React.useMemo(() => {
    if (!analytics?.equityCurve) return [];
    return analytics.equityCurve.map(p => p.dailyProfit);
  }, [analytics]);

  const winRateSparkline: number[] = React.useMemo(() => {
    if (!analytics?.equityCurve) return [];
    // Use daily P&L sign as a proxy for win/loss trend
    let running = 0;
    return analytics.equityCurve.map(p => {
      running += p.dailyProfit >= 0 ? 1 : 0;
      return running;
    });
  }, [analytics]);

  if (isError && !isLoading) {
    return (
      <DashboardLayout pageTitle={t('pages.dashboard')}>
        <PageError
          title={t('dashboard.failedToLoad')}
          message={t('dashboard.fetchError')}
          onRetry={handleRetry}
        />
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout pageTitle={t('pages.dashboard')}>
        {isSlowLoad && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-300">
            <span>{t('dashboard.takingLonger')}</span>
          </div>
        )}
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  const winRate = analytics?.winRate ?? 0;
  const totalPnl = analytics?.totalProfitLoss ?? 0;
  const totalTrades = analytics?.totalTrades ?? 0;

  // Derive avg R:R from winning/losing trade counts and best/worst
  const avgRR = analytics
    ? analytics.winningTrades > 0 && analytics.losingTrades > 0
      ? Math.abs(analytics.bestTrade / (analytics.worstTrade || -1))
      : 0
    : 0;

  return (
    <DashboardLayout pageTitle={t('pages.dashboard')}>
      <PageTransition className="flex flex-col gap-6">

        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <DashboardDateFilter
            preset={datePreset}
            onPresetChange={setDatePreset}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
          />
          <div className="flex items-center gap-3 flex-wrap">
            <XpProgressBar />
            <ConnectionIndicator />
            <AccountSelector
              value={selectedAccountId}
              onChange={setSelectedAccountId}
              className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>

        {/* Row 1: KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title={t('stats.winRate', 'Win Rate')}
            value={`${winRate.toFixed(1)}%`}
            change={winRate - 50}
            icon={PercentIcon}
            sparklineData={winRateSparkline}
            animationDelay="0ms"
          />
          <KpiCard
            title={t('stats.totalPnl', 'Total P&L')}
            value={`$${Math.abs(totalPnl) >= 1000
              ? `${(totalPnl / 1000).toFixed(1)}K`
              : totalPnl.toFixed(0)}`}
            change={totalPnl >= 0 ? Math.min((totalPnl / Math.max(Math.abs(analytics?.worstTrade ?? 1), 1)) * 10, 99) : -Math.min((Math.abs(totalPnl) / Math.max(Math.abs(analytics?.bestTrade ?? 1), 1)) * 10, 99)}
            icon={DollarSign}
            sparklineData={pnlSparkline}
            animationDelay="60ms"
          />
          <KpiCard
            title={t('stats.avgRR', 'Avg R:R')}
            value={`${avgRR.toFixed(2)}`}
            change={avgRR >= 1.5 ? avgRR * 10 - 15 : -(15 - avgRR * 10)}
            icon={TrendingUp}
            sparklineData={equitySparkline}
            animationDelay="120ms"
          />
          <KpiCard
            title={t('stats.totalTrades', 'Total Trades')}
            value={totalTrades}
            icon={BarChart2}
            sparklineData={analytics?.equityCurve?.map(p => p.dailyVolume ?? 0)}
            animationDelay="180ms"
          />
        </div>

        {/* Row 2: Performance + Daily P&L + Trade Statistics (3 x 1/3) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <PerformanceChart analytics={analytics} />
          <TradeStatistics analytics={analytics} />
        </div>

        {/* Row 3: Account Funding (deposits, withdrawals, real P&L) */}
        <AccountFundingCard dashboardSummary={dashboardSummary} isLoading={!dashboardSummary} />

        {/* Row 4: Trade history + Account summary (3/4) | Calendar heatmap (1/4) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 flex flex-col gap-4">
            <TradeTable trades={trades} />
            <AccountSummary analytics={analytics} dashboardSummary={dashboardSummary} metricsLoading={!dashboardSummary} />
          </div>
          <TradingCalendar accountId={accountIds} />
        </div>

      </PageTransition>
    </DashboardLayout>
  );
};

export default Dashboard;
