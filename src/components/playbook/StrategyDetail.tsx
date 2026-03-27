
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, LogIn, ArrowRightFromLine, Shield, BookOpen, ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react';
import type { StrategyResponseDto, StrategyRuleCategory } from '@/types/dto';
import { useTradesByStrategy } from '@/hooks/useTradesByStrategy';
import { formatCurrency } from '@/services/trade.service';
import ComplianceStatsPanel from './ComplianceStatsPanel';

interface StrategyDetailProps {
  strategy: StrategyResponseDto | null;
  open: boolean;
  onClose: () => void;
  onEdit: (strategy: StrategyResponseDto) => void;
}

const CATEGORY_META: Record<
  StrategyRuleCategory,
  { label: string; icon: React.ReactNode; colorClass: string }
> = {
  ENTRY: {
    label: 'Entry Rules',
    icon: <LogIn className="h-4 w-4" />,
    colorClass: 'text-blue-400 bg-blue-500/10',
  },
  EXIT: {
    label: 'Exit Rules',
    icon: <ArrowRightFromLine className="h-4 w-4" />,
    colorClass: 'text-amber-400 bg-amber-500/10',
  },
  RISK_MANAGEMENT: {
    label: 'Risk Management',
    icon: <Shield className="h-4 w-4" />,
    colorClass: 'text-emerald-400 bg-emerald-500/10',
  },
};

const CATEGORY_ORDER: StrategyRuleCategory[] = ['ENTRY', 'EXIT', 'RISK_MANAGEMENT'];

const StrategyDetail: React.FC<StrategyDetailProps> = ({
  strategy,
  open,
  onClose,
  onEdit,
}) => {
  const { t } = useTranslation();

  // Local checked state — visual only, not persisted
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const rules = strategy?.rules ?? [];
  const totalRules = rules.length;
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const progressValue = totalRules > 0 ? Math.round((checkedCount / totalRules) * 100) : 0;

  const toggleChecked = (ruleId: string) => {
    setChecked((prev) => ({ ...prev, [ruleId]: !prev[ruleId] }));
  };

  const resetChecked = () => setChecked({});

  const rulesByCategory = CATEGORY_ORDER.reduce<Record<StrategyRuleCategory, typeof rules>>(
    (acc, cat) => {
      acc[cat] = rules
        .filter((r) => r.category === cat)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      return acc;
    },
    { ENTRY: [], EXIT: [], RISK_MANAGEMENT: [] },
  );

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0 p-0"
      >
        {strategy && (
          <>
            <SheetHeader className="px-6 pt-6 pb-4">
              <div className="flex items-start justify-between gap-3 pr-8">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    {strategy.icon
                      ? <span className="text-xl leading-none">{strategy.icon}</span>
                      : <BookOpen className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="min-w-0">
                    <SheetTitle className="text-base leading-tight truncate">
                      {strategy.name}
                    </SheetTitle>
                    <SheetDescription className="mt-0.5 flex items-center gap-1.5">
                      {strategy.isDefault && (
                        <Badge className="text-xs bg-primary/15 text-primary border-primary/20">
                          Default
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
                    </SheetDescription>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1.5"
                  onClick={() => {
                    onClose();
                    onEdit(strategy);
                  }}
                >
                  <Edit className="h-3.5 w-3.5" />
                  {t('common.edit')}
                </Button>
              </div>
            </SheetHeader>

            <Separator />

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Description */}
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

              {/* Progress bar — checklist progress */}
              {totalRules > 0 && (
                <div className="glass-card rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="label-caps text-muted-foreground/60">
                      {t('playbook.checklistProgress', 'Checklist Progress')}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {checkedCount}/{totalRules}
                      </span>
                      {checkedCount > 0 && (
                        <button
                          type="button"
                          onClick={resetChecked}
                          className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors underline-offset-2 hover:underline"
                        >
                          {t('playbook.resetChecklist', 'Reset')}
                        </button>
                      )}
                    </div>
                  </div>
                  <Progress value={progressValue} className="h-1.5" />
                  {progressValue === 100 && (
                    <p className="text-xs text-emerald-400 font-medium">
                      {t('playbook.allRulesChecked', 'All rules confirmed — ready to trade!')}
                    </p>
                  )}
                </div>
              )}

              {/* Rules by category */}
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
                        <span className={`flex h-6 w-6 items-center justify-center rounded-md ${meta.colorClass}`}>
                          {meta.icon}
                        </span>
                        <p className="text-sm font-medium">{meta.label}</p>
                        <span className="label-caps text-muted-foreground/50 ml-auto">
                          {catRules.filter((r) => checked[r.id]).length}/{catRules.length}
                        </span>
                      </div>

                      <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
                        {catRules.map((rule) => (
                          <label
                            key={rule.id}
                            className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                          >
                            <Checkbox
                              checked={!!checked[rule.id]}
                              onCheckedChange={() => toggleChecked(rule.id)}
                              className="mt-0.5 shrink-0"
                            />
                            <span
                              className={`text-sm leading-relaxed transition-colors ${
                                checked[rule.id]
                                  ? 'text-muted-foreground/40 line-through'
                                  : 'text-foreground/90'
                              }`}
                            >
                              {rule.text}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Recent Trades */}
              <Separator />
              <RecentTradesSection strategyId={strategy.id} onClose={onClose} />

              {/* Compliance Stats */}
              <Separator />
              <ComplianceStatsPanel strategyId={strategy.id} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

// ─── Recent Trades Section ──────────────────────────────────────────────────

const MAX_RECENT_TRADES = 5;

function RecentTradesSection({ strategyId, onClose }: { strategyId: string; onClose: () => void }) {
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

  const handleViewAll = () => {
    onClose();
    // Navigate to trades page — strategy column will show which trades belong
    navigate('/trades');
  };

  const handleClickTrade = (tradeId: string) => {
    onClose();
    navigate('/trades');
  };

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
              {/* Direction indicator */}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                trade.type === 'long'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-red-500/10 text-red-400'
              }`}>
                {trade.type === 'long'
                  ? <TrendingUp className="h-4 w-4" />
                  : <TrendingDown className="h-4 w-4" />}
              </div>

              {/* Symbol + date */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{trade.symbol}</p>
                <p className="text-xs text-muted-foreground/50">{entryDate}</p>
              </div>

              {/* P&L */}
              <div className="text-right shrink-0">
                <p className={`text-sm font-medium tabular-nums ${
                  isWin ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {trade.profit !== undefined
                    ? formatCurrency(trade.profit)
                    : '—'}
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

              {/* Arrow */}
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
            </button>
          );
        })}
      </div>

      {/* View all link */}
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
}

export default StrategyDetail;
