import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Brain,
  Database,
  Lock,
  MessageSquarePlus,
  RotateCw,
  Send,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { renderChatMarkdown } from '@/lib/chatMarkdown';
import { useCoachChat, type CoachViewMessage } from '@/hooks/useCoachChat';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import UsageLimitIndicator from '@/components/subscription/UsageLimitIndicator';
import AiMessagePackPicker from '@/components/ai/AiMessagePackPicker';
import apiClient from '@/services/apiClient';
import type { SubscriptionDto } from '@/types/dto';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const AI_PLAN_CAPS: Record<string, number> = {
  FREE: 0,
  STARTER: 5,
  PRO: 30,
  ELITE: 150,
  TEAM: 150,
};

const SHARE_DATA_STORAGE_KEY = 'coachChat.shareUserData';

interface CoachChatProps {
  className?: string;
  /**
   * When set to a non-empty string, the chat will populate the composer with
   * this text and immediately send it. Cleared via {@link onPromptConsumed}
   * once the parent should stop driving the input.
   *
   * <p>This is the seam used by NLQ quick-prompt chips on the AI Coach page —
   * the parent owns the prompt state and the chat owns the actual send.</p>
   */
  pendingPrompt?: string | null;
  /**
   * Called once the {@code pendingPrompt} has been forwarded to {@code send}.
   * Parents should reset their prompt state in this callback so the same chip
   * can be re-clicked later without firing twice.
   */
  onPromptConsumed?: () => void;
}

/**
 * v2 AI coach chat component.
 *
 * <p>Talks to the {@code /api/v1/coach/*} endpoints via {@link useCoachChat}.
 * Non-blocking (the POST returns in <100 ms), SSE-streamed, and resumable —
 * closing the tab or navigating away is safe; the message keeps generating
 * server-side and resumes on return.</p>
 */
