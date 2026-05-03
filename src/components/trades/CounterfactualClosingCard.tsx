import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Lock, TrendingUp } from 'lucide-react';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import { useClosingScenario } from '@/hooks/useCounterfactual';

interface Props {
  tradeId: string | undefined;
  /** Hide the panel entirely when the trade is not closed. */
  show: boolean;
}

/**
 * Sprint 7 Tâche 7.6 — Per-trade closing-scenario card.
 *
 * <p>Renders inside {@code TradeDetailDialog} for CLOSED trades. Shows the
 * trader's own actual P&L vs the hypothetical P&L had they exited at the
 * trade's MFE — informational, not a recommendation.</p>
 *
 * <p>PRO+ only. FREE / STARTER see a one-line upgrade prompt; the backend
 * also returns 403 in that case (the hook treats it as null).</p>
 */
const CounterfactualClosingCard: React.FC<Props> = ({ tradeId, show }) => {
  const { t } = useTranslation();
  const { hasPlan } = useFeatureFlags();
  const allowed = hasPlan('PRO');

  const query = useClosingScenario(tradeId, show && allowed);

  if (!show) return null;
  if (!allowed) {
    return (
      <div className="rounded-lg border border-border/40 bg-card/30 p-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        <span>
          {t(
            'counterfactual.upgradeNote',
            'Counter-factual analysis is a PRO+ feature.',
          )}
        </span>
      </div>
    );
  }

  if (query.isLoading) {
    return (
      <div className="rounded-lg border border-border/40 bg-card/30 p-3 flex items-center gap-2 text-xs">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>{t('counterfactual.loading', 'Computing scenario…')}</span>
      </div>
    );
  }

  const data = query.data;
  if (!data) return null;

  return (
    <div className="rounded-lg border border-border/40 bg-card/30 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <TrendingUp className="h-4 w-4 text-emerald-500" />
        <h4 className="text-sm font-semibold">
          {t('counterfactual.closingTitle', 'What if you had exited at the MFE?')}
        </h4>
      </div>

      {!data.computable ? (
        <p className="text-xs text-muted-foreground">
          {t(
            'counterfactual.notComputable',
            'Not computable — this trade is missing entry, quantity, or MFE data.',
          )}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Metric
            label={t('counterfactual.actualPnl', 'Actual P&L')}
            value={formatUsd(data.actualPnl)}
          />
          <Metric
            label={t('counterfactual.mfeBasedPnl', 'P&L at MFE')}
            value={formatUsd(data.mfeBasedPnl)}
          />
          <Metric
            label={t('counterfactual.missedGain', 'Missed gain')}
            value={formatUsd(data.missedGain)}
            highlight={parseFloat(data.missedGain ?? '0') > 0}
          />
          <Metric
            label={t('counterfactual.capturedPct', 'Captured %')}
            value={data.capturedPct ? `${parseFloat(data.capturedPct).toFixed(0)}%` : '—'}
          />
        </div>
      )}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
  label,
  value,
  highlight,
}) => (
  <div className="rounded bg-background/40 p-2">
    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
    <div className={`text-sm font-medium ${highlight ? 'text-amber-500' : ''}`}>{value}</div>
  </div>
);

const formatUsd = (raw: string | null | undefined): string => {
  if (raw == null) return '—';
  const v = parseFloat(raw);
  if (Number.isNaN(v)) return '—';
  const sign = v < 0 ? '-' : '';
  return `${sign}$${Math.abs(v).toFixed(2)}`;
};

export default CounterfactualClosingCard;
