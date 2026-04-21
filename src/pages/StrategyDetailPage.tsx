import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Edit,
  LogIn,
  ArrowRightFromLine,
  Shield,
  BookOpen,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStrategies } from '@/hooks/useStrategies';
import { useTradesByStrategy } from '@/hooks/useTradesByStrategy';
import { formatCurrency } from '@/services/trade.service';
import StrategyForm from '@/components/playbook/StrategyForm';
import ComplianceStatsPanel from '@/components/playbook/ComplianceStatsPanel';
import type { StrategyResponseDto, StrategyRuleCategory } from '@/types/dto';

const CATEGORY_META: Record<
  StrategyRuleCategory,
  { labelKey: string; fallback: string; icon: React.ReactNode; colorClass: string }
> = {
  ENTRY: {
    labelKey: 'playbook.entryRules',
    fallback: 'Entry Rules',
    icon: <LogIn className="h-4 w-4" />,
    colorClass: 'text-blue-400 bg-blue-500/10',
  },
  EXIT: {
    labelKey: 'playbook.exitRules',
    fallback: 'Exit Rules',
    icon: <ArrowRightFromLine className="h-4 w-4" />,
    colorClass: 'text-amber-400 bg-amber-500/10',
  },
  RISK_MANAGEMENT: {
    labelKey: 'playbook.riskRules',
    fallback: 'Risk Management',
    icon: <Shield className="h-4 w-4" />,
    colorClass: 'text-emerald-400 bg-emerald-500/10',
  },
};

const CATEGORY_ORDER: StrategyRuleCategory[] = ['ENTRY', 'EXIT', 'RISK_MANAGEMENT'];
const MAX_RECENT_TRADES = 5;

const StrategyDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { strategyId } = useParams<{ strategyId: string }>();
  const navigate = useNavigate();

  const { data: strategies, isLoading } = useStrategies();
  const strategy = useMemo(
    () => strategies?.find((s) => s.id === strategyId) ?? null,
    [strategies, strategyId],
  );

  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    document.title = strategy
      ? `${strategy.name} | Playbook`
      : 'Playbook | Followup Trading';
  }, [strategy]);

  const rules = strategy?.rules ?? [];
  const totalRules = rules.length;

  const rulesByCategory = useMemo(
    () =>
      CATEGORY_ORDER.reduce<Record<StrategyRuleCategory, typeof rules>>(
        (acc, cat) => {
          acc[cat] = rules
            .filter((r) => r.category === cat)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          return acc;
        },
        { ENTRY: [], EXIT: [], RISK_MANAGEMENT: [] },
      ),
    [rules],
  );

  if (isLoading) {
    return (
      <DashboardLayout pageTitle={t('pages.playbook')}>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!strategy) {
    return (
      <DashboardLayout pageTitle={t('pages.playbook')}>
        <div className="max-w-screen-2xl mx-auto space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 -ml-2"
            onClick={() => navigate('/playbook')}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('playbook.backToPlaybook', 'Back to Playbook')}
          </Button>
          <div className="glass-card rounded-2xl p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {t('playbook.strategyNotFound', 'Strategy not found.')}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle={strategy.name}>
      <div className="max-w-screen-2xl mx-auto space-y-6">
        {/* Back + page header */}
        <div className="space-y-3 animate-fade-in">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/playbook')}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('playbook.backToPlaybook', 'Back to Playbook')}
          </Button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                {strategy.icon ? (
                  <span className="text-xl leading-none">{strategy.icon}</span>
                ) : (
                  <BookOpen className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight truncate">
                  {strategy.name}
                </h1>
                <div className="flex items-center gap-1.5 mt-1">
                  {strategy.isDefault && (
                    <Badge className="text-xs bg-primary/15 text-primary border-primary/20">
                      {t('playbook.default', 'Default')}
                    </Badge>
                  )}
                  {strategy.active ? (
                    <Badge className="text-xs bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
                      {t('playbook.active')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {t('playbook.inactive')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-1.5"
              onClick={() => setFormOpen(true)}
            >
              <Edit className="h-3.5 w-3.5" />
              {t('common.edit')}
            </Button>
          </div>
        </div>

        {/* Two-column layout: left = rules (reference), right = insights (analysis) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: description + rules checklist */}
          <div className="lg:col-span-5 space-y-6">
            {strategy.description && (
              <div className="glass-card rounded-2xl p-4">
                <p className="label-caps text-muted-foreground/60 mb-2">
                  {t('playbook.description')}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {strategy.description}
                </p>
              </div>
            )}

            {totalRules === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <p className="text-sm text-muted-foreground/50">
                  {t('playbook.noRulesYet', 'No rules defined yet.')}
                </p>
                <p className="text-xs text-muted-foreground/40">
                  {t('playbook.addRulesHint', 'Edit this strategy to add entry, exit, and risk rules.')}
                </p>
              </div>
            ) : (
              CATEGORY_ORDER.map((cat) => {
                const catRules = rulesByCategory[cat];
                if (catRules.length === 0) return null;
                const meta = CATEGORY_META[cat];

                return (
                  <div key={cat} className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md ${meta.colorClass}`}
                      >
                        {meta.icon}
                      </span>
                      <p className="text-sm font-medium">
                        {t(meta.labelKey, meta.fallback)}
                      </p>
                      <span className="label-caps text-muted-foreground/50 ml-auto tabular-nums">
                        {catRules.length}
                      </span>
                    </div>

                    <ul className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
                      {catRules.map((rule) => (
                        <li
                          key={rule.id}
                          className="flex items-start gap-3 px-4 py-3"
                        >
                          <span
                            aria-hidden
                            className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40"
                          />
                          <span className="text-sm leading-relaxed text-foreground/85">
                            {rule.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT: compliance insights + recent trades */}
          <div className="lg:col-span-7 space-y-6">
            <ComplianceStatsPanel strategyId={strategy.id} />
            <RecentTradesSection strategyId={strategy.id} />
          </div>
        </div>
      </div>

      {/* Edit form */}
      <StrategyForm
        open={formOpen}
        editingStrategy={strategy as StrategyResponseDto}
        onSuccess={() => setFormOpen(false)}
        onCancel={() => setFormOpen(false)}
      />
    </DashboardLayout>
  );
};

// ─── Recent Trades Section ──────────────────────────────────────────────────

const RecentTradesSection: React.FC<{ strategyId: string }> = ({ strategyId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: trades, isLoading } = useTradesByStrategy(strategyId);

  const recentTrades = useMemo(() => {
    if (!trades) return [];
    return [...trades]
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
      .slice(0, MAX_RECENT_TRADES);
  }, [trades]);

  const totalCount = trades?.length ?? 0;

  const handleViewAll = () => navigate(`/trades?strategyId=${strategyId}`);
  const handleClickTrade = (tradeId: string) =>
    navigate('/trades', { state: { highlightTradeId: tradeId } });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-sm font-medium">{t('playbook.recentTrades', 'Recent Trades')}</p>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl bg-white/[0.04] h-14" />
          ))}
        </div>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-sm font-medium">{t('playbook.recentTrades', 'Recent Trades')}</p>
        </div>
        <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-muted-foreground/70">
            {t('playbook.noTradesYet', 'No trades linked to this strategy yet')}
          </p>
          <p className="text-xs text-muted-foreground/40">
            {t('playbook.assignStrategyHint', 'Assign this strategy to trades to see them here.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-sm font-medium">{t('playbook.recentTrades', 'Recent Trades')}</p>
        </div>
        <span className="text-xs text-muted-foreground/50 tabular-nums">
          {totalCount} {totalCount === 1 ? 'trade' : 'trades'}
        </span>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
        {recentTrades.map((trade) => {
          const isWin = (trade.profit ?? 0) >= 0;
          const entryDate = new Date(trade.entryDate).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          });

          return (
            <button
              key={trade.id}
              type="button"
              onClick={() => handleClickTrade(trade.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  trade.type === 'long'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-red-500/10 text-red-400'
                }`}
              >
                {trade.type === 'long' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{trade.symbol}</p>
                <p className="text-xs text-muted-foreground/50">{entryDate}</p>
              </div>

              <div className="text-right shrink-0">
                <p
                  className={`text-sm font-medium tabular-nums ${
                    isWin ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {trade.profit !== undefined ? formatCurrency(trade.profit) : '—'}
                </p>
                <Badge
                  variant="secondary"
                  className={`text-[10px] px-1.5 ${
                    trade.status === 'closed'
                      ? 'bg-muted/30 text-muted-foreground/60'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}
                >
                  {trade.status === 'open' ? 'Open' : 'Closed'}
                </Badge>
              </div>

              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
            </button>
          );
        })}
      </div>

      {totalCount > MAX_RECENT_TRADES && (
        <button
          type="button"
          onClick={handleViewAll}
          className="w-full text-center text-xs text-primary/70 hover:text-primary transition-colors py-1.5"
        >
          {t('playbook.viewAllTrades', 'View all {{count}} trades', { count: totalCount })} →
        </button>
      )}
    </div>
  );
};

export default StrategyDetailPage;
