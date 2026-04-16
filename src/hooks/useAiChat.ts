import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { aiService, type AiChatMessageResponse, type ChatJobResponse } from '@/services/ai.service';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  /** True while the backend is generating this assistant message */
  pending?: boolean;
  /** The async job ID, if this is a placeholder for a pending response */
  jobId?: string;
  /** Original user message that produced this placeholder (used for retry) */
  sourceUserMessage?: string;
}

interface UseAiChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  sendMessage: (text: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
  /** Cancels a pending message locally (stops polling, removes placeholder). */
  cancelPending: (placeholderId: string) => void;
}

const POLL_INTERVAL_MS = 2000;
/** Max wall-clock time a response is allowed to take, measured from backend createdAt. */
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useAiChat = (): UseAiChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  /** Per-placeholder timers so we can cancel one job without touching others. */
  const pollTimersRef = useRef<Map<string, Set<ReturnType<typeof setTimeout>>>>(new Map());
  /** Placeholders that have been cancelled locally — used to ignore late tick results. */
  const cancelledRef = useRef<Set<string>>(new Set());

  const clearTimersFor = useCallback((placeholderId: string) => {
    const timers = pollTimersRef.current.get(placeholderId);
    if (timers) {
      timers.forEach((t) => clearTimeout(t));
      pollTimersRef.current.delete(placeholderId);
    }
  }, []);

  const recomputeStreaming = useCallback(() => {
    setMessages((prev) => {
      const anyPending = prev.some((m) => m.pending === true);
      setIsStreaming(anyPending);
      return prev;
    });
  }, []);

  // ---- Polling loop for a single job ----
  const pollJob = useCallback(
    (jobId: string, placeholderId: string, createdAtIso: string) => {
      // Anchor timeout to the actual backend creation time, NOT to poll start time.
      // Otherwise every page reload would give a stuck job another 5 minutes.
      const createdAtMs = Date.parse(createdAtIso);
      const startedAt = Number.isFinite(createdAtMs) ? createdAtMs : Date.now();

      const tick = async () => {
        if (cancelledRef.current.has(placeholderId)) return;

        try {
          const job: ChatJobResponse = await aiService.getChatJobStatus(jobId);
          if (cancelledRef.current.has(placeholderId)) return;

          if (job.status === 'COMPLETED' && job.content) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === placeholderId
                  ? {
                      ...msg,
                      content: job.content ?? '',
                      pending: false,
                      jobId: undefined,
                      sourceUserMessage: undefined,
                    }
                  : msg,
              ),
            );
            clearTimersFor(placeholderId);
            recomputeStreaming();
            return;
          }

          if (job.status === 'FAILED') {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === placeholderId
                  ? {
                      ...msg,
                      content: `Sorry, I encountered an error: ${job.error ?? 'Unknown error'}. Please try again.`,
                      pending: false,
                      jobId: undefined,
                    }
                  : msg,
              ),
            );
            clearTimersFor(placeholderId);
            recomputeStreaming();
            toast.error('AI Coach could not generate a response.');
            return;
          }

          // Still PENDING or GENERATING → poll again unless timed out.
          // Elapsed is measured from backend creation, so resuming a stale job
          // surfaces the timeout immediately rather than waiting another 5 min.
          if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === placeholderId
                  ? {
                      ...msg,
                      content: 'Response took too long. Please try again.',
                      pending: false,
                      jobId: undefined,
                    }
                  : msg,
              ),
            );
            clearTimersFor(placeholderId);
            recomputeStreaming();
            return;
          }

          const timer = setTimeout(tick, POLL_INTERVAL_MS);
          const bucket = pollTimersRef.current.get(placeholderId) ?? new Set();
          bucket.add(timer);
          pollTimersRef.current.set(placeholderId, bucket);
        } catch {
          // Network error — retry in 5s (double the interval)
          if (cancelledRef.current.has(placeholderId)) return;
          const timer = setTimeout(tick, POLL_INTERVAL_MS * 2);
          const bucket = pollTimersRef.current.get(placeholderId) ?? new Set();
          bucket.add(timer);
          pollTimersRef.current.set(placeholderId, bucket);
        }
      };

      void tick();
    },
    [clearTimersFor, recomputeStreaming],
  );

  // ---- Cleanup timers on unmount ----
  useEffect(() => {
    const timers = pollTimersRef.current;
    return () => {
      timers.forEach((bucket) => bucket.forEach((t) => clearTimeout(t)));
      timers.clear();
    };
  }, []);

  const cancelPending = useCallback(
    (placeholderId: string) => {
      cancelledRef.current.add(placeholderId);
      clearTimersFor(placeholderId);
      setMessages((prev) => prev.filter((msg) => msg.id !== placeholderId));
      recomputeStreaming();
    },
    [clearTimersFor, recomputeStreaming],
  );

  // ---- Load recent history ----
  const loadHistory = useCallback(async () => {
    try {
      const history: AiChatMessageResponse[] = await aiService.getChatHistory();
      const mapped: ChatMessage[] = history.map((msg) => ({
        id: msg.id,
        role: (msg.role?.toLowerCase() ?? 'assistant') as 'user' | 'assistant',
        content: msg.content,
        createdAt: msg.createdAt,
      }));

      // Also check for any pending jobs (user navigated away mid-generation)
      try {
        const pending: ChatJobResponse[] = await aiService.getPendingChatJobs();
        if (pending.length > 0) {
          const placeholders: ChatMessage[] = pending.map((job) => ({
            id: generateId(),
            role: 'assistant' as const,
            content: '',
            createdAt: job.createdAt,
            pending: true,
            jobId: job.jobId,
          }));
          setMessages([...mapped, ...placeholders]);
          setIsStreaming(true);
          placeholders.forEach((p) => {
            if (p.jobId) pollJob(p.jobId, p.id, p.createdAt);
          });
          return;
        }
      } catch {
        // pending check failed — non-blocking
      }

      setMessages(mapped);
    } catch {
      // Non-blocking — history load failure is silent on first open
    }
  }, [pollJob]);

  const clearHistory = useCallback(async () => {
    try {
      await aiService.clearChatHistory();
      setMessages([]);
    } catch {
      toast.error('Failed to clear chat history. Please try again.');
    }
  }, []);

  // ---- Send a message ----
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const trimmed = text.trim();
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      const placeholderId = generateId();
      const placeholderCreatedAt = new Date().toISOString();
      const assistantPlaceholder: ChatMessage = {
        id: placeholderId,
        role: 'assistant',
        content: '',
        createdAt: placeholderCreatedAt,
        pending: true,
        sourceUserMessage: trimmed,
      };

      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
      setIsStreaming(true);

      try {
        const job = await aiService.startChatJob(trimmed);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === placeholderId
              ? { ...msg, jobId: job.jobId, createdAt: job.createdAt }
              : msg,
          ),
        );
        pollJob(job.jobId, placeholderId, job.createdAt);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An unexpected error occurred.';

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === placeholderId
              ? {
                  ...msg,
                  content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
                  pending: false,
                  jobId: undefined,
                }
              : msg,
          ),
        );
        setIsStreaming(false);
        toast.error('AI Coach is unavailable. Please try again later.');
      }
    },
    [isStreaming, pollJob],
  );

  return { messages, isStreaming, sendMessage, loadHistory, clearHistory, cancelPending };
};
