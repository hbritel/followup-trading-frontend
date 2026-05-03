import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Loader2, Lock, RefreshCw, Target, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import {
  useDeleteGoal,
  useGenerateGoals,
  useGoalsProgress,
  useSmartGoals,
} from '@/hooks/useSmartGoals';
import type {
  GoalProgress,
  SmartGoal,
  SmartGoalMetricType,
} from '@/types/smartGoals';
import { isLowerBetter } from '@/types/smartGoals';

/**
 * Sprint 7 Tâche 7.6 — Smart goals card on AI Coach.
 *
 * <p>Lists the user's running-week goals with progress bars, a "Generate"
 * button (PRO+, charges one quota slot), and per-goal delete. Shows a
 * one-line plan upgrade prompt for FREE / STARTER.</p>
 */
const SmartGoalsCard: React.FC = () => {
  const { t } = useTranslation();
  const { hasPlan } = useFeatureFlags();
  const allowed = hasPlan('PRO');

  const goalsQuery = useSmartGoals(8, allowed);
  const progressQuery = useGoalsProgress(allowed);
  const generate = useGenerateGoals();
  const remove = useDeleteGoal();

  if (!allowed) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>{t('aiCoach.smartGoals.upgradeNote', 'Smart goals are a PRO+ feature.')}</span>
      </div>
    );
  }

  const goals = goalsQuery.data ?? [];
  const progressByGoal = new Map<string, GoalProgress>();
  (progressQuery.data ?? []).forEach((p) => progressByGoal.set(p.goalId, p));

  // Filter to the running-week goals; the list endpoint also returns history.
  const today = new Date().toISOString().slice(0, 10);
  const currentWeek = goals.filter(
    (g) => g.weekStart <= today && today <= g.weekEnd,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {t(
            'aiCoach.smartGoals.intro',
            'Weekly stretch targets derived from your own metrics. No advice — just observation.',
          )}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="ml-2 shrink-0"
        >
          {generate.isPending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          )}
          {t('aiCoach.smartGoals.generate', 'Refresh goals')}
        </Button>
      </div>

      {goalsQuery.isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : currentWeek.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-3">
          {t(
            'aiCoach.smartGoals.empty',
            'No goals for this week yet — click Refresh to generate.',
          )}
        </p>
      ) : (
        <ul className="space-y-2">
          {currentWeek.map((goal) => (
            <GoalRow
              key={goal.id}
              goal={goal}
              progress={progressByGoal.get(goal.id)}
              onDelete={() => remove.mutate(goal.id)}
              deleting={remove.isPending}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

interface GoalRowProps {
  goal: SmartGoal;
  progress: GoalProgress | undefined;
  onDelete: () => void;
  deleting: boolean;
}

const GoalRow: React.FC<GoalRowProps> = ({ goal, progress, onDelete, deleting }) => {
  const { t } = useTranslation();
  const completion = parseFloat(progress?.completionPct ?? '0');
  const measured = progress?.measuredValue ?? goal.measuredValue;
  const target = goal.targetValue;
  const achieved = progress?.achieved || goal.achieved;
  const atRisk = progress?.atRisk ?? false;

  const barColor = achieved
    ? 'bg-emerald-500'
    : atRisk
      ? 'bg-rose-500'
      : 'bg-sky-500';

  return (
    <li className="rounded-lg border border-border/40 bg-card/40 p-3">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-start gap-2 min-w-0">
          {achieved ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
          ) : (
            <Target className="h-4 w-4 text-sky-500 mt-0.5 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{goal.title}</p>
            {goal.description ? (
              <p className="text-xs text-muted-foreground line-clamp-2">{goal.description}</p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          aria-label={t('aiCoach.smartGoals.delete', 'Dismiss goal')}
          className="text-muted-foreground hover:text-rose-500 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
        <div
          className={`h-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(completion, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {t('aiCoach.smartGoals.metric', '{{measured}} / {{target}}', {
            measured: formatMetric(goal.metricType, measured),
            target: formatMetric(goal.metricType, target),
          })}
        </span>
        <span className={atRisk && !achieved ? 'text-rose-500 font-medium' : ''}>
          {Math.round(completion)}%
        </span>
      </div>
    </li>
  );
};

const formatMetric = (metric: SmartGoalMetricType, raw: string | null | undefined): string => {
  if (raw == null) return '—';
  const v = parseFloat(raw);
  if (Number.isNaN(v)) return '—';
  if (metric === 'WIN_RATE_PCT' || metric === 'RULE_COMPLIANCE_PCT' || metric === 'TRADES_TAGGED_PCT') {
    return `${v.toFixed(0)}%`;
  }
  if (metric === 'AVG_R_MULTIPLE') {
    return `${v.toFixed(2)}R`;
  }
  if (metric === 'MAX_DAILY_LOSS_USD') {
    return `$${v.toFixed(2)}${isLowerBetter(metric) ? '' : ''}`;
  }
  return v.toFixed(0);
};

export default SmartGoalsCard;
