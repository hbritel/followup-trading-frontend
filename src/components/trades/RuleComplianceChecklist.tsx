import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LogIn, ArrowRightFromLine, Shield, Check, X, Minus, Lock, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useTradeCompliance, useUpdateTradeCompliance } from '@/hooks/useCompliance';
import { useToast } from '@/hooks/use-toast';
import type {
  StrategyRuleResponseDto,
  StrategyRuleCategory,
  ComplianceStatus,
  RuleComplianceRequest,
} from '@/types/dto';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RuleComplianceChecklistProps {
  tradeId: string;
  strategyRules: StrategyRuleResponseDto[];
  tradeStatus: 'OPEN' | 'CLOSED';
}

interface LocalEntry {
  status: ComplianceStatus;
  note: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

const STATUS_CYCLE: ComplianceStatus[] = ['NOT_APPLICABLE', 'FOLLOWED', 'NOT_FOLLOWED'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nextStatus(current: ComplianceStatus): ComplianceStatus {
  const idx = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <div className="flex items-center gap-3 px-4 py-3">
    <div className="h-7 w-7 rounded-full bg-white/[0.06] animate-pulse shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 w-3/4 rounded bg-white/[0.06] animate-pulse" />
    </div>
  </div>
);

const SkeletonCategory = () => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 mb-3">
      <div className="h-6 w-6 rounded-md bg-white/[0.06] animate-pulse" />
      <div className="h-3 w-24 rounded bg-white/[0.06] animate-pulse" />
    </div>
    <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
      <SkeletonRow />
      <SkeletonRow />
    </div>
  </div>
);

interface StatusToggleProps {
  status: ComplianceStatus;
  disabled?: boolean;
  onClick: () => void;
}

const StatusToggle: React.FC<StatusToggleProps> = ({ status, disabled, onClick }) => {
  const baseClass =
    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1';

  const variantClass: Record<ComplianceStatus, string> = {
    FOLLOWED:
      'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30',
    NOT_FOLLOWED:
      'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30',
    NOT_APPLICABLE:
      'bg-muted/40 border-white/10 text-muted-foreground hover:bg-muted/60',
  };

  const disabledClass = 'opacity-40 cursor-not-allowed';

  const icon: Record<ComplianceStatus, React.ReactNode> = {
    FOLLOWED: <Check className="h-3.5 w-3.5" />,
    NOT_FOLLOWED: <X className="h-3.5 w-3.5" />,
    NOT_APPLICABLE: <Minus className="h-3.5 w-3.5" />,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Status: ${status.replace('_', ' ').toLowerCase()}`}
      className={[baseClass, variantClass[status], disabled ? disabledClass : ''].join(' ')}
    >
      {icon[status]}
    </button>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const RuleComplianceChecklist: React.FC<RuleComplianceChecklistProps> = ({
  tradeId,
  strategyRules,
  tradeStatus,
}) => {
  const { toast } = useToast();

  // Server data
  const { data: serverCompliance, isLoading } = useTradeCompliance(tradeId);
  const { mutate: updateCompliance, isPending: isSaving } = useUpdateTradeCompliance(tradeId);

  // Local state: Map<strategyRuleId, LocalEntry>
  const [localState, setLocalState] = useState<Map<string, LocalEntry>>(new Map());
  // Snapshot of server state to compute dirty diff
  const [serverSnapshot, setServerSnapshot] = useState<Map<string, LocalEntry>>(new Map());

  // Hydrate local state whenever server data arrives
  useEffect(() => {
    if (!serverCompliance) return;

    const built = new Map<string, LocalEntry>();
    for (const entry of serverCompliance) {
      built.set(entry.strategyRuleId, {
        status: entry.status,
        note: entry.note ?? '',
      });
    }
    setLocalState(built);
    setServerSnapshot(built);
  }, [serverCompliance]);

  // Derived: rules grouped by category (sorted)
  const rulesByCategory = useMemo(() => {
    return CATEGORY_ORDER.reduce<Record<StrategyRuleCategory, StrategyRuleResponseDto[]>>(
      (acc, cat) => {
        acc[cat] = strategyRules
          .filter((r) => r.category === cat)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        return acc;
      },
      { ENTRY: [], EXIT: [], RISK_MANAGEMENT: [] },
    );
  }, [strategyRules]);

  // Dirty detection: compare current local state to server snapshot
  const isDirty = useMemo(() => {
    for (const [ruleId, local] of localState) {
      const snap = serverSnapshot.get(ruleId);
      const snapStatus: ComplianceStatus = snap?.status ?? 'NOT_APPLICABLE';
      const snapNote = snap?.note ?? '';
      if (local.status !== snapStatus || local.note !== snapNote) return true;
    }
    // Also check if a server entry was removed locally (edge-case guard)
    for (const ruleId of serverSnapshot.keys()) {
      if (!localState.has(ruleId)) return true;
    }
    return false;
  }, [localState, serverSnapshot]);

  // Compliance score badge
  const { followedCount, totalApplicable } = useMemo(() => {
    let followed = 0;
    let applicable = 0;
    for (const rule of strategyRules) {
      const entry = localState.get(rule.id);
      const status = entry?.status ?? 'NOT_APPLICABLE';
      if (status !== 'NOT_APPLICABLE') {
        applicable++;
        if (status === 'FOLLOWED') followed++;
      }
    }
    return { followedCount: followed, totalApplicable: applicable };
  }, [localState, strategyRules]);

  const handleToggle = useCallback((ruleId: string) => {
    setLocalState((prev) => {
      const next = new Map(prev);
      const current = next.get(ruleId) ?? { status: 'NOT_APPLICABLE' as ComplianceStatus, note: '' };
      const newStatus = nextStatus(current.status);
      next.set(ruleId, {
        ...current,
        status: newStatus,
        // Clear note when moving away from NOT_FOLLOWED
        note: newStatus === 'NOT_FOLLOWED' ? current.note : '',
      });
      return next;
    });
  }, []);

  const handleNoteChange = useCallback((ruleId: string, note: string) => {
    setLocalState((prev) => {
      const next = new Map(prev);
      const current = next.get(ruleId) ?? { status: 'NOT_FOLLOWED' as ComplianceStatus, note: '' };
      next.set(ruleId, { ...current, note: note.slice(0, 500) });
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    // Build payload: only changed entries compared to server snapshot
    const changed: RuleComplianceRequest[] = [];

    for (const rule of strategyRules) {
      const local = localState.get(rule.id) ?? { status: 'NOT_APPLICABLE' as ComplianceStatus, note: '' };
      const snap = serverSnapshot.get(rule.id);
      const snapStatus: ComplianceStatus = snap?.status ?? 'NOT_APPLICABLE';
      const snapNote = snap?.note ?? '';

      if (local.status !== snapStatus || local.note !== snapNote) {
        changed.push({
          strategyRuleId: rule.id,
          status: local.status,
          note: local.note || undefined,
        });
      }
    }

    if (changed.length === 0) return;

    updateCompliance(changed, {
      onSuccess: () => {
        toast({
          title: 'Compliance saved',
          description: 'Rule compliance has been updated.',
        });
      },
      onError: () => {
        toast({
          title: 'Save failed',
          description: 'Could not save compliance data. Please try again.',
          variant: 'destructive',
        });
      },
    });
  }, [localState, serverSnapshot, strategyRules, updateCompliance, toast]);

  // ── Empty state ───────────────────────────────────────────────────────────

  if (!isLoading && strategyRules.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-muted-foreground/60">No rules defined for this strategy</p>
        <p className="text-xs text-muted-foreground/40">
          Add entry, exit, and risk rules to the strategy to track compliance here.
        </p>
      </div>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-5">
        <SkeletonCategory />
        <SkeletonCategory />
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header row with score badge */}
      <div className="flex items-center justify-between">
        <p className="label-caps text-muted-foreground/60">Rule Compliance</p>
        {totalApplicable > 0 && (
          <Badge
            className={[
              'text-xs tabular-nums',
              followedCount === totalApplicable
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                : 'bg-muted/40 text-muted-foreground border-white/10',
            ].join(' ')}
          >
            {followedCount}/{totalApplicable} followed
          </Badge>
        )}
      </div>

      {/* Categories */}
      {CATEGORY_ORDER.map((cat) => {
        const catRules = rulesByCategory[cat];
        if (catRules.length === 0) return null;

        const meta = CATEGORY_META[cat];
        const isExitLocked = cat === 'EXIT' && tradeStatus === 'OPEN';

        const catFollowed = catRules.filter(
          (r) => (localState.get(r.id)?.status ?? 'NOT_APPLICABLE') === 'FOLLOWED',
        ).length;
        const catApplicable = catRules.filter(
          (r) => (localState.get(r.id)?.status ?? 'NOT_APPLICABLE') !== 'NOT_APPLICABLE',
        ).length;

        return (
          <div key={cat} className="space-y-2">
            {/* Category header */}
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${meta.colorClass}`}
              >
                {meta.icon}
              </span>
              <p className="text-sm font-medium">{meta.label}</p>

              {isExitLocked && (
                <span className="ml-1 flex items-center gap-1 text-xs text-muted-foreground/50">
                  <Lock className="h-3 w-3" />
                  Available when trade closes
                </span>
              )}

              {!isExitLocked && catApplicable > 0 && (
                <span className="label-caps text-muted-foreground/50 ml-auto tabular-nums">
                  {catFollowed}/{catApplicable}
                </span>
              )}
            </div>

            {/* Rule rows */}
            <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
              {catRules.map((rule) => {
                const entry = localState.get(rule.id) ?? {
                  status: 'NOT_APPLICABLE' as ComplianceStatus,
                  note: '',
                };
                const showNote = entry.status === 'NOT_FOLLOWED' && !isExitLocked;

                return (
                  <div key={rule.id} className="group">
                    <div
                      className={[
                        'flex items-start gap-3 px-4 py-3 transition-colors',
                        !isExitLocked && 'hover:bg-white/[0.02]',
                        isExitLocked && 'opacity-50',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <StatusToggle
                        status={entry.status}
                        disabled={isExitLocked}
                        onClick={() => handleToggle(rule.id)}
                      />

                      <div className="flex-1 min-w-0 pt-0.5">
                        <p
                          className={[
                            'text-sm leading-relaxed transition-colors',
                            entry.status === 'FOLLOWED' && 'text-muted-foreground/50 line-through',
                            entry.status === 'NOT_FOLLOWED' && 'text-foreground/90',
                            entry.status === 'NOT_APPLICABLE' && 'text-foreground/70',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {rule.text}
                        </p>
                      </div>
                    </div>

                    {/* Slide-in note field */}
                    <div
                      className={[
                        'overflow-hidden transition-all duration-200 ease-in-out',
                        showNote ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0',
                      ].join(' ')}
                    >
                      <div className="px-4 pb-3">
                        <Textarea
                          value={entry.note}
                          onChange={(e) => handleNoteChange(rule.id, e.target.value)}
                          placeholder="Why was this rule not followed? (optional)"
                          className="min-h-[64px] resize-none text-xs bg-white/[0.03] border-white/10 placeholder:text-muted-foreground/40 focus-visible:ring-red-500/30"
                          maxLength={500}
                        />
                        <p className="mt-1 text-right text-xs text-muted-foreground/40 tabular-nums">
                          {entry.note.length}/500
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Save footer */}
      {isDirty && (
        <>
          <Separator className="opacity-20" />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save compliance
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default RuleComplianceChecklist;
