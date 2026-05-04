import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import i18n from '@/i18n/i18n';
import {
  coachChatService,
  streamCoachMessage,
  type CoachMessageDto,
  type CoachMessageStatus,
} from '@/services/coachChat.service';
import { COACH_THREADS_KEY } from '@/hooks/useCoachThreads';

/**
 * Local view-model of a message. Mirrors {@link CoachMessageDto} but keeps
 * a mutable {@code content} field updated as tokens stream in.
 */
export interface CoachViewMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  status: CoachMessageStatus;
  content: string;
  errorMessage: string | null;
  createdAt: string;
}

interface UseCoachChatState {
  messages: CoachViewMessage[];
  /** True iff the tail assistant message is PENDING or STREAMING. */
  isGenerating: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  /** Set when the backend returns 402 PLAN_LIMIT_EXCEEDED on send. */
  isPlanLimitExceeded: boolean;
}

/**
 * React hook for the v2 AI coach chat — SSE-streamed, resumable, multi-thread.
 *
 * Pass a {@code threadId} to scope every operation to a specific thread; pass
 * {@code null} or {@code undefined} (or call with no args) to operate on the
 * user's "current" thread, the same legacy behaviour as the v1 mono-thread
 * hook. The current-thread mode keeps existing callers working unchanged.
 *
 * On mount or when {@code threadId} changes: loads the last N messages and,
 * if the latest one is non-terminal, automatically re-subscribes to its SSE
 * stream so the user picks up the in-flight generation.
 *
 * On {@code send}: POSTs the text (scoped to {@code threadId} if set), appends
 * the two returned messages to local state, and subscribes to the assistant's
 * stream.
 */
