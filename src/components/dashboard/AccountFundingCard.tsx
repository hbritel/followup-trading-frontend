import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  TrendingUp,
  Wallet,
  Percent,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DashboardSummary } from '@/services/metrics.service';

interface AccountFundingCardProps {
  dashboardSummary?: DashboardSummary;
  isLoading?: boolean;
}

const fmt = (value: number | undefined | null, locale = 'en-US'): string => {
  if (value == null) return '$0.00';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const FundingMetric = ({
  label,
  value,
  icon: Icon,
  color,
  isLoading,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: 'profit' | 'loss' | 'primary' | 'muted';
  isLoading?: boolean;
}) => {
  const colorMap = {
    profit: 'text-profit bg-profit/10 border-profit/20',
    loss: 'text-loss bg-loss/10 border-loss/20',
    primary: 'text-primary bg-primary/10 border-primary/20',
    muted: 'text-muted-foreground bg-muted/10 border-muted/20',
  };

  return (
    <div className="flex items-center gap-3 p-3 sm:p-4 bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors group min-w-0">
      <div
        className={cn(
          'p-2 rounded-lg border shrink-0 transition-all duration-300',
          colorMap[color],
          'group-hover:shadow-md'
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
          {label}
        </p>
        {isLoading ? (
          <Skeleton className="h-5 w-20 mt-0.5" />
        ) : (
          <p className="text-sm sm:text-base font-bold font-mono tracking-tight text-foreground dark:text-white truncate tabular-nums">
            {value}
          </p>
        )}
      </div>
    </div>
  );
};

const AccountFundingCard: React.FC<AccountFundingCardProps> = ({
  dashboardSummary,
  isLoading = false,
}) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const totalDeposits = dashboardSummary?.totalDeposits ?? 0;
  const totalWithdrawals = dashboardSummary?.totalWithdrawals ?? 0;
  const netFunding = dashboardSummary?.netFunding ?? 0;
  const realizedPnl = dashboardSummary?.realizedTradingPnl ?? 0;
  const accountBalance = dashboardSummary?.accountBalance ?? 0;
  const roi = dashboardSummary?.returnOnInvestment ?? 0;

  const roiColor: 'profit' | 'loss' | 'muted' =
    roi > 0 ? 'profit' : roi < 0 ? 'loss' : 'muted';

  const pnlColor: 'profit' | 'loss' | 'muted' =
    realizedPnl > 0 ? 'profit' : realizedPnl < 0 ? 'loss' : 'muted';

  return (
    <Card className="glass-card animate-slide-up">
      <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200/50 dark:border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg font-semibold tracking-tight">
              {t('dashboard.accountFunding')}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('dashboard.depositsWithdrawalsDesc')}
            </CardDescription>
          </div>
          {!isLoading && (
            <div
              className={cn(
                'px-3 py-1.5 rounded-full border text-xs font-bold font-mono tabular-nums',
                roi > 0 && 'text-profit bg-profit/10 border-profit/20',
                roi < 0 && 'text-loss bg-loss/10 border-loss/20',
                roi === 0 && 'text-muted-foreground bg-muted/10 border-muted/20'
              )}
            >
              ROI {roi >= 0 ? '+' : ''}
              {roi.toFixed(1)}%
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3">
          <FundingMetric
            label={t('dashboard.totalDeposits')}
            value={fmt(totalDeposits, locale)}
            icon={ArrowDownToLine}
            color="profit"
            isLoading={isLoading}
          />
          <FundingMetric
            label={t('dashboard.totalWithdrawals')}
            value={fmt(totalWithdrawals, locale)}
            icon={ArrowUpFromLine}
            color="loss"
            isLoading={isLoading}
          />
          <FundingMetric
            label={t('dashboard.netFunding')}
            value={fmt(netFunding, locale)}
            icon={Banknote}
            color="primary"
            isLoading={isLoading}
          />
          <FundingMetric
            label={t('dashboard.tradingPnl')}
            value={`${realizedPnl >= 0 ? '+' : ''}${fmt(realizedPnl, locale)}`}
            icon={TrendingUp}
            color={pnlColor}
            isLoading={isLoading}
          />
          <FundingMetric
            label={t('dashboard.accountBalance')}
            value={fmt(accountBalance, locale)}
            icon={Wallet}
            color="primary"
            isLoading={isLoading}
          />
          <FundingMetric
            label={t('dashboard.returnOnInvestment')}
            value={`${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`}
            icon={Percent}
            color={roiColor}
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountFundingCard;
