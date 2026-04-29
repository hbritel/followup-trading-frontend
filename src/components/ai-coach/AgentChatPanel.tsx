import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AgentOrchestrationView from './AgentOrchestrationView';
import { useAgentOrchestration } from '@/hooks/useAgentOrchestration';

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
  const {
    ask,
    cancel,
    reset,
    selectedAgents,
    agentStates,
    synthesisContent,
    isStreaming,
    error,
  } = useAgentOrchestration();

  const [input, setInput] = useState('');
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);

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
    if (!lastQuestion) return;
    ask(lastQuestion, { locale: locale ?? i18n.language });
  }, [ask, i18n.language, lastQuestion, locale]);

  const hasRun = lastQuestion !== null || selectedAgents.length > 0;

  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-3', className)}>
      <div className="flex-1 min-h-0">
        {hasRun ? (
          <AgentOrchestrationView
            selectedAgents={selectedAgents}
            agentStates={agentStates}
            synthesisContent={synthesisContent}
            isStreaming={isStreaming}
            error={error}
            question={lastQuestion ?? undefined}
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
