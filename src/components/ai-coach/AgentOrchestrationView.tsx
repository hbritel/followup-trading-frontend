import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, RotateCw, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { renderChatMarkdown } from '@/lib/chatMarkdown';
import AgentBadge from './AgentBadge';
import AgentStep from './AgentStep';
import type { AgentState, AgentType } from '@/types/agent';

interface AgentOrchestrationViewProps {
  selectedAgents: AgentType[];
  agentStates: Map<AgentType, AgentState>;
  synthesisContent: string;
  isStreaming: boolean;
  error: string | null;
  question?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
}

/**
 * Container that paints a full multi-agent orchestration run:
 * <ol>
 *   <li>Header — the question being answered + cancel/retry actions</li>
 *   <li>Agent strip — pills for each routed specialist (click to expand)</li>
 *   <li>Per-agent detail — collapsible markdown panes with citations</li>
 *   <li>Synthesis — the orchestrator's aggregated answer (streamed)</li>
 *   <li>Citations footer — deduped union across all agents</li>
 * </ol>
 *
 * <p>Stateless w.r.t. the SSE stream: parent passes already-shaped view-model
 * (typically from {@link useAgentOrchestration}).</p>
 */
const AgentOrchestrationView: React.FC<AgentOrchestrationViewProps> = ({
  selectedAgents,
  agentStates,
  synthesisContent,
  isStreaming,
  error,
  question,
  onCancel,
  onRetry,
  className,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Set<AgentType>>(() => new Set());
  const [userOverrode, setUserOverrode] = useState<Set<AgentType>>(() => new Set());

  // Auto-expand each agent once it transitions to a state that has reasoning
  // worth reading (running/done with content, or error). Respect explicit user
  // overrides so a manual collapse stays collapsed.
  useEffect(() => {
    setExpanded((prev) => {
      let mutated = false;
      const next = new Set(prev);
      for (const agent of selectedAgents) {
        if (userOverrode.has(agent)) continue;
        const state = agentStates.get(agent);
        if (!state) continue;
        const hasContent = state.partialContent.trim().length > 0;
        const shouldExpand =
          state.status === 'error' || (state.status === 'done' && hasContent);
        if (shouldExpand && !next.has(agent)) {
          next.add(agent);
          mutated = true;
        }
      }
      return mutated ? next : prev;
    });
  }, [agentStates, selectedAgents, userOverrode]);

  const toggleExpanded = (agent: AgentType) => {
    setUserOverrode((prev) => {
      const next = new Set(prev);
      next.add(agent);
      return next;
    });
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(agent)) next.delete(agent);
      else next.add(agent);
      return next;
    });
  };

  const aggregatedCitations = useMemo(() => {
    const seen = new Set<string>();
    for (const state of agentStates.values()) {
      for (const ref of state.finalCitations) seen.add(ref);
    }
    return Array.from(seen);
  }, [agentStates]);

  const isRouting = isStreaming && selectedAgents.length === 0;
  const hasSynthesis = synthesisContent.trim().length > 0;
  // Synthesis runs AFTER all agents complete. Hide its skeleton placeholder
  // while agents are still pending/running to avoid two unrelated grey
  // banners stacking up during fan-out.
  const allAgentsTerminal =
    selectedAgents.length > 0 &&
    selectedAgents.every((a) => {
      const s = agentStates.get(a)?.status;
      return s === 'done' || s === 'error';
    });
  const showSynthesisSkeleton = isStreaming && allAgentsTerminal && !hasSynthesis;

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col rounded-lg border bg-card',
        className,
      )}
    >
      {/* Header --------------------------------------------------------- */}
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            {t('aiCoach.orchestration.title', 'Multi-agent answer')}
          </div>
          {question && (
            <p className="mt-1 line-clamp-2 break-words text-sm text-foreground">
              {question}
            </p>
          )}
        </div>
        {isStreaming && onCancel && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-2"
            onClick={onCancel}
          >
            <X className="mr-1 h-3 w-3" />
            {t('aiCoach.orchestration.cancel', 'Cancel')}
          </Button>
        )}
        {!isStreaming && error && onRetry && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-2 text-destructive hover:text-destructive"
            onClick={onRetry}
          >
            <RotateCw className="mr-1 h-3 w-3" />
            {t('aiCoach.orchestration.retry', 'Retry')}
          </Button>
        )}
      </div>

      {/* Body ----------------------------------------------------------- */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4">
        {isRouting && (
          <div
            className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t('aiCoach.orchestration.routing', 'Selecting agents...')}
          </div>
        )}

        {selectedAgents.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedAgents.map((agent) => {
              const state = agentStates.get(agent);
              return (
                <AgentBadge
                  key={agent}
                  type={agent}
                  status={state?.status ?? 'pending'}
                  expanded={expanded.has(agent)}
                  onClick={() => toggleExpanded(agent)}
                />
              );
            })}
          </div>
        )}

        {selectedAgents.length > 0 && (
          <div className="space-y-2">
            {selectedAgents.map((agent) => {
              if (!expanded.has(agent)) return null;
              const state = agentStates.get(agent);
              if (!state) return null;
              return <AgentStep key={agent} agent={agent} state={state} />;
            })}
          </div>
        )}

        {(hasSynthesis || showSynthesisSkeleton) && (
          <section
            aria-labelledby="agent-orchestration-synthesis-title"
            className="rounded-lg border border-primary/20 bg-primary/5 p-3"
          >
            <h3
              id="agent-orchestration-synthesis-title"
              className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary"
            >
              {t('aiCoach.orchestration.synthesis', 'Synthesis')}
            </h3>
            {hasSynthesis ? (
              <div className="prose prose-sm max-w-none break-words text-foreground">
                {renderChatMarkdown(synthesisContent)}
                {isStreaming && (
                  <span
                    aria-hidden
                    className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-current align-middle opacity-60"
                  />
                )}
              </div>
            ) : (
              <div className="space-y-2" aria-hidden>
                <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            )}
          </section>
        )}

        {aggregatedCitations.length > 0 && (
          <footer className="rounded-md border border-dashed border-border/60 bg-background/50 p-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('aiCoach.orchestration.allCitations', 'All citations')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {aggregatedCitations.map((ref) => (
                <span
                  key={ref}
                  className="rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {ref}
                </span>
              ))}
            </div>
          </footer>
        )}

        {error && !isStreaming && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentOrchestrationView;