export function useCoachChat(opts: {
  pageSize?: number;
  /**
   * Optional thread id to scope the chat to a specific conversation. Pass
   * {@code null} (or omit) for the user's current thread — backward-compat
   * for callers that haven't opted into multi-thread yet.
   */
  threadId?: string | null;
} = {}) {
  const pageSize = opts.pageSize ?? 50;
  const threadId = opts.threadId ?? null;
  const queryClient = useQueryClient();

  const [state, setState] = useState<UseCoachChatState>({
    messages: [],
    isGenerating: false,
    isLoadingHistory: false,
    error: null,
    isPlanLimitExceeded: false,
  });

  /**
   * Invalidate the ['subscription', 'me'] query so the "X/Y today" counter
   * in the chat header refetches. Otherwise the server-side counter bumps
   * but the frontend keeps displaying the 60s-stale value.
   */
  const refreshSubscriptionUsage = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['subscription', 'me'] });
  }, [queryClient]);

  /**
   * Ask the threads list to refetch. Triggered after every send / clear /
   * cancel because each of those bumps {@code lastMessagePreview} or
   * {@code updatedAt} server-side, and the sidebar surfaces both.
   */
  const refreshThreadsList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: COACH_THREADS_KEY });
  }, [queryClient]);

  /** Active SSE stream — one at a time (we only stream the tail message). */
  const activeStreamRef = useRef<{ messageId: string; cancel: () => void } | null>(null);

  const closeActiveStream = useCallback(() => {
    activeStreamRef.current?.cancel();
    activeStreamRef.current = null;
  }, []);

  // Close the SSE stream on unmount.
  useEffect(() => () => closeActiveStream(), [closeActiveStream]);

  /** Mutates a specific message in-state by id. */
  const patchMessage = useCallback(
    (id: string, patch: Partial<CoachViewMessage>) => {
      setState((prev) => {
        const idx = prev.messages.findIndex((m) => m.id === id);
        if (idx < 0) return prev;
        const next = prev.messages.slice();
        next[idx] = { ...next[idx], ...patch };
        return { ...prev, messages: next };
      });
    },
    [],
  );

  const finishGenerating = useCallback(() => {
    setState((prev) => ({ ...prev, isGenerating: false }));
    closeActiveStream();
  }, [closeActiveStream]);

  /** Subscribes to the SSE stream for an assistant message. */
  const subscribe = useCallback(
    (messageId: string) => {
      closeActiveStream();
      const cancel = streamCoachMessage(messageId, {
        onReplay: (content) =>
          patchMessage(messageId, { content, status: 'STREAMING' }),
        onToken: (delta) => {
          setState((prev) => {
            const idx = prev.messages.findIndex((m) => m.id === messageId);
            if (idx < 0) return prev;
            const next = prev.messages.slice();
            next[idx] = {
              ...next[idx],
              status: 'STREAMING',
              content: (next[idx].content ?? '') + delta,
            };
            return { ...prev, messages: next };
          });
        },
        onDone: () => {
          patchMessage(messageId, { status: 'DONE' });
          finishGenerating();
          // Final preview lands once the assistant message is done — refresh
          // the sidebar so the truncated preview reflects the new content.
          refreshThreadsList();
        },
        onError: (reason) => {
          patchMessage(messageId, { status: 'FAILED', errorMessage: reason });
          setState((prev) => ({ ...prev, error: reason }));
          finishGenerating();
          // Backend refunds the daily quota slot when the LLM call fails,
          // so re-fetch the subscription usage so the counter rolls back
          // immediately instead of waiting for the next 60-second tick.
          refreshSubscriptionUsage();
        },
        onCancelled: () => {
          patchMessage(messageId, { status: 'CANCELLED' });
          finishGenerating();
          refreshThreadsList();
        },
      });
      activeStreamRef.current = { messageId, cancel };
    },
    [closeActiveStream, finishGenerating, patchMessage, refreshSubscriptionUsage, refreshThreadsList],
  );

  /** Maps a wire DTO → the local view model. */
  const toViewModel = (m: CoachMessageDto): CoachViewMessage => ({
    id: m.id,
    role: m.role,
    status: m.status,
    content: m.content,
    errorMessage: m.errorMessage,
    createdAt: m.createdAt,
  });

  /**
   * Loads (or reloads) the most recent messages for the current thread. If
   * the tail message is non-terminal, re-subscribes to its stream so the UI
   * shows live tokens.
   */
  const loadHistory = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoadingHistory: true, error: null }));
    try {
      const { data } = await coachChatService.history({ limit: pageSize, threadId });
      // Backend returns newest-first; flip to oldest-first for natural chat UI.
      const ordered = data.slice().reverse().map(toViewModel);
      setState((prev) => ({
        ...prev,
        messages: ordered,
        isLoadingHistory: false,
      }));

      const tail = ordered[ordered.length - 1];
      if (tail && tail.role === 'ASSISTANT' && (tail.status === 'PENDING' || tail.status === 'STREAMING')) {
        setState((prev) => ({ ...prev, isGenerating: true }));
        subscribe(tail.id);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : i18n.t('aiCoach.errors.historyLoad', 'Failed to load history.');
      setState((prev) => ({ ...prev, isLoadingHistory: false, error: msg }));
    }
  }, [pageSize, subscribe, threadId]);

  /**
   * Submits a user turn. Returns once the POST returns (fast).
   *
   * @param opts.shareUserData When true, the backend attaches a compact dump
   *   of the user's recent trades / accounts / 30-day stats to the system
   *   prompt so the coach can reference concrete numbers. Per-turn flag only —
   *   no server-side consent is stored.
   */
  const send = useCallback(
    async (text: string, opts: { shareUserData?: boolean } = {}) => {
      const trimmed = text.trim();
      if (!trimmed || state.isGenerating) return;

      setState((prev) => ({ ...prev, error: null, isPlanLimitExceeded: false }));
      try {
        const { data } = await coachChatService.post(
          trimmed,
          Boolean(opts.shareUserData),
          threadId,
        );
        setState((prev) => ({
          ...prev,
          isGenerating: true,
          messages: [
            ...prev.messages,
            toViewModel(data.userMessage),
            toViewModel(data.assistant),
          ],
        }));
        // Bump the usage counter immediately — the user message just got
        // persisted server-side, so count-today is already +1.
        refreshSubscriptionUsage();
        // Bump the threads list — the user's message just bumped this
        // thread's updatedAt, and the preview will follow on stream done.
        refreshThreadsList();
        subscribe(data.assistant.id);
      } catch (e) {
        const planLimit = Boolean(
          (e as { isPlanLimitExceeded?: boolean } | null)?.isPlanLimitExceeded,
        );
        const msg = planLimit
          ? i18n.t('aiCoach.errors.planLimit', "You've hit your daily AI coach limit. Buy a pack or wait until tomorrow.")
          : e instanceof Error
            ? e.message
            : i18n.t('aiCoach.errors.send', 'Failed to send message.');
        setState((prev) => ({ ...prev, error: msg, isPlanLimitExceeded: planLimit }));
      }
    },
    [state.isGenerating, subscribe, refreshSubscriptionUsage, refreshThreadsList, threadId],
  );

  /** Cancels the currently-streaming assistant message, if any. */
  const cancel = useCallback(async () => {
    const active = activeStreamRef.current;
    if (!active) return;
    try {
      await coachChatService.cancel(active.messageId);
      // The backend will push a 'cancelled' SSE event; our handler cleans up.
    } catch (e) {
      const msg = e instanceof Error ? e.message : i18n.t('aiCoach.errors.cancel', 'Failed to cancel.');
      setState((prev) => ({ ...prev, error: msg }));
    }
  }, []);

  /**
   * Deletes every message on the current thread (or the thread referenced by
   * {@code threadId}) and resets local state. Does NOT archive the thread —
   * that's a separate operation owned by the sidebar.
   */
  const clearHistory = useCallback(async () => {
    closeActiveStream();
    try {
      await coachChatService.clearThread(threadId);
      setState({
        messages: [],
        isGenerating: false,
        isLoadingHistory: false,
        error: null,
        isPlanLimitExceeded: false,
      });
      // Preview / updatedAt drop to null/now respectively — refresh sidebar.
      refreshThreadsList();
    } catch (e) {
      const msg = e instanceof Error ? e.message : i18n.t('aiCoach.errors.clearHistory', 'Failed to clear history.');
      setState((prev) => ({ ...prev, error: msg }));
    }
  }, [closeActiveStream, refreshThreadsList, threadId]);

  /** Retries the tail message if it's FAILED. */
  const retry = useCallback(async () => {
    const tail = state.messages[state.messages.length - 1];
    if (!tail || tail.role !== 'ASSISTANT' || tail.status !== 'FAILED') return;
    try {
      const { data } = await coachChatService.retry(tail.id);
      patchMessage(tail.id, {
        status: data.status,
        content: data.content,
        errorMessage: data.errorMessage,
      });
      setState((prev) => ({ ...prev, isGenerating: true, error: null }));
      subscribe(tail.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : i18n.t('aiCoach.errors.retry', 'Retry failed.');
      setState((prev) => ({ ...prev, error: msg }));
    }
  }, [patchMessage, state.messages, subscribe]);

  return {
    messages: state.messages,
    isGenerating: state.isGenerating,
    isLoadingHistory: state.isLoadingHistory,
    error: state.error,
    isPlanLimitExceeded: state.isPlanLimitExceeded,
    send,
    cancel,
    retry,
    loadHistory,
    clearHistory,
  };
}