const CoachChat: React.FC<CoachChatProps> = ({
  className,
  pendingPrompt,
  onPromptConsumed,
}) => {
  const { t, i18n } = useTranslation();
  const { currentPlan } = useFeatureFlags();
  const {
    messages,
    isGenerating,
    isLoadingHistory,
    error,
    isPlanLimitExceeded,
    send,
    cancel,
    retry,
    loadHistory,
    clearHistory,
  } = useCoachChat();

  // Daily AI message usage — counter shown in header for paid plans
  const { data: subscription } = useQuery<SubscriptionDto>({
    queryKey: ['subscription', 'me'],
    queryFn: async () => {
      const res = await apiClient.get<SubscriptionDto>('/subscription');
      return res.data;
    },
    staleTime: 60 * 1000,
  });
  const showUsageCounter =
    currentPlan === 'STARTER' || currentPlan === 'PRO' || currentPlan === 'ELITE' || currentPlan === 'TEAM';
  const aiMessagesToday = subscription?.usage?.aiMessagesToday ?? 0;
  const aiMessagesMax =
    subscription?.usage?.aiMessagesMax ?? AI_PLAN_CAPS[currentPlan] ?? 0;

  const [input, setInput] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  // Data-sharing consent: per-turn flag, persisted locally so the user doesn't
  // have to re-enable it every time. Never stored server-side — the POST body
  // carries it for exactly one message.
  const [shareUserData, setShareUserData] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem(SHARE_DATA_STORAGE_KEY) === 'true'; }
    catch { return false; }
  });
  const scrollerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRafRef = useRef<number | null>(null);
  // Tracks IDs present at initial history load so new messages get the
  // entrance animation while historical messages render without it.
  const historyIdsRef = useRef<Set<string>>(new Set());

  const toggleShareUserData = useCallback(() => {
    setShareUserData((prev) => {
      const next = !prev;
      try { localStorage.setItem(SHARE_DATA_STORAGE_KEY, String(next)); }
      catch { /* storage blocked — in-memory only is fine */ }
      return next;
    });
  }, []);

  // One-shot history load on mount.
  useEffect(() => {
    if (historyLoaded) return;
    loadHistory().finally(() => setHistoryLoaded(true));
  }, [historyLoaded, loadHistory]);

  // Snapshot the IDs present at history-load time so subsequent messages
  // can be detected as "fresh" and receive the entrance animation.
  useEffect(() => {
    if (historyLoaded && historyIdsRef.current.size === 0) {
      historyIdsRef.current = new Set(messages.map((m) => m.id));
    }
  }, [historyLoaded, messages]);

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

  // Externally-driven prompt: when the parent injects a pendingPrompt, mirror
  // it into the composer for visual feedback, then immediately send. Guarded
  // against re-fires on prop identity churn by gating on the actual string.
  const lastPromptRef = useRef<string | null>(null);
  useEffect(() => {
    if (!pendingPrompt) return;
    if (lastPromptRef.current === pendingPrompt) return;
    if (isGenerating) return;
    lastPromptRef.current = pendingPrompt;
    setInput(pendingPrompt);
    // Defer the actual send by a tick so React paints the composer text first.
    const id = window.setTimeout(() => {
      setInput('');
      send(pendingPrompt, { shareUserData });
      onPromptConsumed?.();
    }, 0);
    return () => window.clearTimeout(id);
  }, [pendingPrompt, isGenerating, send, shareUserData, onPromptConsumed]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const text = input.trim();
      if (!text || isGenerating) return;
      setInput('');
      send(text, { shareUserData });
    },
    [input, isGenerating, send, shareUserData],
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

  // Group messages into day buckets for day dividers
  const dayBuckets = groupMessagesByDay(messages, i18n.language, t);

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col rounded-2xl border border-border/50 bg-gradient-to-b from-card to-card/60 shadow-xl shadow-primary/5 backdrop-blur-sm',
        className,
      )}
    >
      {/* Header: usage counter + new conversation button ----------------- */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5 flex-shrink-0 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative shrink-0">
            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
            {/* Online status dot */}
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-card" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold truncate">
            {t('ai.chatTitle', 'Chat with your AI Coach')}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {showUsageCounter && (
            <UsageLimitIndicator
              used={aiMessagesToday}
              max={aiMessagesMax}
              label={t('ai.messagesToday', 'today')}
              showBar={false}
              className="flex-row items-center gap-1.5"
            />
          )}
          {messages.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-muted-foreground hover:text-foreground"
                  aria-label={t('ai.newConversation', 'New conversation')}
                  title={t('ai.newConversation', 'New conversation')}
                  disabled={isGenerating}
                >
                  <MessageSquarePlus className="h-3.5 w-3.5" />
                  <span className="text-xs hidden sm:inline">
                    {t('ai.newConversation', 'New conversation')}
                  </span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t('ai.clearConfirmTitle', 'Start a new conversation?')}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('ai.clearConfirmBody', 'Your current chat history will be permanently deleted. The coach will no longer have access to previous messages as context.')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {t('common.cancel', 'Cancel')}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => void clearHistory()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    {t('ai.clearAndStart', 'Clear & start fresh')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Message list -------------------------------------------------- */}
      <div
        ref={scrollerRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3"
      >
        {messages.length === 0 && !isLoadingHistory && historyLoaded && (
          <EmptyState t={t} onSuggestionClick={setInput} />
        )}

        {/* Skeleton shimmer while history is loading */}
        {isLoadingHistory && messages.length === 0 && (
          <div className="space-y-3 motion-safe:animate-pulse">
            <div className="flex items-start">
              <div className="h-12 w-2/3 rounded-lg bg-muted/50" />
            </div>
            <div className="flex items-end justify-end">
              <div className="h-8 w-1/3 rounded-lg bg-primary/20" />
            </div>
            <div className="flex items-start">
              <div className="h-16 w-3/4 rounded-lg bg-muted/50" />
            </div>
          </div>
        )}

        {dayBuckets.map(({ label, messages: dayMessages }) => (
          <React.Fragment key={label}>
            <DayDivider label={label} />
            {dayMessages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                isFresh={historyLoaded && !historyIdsRef.current.has(m.id)}
              />
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Status strip -------------------------------------------------- */}
      {isGenerating && (
        <div className="flex items-center justify-between border-t border-border/50 bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
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
        <div className="flex items-center justify-between border-t border-border/50 bg-destructive/10 px-4 py-2 text-xs text-destructive">
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

      {error && !isGenerating && !canRetry && !isPlanLimitExceeded && (
        <div className="border-t border-border/50 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {isPlanLimitExceeded && (
        <div className="border-t border-border/50 bg-amber-50/50 dark:bg-amber-500/5 px-4 py-3 space-y-3">
          <p className="text-xs text-amber-900 dark:text-amber-200">
            {t(
              'coach.chat.outOfMessages',
              "You're out of messages today — pick a pack or wait until tomorrow.",
            )}
          </p>
          <AiMessagePackPicker compact />
        </div>
      )}

      {/* Composer ------------------------------------------------------ */}
      <form onSubmit={handleSubmit} className="border-t border-border/50 bg-background/50 px-3 pt-2 pb-3">
        <div className="rounded-2xl border border-border/60 bg-background/80 backdrop-blur transition-all focus-within:border-primary/50 focus-within:shadow-lg focus-within:shadow-primary/10">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('coach.chat.placeholder', 'Ask your coach anything…')}
            rows={1}
            className="block w-full resize-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/60 max-h-40 min-h-[44px]"
          />
          <div className="flex items-center justify-between border-t border-border/30 px-2 py-2">
            {/* Share-data toggle — small chip */}
            <button
              type="button"
              onClick={toggleShareUserData}
              aria-pressed={shareUserData}
              title={t(
                'coach.chat.shareData.tooltip',
                'When on, the coach gets a compact snapshot of your recent trades and stats for this message only. Nothing is stored server-side.',
              )}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                shareUserData
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'border-border/50 text-muted-foreground hover:bg-muted/50',
              )}
            >
              {shareUserData
                ? <Lock className="h-3 w-3" />
                : <Database className="h-3 w-3" />}
              {shareUserData
                ? t('coach.chat.shareData.on', 'Sharing my data')
                : t('coach.chat.shareData.off', 'Share my data')}
            </button>
            {/* Send button */}
            <Button
              type="submit"
              size="icon"
              className="h-8 w-8 rounded-full"
              disabled={!input.trim() || isGenerating}
              aria-label={t('coach.chat.send', 'Send')}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <p className="mt-1.5 px-2 text-[10px] text-muted-foreground/70">
          {shareUserData
            ? t('coach.chat.shareData.hintOn', 'Your last trades are attached to this message.')
            : t('coach.chat.shareData.hintOff', 'The coach has no access to your trades.')}
        </p>
      </form>
    </div>
  );
};

// ---- Helpers ---------------------------------------------------------------

/** Locale-aware "MMM d, HH:mm" or just "HH:mm" if today. */
function formatChatTimestamp(iso: string, lang: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const locale = lang.startsWith('fr') ? 'fr-FR' : lang.startsWith('es') ? 'es-ES' : 'en-US';
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  return sameDay
    ? new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(d)
    : new Intl.DateTimeFormat(locale, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      }).format(d);
}

/** Returns a YYYY-MM-DD key for grouping messages by calendar day. */
function dayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'unknown';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface DayBucket {
  label: string;
  messages: CoachViewMessage[];
}

/**
 * Splits a flat message array into buckets per calendar day.
 * Each bucket carries a human-readable label ("Aujourd'hui", "Hier", or a
 * formatted date) derived from the first message's timestamp.
 */
function groupMessagesByDay(
  messages: CoachViewMessage[],
  lang: string,
  t: (k: string, fb: string) => string,
): DayBucket[] {
  const locale = lang.startsWith('fr') ? 'fr-FR' : lang.startsWith('es') ? 'es-ES' : 'en-US';
  const now = new Date();
  const todayKey = dayKey(now.toISOString());
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dayKey(yesterday.toISOString());

  const bucketMap = new Map<string, CoachViewMessage[]>();
  for (const msg of messages) {
    const k = dayKey(msg.createdAt);
    if (!bucketMap.has(k)) bucketMap.set(k, []);
    bucketMap.get(k)!.push(msg);
  }

  return Array.from(bucketMap.entries()).map(([k, msgs]) => {
    let label: string;
    if (k === todayKey) {
      label = t('coach.chat.today', 'Aujourd\'hui');
    } else if (k === yesterdayKey) {
      label = t('coach.chat.yesterday', 'Hier');
    } else {
      const d = new Date(msgs[0].createdAt);
      label = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(d);
    }
    return { label, messages: msgs };
  });
}

// ---- Private subcomponents -------------------------------------------------

const DayDivider: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 my-4" aria-hidden="true">
    <div className="flex-1 h-px bg-border/40" />
    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
    <div className="flex-1 h-px bg-border/40" />
  </div>
);

