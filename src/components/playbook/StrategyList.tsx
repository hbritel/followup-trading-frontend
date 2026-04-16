
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, Target, BookOpen, TrendingUp, TrendingDown } from "lucide-react";
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

const formatCurrency = (value: number) => {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPercent = (value: number | null | undefined) => value != null ? `${value.toFixed(1)}%` : '—';

const formatDecimal = (value: number | null | undefined) => value != null ? value.toFixed(2) : '—';

const StatCell: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium">{label}</span>
    <span className={`text-sm font-semibold tabular-nums ${color ?? 'text-foreground'}`}>{value}</span>
  </div>
);

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
          const pnlColor = strategy.netPnl >= 0 ? 'text-emerald-400' : 'text-red-400';
          const winRateColor = strategy.winRate >= 50 ? 'text-emerald-400' : strategy.winRate > 0 ? 'text-amber-400' : 'text-muted-foreground';

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
                  {strategy.active ? (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 text-xs">
                      {t('playbook.active')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {t('playbook.inactive')}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Main stats row: Win Rate + Net P&L */}
              <div className="flex items-center justify-between gap-4 py-2 px-3 rounded-xl bg-muted/30 border border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${strategy.netPnl >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    {strategy.netPnl >= 0 ? (
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 block">{t('playbook.netPnl', 'Net P&L')}</span>
                    <span className={`text-base font-bold tabular-nums ${pnlColor}`}>
                      {formatCurrency(strategy.netPnl)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 block">{t('playbook.winRate', 'Win Rate')}</span>
                  <span className={`text-base font-bold tabular-nums ${winRateColor}`}>
                    {formatPercent(strategy.winRate)}
                  </span>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3">
                <StatCell
                  label={t('playbook.trades', 'Trades')}
                  value={`${strategy.tradeCount}`}
                />
                <StatCell
                  label={t('playbook.profitFactor', 'Profit Factor')}
                  value={formatDecimal(strategy.profitFactor)}
                  color={strategy.profitFactor >= 1 ? 'text-emerald-400' : strategy.profitFactor > 0 ? 'text-amber-400' : undefined}
                />
                <StatCell
                  label={t('playbook.expectancy', 'Expectancy')}
                  value={formatCurrency(strategy.expectancy)}
                  color={strategy.expectancy >= 0 ? 'text-emerald-400' : 'text-red-400'}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatCell
                  label={t('playbook.avgWinner', 'Avg Winner')}
                  value={formatCurrency(strategy.averageWin)}
                  color="text-emerald-400"
                />
                <StatCell
                  label={t('playbook.avgLoser', 'Avg Loser')}
                  value={formatCurrency(strategy.averageLoss)}
                  color="text-red-400"
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
