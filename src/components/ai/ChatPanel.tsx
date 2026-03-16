import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Sparkles, Send, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { messages, isStreaming, sendMessage, loadHistory, clearHistory } =
    useAiChat();
  const [inputValue, setInputValue] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
            {isStreaming && (
              <p className="mb-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3 animate-pulse text-amber-400" />
                  {t('ai.streaming', 'Thinking...')}
                </span>
              </p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('ai.placeholder', 'Ask about your trading...')}
                disabled={isStreaming}
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
                disabled={!inputValue.trim() || isStreaming}
                onClick={() => void handleSend()}
                aria-label={t('ai.send', 'Send')}
                className="h-10 w-10 shrink-0 rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground/50">
              Enter to send &middot; Shift+Enter for new line
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChatPanel;
