import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AgentOrchestrationView from './AgentOrchestrationView';
import UsageLimitIndicator from '@/components/subscription/UsageLimitIndicator';
import { useAgentOrchestration } from '@/hooks/useAgentOrchestration';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import { useSubscription } from '@/hooks/useSubscription';

const AI_PLAN_CAPS: Record<string, number> = {
  FREE: 0,
  STARTER: 5,
  PRO: 30,
  ELITE: 150,
  TEAM: 150,
};

interface AgentChatPanelProps {
  className?: string;
  locale?: string;
}

/**
 * Self-contained multi-agent panel: owns the composer, the orchestration
 * hook, and the visualization. This is rendered alongside (or instead of)
 * the existing single-agent {@link CoachChat} when the user opts into the
 * beta multi-agent mode.
 */
const AgentChatPanel: React.FC<AgentChatPanelProps> = ({ className, locale }) => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { currentPlan } = useFeatureFlags();
  const { data: subscription } = useSubscription();
  const {
    ask,
    cancel,
    reset,
    selectedAgents,
    agentStates,
    synthesisContent,
    isStreaming,
    error,
    question: persistedQuestion,
  } = useAgentOrchestration();

  const [input, setInput] = useState('');
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  // Show the persisted question after a refresh / navigation: if the hook
  // hydrated state from GET /coach/ask/active before the user typed
  // anything, fall back to that snapshot's question for the header.
  const displayedQuestion = lastQuestion ?? persistedQuestion;

  const showUsageCounter =
    currentPlan === 'STARTER' || currentPlan === 'PRO' || currentPlan === 'ELITE' || currentPlan === 'TEAM';
  const aiMessagesToday = subscription?.usage?.aiMessagesToday ?? 0;
  const aiMessagesMax =
    subscription?.usage?.aiMessagesMax ?? AI_PLAN_CAPS[currentPlan] ?? 0;

  // Multi-agent calls debit the same daily counter as single-agent ones
  // (server-side: CoachOrchestrator delegates to CoachMessageQuotaService).
  // Refresh the counter as soon as a stream completes (success or error)
  // so the indicator stays in sync with the server.
  const wasStreamingRef = useRef(isStreaming);
  useEffect(() => {
    if (wasStreamingRef.current && !isStreaming) {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    }
    wasStreamingRef.current = isStreaming;
  }, [isStreaming, queryClient]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const text = input.trim();
      if (!text || isStreaming) return;
      setInput('');
      setLastQuestion(text);
      ask(text, { locale: locale ?? i18n.language });
    },
    [ask, i18n.language, input, isStreaming, locale],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleRetry = useCallback(() => {
    const q = lastQuestion ?? persistedQuestion;
    if (!q) return;
    ask(q, { locale: locale ?? i18n.language });
  }, [ask, i18n.language, lastQuestion, locale, persistedQuestion]);

  const hasRun =
    displayedQuestion !== null || selectedAgents.length > 0 || synthesisContent.length > 0;

  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-3', className)}>
      {showUsageCounter && (
        <div className="flex items-center justify-end px-1 -mb-1 flex-shrink-0">
          <UsageLimitIndicator
            used={aiMessagesToday}
            max={aiMessagesMax}
            label={t('ai.messagesToday', 'today')}
            showBar={false}
            className="flex-row items-center gap-1.5"
          />
        </div>
      )}
      <div className="flex-1 min-h-0">
        {hasRun ? (
          <AgentOrchestrationView
            selectedAgents={selectedAgents}
            agentStates={agentStates}
            synthesisContent={synthesisContent}
            isStreaming={isStreaming}
            error={error}
            question={displayedQuestion ?? undefined}
            onCancel={cancel}
            onRetry={handleRetry}
            className="h-full"
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Composer ------------------------------------------------------- */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 rounded-lg border bg-card p-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t(
            'aiCoach.orchestration.placeholder',
            'Ask a question — agents will cooperate to answer.',
          )}
          rows={1}
          className="max-h-40 min-h-[2.5rem] flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {hasRun && !isStreaming && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              reset();
              setLastQuestion(null);
            }}
          >
            {t('aiCoach.orchestration.newRun', 'New')}
          </Button>
        )}
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isStreaming}
          aria-label={t('aiCoach.orchestration.send', 'Send')}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

const EmptyState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-card/50 p-6 text-center text-muted-foreground">
      <Sparkles className="h-6 w-6 text-primary" />
      <p className="text-sm font-medium">
        {t('aiCoach.orchestration.emptyTitle', 'Ask the multi-agent coach')}
      </p>
      <p className="max-w-md text-xs">
        {t(
          'aiCoach.orchestration.emptyBody',
          'Specialist agents (risk, psychology, strategy, data, learning) will collaborate to answer.',
        )}
      </p>
    </div>
  );
};

export default AgentChatPanel;
