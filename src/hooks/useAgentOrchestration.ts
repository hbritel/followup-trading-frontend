import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cancelOrchestration,
  getActiveOrchestration,
  getOrchestrationById,
  streamAgentAsk,
} from '@/services/agentOrchestration.service';
import type {
  AgentInvocationView,
  AgentOrchestrationRunView,
  AgentState,
  AgentType,
} from '@/types/agent';

interface AgentOrchestrationState {
  orchestrationId: string | null;
  question: string | null;
  selectedAgents: AgentType[];
  agentStates: Map<AgentType, AgentState>;
  synthesisContent: string;
  isStreaming: boolean;
  error: string | null;
}

/** Statuses that signal the run is still in flight server-side. */
const ACTIVE_STATUSES = new Set(['PENDING', 'ROUTING', 'FAN_OUT', 'SYNTHESIS']);

/** How often we poll an in-flight run while the user is on the page. */
const POLL_INTERVAL_MS = 1500;

interface AskOptions {
  forceAgents?: AgentType[];
  useCache?: boolean;
  locale?: string;
}

const INITIAL_STATE: AgentOrchestrationState = {
  orchestrationId: null,
  question: null,
  selectedAgents: [],
  agentStates: new Map(),
  synthesisContent: '',
  isStreaming: false,
  error: null,
};

/**
 * Hydrates a {@link AgentOrchestrationState} from a persisted run snapshot.
 * Used both on mount (resume after refresh) and during the polling loop while
 * the run is in flight.
 */
function fromRunView(run: AgentOrchestrationRunView): AgentOrchestrationState {
  const stillActive = ACTIVE_STATUSES.has(run.status);
  // When the run has reached a terminal status, every selected agent must have
  // finished server-side — even if the matching agent_invocations row is
  // missing from the snapshot (race between persistence and the poll, or a
  // silent save failure). Surface them as "done" instead of "pending" so the
  // UI doesn't spin forever after a refresh.
  const fallbackStatus: AgentState['status'] = stillActive ? 'pending' : 'done';
  const map = new Map<AgentType, AgentState>();
  for (const agent of run.selectedAgents) {
    map.set(agent, {
      type: agent,
      status: fallbackStatus,
      partialContent: '',
      finalCitations: [],
    });
  }
  for (const inv of run.invocations) {
    map.set(inv.agent, {
      type: inv.agent,
      status: invocationStatus(inv),
      partialContent: inv.content ?? '',
      finalCitations: inv.citations ?? [],
      error: inv.error ?? undefined,
    });
  }
  return {
    orchestrationId: run.orchestrationId,
    question: run.question,
    selectedAgents: [...run.selectedAgents],
    agentStates: map,
    synthesisContent: run.synthesisContent ?? '',
    isStreaming: stillActive,
    error: run.status === 'FAILED' ? run.error : null,
  };
}

function invocationStatus(inv: AgentInvocationView): AgentState['status'] {
  if (inv.error) return 'error';
  return inv.status;
}

/**
 * React hook driving the multi-agent orchestration UI.
 *
 * <p>Owns:</p>
 * <ul>
 *   <li>The list of agents the router picked for this run</li>
 *   <li>Per-agent streaming state (status + partial content + citations)</li>
 *   <li>The aggregated synthesis stream</li>
 *   <li>A single in-flight {@link AbortController} so we can cancel</li>
 * </ul>
 *
 * <p>Subsequent calls to {@code ask} reset prior state automatically — the UI
 * shows one orchestration run at a time, mirroring how the user perceives a
 * single question/answer turn.</p>
 */
