import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCw, Send, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { renderChatMarkdown } from '@/lib/chatMarkdown';
import { useCoachChat, type CoachViewMessage } from '@/hooks/useCoachChat';

interface CoachChatProps {
  className?: string;
}

/**
 * v2 AI coach chat component.
 *
 * <p>Talks to the {@code /api/v1/coach/*} endpoints via {@link useCoachChat}.
 * Non-blocking (the POST returns in <100 ms), SSE-streamed, and resumable —
 * closing the tab or navigating away is safe; the message keeps generating
 * server-side and resumes on return.</p>
 */
const CoachChat: React.FC<CoachChatProps> = ({ className }) => {
  const { t } = useTranslation();
  const {
    messages,
    isGenerating,
    isLoadingHistory,
    error,
    send,
    cancel,
    retry,
    loadHistory,
  } = useCoachChat();

  const [input, setInput] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRafRef = useRef<number | null>(null);

  // One-shot history load on mount.
  useEffect(() => {
    if (historyLoaded) return;
    loadHistory().finally(() => setHistoryLoaded(true));
  }, [historyLoaded, loadHistory]);

  // Auto-scroll to the newest message as content grows — throttled via rAF
  // so a fast stream doesn't trigger layout thrash.
  useEffect(() => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = scrollerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [messages]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const text = input.trim();
      if (!text || isGenerating) return;
      setInput('');
      send(text);
    },
    [input, isGenerating, send],
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

  const tailMessage = messages[messages.length - 1];
  const canRetry =
    tailMessage?.role === 'ASSISTANT' && tailMessage.status === 'FAILED';

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col rounded-lg border bg-card',
        className,
      )}
    >
      {/* Message list -------------------------------------------------- */}
      <div
        ref={scrollerRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3"
      >
        {messages.length === 0 && !isLoadingHistory && (
          <EmptyState t={t} />
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>

      {/* Status strip -------------------------------------------------- */}
      {isGenerating && (
        <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            {t('coach.chat.generating', 'Your coach is preparing a response')}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            onClick={() => cancel()}
          >
            <X className="mr-1 h-3 w-3" />
            {t('coach.chat.cancel', 'Cancel')}
          </Button>
        </div>
      )}

      {canRetry && (
        <div className="flex items-center justify-between border-t bg-destructive/10 px-4 py-2 text-xs text-destructive">
          <span className="truncate pr-2">
            {tailMessage?.errorMessage ||
              t('coach.chat.failed', 'Generation failed.')}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-destructive hover:text-destructive"
            onClick={() => retry()}
          >
            <RotateCw className="mr-1 h-3 w-3" />
            {t('coach.chat.retry', 'Retry')}
          </Button>
        </div>
      )}

      {error && !isGenerating && !canRetry && (
        <div className="border-t bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Composer ------------------------------------------------------ */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t bg-background px-3 py-3"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t('coach.chat.placeholder', 'Ask your coach anything…')}
          rows={1}
          className="max-h-40 min-h-[2.5rem] flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isGenerating}
          aria-label={t('coach.chat.send', 'Send')}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

// ---- Private subcomponents ------------------------------------------------

const EmptyState: React.FC<{ t: (k: string, fb?: string) => string }> = ({ t }) => (
  <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
    <Sparkles className="h-6 w-6 text-primary" />
    <p className="text-sm font-medium">
      {t('coach.chat.empty.title', 'Start a conversation')}
    </p>
    <p className="max-w-md text-xs">
      {t(
        'coach.chat.empty.body',
        "Ask about a trade, a pattern you're noticing, or what discipline to work on next. The coach remembers context across turns.",
      )}
    </p>
  </div>
);

const MessageBubble: React.FC<{ message: CoachViewMessage }> = ({ message }) => {
  const isUser = message.role === 'USER';
  const showCaret =
    !isUser && (message.status === 'STREAMING' || message.status === 'PENDING');

  // User bubbles stay plain-text (their own input); assistant bubbles get the
  // small markdown renderer so **bold**, bullets, and numbered lists display.
  const body = isUser
    ? message.content
    : message.content
      ? renderChatMarkdown(message.content)
      : showCaret
        ? '…'
        : '';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          // break-words + whitespace-pre-wrap handles unbroken tokens AND
          // preserves in-line whitespace the model emitted.
          'max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground',
          message.status === 'FAILED' && !isUser && 'border border-destructive/40',
          message.status === 'CANCELLED' && 'opacity-60',
        )}
      >
        {body}
        {showCaret && message.content && (
          <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-current align-middle opacity-60" />
        )}
      </div>
    </div>
  );
};

export default CoachChat;
