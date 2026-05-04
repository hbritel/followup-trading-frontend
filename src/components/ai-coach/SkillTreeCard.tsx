import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Award,
  CheckCircle2,
  Loader2,
  Lock,
  RefreshCw,
  Shield,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import { useEvaluateSkillTree, useSkillTree } from '@/hooks/useSkillTree';
import type { SkillCategory, SkillNodeView } from '@/types/skillTree';

const CATEGORIES: SkillCategory[] = ['DISCIPLINE', 'PERFORMANCE', 'STRATEGY', 'RISK'];

const CATEGORY_ICON: Record<SkillCategory, React.ComponentType<{ className?: string }>> = {
  DISCIPLINE: Shield,
  PERFORMANCE: TrendingUp,
  STRATEGY: Target,
  RISK: Award,
};

const CATEGORY_TINT: Record<SkillCategory, string> = {
  DISCIPLINE: 'text-violet-400',
  PERFORMANCE: 'text-emerald-400',
  STRATEGY: 'text-sky-400',
  RISK: 'text-amber-400',
};

/**
 * Sprint 7 Tâche 7.6 — Skill tree card on AI Coach.
 *
 * <p>Renders the four category columns with progress chips. Each chip is
 * locked / partial / unlocked depending on the user's current metrics.
 * Evaluation is deterministic compute server-side — the "Evaluate"
 * button is free (no quota debit).</p>
 */
const SkillTreeCard: React.FC = () => {
  const { t } = useTranslation();
  const { hasPlan } = useFeatureFlags();
  const allowed = hasPlan('PRO');

  const treeQuery = useSkillTree(allowed);
  const evaluate = useEvaluateSkillTree();

  const grouped = useMemo(() => {
    const out: Record<SkillCategory, SkillNodeView[]> = {
      DISCIPLINE: [],
      PERFORMANCE: [],
      STRATEGY: [],
      RISK: [],
    };
    for (const v of treeQuery.data ?? []) {
      out[v.node.category].push(v);
    }
    for (const cat of CATEGORIES) {
      out[cat].sort((a, b) => a.node.sortOrder - b.node.sortOrder);
    }
    return out;
  }, [treeQuery.data]);

  if (!allowed) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>{t('aiCoach.skillTree.upgradeNote', 'The skill tree is a PRO+ feature.')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {t(
            'aiCoach.skillTree.intro',
            'Milestones from your own metrics. No advice — just things you have already done or are working towards.',
          )}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => evaluate.mutate()}
          disabled={evaluate.isPending}
          className="ml-2 shrink-0"
        >
          {evaluate.isPending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          )}
          {t('aiCoach.skillTree.evaluate', 'Re-evaluate')}
        </Button>
      </div>

      {treeQuery.isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <CategoryColumn key={cat} category={cat} nodes={grouped[cat]} />
          ))}
        </div>
      )}
    </div>
  );
};

interface CategoryColumnProps {
  category: SkillCategory;
  nodes: SkillNodeView[];
}

const CategoryColumn: React.FC<CategoryColumnProps> = ({ category, nodes }) => {
  const { t } = useTranslation();
  const Icon = CATEGORY_ICON[category];
  const tint = CATEGORY_TINT[category];
  const unlockedCount = nodes.filter((n) => n.unlockedAt != null).length;
  return (
    <div className="rounded-lg border border-border/40 bg-card/30 p-3 space-y-2 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className={`h-3.5 w-3.5 shrink-0 ${tint}`} />
          <span className="text-xs font-semibold uppercase tracking-wider break-words leading-tight">
            {t(`aiCoach.skillTree.category.${category}`, category)}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {unlockedCount}/{nodes.length}
        </span>
      </div>
      <ul className="space-y-1.5">
        {nodes.map((view) => (
          <SkillRow key={view.node.id} view={view} />
        ))}
      </ul>
    </div>
  );
};

const SkillRow: React.FC<{ view: SkillNodeView }> = ({ view }) => {
  const { node, progressPct, unlockedAt } = view;
  const unlocked = unlockedAt != null;
  const pct = parseFloat(progressPct);
  return (
    <li
      className={`rounded-md p-1.5 border ${
        unlocked
          ? 'border-emerald-500/30 bg-emerald-500/10'
          : 'border-border/30 bg-background/40'
      }`}
      title={node.description ?? undefined}
    >
      <div className="flex items-start gap-1.5 mb-1">
        {unlocked ? (
          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
        ) : (
          <Lock className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
        )}
        <span className="text-[11px] font-medium leading-tight break-words">{node.name}</span>
      </div>
      {!unlocked && pct > 0 ? (
        <div className="h-0.5 bg-muted/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-500 transition-all"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      ) : null}
    </li>
  );
};

export default SkillTreeCard;
