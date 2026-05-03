import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Loader2,
  Lock,
  RefreshCw,
  ScrollText,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import { useRulesScenario } from '@/hooks/useCounterfactual';
import type { RuleImpact } from '@/types/counterfactual';

const LOOKBACK_OPTIONS = [7, 14, 30, 60, 90, 180] as const;
const DEFAULT_LOOKBACK = 30;
const TOP_RULES_LIMIT = 8;

/**
 * Sprint 7 Tâche 7.6 — Counter-factual rules panel.
 *
 * <p>Aggregates per-rule "potential gain" across the user's recent trades:
 * for each playbook rule, compares avg P&L when the rule was respected vs
 * broken, and projects the additional P&L the user would have realised by
 * respecting every rule on every trade. Pure compute — no LLM, no quota,
 * no advice. Frame: trader's own data.</p>
 *
 * <p>PRO+ only. FREE / STARTER see a one-line upgrade prompt; backend
 * also returns 403 (the hook treats it as null).</p>
 */
const CounterfactualRulesPanel: React.FC = () => {
  const { t } = useTranslation();
  const { hasPlan } = useFeatureFlags();
  const allowed = hasPlan('PRO');

  const [lookback, setLookback] = useState<number>(DEFAULT_LOOKBACK);
  const query = useRulesScenario(lookback, allowed);

  const ranked = useMemo<RuleImpact[]>(() => {
    if (!query.data) return [];
    return [...query.data.perRule]
      .sort((a, b) => parseFloat(b.potentialGain) - parseFloat(a.potentialGain))
      .slice(0, TOP_RULES_LIMIT);
  }, [query.data]);

  if (!allowed) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>
          {t(
            'counterfactual.rulesUpgradeNote',
            'Counter-factual rules analysis is a PRO+ feature.',
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground max-w-prose">
          {t(
            'counterfactual.rulesIntro',
            'Sums per-rule potential gain across your recent trades. No advice — observation of your own playbook compliance.',
          )}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Select
            value={String(lookback)}
            onValueChange={(v) => setLookback(parseInt(v, 10))}
          >
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOOKBACK_OPTIONS.map((d) => (
                <SelectItem key={d} value={String(d)} className="text-xs">
                  {t('counterfactual.lookbackOption', '{{days}} days', { days: d })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            className="h-8"
          >
            {query.isFetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {query.isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : !query.data ? (
        <p className="text-xs text-muted-foreground italic py-3">
          {t('counterfactual.rulesEmpty', 'No data yet. Build up some trade history with playbook rules.')}
        </p>
      ) : (
        <>
          <SummaryStrip
            actual={query.data.totalActualPnl}
            hypothetical={query.data.hypotheticalPnl}
            gap={query.data.gap}
          />
          {ranked.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">
              {t(
                'counterfactual.rulesNoBreaches',
                'No actionable rule breaches over the window — well played.',
              )}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {ranked.map((r) => (
                <RuleRow key={r.ruleId} impact={r} totalGap={query.data!.gap} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

interface SummaryStripProps {
  actual: string;
  hypothetical: string;
  gap: string;
}

const SummaryStrip: React.FC<SummaryStripProps> = ({ actual, hypothetical, gap }) => {
  const { t } = useTranslation();
  const hasGap = parseFloat(gap) > 0.01;
  return (
    <div className="grid grid-cols-3 gap-2">
      <Tile
        icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
        label={t('counterfactual.totalActualPnl', 'Actual')}
        value={formatUsd(actual)}
      />
      <Tile
        icon={<ScrollText className="h-3.5 w-3.5 text-sky-500" />}
        label={t('counterfactual.hypotheticalPnl', 'If rules followed')}
        value={formatUsd(hypothetical)}
      />
      <Tile
        icon={<AlertTriangle className={`h-3.5 w-3.5 ${hasGap ? 'text-amber-500' : 'text-muted-foreground'}`} />}
        label={t('counterfactual.totalGap', 'Gap')}
        value={formatUsd(gap)}
        highlight={hasGap}
      />
    </div>
  );
};

const Tile: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}> = ({ icon, label, value, highlight }) => (
  <div className="rounded-lg border border-border/40 bg-card/40 p-2">
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
      {icon}
      <span>{label}</span>
    </div>
    <div className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-amber-500' : ''}`}>
      {value}
    </div>
  </div>
);

interface RuleRowProps {
  impact: RuleImpact;
  totalGap: string;
}

const RuleRow: React.FC<RuleRowProps> = ({ impact, totalGap }) => {
  const { t } = useTranslation();
  const total = parseFloat(totalGap);
  const gain = parseFloat(impact.potentialGain);
  const share = total > 0 ? Math.min(100, (gain / total) * 100) : 0;
  return (
    <li className="rounded-md border border-border/30 bg-background/40 p-2">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <p className="text-xs font-medium truncate" title={impact.ruleText}>
            {impact.ruleText}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            {impact.strategyName} · {t('counterfactual.followedNotFollowed',
              '{{ok}} OK / {{ko}} broken', {
                ok: impact.followedCount,
                ko: impact.notFollowedCount,
              })}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-semibold text-amber-500">
            {formatUsd(impact.potentialGain)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            Δ {formatUsd(impact.perTradeDelta)}/trade
          </div>
        </div>
      </div>
      <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 transition-all"
          style={{ width: `${share}%` }}
        />
      </div>
    </li>
  );
};

const formatUsd = (raw: string | null | undefined): string => {
  if (raw == null) return '—';
  const v = parseFloat(raw);
  if (Number.isNaN(v)) return '—';
  const sign = v < 0 ? '-' : '';
  return `${sign}$${Math.abs(v).toFixed(2)}`;
};

export default CounterfactualRulesPanel;
