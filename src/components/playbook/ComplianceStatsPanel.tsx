import { TrendingUp, TrendingDown, BarChart3, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useComplianceStats } from '@/hooks/useCompliance';
import type { RuleComplianceStatDto } from '@/types/dto';

interface ComplianceStatsPanelProps {
  strategyId: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatPnl(value: number | undefined): string {
  if (value === undefined || value === null) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}$${value.toFixed(2)}`;
}

function pnlClass(value: number | undefined): string {
  if (value === undefined || value === null) return 'text-muted-foreground';
  return value >= 0 ? 'text-emerald-400' : 'text-red-400';
}

function adherenceColor(pct: number): string {
  if (pct >= 80) return 'text-emerald-400';
  if (pct >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function adherenceProgressClass(pct: number): string {
  if (pct >= 80) return '[&>div]:bg-emerald-400';
  if (pct >= 50) return '[&>div]:bg-amber-400';
  return '[&>div]:bg-red-400';
}

function categoryLabel(category: string): string {
  switch (category) {
    case 'ENTRY':
      return 'Entry';
    case 'EXIT':
      return 'Exit';
    case 'RISK_MANAGEMENT':
      return 'Risk';
    default:
      return category;
  }
}

function categoryBadgeClass(category: string): string {
  switch (category) {
    case 'ENTRY':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'EXIT':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'RISK_MANAGEMENT':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    default:
      return 'bg-muted/30 text-muted-foreground';
  }
}

function worstRule(rules: RuleComplianceStatDto[]): string | null {
  const withData = rules.filter(
    (r) => r.avgPnlWhenNotFollowed !== undefined && r.avgPnlWhenNotFollowed !== null,
  );
  if (withData.length === 0) return null;
  return withData.reduce((worst, r) =>
    (r.avgPnlWhenNotFollowed ?? 0) < (worst.avgPnlWhenNotFollowed ?? 0) ? r : worst,
  ).ruleId;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.04] ${className ?? ''}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-24 w-full" />
      <SkeletonBlock className="h-20 w-full" />
      <SkeletonBlock className="h-40 w-full" />
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

const ComplianceStatsPanel: React.FC<ComplianceStatsPanelProps> = ({ strategyId }) => {
  const { data: stats, isLoading, isError } = useComplianceStats(strategyId);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError || !stats) {
    return (
      <div className="glass-card rounded-2xl p-4 text-center">
        <p className="text-sm text-muted-foreground/50">
          Could not load compliance data. Try again later.
        </p>
      </div>
    );
  }

  const { overallAdherence, tradesWithComplianceData, totalTrades, adherentWinRate,
    nonAdherentWinRate, perRuleStats } = stats;

  // Empty state
  if (tradesWithComplianceData === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/20">
          <BarChart3 className="h-5 w-5 text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground/70">No compliance data yet</p>
          <p className="mt-1 text-xs text-muted-foreground/40 leading-relaxed max-w-xs">
            Start tracking your rules on individual trades to see insights here.
          </p>
        </div>
      </div>
    );
  }

  const winRateDiff = adherentWinRate - nonAdherentWinRate;
  const diffLabel = `${winRateDiff >= 0 ? '+' : ''}${winRateDiff.toFixed(1)}%`;
  const worstRuleId = worstRule(perRuleStats);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
          <Target className="h-3.5 w-3.5 text-primary" />
        </div>
        <p className="text-sm font-medium">Compliance Insights</p>
      </div>

      {/* Overall Adherence */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <p className="label-caps text-muted-foreground/60">Overall Adherence</p>
        <div className="flex items-end gap-3">
          <span className={`text-3xl font-bold tabular-nums ${adherenceColor(overallAdherence)}`}>
            {overallAdherence.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground/50 mb-1 leading-tight">
            {tradesWithComplianceData} of {totalTrades} trades tracked
          </span>
        </div>
        <Progress
          value={overallAdherence}
          className={`h-2 ${adherenceProgressClass(overallAdherence)}`}
        />
      </div>

      {/* Discipline Impact */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="label-caps text-muted-foreground/60">Discipline Impact</p>
          <Badge
            className={`text-xs tabular-nums ${
              winRateDiff >= 0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
          >
            {diffLabel} win rate
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Adherent */}
          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="text-xs text-muted-foreground/60">When Disciplined</span>
            </div>
            <p className="text-xl font-bold tabular-nums text-emerald-400">
              {adherentWinRate.toFixed(1)}%
            </p>
          </div>

          {/* Non-adherent */}
          <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-red-400 shrink-0" />
              <span className="text-xs text-muted-foreground/60">When Not</span>
            </div>
            <p className="text-xl font-bold tabular-nums text-red-400">
              {nonAdherentWinRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Per-Rule Breakdown */}
      {perRuleStats.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.04]">
            <p className="label-caps text-muted-foreground/60">Rule Breakdown</p>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {perRuleStats.map((rule) => {
              const isWorst = rule.ruleId === worstRuleId;
              return (
                <div
                  key={rule.ruleId}
                  className={`px-4 py-3 space-y-2 ${
                    isWorst ? 'bg-red-500/[0.03]' : ''
                  }`}
                >
                  {/* Rule text + category */}
                  <div className="flex items-start gap-2">
                    <Badge className={`text-[10px] shrink-0 mt-0.5 ${categoryBadgeClass(rule.category)}`}>
                      {categoryLabel(rule.category)}
                    </Badge>
                    <span className={`text-xs leading-relaxed ${
                      isWorst ? 'text-foreground/90' : 'text-muted-foreground/80'
                    }`}>
                      {rule.ruleText}
                      {isWorst && (
                        <span className="ml-1.5 text-red-400/70 text-[10px] font-medium">
                          biggest impact
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Follow rate + P&L columns */}
                  <div className="grid grid-cols-3 gap-2 items-center">
                    {/* Follow Rate */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">
                        Follow Rate
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Progress value={rule.followRate} className="h-1 flex-1" />
                        <span className="text-[11px] tabular-nums text-muted-foreground/70 shrink-0 w-8 text-right">
                          {rule.followRate.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* P&L when followed */}
                    <div className="text-center">
                      <span className="block text-[10px] text-muted-foreground/40 uppercase tracking-wider mb-0.5">
                        P&amp;L Followed
                      </span>
                      <span className={`text-xs font-medium tabular-nums ${pnlClass(rule.avgPnlWhenFollowed)}`}>
                        {formatPnl(rule.avgPnlWhenFollowed)}
                      </span>
                    </div>

                    {/* P&L when not followed */}
                    <div className="text-right">
                      <span className="block text-[10px] text-muted-foreground/40 uppercase tracking-wider mb-0.5">
                        P&amp;L Skipped
                      </span>
                      <span className={`text-xs font-medium tabular-nums ${pnlClass(rule.avgPnlWhenNotFollowed)}`}>
                        {formatPnl(rule.avgPnlWhenNotFollowed)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceStatsPanel;
