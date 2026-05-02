/**
 * Multi-agent orchestration types — Wave 2D frontend.
 *
 * <p>Mirrors the SSE event contract published by the backend
 * {@code POST /api/v1/ai/coach/ask} endpoint (Wave 2C). Each agent
 * type corresponds to a specialized sub-prompt + tool surface on the
 * server side.</p>
 */

/** The five specialist agents the orchestrator can route a question to. */
export type AgentType = 'risk' | 'psychology' | 'strategy' | 'data' | 'education';

/**
 * Lifecycle of a single agent in the current orchestration run. Mirrors
 * the SSE events one-for-one:
 * <ul>
 *   <li>{@code pending}  — selected by router, not started yet</li>
 *   <li>{@code running}  — receiving {@code agent_token} events</li>
 *   <li>{@code done}     — terminated cleanly with citations</li>
 *   <li>{@code error}    — terminated with an error message</li>
 * </ul>
 */
export type AgentStatus = 'pending' | 'running' | 'done' | 'error';

/** Body of {@code POST /api/v1/ai/coach/ask}. */
export interface AgentAskRequest {
  question: string;
  forceAgents?: AgentType[];
  useCache?: boolean;
  /** BCP-47 tag, e.g. {@code "fr"}. */
  locale?: string;
}

/** Per-agent view-model the UI binds to. */
export interface AgentState {
  type: AgentType;
  status: AgentStatus;
  /** Accumulated streaming content (markdown). */
  partialContent: string;
  /** Final citation refs emitted with {@code agent_done}. */
  finalCitations: string[];
  /** Set when {@code status === 'error'}. */
  error?: string;
}

/** Handlers fired by {@link streamAgentAsk} as SSE events arrive. */
export interface AgentStreamHandlers {
  /**
   * Always the first event. Carries the persistent run id so the client can
   * later restore the panel via GET /coach/ask/{id} after a refresh.
   */
  onOrchestrationStarted?: (orchestrationId: string) => void;
  onRouting: (agents: AgentType[]) => void;
  onAgentStart: (agent: AgentType) => void;
  onAgentToken: (agent: AgentType, token: string) => void;
  onAgentDone: (agent: AgentType, citations: string[], content: string) => void;
  onSynthesisToken: (token: string) => void;
  onDone: () => void;
  onError: (message: string, agent?: AgentType) => void;
}

/** Discriminated union of every payload shape emitted by the backend. */
export type AgentSseEvent =
  | { type: 'orchestration_started'; orchestrationId: string }
  | { type: 'routing'; agents: AgentType[] }
  | { type: 'agent_start'; agent: AgentType }
  | { type: 'agent_token'; agent: AgentType; token: string }
  | { type: 'agent_done'; agent: AgentType; citations: string[]; content?: string | null }
  | { type: 'synthesis_token'; token: string }
  | { type: 'done' }
  | { type: 'error'; message: string; agent?: AgentType };

/** Lifecycle phases of a persisted run, mirrors backend AgentOrchestrationStatus. */
export type AgentOrchestrationStatus =
  | 'PENDING'
  | 'ROUTING'
  | 'FAN_OUT'
  | 'SYNTHESIS'
  | 'DONE'
  | 'FAILED'
  | 'CANCELLED';

/** Per-agent invocation snapshot returned by the run-detail endpoint. */
export interface AgentInvocationView {
  id: string;
  agent: AgentType;
  content: string;
  citations: string[];
  status: 'pending' | 'running' | 'done' | 'error';
  error: string | null;
  createdAt: string;
}

/** Snapshot returned by GET /coach/ask/active and /coach/ask/{id}. */
export interface AgentOrchestrationRunView {
  orchestrationId: string;
  status: AgentOrchestrationStatus;
  question: string;
  locale: string | null;
  selectedAgents: AgentType[];
  synthesisContent: string;
  error: string | null;
  invocations: AgentInvocationView[];
  startedAt: string;
  completedAt: string | null;
}