interface EmptyStateProps {
  t: (k: string, fb: string) => string;
  onSuggestionClick: (text: string) => void;
}

const SUGGESTIONS = [
  {
    icon: TrendingUp,
    labelKey: 'coach.chat.suggestion.bestDay',
    labelFallback: 'Analyser mon meilleur jour de trading',
  },
  {
    icon: AlertTriangle,
    labelKey: 'coach.chat.suggestion.negativePatterns',
    labelFallback: 'Détecter mes patterns négatifs récurrents',
  },
  {
    icon: Target,
    labelKey: 'coach.chat.suggestion.morningRoutine',
    labelFallback: 'Comment améliorer ma routine matinale ?',
  },
  {
    icon: Brain,
    labelKey: 'coach.chat.suggestion.psychology',
    labelFallback: 'Quelle psychologie travailler en priorité ?',
  },
] as const;

const EmptyState: React.FC<EmptyStateProps> = ({ t, onSuggestionClick }) => (
  <div className="flex h-full flex-col items-center justify-center gap-4 px-2 py-6 text-center">
    <div className="flex flex-col items-center gap-2 text-muted-foreground">
      <Sparkles className="h-6 w-6 text-primary" />
      <p className="text-sm font-medium text-foreground">
        {t('coach.chat.empty.title', 'Discuter avec votre Coach IA')}
      </p>
      <p className="max-w-xs text-xs text-muted-foreground">
        {t(
          'coach.chat.empty.body',
          'Posez une question sur un trade, un pattern ou la discipline à travailler. Le coach retient le contexte entre les échanges.',
        )}
      </p>
    </div>
    <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
      {SUGGESTIONS.map(({ icon: Icon, labelKey, labelFallback }) => {
        const prompt = t(labelKey, labelFallback);
        return (
          <button
            key={labelKey}
            type="button"
            onClick={() => onSuggestionClick(prompt)}
            className="group flex items-start gap-3 rounded-xl border border-border/50 bg-card/50 p-3 text-left transition-all hover:border-primary/40 hover:bg-card hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]"
          >
            <div className="rounded-lg bg-primary/10 p-2 text-primary group-hover:bg-primary/20 shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium leading-snug text-foreground">
              {prompt}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

const MessageBubble: React.FC<{ message: CoachViewMessage; isFresh?: boolean }> = ({ message, isFresh = false }) => {
  const { i18n, t } = useTranslation();
  const isUser = message.role === 'USER';
  const showCaret =
    !isUser && (message.status === 'STREAMING' || message.status === 'PENDING');

  // User bubbles stay plain-text (their own input); assistant bubbles get the
  // small markdown renderer so **bold**, bullets, and numbered lists display.
  const contentIsEmpty = !message.content;

  const body = isUser
    ? message.content
    : contentIsEmpty
      ? null
      : renderChatMarkdown(message.content);

  const timestamp = formatChatTimestamp(message.createdAt, i18n.language);
  const fullTimestamp = (() => {
    const d = new Date(message.createdAt);
    if (Number.isNaN(d.getTime())) return '';
    const locale = i18n.language.startsWith('fr') ? 'fr-FR' : i18n.language.startsWith('es') ? 'es-ES' : 'en-US';
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'medium' }).format(d);
  })();

  const roleLabel = isUser
    ? t('coach.chat.role.user', 'Vous')
    : t('coach.chat.role.assistant', 'Coach IA');
  const ariaLabel = `${roleLabel}${timestamp ? `, ${timestamp}` : ''}`;

  return (
    <div
      className={cn(
        'flex flex-col',
        isUser ? 'items-end' : 'items-start',
        isFresh && 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200',
      )}
    >
      <div
        role="article"
        aria-label={ariaLabel}
        className={cn(
          // break-words + whitespace-pre-wrap handles unbroken tokens AND
          // preserves in-line whitespace the model emitted.
          'max-w-[88%] sm:max-w-[78%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm leading-relaxed',
          isUser
            ? 'bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 ring-1 ring-primary/20'
            : 'bg-muted/50 border border-border/40 backdrop-blur-sm text-foreground',
          message.status === 'FAILED' && !isUser && 'border-destructive/40',
          message.status === 'CANCELLED' && 'opacity-60',
        )}
      >
        {/* Typing indicator: 3 bouncing dots when streaming with no content yet */}
        {showCaret && contentIsEmpty ? (
          <div className="flex items-center gap-1 py-1" aria-label={t('coach.chat.typing', 'Coach is typing')}>
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
          </div>
        ) : (
          <>
            {body}
            {/* Streaming caret shown only while content is actively growing */}
            {showCaret && !contentIsEmpty && (
              <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-current align-middle opacity-60" />
            )}
          </>
        )}
      </div>
      {timestamp && (
        <time
          dateTime={message.createdAt}
          title={fullTimestamp}
          className="mt-1 px-1 text-[10px] text-muted-foreground/70 tabular-nums"
        >
          {timestamp}
        </time>
      )}
    </div>
  );
};

export default CoachChat;
