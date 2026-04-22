import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronRight,
  FlaskConical,
  Link2,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useForceComplianceCheck } from '@/hooks/usePropFirm';
import { useToast } from '@/hooks/use-toast';
import type { PropFirmEvaluation, EvaluationStatus } from '@/types/propfirm';

interface EvaluationCardProps {
  evaluation: PropFirmEvaluation;
  className?: string;
}

const STATUS_META: Record<
  EvaluationStatus,
  { labelKey: string; badgeClass: string; borderClass: string }
> = {
  ACTIVE: {
    labelKey: 'propFirm.status.active',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    borderClass: 'border-l-blue-500',
  },
  PASSED: {
    labelKey: 'propFirm.status.passed',
    badgeClass: 'bg-green-500/10 text-green-400 border-green-500/20',
    borderClass: 'border-l-green-500',
  },
  FAILED: {
    labelKey: 'propFirm.status.failed',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
    borderClass: 'border-l-red-500',
  },
  EXPIRED: {
    labelKey: 'propFirm.status.expired',
    badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    borderClass: 'border-l-zinc-500',
  },
  FUNDED: {
    labelKey: 'propFirm.status.funded',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    borderClass: 'border-l-amber-500',
  },
};

const EvaluationCard: React.FC<EvaluationCardProps> = ({ evaluation, className }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const forceCheck = useForceComplianceCheck();

  const locale = i18n.language || 'en';

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  const formatDate = (iso: string): string => {
    try {
      return new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  const timeAgo = (iso: string): string => {
    try {
      const diffMs = Date.now() - new Date(iso).getTime();
      if (diffMs < 0) return t('propFirm.timeAgo.justNow');
      const diffMin = Math.floor(diffMs / 60_000);
      if (diffMin < 1) return t('propFirm.timeAgo.justNow');
      if (diffMin < 60) return t('propFirm.timeAgo.minutes', { count: diffMin });
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return t('propFirm.timeAgo.hours', { count: diffHr });
      const diffDay = Math.floor(diffHr / 24);
      return t('propFirm.timeAgo.days', { count: diffDay });
    } catch {
      return '';
    }
  };

  const statusMeta = STATUS_META[evaluation.status] ?? STATUS_META.ACTIVE;
  const statusLabel = t(statusMeta.labelKey);

  const pnlPositive = evaluation.totalPnl >= 0;

  // Profit progress — capped at 100 for display
  const profitProgressPct = Math.min(Math.max(evaluation.totalPnlPercent, 0), 100);

  // Always 3 lines: Name, Challenge Type, Phase + Date
  const titleLine = evaluation.displayName || evaluation.firmName;
  const challengeLine = evaluation.challengeType
    ? (evaluation.displayName ? `${evaluation.firmName} · ${evaluation.challengeType}` : evaluation.challengeType)
    : (evaluation.displayName ? evaluation.firmName : null);

  // "Last checked" — use createdAt as a proxy if no explicit field is available
  const lastCheckedLabel = timeAgo(evaluation.createdAt);

  const handleQuickCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    forceCheck.mutate(evaluation.id, {
      onSuccess: () => {
        toast({
          title: t('propFirm.toast.checkSuccessTitle'),
          description: t('propFirm.toast.checkSuccessDesc'),
        });
      },
      onError: () => {
        toast({
          title: t('propFirm.toast.checkFailTitle'),
          description: t('propFirm.toast.checkFailDesc'),
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Card
      className={cn(
        'glass-card rounded-2xl cursor-pointer hover:border-primary/30 transition-all group overflow-hidden',
        // Colored left border based on status
        'border-l-4',
        statusMeta.borderClass,
        className,
      )}
      onClick={() => navigate(`/prop-firm/evaluation/${evaluation.id}`)}
      role="button"
      aria-label={t('propFirm.card.viewAria', { name: titleLine })}
    >
      <CardContent className="p-5 space-y-4">
        {/* Row 1: title, badges, actions, arrow */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Line 1: Name + SIM/account badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm leading-tight">{titleLine}</h3>
              {evaluation.simulationMode ? (
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-violet-500/10 text-violet-400 border-violet-500/20 flex items-center gap-0.5"
                >
                  <FlaskConical className="h-2.5 w-2.5" />
                  SIM
                </Badge>
              ) : evaluation.brokerConnectionDisplayName ? (
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-primary/8 text-primary/80 border-primary/20 flex items-center gap-0.5"
                >
                  <Link2 className="h-2.5 w-2.5" />
                  {evaluation.brokerConnectionDisplayName}
                </Badge>
              ) : null}
            </div>
            {/* Line 2: Challenge type (always shown) */}
            {challengeLine && (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{challengeLine}</p>
            )}
            {/* Line 3: Phase + start date (always shown) */}
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('propFirm.card.phaseStarted', {
                phase: evaluation.currentPhase,
                date: formatDate(evaluation.startDate),
              })}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Challenge type badge */}
            {evaluation.challengeType && (
              <Badge
                variant="secondary"
                className="text-[10px] bg-muted/60 text-muted-foreground border-border/40 hidden sm:inline-flex"
              >
                {evaluation.challengeType}
              </Badge>
            )}
            <Badge
              variant="secondary"
              className={cn('text-[10px] border font-medium', statusMeta.badgeClass)}
            >
              {statusLabel}
            </Badge>
            {/* Quick check button — only for active evaluations */}
            {evaluation.status === 'ACTIVE' && (
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  'h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
                  forceCheck.isPending && forceCheck.variables === evaluation.id && 'opacity-100',
                )}
                onClick={handleQuickCheck}
                disabled={forceCheck.isPending}
                title={t('propFirm.card.forceCheck')}
                aria-label={t('propFirm.card.forceCheck')}
              >
                <RefreshCw
                  className={cn(
                    'h-3.5 w-3.5',
                    forceCheck.isPending &&
                      forceCheck.variables === evaluation.id &&
                      'animate-spin',
                  )}
                />
              </Button>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Row 2: key metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
              {t('propFirm.card.balance')}
            </p>
            <p className="text-sm font-semibold font-mono">
              {formatCurrency(evaluation.currentBalance)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
              {t('propFirm.card.pnl')}
            </p>
            <p
              className={cn(
                'text-sm font-semibold font-mono flex items-center gap-0.5',
                pnlPositive ? 'text-green-400' : 'text-red-400',
              )}
            >
              {pnlPositive ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {evaluation.totalPnlPercent >= 0 ? '+' : ''}
              {evaluation.totalPnlPercent.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
              {t('propFirm.card.drawdown')}
            </p>
            <p
              className={cn(
                'text-sm font-semibold font-mono',
                evaluation.currentDrawdownPercent > 5 ? 'text-red-400' : 'text-muted-foreground',
              )}
            >
              {evaluation.currentDrawdownPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Row 3: Profit progress mini bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {t('propFirm.card.tradingDays', { count: evaluation.tradingDaysCount })}
            </span>
            <span className="font-mono">
              {t('propFirm.card.profitPct', { value: profitProgressPct.toFixed(0) })}
            </span>
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-green-500/10">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${profitProgressPct}%` }}
            />
          </div>
        </div>

        {/* Row 4: Last checked timestamp */}
        {lastCheckedLabel && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 pt-0.5">
            <Clock className="h-2.5 w-2.5 shrink-0" />
            <span>{t('propFirm.card.lastChecked', { label: lastCheckedLabel })}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EvaluationCard;