export function useAgentOrchestration() {
  const [state, setState] = useState<AgentOrchestrationState>(() => ({
    ...INITIAL_STATE,
    agentStates: new Map(),
  }));

  const controllerRef = useRef<AbortController | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollOrchestrationIdRef = useRef<string | null>(null);

  const abortInFlight = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  const stopPoll = useCallback(() => {
    if (pollTimerRef.current !== null) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    pollOrchestrationIdRef.current = null;
  }, []);

  // Cancel any in-flight stream + polling when the component unmounts.
  useEffect(() => {
    return () => {
      abortInFlight();
      stopPoll();
    };
  }, [abortInFlight, stopPoll]);

  /**
   * Starts a polling loop that re-fetches the persisted run every
   * {@link POLL_INTERVAL_MS} until the server marks it terminal. Used after
   * a refresh: the SSE stream from the original POST is gone, but the run
   * keeps progressing server-side and we mirror its state into the UI.
   */
  const startPoll = useCallback((id: string) => {
    pollOrchestrationIdRef.current = id;
    const tick = async () => {
      if (pollOrchestrationIdRef.current !== id) {
        return;
      }
      try {
        const run = await getOrchestrationById(id);
        if (pollOrchestrationIdRef.current !== id) {
          return;
        }
        if (!run) {
          stopPoll();
          return;
        }
        setState(fromRunView(run));
        if (ACTIVE_STATUSES.has(run.status)) {
          pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
        } else {
          stopPoll();
        }
      } catch {
        // Network blip — keep polling at the same cadence.
        if (pollOrchestrationIdRef.current === id) {
          pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
        }
      }
    };
    pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
  }, [stopPoll]);

  // Restore an in-flight or recently-completed run on mount so a refresh
  // doesn't lose the user's question and the agent reasoning that's about
  // to land.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const run = await getActiveOrchestration();
        if (cancelled || !run) return;
        setState(fromRunView(run));
        if (ACTIVE_STATUSES.has(run.status)) {
          startPoll(run.orchestrationId);
        }
      } catch {
        // Silent: the panel just stays empty until the user runs a new one.
      }
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Wipes view-state and aborts any pending stream / polling. */
  const reset = useCallback(() => {
    abortInFlight();
    stopPoll();
    setState({
      ...INITIAL_STATE,
      agentStates: new Map(),
    });
  }, [abortInFlight, stopPoll]);

  /**
   * Cancels the active stream + polling locally and tells the backend to mark
   * the run CANCELLED so it stops being returned by /ask/active. The visible
   * state stays — user keeps the agents' partial reasoning visible after
   * cancelling, which mirrors how the chat panel feels.
   */
  const cancel = useCallback(() => {
    abortInFlight();
    stopPoll();
    const idToCancel = state.orchestrationId;
    setState((prev) => (prev.isStreaming ? { ...prev, isStreaming: false } : prev));
    if (idToCancel) {
      void cancelOrchestration(idToCancel);
    }
  }, [abortInFlight, state.orchestrationId, stopPoll]);

  /**
   * Submits a new question. Cancels any in-flight run, clears state, and
   * subscribes to the SSE stream.
   */
  const ask = useCallback(
    (question: string, options: AskOptions = {}) => {
      const trimmed = question.trim();
      if (!trimmed) return;

      // Reset before kicking off — one active run at a time.
      abortInFlight();
      stopPoll();
      setState({
        orchestrationId: null,
        question: trimmed,
        selectedAgents: [],
        agentStates: new Map(),
        synthesisContent: '',
        isStreaming: true,
        error: null,
      });

      const controller = streamAgentAsk(
        {
          question: trimmed,
          forceAgents: options.forceAgents,
          useCache: options.useCache,
          locale: options.locale,
        },
        {
          onOrchestrationStarted: (orchestrationId) => {
            setState((prev) => ({ ...prev, orchestrationId }));
          },
          onRouting: (agents) => {
            setState((prev) => {
              const nextStates = new Map(prev.agentStates);
              for (const a of agents) {
                if (!nextStates.has(a)) {
                  nextStates.set(a, {
                    type: a,
                    status: 'pending',
                    partialContent: '',
                    finalCitations: [],
                  });
                }
              }
              return { ...prev, selectedAgents: agents, agentStates: nextStates };
            });
          },
          onAgentStart: (agent) => {
            setState((prev) => patchAgent(prev, agent, (s) => ({ ...s, status: 'running' })));
          },
          onAgentToken: (agent, token) => {
            setState((prev) =>
              patchAgent(prev, agent, (s) => ({
                ...s,
                status: 'running',
                partialContent: s.partialContent + token,
              })),
            );
          },
          onAgentDone: (agent, citations, content) => {
            setState((prev) =>
              patchAgent(prev, agent, (s) => ({
                ...s,
                status: 'done',
                finalCitations: citations,
                // Backend BaseAgent emits the full reasoning in one shot via
                // AgentDone (no per-token streaming yet), so the partial
                // content is empty until the agent finishes. Substitute the
                // final content here when available so the AgentStep panel
                // shows the agent's reasoning instead of staying blank.
                partialContent: content && content.trim().length > 0
                  ? content
                  : s.partialContent,
              })),
            );
          },
          onSynthesisToken: (token) => {
            setState((prev) => ({ ...prev, synthesisContent: prev.synthesisContent + token }));
          },
          onDone: () => {
            controllerRef.current = null;
            setState((prev) => ({ ...prev, isStreaming: false }));
          },
          onError: (message, agent) => {
            controllerRef.current = null;
            setState((prev) => {
              if (agent) {
                return patchAgent(prev, agent, (s) => ({
                  ...s,
                  status: 'error',
                  error: message,
                }));
              }
              return { ...prev, error: message, isStreaming: false };
            });
          },
        },
      );

      controllerRef.current = controller;
    },
    [abortInFlight, stopPoll],
  );

  return {
    ask,
    cancel,
    reset,
    orchestrationId: state.orchestrationId,
    question: state.question,
    selectedAgents: state.selectedAgents,
    agentStates: state.agentStates,
    synthesisContent: state.synthesisContent,
    isStreaming: state.isStreaming,
    error: state.error,
  };
}

/**
 * Immutably updates a single agent's state, ensuring the surrounding Map is
 * a fresh reference so React picks up the change.
 */
function patchAgent(
  prev: AgentOrchestrationState,
  agent: AgentType,
  updater: (s: AgentState) => AgentState,
): AgentOrchestrationState {
  const current = prev.agentStates.get(agent) ?? {
    type: agent,
    status: 'pending' as const,
    partialContent: '',
    finalCitations: [],
  };
  const next = updater(current);
  const map = new Map(prev.agentStates);
  map.set(agent, next);
  return { ...prev, agentStates: map };
}
