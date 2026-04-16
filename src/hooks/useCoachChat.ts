import { useCallback, useEffect, useRef, useState } from 'react';
import {
  coachChatService,
  streamCoachMessage,
  type CoachMessageDto,
  type CoachMessageStatus,
} from '@/services/coachChat.service';

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
}

/**
 * React hook for the v2 AI coach chat — mono-thread, SSE-streamed, resumable.
 *
 * On mount: loads the last N messages and, if the latest one is non-terminal,
 * automatically re-subscribes to its SSE stream so the user picks up the
 * in-flight generation.
 *
 * On {@code send}: POSTs the text, appends the two returned messages to local
 * state, and subscribes to the assistant's stream.
 */
export function useCoachChat(opts: { pageSize?: number } = {}) {
  const pageSize = opts.pageSize ?? 50;

  const [state, setState] = useState<UseCoachChatState>({
    messages: [],
    isGenerating: false,
    isLoadingHistory: false,
    error: null,
  });

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
        },
        onError: (reason) => {
          patchMessage(messageId, { status: 'FAILED', errorMessage: reason });
          setState((prev) => ({ ...prev, error: reason }));
          finishGenerating();
        },
        onCancelled: () => {
          patchMessage(messageId, { status: 'CANCELLED' });
          finishGenerating();
        },
      });
      activeStreamRef.current = { messageId, cancel };
    },
    [closeActiveStream, finishGenerating, patchMessage],
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
   * Loads (or reloads) the most recent messages. If the tail message is non-
   * terminal, re-subscribes to its stream so the UI shows live tokens.
   */
  const loadHistory = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoadingHistory: true, error: null }));
    try {
      const { data } = await coachChatService.history({ limit: pageSize });
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
      const msg = e instanceof Error ? e.message : 'Failed to load history.';
      setState((prev) => ({ ...prev, isLoadingHistory: false, error: msg }));
    }
  }, [pageSize, subscribe]);

  /** Submits a user turn. Returns once the POST returns (fast). */
  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || state.isGenerating) return;

      setState((prev) => ({ ...prev, error: null }));
      try {
        const { data } = await coachChatService.post(trimmed);
        setState((prev) => ({
          ...prev,
          isGenerating: true,
          messages: [
            ...prev.messages,
            toViewModel(data.userMessage),
            toViewModel(data.assistant),
          ],
        }));
        subscribe(data.assistant.id);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to send message.';
        setState((prev) => ({ ...prev, error: msg }));
      }
    },
    [state.isGenerating, subscribe],
  );

  /** Cancels the currently-streaming assistant message, if any. */
  const cancel = useCallback(async () => {
    const active = activeStreamRef.current;
    if (!active) return;
    try {
      await coachChatService.cancel(active.messageId);
      // The backend will push a 'cancelled' SSE event; our handler cleans up.
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to cancel.';
      setState((prev) => ({ ...prev, error: msg }));
    }
  }, []);

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
      const msg = e instanceof Error ? e.message : 'Retry failed.';
      setState((prev) => ({ ...prev, error: msg }));
    }
  }, [patchMessage, state.messages, subscribe]);

  return {
    messages: state.messages,
    isGenerating: state.isGenerating,
    isLoadingHistory: state.isLoadingHistory,
    error: state.error,
    send,
    cancel,
    retry,
    loadHistory,
  };
}
