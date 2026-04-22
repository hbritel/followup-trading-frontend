import React from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Sigma } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePortfolioGreeks } from '@/hooks/useOptionSpreads';

interface PortfolioGreeksPanelProps {
  /** Must already be plan-checked by the caller. */
  readonly enabled: boolean;
}

function formatSigned(value: number | null | undefined, digits = 2): string {
  if (value == null) return '--';
  const abs = Math.abs(value).toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
  return value >= 0 ? `+${abs}` : `-${abs}`;
}

const GreekCell: React.FC<{
  symbol: string;
  label: string;
  value: number | null | undefined;
  digits?: number;
}> = ({ symbol, label, value, digits = 2 }) => {
  const tone =
    value == null
      ? 'text-muted-foreground'
      : value > 0
        ? 'text-emerald-400'
        : value < 0
          ? 'text-red-400'
          : 'text-white';
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 text-muted-foreground/70 text-[10px] uppercase tracking-wider">
        <span className="font-bold text-white/60">{symbol}</span>
        <span>{label}</span>
      </div>
      <p className={`text-lg font-bold tabular-nums ${tone}`}>
        {formatSigned(value, digits)}
      </p>
    </div>
  );
};

const PortfolioGreeksPanel: React.FC<PortfolioGreeksPanelProps> = ({ enabled }) => {
  const { t } = useTranslation();
  const { data, isLoading } = usePortfolioGreeks(enabled);

  if (!enabled) return null;

  return (
    <section
      className="glass-card rounded-2xl p-4 border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.03] to-transparent"
      aria-labelledby="portfolio-greeks-title"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sigma className="w-4 h-4 text-amber-400" aria-hidden />
          <h3
            id="portfolio-greeks-title"
            className="text-sm font-semibold text-white tracking-tight"
          >
            {t('options.portfolioGreeks.title', 'Portfolio Greeks')}
          </h3>
          <Badge
            variant="outline"
            className="text-[10px] font-semibold bg-amber-500/10 text-amber-300 border-amber-500/30"
          >
            <Crown className="w-2.5 h-2.5 mr-1" />
            ELITE
          </Badge>
        </div>
        {data && (
          <span className="text-xs text-muted-foreground">
            {t('options.portfolioGreeks.hint', '{{open}} OPEN spreads · {{legs}} legs', {
              open: data.openSpreadCount,
              legs: data.legsWithGreeks,
            })}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="h-14 rounded-lg bg-muted/30 animate-pulse" aria-busy="true" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <GreekCell symbol="Δ" label={t('options.delta', 'Delta')} value={data?.totalDelta} digits={2} />
          <GreekCell symbol="Γ" label={t('options.gamma', 'Gamma')} value={data?.totalGamma} digits={4} />
          <GreekCell symbol="Θ" label={t('options.theta', 'Theta')} value={data?.totalTheta} digits={2} />
          <GreekCell symbol="V" label={t('options.vega', 'Vega')} value={data?.totalVega} digits={2} />
        </div>
      )}
    </section>
  );
};

export default PortfolioGreeksPanel;
