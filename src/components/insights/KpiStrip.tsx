import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { useDashboardSummary } from '@/hooks/useAdvancedMetrics';

interface KpiCardProps {
  label: string;
  value: string;
  subtext?: string;
  positive?: boolean | null;
  tooltip?: string;
  badge?: number;
  loading?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, subtext, positive, tooltip, badge, loading }) => {
  const valueColor =
    positive === true
      ? 'text-green-500'
      : positive === false
        ? 'text-red-500'
        : 'text-foreground';

  const arrow = positive === true ? ' ▲' : positive === false ? ' ▼' : '';

  return (
    <Card className="glass-card rounded-2xl flex-1 min-w-[140px]">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-1 mb-1">
          <span className="label-caps text-muted-foreground text-xs truncate">{label}</span>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground shrink-0 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px] text-xs">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {loading ? (
          <Skeleton className="h-7 w-20 mt-1" />
        ) : (
          <div className="flex items-end gap-2">
            <span className={`text-xl sm:text-2xl font-bold tabular-nums ${valueColor}`} aria-label={`${label}: ${value}${arrow}`}>
              {value}
              <span className="text-sm ml-0.5" aria-hidden="true">{arrow}</span>
            </span>
            {badge !== undefined && badge > 0 && (
              <Badge variant="secondary" className="mb-0.5 text-xs font-medium px-1.5">
                {badge}
              </Badge>
            )}
          </div>
        )}
        {subtext && !loading && (
          <p className="text-xs text-muted-foreground mt-0.5 font-mono tabular-nums">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );
};

interface KpiStripProps {
  activeInsightCount?: number;
}

const KpiStrip: React.FC<KpiStripProps> = ({ activeInsightCount }) => {
  const { t } = useTranslation();
  const { data: summary, isLoading } = useDashboardSummary();

  const winRate = summary?.performanceSummary?.winRate ?? 0;
  const netPnl = summary?.performanceSummary?.totalProfitLoss ?? 0;
  const profitFactor = summary?.performanceSummary?.profitFactor ?? 0;

  const formatCurrency = (val: number): string => {
    const abs = Math.abs(val);
    const prefix = val < 0 ? '-$' : '$';
    if (abs >= 1000) {
      return `${prefix}${(abs / 1000).toFixed(1)}k`;
    }
    return `${prefix}${abs.toFixed(0)}`;
  };

  return (
    <div
      className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-thin"
      role="region"
      aria-label="Key performance indicators"
    >
      <KpiCard
        label={t('insights.winRate', 'Win Rate')}
        value={`${winRate.toFixed(1)}%`}
        positive={winRate >= 50 ? true : winRate > 0 ? null : false}
        tooltip={t('insights.winRateTooltip', 'Percentage of closed trades that were profitable.')}
        loading={isLoading}
      />
      <KpiCard
        label={t('insights.netPnl', 'Net P&L')}
        value={formatCurrency(netPnl)}
        positive={netPnl > 0 ? true : netPnl < 0 ? false : null}
        tooltip={t('insights.netPnlTooltip', 'Total realised profit and loss across all closed trades.')}
        loading={isLoading}
      />
      <KpiCard
        label={t('insights.profitFactor', 'Profit Factor')}
        value={profitFactor > 0 ? profitFactor.toFixed(2) : '—'}
        positive={profitFactor >= 1.5 ? true : profitFactor > 1 ? null : false}
        tooltip={t(
          'insights.profitFactorTooltip',
          'Gross profit divided by gross loss. Above 1.5 is generally considered healthy.',
        )}
        loading={isLoading}
      />
      <KpiCard
        label={t('insights.activeInsights', 'Active Insights')}
        value={activeInsightCount !== undefined ? String(activeInsightCount) : '—'}
        positive={null}
        badge={activeInsightCount}
        loading={isLoading && activeInsightCount === undefined}
      />
    </div>
  );
};

export default KpiStrip;
