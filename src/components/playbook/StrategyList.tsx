
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, Target, BookOpen } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { StrategyStatsDto } from '@/types/dto';

interface StrategyListProps {
  strategies: StrategyStatsDto[];
  onEdit: (strategy: StrategyStatsDto) => void;
  onDelete: (id: string) => void;
  onView: (strategy: StrategyStatsDto) => void;
  isDeleting?: boolean;
}

// Minimum trades before expectancy is statistically meaningful.
const MIN_TRADES_FOR_VERDICT = 20;

const formatCurrency = (value: number) => {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}$${Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatPercent = (value: number | null | undefined) =>
  value != null ? `${value.toFixed(1)}%` : '—';

const formatDecimal = (value: number | null | undefined) =>
  value != null ? value.toFixed(2) : '—';

// ─── Verdict ────────────────────────────────────────────────────────────────

type VerdictKind = 'EDGE' | 'BREAKEVEN' | 'BLEEDING' | 'INSUFFICIENT';

const computeVerdictKind = (s: StrategyStatsDto): VerdictKind => {
  if (s.tradeCount < MIN_TRADES_FOR_VERDICT) return 'INSUFFICIENT';
  const exp = s.expectancy ?? 0;
  const pf = s.profitFactor ?? 0;
  if (exp > 0 && pf >= 1.1) return 'EDGE';
  if (exp < 0 && pf < 1) return 'BLEEDING';
  return 'BREAKEVEN';
};

const VERDICT_CLASSES: Record<VerdictKind, string> = {
  EDGE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  BLEEDING: 'bg-red-500/15 text-red-400 border-red-500/20',
  BREAKEVEN: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  INSUFFICIENT: 'bg-muted/40 text-muted-foreground/70 border-white/[0.06]',
};

// ─── Small cells ─────────────────────────────────────────────────────────────

const StatCell: React.FC<{ label: string; value: string; color?: string }> = ({
  label,
  value,
  color,
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium">
      {label}
    </span>
    <span className={`text-sm font-semibold tabular-nums ${color ?? 'text-foreground'}`}>
      {value}
    </span>
  </div>
);

// ─── Component ───────────────────────────────────────────────────────────────

const StrategyList: React.FC<StrategyListProps> = ({
  strategies,
  onEdit,
  onDelete,
  onView,
  isDeleting,
}) => {
  const { t } = useTranslation();
  const [deleteTarget, setDeleteTarget] = useState<StrategyStatsDto | null>(null);

  const confirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.strategyId);
      setDeleteTarget(null);
    }
  };

  if (strategies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40">
          <Target className="h-7 w-7 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {t('playbook.noStrategies')}
        </p>
        <p className="text-xs text-muted-foreground/60">
          {t('playbook.noStrategiesHint', 'Create your first strategy to start tracking your setups.')}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {strategies.map((strategy, index) => {
          const verdictKind = computeVerdictKind(strategy);
          const verdictLabel =
            verdictKind === 'EDGE'
              ? t('playbook.verdictEdge', 'Edge')
              : verdictKind === 'BLEEDING'
                ? t('playbook.verdictBleeding', 'Bleeding')
                : verdictKind === 'BREAKEVEN'
                  ? t('playbook.verdictBreakeven', 'Breakeven')
                  : t('playbook.verdictInsufficient', 'Not enough data');
          const expectancyColor =
            verdictKind === 'EDGE'
              ? 'text-emerald-400'
              : verdictKind === 'BLEEDING'
                ? 'text-red-400'
                : 'text-foreground';
          const pnlColor = strategy.netPnl >= 0 ? 'text-emerald-400' : 'text-red-400';

          return (
            <div
              key={strategy.strategyId}
              className="glass-card rounded-2xl p-5 flex flex-col gap-4 animate-fade-in cursor-pointer hover:border-primary/20 transition-colors"
              style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
              onClick={() => onView(strategy)}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base">
                    {strategy.icon || <BookOpen className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm leading-tight truncate">
                      {strategy.strategyName}
                    </h3>
                    {strategy.description && (
                      <p className="text-xs text-muted-foreground/60 truncate mt-0.5">
                        {strategy.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {strategy.isDefault && (
                    <Badge className="bg-primary/15 text-primary border-primary/20 hover:bg-primary/20 text-xs">
                      {t('playbook.default', 'Default')}
                    </Badge>
                  )}
                  {!strategy.active && (
                    <Badge variant="secondary" className="text-xs">
                      {t('playbook.inactive')}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Hero: Expectancy + Verdict */}
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium block mb-0.5">
                    {t('playbook.expectancy', 'Expectancy')}
                    <span className="ml-1 text-muted-foreground/40 normal-case tracking-normal">
                      / {t('playbook.perTradeShort', 'trade')}
                    </span>
                  </span>
                  <span className={`text-3xl font-bold tabular-nums leading-none ${expectancyColor}`}>
                    {formatCurrency(strategy.expectancy)}
                  </span>
                </div>
                <Badge
                  className={`${VERDICT_CLASSES[verdictKind]} text-[11px] font-semibold uppercase tracking-wide border shrink-0`}
                  title={
                    verdictKind === 'INSUFFICIENT'
                      ? t(
                          'playbook.verdictInsufficientHint',
                          `Need at least ${MIN_TRADES_FOR_VERDICT} trades for a reliable verdict`,
                        )
                      : undefined
                  }
                >
                  {verdictLabel}
                </Badge>
              </div>

              {/* Secondary stats — demoted, compact */}
              <div className="grid grid-cols-4 gap-3 pt-1">
                <StatCell
                  label={t('playbook.trades', 'Trades')}
                  value={`${strategy.tradeCount}`}
                />
                <StatCell
                  label={t('playbook.winRate', 'Win Rate')}
                  value={formatPercent(strategy.winRate)}
                />
                <StatCell
                  label={t('playbook.profitFactor', 'Profit Factor')}
                  value={formatDecimal(strategy.profitFactor)}
                />
                <StatCell
                  label={t('playbook.netPnl', 'Net P&L')}
                  value={formatCurrency(strategy.netPnl)}
                  color={pnlColor}
                />
              </div>

              {/* Footer actions */}
              <div
                className="flex items-center justify-between border-t border-white/[0.05] pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="label-caps text-muted-foreground/50">
                  {strategy.winCount}W / {strategy.lossCount}L
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label={t('common.edit')}
                    onClick={() => onEdit(strategy)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    aria-label={t('common.delete')}
                    onClick={() => setDeleteTarget(strategy)}
                    disabled={isDeleting}
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('playbook.deleteStrategyTitle', 'Delete strategy?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'playbook.deleteStrategyConfirm',
                `Are you sure you want to delete "${deleteTarget?.strategyName}"? This action cannot be undone.`,
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StrategyList;
