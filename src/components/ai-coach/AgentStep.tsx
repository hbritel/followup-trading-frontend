import React from 'react';
import { useTranslation } from 'react-i18next';
import { renderChatMarkdown } from '@/lib/chatMarkdown';
import { cn } from '@/lib/utils';
import type { AgentState, AgentType } from '@/types/agent';

interface AgentStepProps {
  agent: AgentType;
  state: AgentState;
}

/**
 * Detail panel for a single agent in the orchestration view. Renders the
 * agent's progressive (or final) markdown response and any attached
 * citations as inline tappable badges.
 *
 * <p>Visibility is owned by the parent — this component always renders, and
 * collapse/expand is achieved by mounting/unmounting from the caller's side.
 * That keeps streaming updates from accumulating in hidden subtrees while
 * still allowing the parent to drive layout.</p>
 */
const AgentStep: React.FC<AgentStepProps> = ({ agent, state }) => {
  const { t } = useTranslation();
  const isStreaming = state.status === 'running';
  const isPending = state.status === 'pending';
  const isError = state.status === 'error';
  const hasContent = state.partialContent.trim().length > 0;

  return (
    <div
      data-agent={agent}
      className={cn(
        'rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed',
        isError && 'border-destructive/40 bg-destructive/5',
      )}
    >
      {isPending && !hasContent && (
        <div className="space-y-2" aria-hidden>
          <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      )}

      {!isPending && hasContent && (
        <div className="prose prose-sm max-w-none break-words text-foreground">
          {renderChatMarkdown(state.partialContent)}
          {isStreaming && (
            <span
              aria-hidden
              className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-current align-middle opacity-60"
            />
          )}
        </div>
      )}

      {isError && (
        <p className="mt-2 text-xs text-destructive">
          {state.error ?? t('aiCoach.orchestration.agentError', 'This agent failed.')}
        </p>
      )}

      {state.finalCitations.length > 0 && (
        <CitationStrip citations={state.finalCitations} />
      )}
    </div>
  );
};

/**
 * Tiny pill row for citation refs. Navigation is intentionally stubbed — the
 * citation format is {@code "trade:abc123"} and the eventual handler will
 * route to the trade detail dialog. For now we stop the click so the row
 * doesn't accidentally collapse the parent.
 */
const CitationStrip: React.FC<{ citations: string[] }> = ({ citations }) => {
  const { t } = useTranslation();
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-2">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {t('aiCoach.orchestration.citations', 'Citations')}
      </span>
      {citations.map((ref) => (
        <button
          key={ref}
          type="button"
          // Stub: real navigation lands in a follow-up wave.
          onClick={(e) => e.stopPropagation()}
          className="rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {ref}
        </button>
      ))}
    </div>
  );
};

export default AgentStep;
