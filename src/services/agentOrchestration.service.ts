import { config } from '@/config';
import apiClient from '@/services/apiClient';
import type {
  AgentAskRequest,
  AgentOrchestrationRunView,
  AgentSseEvent,
  AgentStreamHandlers,
  AgentType,
} from '@/types/agent';

/**
 * SSE client for the multi-agent orchestrator endpoint
 * {@code POST /api/v1/ai/coach/ask} (Wave 2B/2C).
 *
 * <p>{@link EventSource} can't carry an {@code Authorization} header, so we
 * drive the SSE parse ourselves with {@code fetch} + {@code ReadableStream}
 * — same pattern as {@link streamCoachMessage} in {@code coachChat.service.ts}.</p>
 *
 * @returns An {@link AbortController}; call {@code .abort()} to cancel the stream.
 */
export function streamAgentAsk(
  request: AgentAskRequest,
  handlers: AgentStreamHandlers,
): AbortController {
  const controller = new AbortController();
  const token = readAccessToken();

  const url = `${config.apiBaseUrl}/ai/coach/ask`;

  void (async () => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(request),
        signal: controller.signal,
        cache: 'no-store',
      });

      if (!response.ok || !response.body) {
        handlers.onError(
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

        // SSE frames are separated by a blank line (\n\n).
        let boundary: number;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          dispatchSseFrame(rawEvent, handlers);
        }
      }

      // Flush any trailing frame the server forgot to terminate with \n\n.
      if (buffer.trim().length > 0) {
        dispatchSseFrame(buffer, handlers);
      }
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : String(err);
      handlers.onError(msg);
    }
  })();

  return controller;
}

/** localStorage may be unavailable (SSR, sandboxed iframe) — fail soft. */
function readAccessToken(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('accessToken');
  } catch {
    return null;
  }
}

/**
 * Parses one SSE frame and routes its decoded payload to the matching handler.
 *
 * <p>The W3C spec says implementations should strip a single leading space
 * after {@code data:}; Spring's {@code SseEmitter} doesn't add one, so we
 * take the value as-is to avoid eating intentional leading whitespace.</p>
 */
function dispatchSseFrame(raw: string, handlers: AgentStreamHandlers): void {
  if (!raw.trim()) return;

  let eventName = 'message';
  const dataLines: string[] = [];

  for (const line of raw.split('\n')) {
    if (line.startsWith(':')) continue; // SSE comment
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    const value = colon === -1 ? '' : line.slice(colon + 1);

    if (field === 'event') eventName = value.trim();
    else if (field === 'data') dataLines.push(value);
  }

  const data = dataLines.join('\n');
  if (!data) return;

  const parsed = parseEventPayload(data);
  if (!parsed) {
    // Bad JSON — surface as an error rather than crashing the stream.
    handlers.onError(`Invalid SSE payload (event=${eventName})`);
    return;
  }

  // Trust event name when present, but fall back to payload's `type` so we
  // remain robust to upstream framing tweaks.
  const kind = (eventName !== 'message' ? eventName : parsed.type) as AgentSseEvent['type'];

  switch (kind) {
    case 'routing':
      if (parsed.type === 'routing') handlers.onRouting(parsed.agents);
      break;
    case 'agent_start':
      if (parsed.type === 'agent_start') handlers.onAgentStart(parsed.agent);
      break;
    case 'agent_token':
      if (parsed.type === 'agent_token') handlers.onAgentToken(parsed.agent, parsed.token);
      break;
    case 'agent_done':
      if (parsed.type === 'agent_done') {
        handlers.onAgentDone(parsed.agent, parsed.citations ?? [], parsed.content ?? '');
      }
      break;
    case 'orchestration_started':
      if (parsed.type === 'orchestration_started') {
        handlers.onOrchestrationStarted?.(parsed.orchestrationId);
      }
      break;
    case 'synthesis_token':
      if (parsed.type === 'synthesis_token') handlers.onSynthesisToken(parsed.token);
      break;
    case 'done':
      handlers.onDone();
      break;
    case 'error':
      if (parsed.type === 'error') handlers.onError(parsed.message, parsed.agent);
      else handlers.onError('Stream error');
      break;
    default:
      // Forward-compatible: ignore unknown events instead of erroring.
      break;
  }
}

/** Returns the typed payload, or {@code null} on JSON / shape failure. */
function parseEventPayload(data: string): AgentSseEvent | null {
  try {
    const obj = JSON.parse(data) as { type?: string } & Record<string, unknown>;
    if (typeof obj.type !== 'string') return null;
    return obj as unknown as AgentSseEvent;
  } catch {
    return null;
  }
}

/**
 * Fetches the most recent multi-agent orchestration run for the authenticated
 * user. Used by the panel on mount to restore an in-flight or recently-completed
 * run after a navigation or refresh. Returns {@code null} when the user has
 * never run an orchestration (backend responds with 204 No Content).
 */
export async function getActiveOrchestration(): Promise<AgentOrchestrationRunView | null> {
  try {
    const res = await apiClient.get<AgentOrchestrationRunView | ''>('/ai/coach/ask/active');
    if (res.status === 204 || !res.data) {
      return null;
    }
    return res.data as AgentOrchestrationRunView;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } } | null)?.response?.status;
    if (status === 204 || status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Fetches a specific orchestration run by id. Returns {@code null} on 404 / 403
 * (the run does not exist or belongs to another user).
 */
export async function getOrchestrationById(
  id: string,
): Promise<AgentOrchestrationRunView | null> {
  try {
    const res = await apiClient.get<AgentOrchestrationRunView>(`/ai/coach/ask/${id}`);
    return res.data;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } } | null)?.response?.status;
    if (status === 404 || status === 403) {
      return null;
    }
    throw err;
  }
}

/** Re-exported for hook + tests so they don't reach into the type module twice. */
export type { AgentAskRequest, AgentStreamHandlers, AgentType };
