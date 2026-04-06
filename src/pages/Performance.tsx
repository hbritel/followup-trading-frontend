import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePageFilter } from '@/contexts/page-filters-context';
import { useDefaultDatePreset } from '@/hooks/useDefaultDatePreset';
import { useTradePerformance, useDashboardSummary } from '@/hooks/useAdvancedMetrics';
import { useAnalytics } from '@/hooks/useAnalytics';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PlanGatedSection from '@/components/subscription/PlanGatedSection';
import PageTransition from '@/components/ui/page-transition';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import DashboardDateFilter, { computeDateRange } from '@/components/dashboard/DashboardDateFilter';
import AccountSelector from '@/components/dashboard/AccountSelector';
import { useAccountFilter } from '@/hooks/useAccountFilter';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Filter, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import DetailedPerformanceCharts from '@/components/performance/DetailedPerformanceCharts';

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const InfoTip = ({ text }: { text: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-xs">{text}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const Performance = () => {
  const { t } = useTranslation();

  const [selectedAccountId, setSelectedAccountId] = usePageFilter('performance', 'accountId', 'all');
  const [datePreset, setDatePreset] = useDefaultDatePreset('performance', '3m');
  const [customStart, setCustomStart] = usePageFilter<Date | null>('performance', 'customStart', null);
  const [customEnd, setCustomEnd] = usePageFilter<Date | null>('performance', 'customEnd', null);

  const { accountIds, accountId } = useAccountFilter(selectedAccountId);
  const dateRange = datePreset === 'custom'
    ? {
        startDate: customStart ? toISODate(customStart) : undefined,
        endDate: customEnd ? toISODate(customEnd) : undefined,
      }
    : computeDateRange(datePreset);

  const { data: performance, isLoading: perfLoading } = useTradePerformance(
    dateRange.startDate, dateRange.endDate, accountIds
  );
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary(
    dateRange.startDate, dateRange.endDate, accountIds
  );
  const { data: analytics } = useAnalytics(accountIds, dateRange.startDate, dateRange.endDate);

  const isLoading = perfLoading || summaryLoading;

  const symbolEntries = summary?.performanceByAssetType
    ? Object.entries(summary.performanceByAssetType).map(([symbol, pnl]) => ({
        symbol,
        total: pnl,
      }))
    : [];

  const directionEntries = summary?.performanceByDirection
    ? Object.entries(summary.performanceByDirection).map(([direction, pnl]) => ({
        direction,
        total: pnl,
      }))
    : [];

  return (
    <DashboardLayout pageTitle={t('pages.performance')}>
      <PageTransition className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="label-caps flex items-center gap-1.5">{t('performance.netPnl')}<InfoTip text={t('performance.netPnlTooltip')} /></CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className={cn("kpi-value tabular-nums",
                    (performance?.totalProfitLoss ?? 0) >= 0 ? "text-profit" : "text-loss"
                  )}>
                    {formatCurrency(performance?.totalProfitLoss ?? 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {performance?.totalTrades ?? 0} {t('performance.trades', 'trades')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="label-caps flex items-center gap-1.5">{t('insights.winRate')}<InfoTip text={t('performance.winRateTooltip')} /></CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="kpi-value tabular-nums">
                    {(performance?.winRate ?? 0).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('performance.winsOutOfTrades', {
                      wins: performance?.winningTrades ?? 0,
                      total: performance?.totalTrades ?? 0
                    })}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="label-caps flex items-center gap-1.5">{t('insights.profitFactor')}<InfoTip text={t('performance.profitFactorTooltip')} /></CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="kpi-value tabular-nums">
                    {(performance?.profitFactor ?? 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('performance.grossProfitOverLoss')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <PerformanceChart analytics={analytics} />

        <PlanGatedSection requiredPlan="PRO" feature="Advanced performance analytics">
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-gradient flex items-center gap-1.5">{t('insights.performanceAnalysis')}<InfoTip text={t('performance.performanceAnalysisTooltip')} /></CardTitle>
                  <CardDescription>{t('performance.detailedBreakdown')}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    {t('common.filter')}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    {t('common.export')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="symbols">
                <TabsList>
                  <TabsTrigger value="symbols">{t('performance.symbols')}</TabsTrigger>
                  <TabsTrigger value="direction">{t('performance.direction', 'Direction')}</TabsTrigger>
                </TabsList>

                <TabsContent value="symbols" className="mt-4">
                  <div className="overflow-x-auto">
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : symbolEntries.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">{t('common.noData', 'No data available')}</p>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 label-caps">{t('performance.symbol')}</th>
                            <th className="text-right py-3 px-4 label-caps">{t('performance.netPnl')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {symbolEntries
                            .sort((a, b) => b.total - a.total)
                            .map((item) => (
                            <tr key={item.symbol} className="border-b">
                              <td className="py-3 px-4 text-sm font-mono">{item.symbol}</td>
                              <td className={cn("py-3 px-4 text-sm font-medium text-right tabular-nums font-mono",
                                item.total >= 0 ? "text-profit" : "text-loss")}>
                                {formatCurrency(item.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="direction" className="mt-4">
                  <div className="overflow-x-auto">
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : directionEntries.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">{t('common.noData', 'No data available')}</p>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 label-caps">{t('common.direction', 'Direction')}</th>
                            <th className="text-right py-3 px-4 label-caps">{t('performance.netPnl')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {directionEntries.map((item) => (
                            <tr key={item.direction} className="border-b">
                              <td className={cn("py-3 px-4 text-sm font-mono",
                                item.direction.toLowerCase() === 'long' ? 'text-primary' : 'text-destructive'
                              )}>{item.direction}</td>
                              <td className={cn("py-3 px-4 text-sm font-medium text-right tabular-nums font-mono",
                                item.total >= 0 ? "text-profit" : "text-loss")}>
                                {formatCurrency(item.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <DetailedPerformanceCharts startDate={dateRange.startDate} endDate={dateRange.endDate} accountId={accountId} />
        </PlanGatedSection>
      </PageTransition>
    </DashboardLayout>
  );
};

export default Performance;
