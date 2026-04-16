import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Sparkles, Send, Trash2, Lock, X, RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useAiChat } from '@/hooks/useAiChat';
import ChatMessage from './ChatMessage';
import SuggestedQuestions from './SuggestedQuestions';
import { cn } from '@/lib/utils';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import UsageLimitIndicator from '@/components/subscription/UsageLimitIndicator';
import apiClient from '@/services/apiClient';
import type { SubscriptionDto } from '@/types/dto';

interface InlineChatProps {
  className?: string;
}

// AI plan limits: FREE=0, STARTER=5/day, PRO=30/day, ELITE=150/day
const AI_PLAN_CAPS: Record<string, number> = {
  FREE: 0,
  STARTER: 5,
  PRO: 30,
  ELITE: 150,
};

const InlineChat: React.FC<InlineChatProps> = ({ className }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentPlan } = useFeatureFlags();
  const { messages, isStreaming, sendMessage, loadHistory, clearHistory, cancelPending } =
    useAiChat();
  const [inputValue, setInputValue] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRafRef = useRef<number | null>(null);

  // Fetch subscription usage for AI message counter
  const { data: subscription } = useQuery<SubscriptionDto>({
    queryKey: ['subscription', 'me'],
    queryFn: async () => {
      const res = await apiClient.get<SubscriptionDto>('/subscription');
      return res.data;
    },
    staleTime: 60 * 1000,
  });

  const isFree = currentPlan === 'FREE';
  const showUsageCounter =
    currentPlan === 'STARTER' || currentPlan === 'PRO' || currentPlan === 'ELITE';
  const aiMessagesToday = subscription?.usage?.aiMessagesToday ?? 0;
  const aiMessagesMax =
    subscription?.usage?.aiMessagesMax ?? AI_PLAN_CAPS[currentPlan] ?? 0;
  const atAiLimit =
    isFree || (!isFree && aiMessagesToday >= aiMessagesMax && aiMessagesMax > 0);

  // Load history once on mount
  useEffect(() => {
    if (!historyLoaded) {
      loadHistory().finally(() => setHistoryLoaded(true));
    }
  }, [historyLoaded, loadHistory]);

  // Scroll to bottom when messages change — throttled via rAF to avoid jank during streaming
  useEffect(() => {
    if (scrollRafRef.current) return; // already scheduled
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [inputValue]);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isStreaming) return;
    setInputValue('');
    await sendMessage(text);
  }, [inputValue, isStreaming, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  const handleSuggestionSelect = useCallback(
    (question: string) => {
      void sendMessage(question);
    },
    [sendMessage],
  );

  const handleClearHistory = useCallback(() => {
    void clearHistory();
  }, [clearHistory]);

  const isEmpty = messages.length === 0;

  return (
    <div
      className={cn(
        'glass-card rounded-2xl flex flex-col overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-gradient-primary">
            {t('ai.chatTitle', 'Chat with your AI Coach')}
          </span>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={handleClearHistory}
            aria-label={t('ai.clearHistory', 'Clear history')}
            title={t('ai.clearHistory', 'Clear history')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        <div ref={messagesContainerRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
          {isEmpty ? (
            <div className="flex flex-1 flex-col justify-center">
              <div className="mb-4 text-center">
                <Sparkles className="mx-auto mb-3 h-10 w-10 text-amber-400 opacity-60" />
                <p className="text-sm text-muted-foreground">
                  {t('ai.noMessages', 'Start a conversation with your AI trading coach')}
                </p>
              </div>
              <SuggestedQuestions onSelect={handleSuggestionSelect} />
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isStreaming={msg.role === 'assistant' && msg.pending === true}
                />
              ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border/50 px-4 py-3 flex-shrink-0">
          {isFree ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Lock className="h-4 w-4 text-amber-400" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {t('subscription.limitReached', 'AI Chat not available')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('ai.freePlanNote', 'Upgrade to Starter or higher to use the AI coach.')}
                </p>
              </div>
              <Button
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-amber-400 text-white hover:from-amber-600 hover:to-amber-500 border-0 text-xs"
                onClick={() => navigate('/pricing')}
              >
                {t('subscription.upgrade', 'Upgrade to Starter')}
              </Button>
            </div>
          ) : (
            <>
              {isStreaming && (() => {
                const pendingMsg = [...messages].reverse().find((m) => m.pending === true);
                const userMsg = pendingMsg?.sourceUserMessage;
                const handleCancel = () => {
                  if (pendingMsg) cancelPending(pendingMsg.id);
                };
                const handleRetry = () => {
                  if (!pendingMsg || !userMsg) return;
                  cancelPending(pendingMsg.id);
                  void sendMessage(userMsg);
                };
                return (
                  <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-amber-500/5 px-2.5 py-1.5 border border-amber-500/10">
                    <Sparkles className="h-3 w-3 animate-pulse text-amber-400 shrink-0" />
                    <span className="flex-1 text-xs text-muted-foreground">
                      {t('ai.preparingResponse', 'Your coach is preparing a response — you can navigate away, it will be ready when you return.')}
                    </span>
                    {userMsg && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-amber-400"
                        onClick={handleRetry}
                        aria-label={t('ai.retry', 'Retry')}
                        title={t('ai.retry', 'Retry')}
                      >
                        <RotateCw className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={handleCancel}
                      aria-label={t('ai.cancel', 'Cancel')}
                      title={t('ai.cancel', 'Cancel')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })()}
              {showUsageCounter && (
                <div className="mb-2 flex justify-end">
                  <UsageLimitIndicator
                    used={aiMessagesToday}
                    max={aiMessagesMax}
                    label={t('ai.messagesToday', 'messages today')}
                    showBar={false}
                  />
                </div>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    atAiLimit
                      ? t(
                          'ai.limitReachedPlaceholder',
                          'Daily limit reached. Upgrade for more messages.',
                        )
                      : t('ai.placeholder', 'Ask about your trading...')
                  }
                  disabled={isStreaming || atAiLimit}
                  rows={1}
                  className={cn(
                    'flex-1 resize-none rounded-xl border bg-background/60 px-3 py-2.5',
                    'text-sm placeholder:text-muted-foreground/50',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'transition-colors duration-150',
                  )}
                />
                <Button
                  size="icon"
                  disabled={!inputValue.trim() || isStreaming || atAiLimit}
                  onClick={() => void handleSend()}
                  aria-label={t('ai.send', 'Send')}
                  className="h-10 w-10 shrink-0 rounded-xl"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {atAiLimit ? (
                <p className="mt-1.5 text-[10px] text-amber-400 font-medium text-center">
                  {t('ai.dailyLimitReached', 'Daily AI message limit reached.')}{' '}
                  <a href="/pricing" className="underline hover:text-amber-300">
                    {t('subscription.upgrade', 'Upgrade')}
                  </a>
                </p>
              ) : (
                <p className="mt-1.5 text-[10px] text-muted-foreground/50">
                  Enter to send &middot; Shift+Enter for new line
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InlineChat;
