import apiClient from './apiClient';
import { config } from '@/config';

// ---- Shared message types (match backend CoachMessageDto / enums) --------

export type CoachMessageRole = 'USER' | 'ASSISTANT';

export type CoachMessageStatus =
  | 'PENDING'
  | 'STREAMING'
  | 'DONE'
  | 'FAILED'
  | 'CANCELLED';

export interface CoachMessageDto {
  id: string;
  threadId: string;
  role: CoachMessageRole;
  status: CoachMessageStatus;
  content: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PostCoachMessageResponse {
  userMessage: CoachMessageDto;
  assistant: CoachMessageDto;
}

// ---- REST surface (thin wrappers around apiClient) -----------------------

export const coachChatService = {
  /**
   * Submits a user turn. Returns the persisted USER message and the
   * placeholder ASSISTANT message; the latter's id is the SSE stream handle.
   */
  post: (text: string) =>
    apiClient.post<PostCoachMessageResponse>('/coach/messages', { text }),

  /** Paginated history, newest-first. */
  history: (opts?: { before?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (opts?.before) params.set('before', opts.before);
    if (opts?.limit) params.set('limit', String(opts.limit));
    const qs = params.toString();
    return apiClient.get<CoachMessageDto[]>(
      `/coach/thread/messages${qs ? `?${qs}` : ''}`,
    );
  },

  cancel: (messageId: string) =>
    apiClient.delete<CoachMessageDto>(`/coach/messages/${messageId}`),

  retry: (messageId: string) =>
    apiClient.post<CoachMessageDto>(`/coach/messages/${messageId}/retry`),
};

// ---- SSE streaming (fetch-based to carry the JWT header) -----------------

/**
 * Handlers invoked by {@link streamCoachMessage}. All are optional — supply
 * only what you need.
 */
export interface CoachStreamHandlers {
  /** Full partial content replayed on reconnect, before any live token. */
  onReplay?: (content: string) => void;
  /** A new token delta pushed by the backend worker. */
  onToken?: (delta: string) => void;
  /** Generation finished normally. */
  onDone?: () => void;
  /** Generation failed; {@code reason} is a user-facing message. */
  onError?: (reason: string) => void;
  /** User / another client cancelled the generation. */
  onCancelled?: () => void;
}

/**
 * Opens an SSE stream for a specific assistant message. Returns a cancel
 * function that aborts the underlying fetch. Safe to call on an already-
 * terminal message — the backend sends the final snapshot and closes.
 *
 * {@code EventSource} can't carry an {@code Authorization} header, so we
 * drive the parse ourselves with {@code fetch} + {@code ReadableStream}.
 */
export function streamCoachMessage(
  messageId: string,
  handlers: CoachStreamHandlers,
): () => void {
  const controller = new AbortController();
  const token = localStorage.getItem('accessToken');

  const url = `${config.apiBaseUrl}/coach/messages/${messageId}/stream`;

  (async () => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
        // Avoid buffering by intermediate proxies.
        cache: 'no-store',
      });

      if (!response.ok || !response.body) {
        handlers.onError?.(
          `Stream failed: HTTP ${response.status} ${response.statusText}`,
        );
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by a blank line (\n\n).
        let boundary: number;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          dispatchSseEvent(rawEvent, handlers);
        }
      }
    } catch (err) {
      if ((err as { name?: string }).name !== 'AbortError') {
        const msg = err instanceof Error ? err.message : String(err);
        handlers.onError?.(msg);
      }
    }
  })();

  return () => controller.abort();
}

/** Parses a single SSE frame and dispatches to the right handler. */
function dispatchSseEvent(raw: string, handlers: CoachStreamHandlers): void {
  if (!raw.trim()) return;
  let event = 'message';
  const dataLines: string[] = [];

  for (const line of raw.split('\n')) {
    if (line.startsWith(':')) continue; // comment
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    // Note: W3C SSE says "strip one leading space after the colon" but Spring's
    // SseEmitter emits `data:TEXT` with no cosmetic separator. Stripping a space
    // here would eat the token's own leading space ("  n'ai" → "n'ai") and
    // collapse every word in a streamed chat reply. We take the value as-is
    // since we control both ends.
    const value = colon === -1 ? '' : line.slice(colon + 1);

    if (field === 'event') event = value;
    else if (field === 'data') dataLines.push(value);
  }

  const data = dataLines.join('\n');

  switch (event) {
    case 'replay':   handlers.onReplay?.(data); break;
    case 'token':    handlers.onToken?.(data); break;
    case 'done':     handlers.onDone?.(); break;
    case 'error':    handlers.onError?.(data || 'Generation failed.'); break;
    case 'cancelled':handlers.onCancelled?.(); break;
    // Unknown events are silently ignored — forward-compatible with new server events.
  }
}
