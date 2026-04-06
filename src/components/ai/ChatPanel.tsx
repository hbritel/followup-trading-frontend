import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Sparkles, Send, Trash2, X, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAiChat } from '@/hooks/useAiChat';
import ChatMessage from './ChatMessage';
import SuggestedQuestions from './SuggestedQuestions';
import { cn } from '@/lib/utils';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import UsageLimitIndicator from '@/components/subscription/UsageLimitIndicator';
import apiClient from '@/services/apiClient';
import type { SubscriptionDto } from '@/types/dto';

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

// AI plan limits: FREE=0, STARTER=5/day, PRO=30/day, ELITE=150/day
const AI_PLAN_CAPS: Record<string, number> = {
  FREE: 0,
  STARTER: 5,
  PRO: 30,
  ELITE: 150,
};

const ChatPanel: React.FC<ChatPanelProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentPlan } = useFeatureFlags();
  const { messages, isStreaming, sendMessage, loadHistory, clearHistory } =
    useAiChat();
  const [inputValue, setInputValue] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch subscription usage for AI message counter (only when panel opens)
  const { data: subscription } = useQuery<SubscriptionDto>({
    queryKey: ['subscription', 'me'],
    queryFn: async () => {
      const res = await apiClient.get<SubscriptionDto>('/subscription');
      return res.data;
    },
    staleTime: 60 * 1000,
    enabled: open,
  });

  const isFree = currentPlan === 'FREE';
  // Show counter for all paid plans (STARTER, PRO, ELITE all have caps)
  const showUsageCounter = currentPlan === 'STARTER' || currentPlan === 'PRO' || currentPlan === 'ELITE';
  const aiMessagesToday = subscription?.usage?.aiMessagesToday ?? 0;
  const aiMessagesMax = subscription?.usage?.aiMessagesMax ?? AI_PLAN_CAPS[currentPlan] ?? 0;
  const atAiLimit = isFree || (!isFree && aiMessagesToday >= aiMessagesMax && aiMessagesMax > 0);

  // Load history once on first open
  useEffect(() => {
    if (open && !historyLoaded) {
      loadHistory().finally(() => setHistoryLoaded(true));
    }
  }, [open, historyLoaded, loadHistory]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

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
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent
        side="right"
        className={cn(
          'flex w-full flex-col gap-0 p-0 sm:max-w-[420px]',
          'bg-background/95 backdrop-blur-2xl',
        )}
        // Override the built-in close button — we render our own
        onInteractOutside={onClose}
      >
        {/* Header */}
        <SheetHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <SheetTitle className="text-gradient-primary">
              {t('ai.title', 'AI Trading Coach')}
            </SheetTitle>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={handleClearHistory}
                aria-label={t('ai.clearHistory', 'Clear history')}
                title={t('ai.clearHistory', 'Clear history')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Messages area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
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
                {messages.map((msg, index) => {
                  const isLastAssistant =
                    index === messages.length - 1 && msg.role === 'assistant';
                  return (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      isStreaming={isLastAssistant && isStreaming}
                    />
                  );
                })}

                {/* Streaming indicator when assistant hasn't started yet */}
                {isStreaming &&
                  messages[messages.length - 1]?.role === 'assistant' &&
                  messages[messages.length - 1]?.content === '' && null /* handled inside ChatMessage */}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t px-4 py-3">
            {/* FREE plan — show compact upgrade prompt instead of input */}
            {isFree ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-amber-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{t('subscription.limitReached', 'AI Chat not available')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('ai.freePlanNote', 'Upgrade to Starter or higher to use the AI coach.')}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-amber-500 to-amber-400 text-white hover:from-amber-600 hover:to-amber-500 border-0 text-xs"
                  onClick={() => { onClose(); navigate('/pricing'); }}
                >
                  {t('subscription.upgrade', 'Upgrade to Starter')}
                </Button>
              </div>
            ) : (
              <>
                {isStreaming && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3 animate-pulse text-amber-400" />
                      {t('ai.streaming', 'Thinking...')}
                    </span>
                  </p>
                )}
                {/* Usage counter for STARTER / PRO */}
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
                        ? t('ai.limitReachedPlaceholder', 'Daily limit reached. Upgrade for more messages.')
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
      </SheetContent>
    </Sheet>
  );
};

export default ChatPanel;
