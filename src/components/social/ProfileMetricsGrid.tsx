import React from 'react';
import {
  TrendingUp,
  Activity,
  BarChart3,
  Hash,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VerifiedProfileDto } from '@/types/dto';

interface ProfileMetricsGridProps {
  profile: VerifiedProfileDto;
}

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  colorClass?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, colorClass }) => (
  <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colorClass ?? 'bg-white/5 text-white/60')}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  </div>
);

const winRateColor = (rate: number | undefined): string => {
  if (rate == null) return 'text-white/60 bg-white/5';
  if (rate >= 60) return 'text-emerald-400 bg-emerald-500/15';
  if (rate >= 40) return 'text-amber-400 bg-amber-500/15';
  return 'text-red-400 bg-red-500/15';
};

const formatPercent = (val: number | undefined): string =>
  val != null ? `${val.toFixed(1)}%` : '--';

const formatDecimal = (val: number | undefined): string =>
  val != null ? val.toFixed(2) : '--';

const ProfileMetricsGrid: React.FC<ProfileMetricsGridProps> = ({ profile }) => {
  const cards: MetricCardProps[] = [
    {
      label: 'Win Rate',
      value: formatPercent(profile.winRate),
      icon: <TrendingUp className="w-4 h-4" />,
      colorClass: winRateColor(profile.winRate),
    },
    {
      label: 'Profit Factor',
      value: formatDecimal(profile.profitFactor),
      icon: <Activity className="w-4 h-4" />,
      colorClass: 'text-blue-400 bg-blue-500/15',
    },
    {
      label: 'Sharpe Ratio',
      value: formatDecimal(profile.sharpeRatio),
      icon: <BarChart3 className="w-4 h-4" />,
      colorClass: 'text-violet-400 bg-violet-500/15',
    },
    {
      label: 'Total Trades',
      value: profile.totalTrades.toLocaleString(),
      icon: <Hash className="w-4 h-4" />,
      colorClass: 'text-amber-400 bg-amber-500/15',
    },
    {
      label: 'Trading Days',
      value: profile.tradingDayCount.toLocaleString(),
      icon: <CalendarDays className="w-4 h-4" />,
      colorClass: 'text-cyan-400 bg-cyan-500/15',
    },
    {
      label: 'Best Month',
      value: formatPercent(profile.bestMonthPercent),
      icon: <ArrowUpRight className="w-4 h-4" />,
      colorClass: 'text-emerald-400 bg-emerald-500/15',
    },
    {
      label: 'Worst Month',
      value: formatPercent(profile.worstMonthPercent),
      icon: <ArrowDownRight className="w-4 h-4" />,
      colorClass: 'text-red-400 bg-red-500/15',
    },
  ];

  if (profile.showRealPnl && profile.totalReturnPercent != null) {
    cards.push({
      label: 'Total Return',
      value: formatPercent(profile.totalReturnPercent),
      icon: <Percent className="w-4 h-4" />,
      colorClass:
        profile.totalReturnPercent >= 0
          ? 'text-emerald-400 bg-emerald-500/15'
          : 'text-red-400 bg-red-500/15',
    });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {cards.map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
  );
};

export default ProfileMetricsGrid;
