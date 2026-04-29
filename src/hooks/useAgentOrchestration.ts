import { useCallback, useEffect, useRef, useState } from 'react';
import { streamAgentAsk } from '@/services/agentOrchestration.service';
import type { AgentState, AgentType } from '@/types/agent';

interface AgentOrchestrationState {
  selectedAgents: AgentType[];
  agentStates: Map<AgentType, AgentState>;
  synthesisContent: string;
  isStreaming: boolean;
  error: string | null;
}

interface AskOptions {
  forceAgents?: AgentType[];
  useCache?: boolean;
  locale?: string;
}

const INITIAL_STATE: AgentOrchestrationState = {
  selectedAgents: [],
  agentStates: new Map(),
  synthesisContent: '',
  isStreaming: false,
  error: null,
};

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

  const abortInFlight = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  // Cancel any in-flight stream when the component unmounts.
  useEffect(() => () => abortInFlight(), [abortInFlight]);

  /** Wipes view-state and aborts any pending stream. */
  const reset = useCallback(() => {
    abortInFlight();
    setState({
      ...INITIAL_STATE,
      agentStates: new Map(),
    });
  }, [abortInFlight]);

  /** Cancels the active stream but keeps already-rendered state visible. */
  const cancel = useCallback(() => {
    abortInFlight();
    setState((prev) => (prev.isStreaming ? { ...prev, isStreaming: false } : prev));
  }, [abortInFlight]);

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
      setState({
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
          onAgentDone: (agent, citations) => {
            setState((prev) =>
              patchAgent(prev, agent, (s) => ({
                ...s,
                status: 'done',
                finalCitations: citations,
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
    [abortInFlight],
  );

  return {
    ask,
    cancel,
    reset,
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
