import { describe, it, expect, vi, beforeEach } from 'vitest';

const tokenMock = vi.hoisted(() => vi.fn(() => 'jwt-test-token'));

vi.mock('@/services/apiClient', () => ({
  default: {
    defaults: { baseURL: '/api/v1' },
    getAccessToken: tokenMock,
  },
  getAccessToken: tokenMock,
}));

import { streamAgentAsk } from '../agentOrchestration.service';
import type { AgentStreamHandlers } from '../agentOrchestration.service';

const encoder = new TextEncoder();

const buildSseStream = (lines: string[]): ReadableStream<Uint8Array> => {
  return new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(line));
      }
      controller.close();
    },
  });
};

const blankHandlers = (): AgentStreamHandlers => ({
  onRouting: vi.fn(),
  onAgentStart: vi.fn(),
  onAgentToken: vi.fn(),
  onAgentDone: vi.fn(),
  onSynthesisToken: vi.fn(),
  onDone: vi.fn(),
  onError: vi.fn(),
});

describe('streamAgentAsk', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenMock.mockReturnValue('jwt-test-token');
  });

  it('dispatches each SSE event to its corresponding handler', async () => {
    const stream = buildSseStream([
      'event: routing\ndata: {"type":"routing","agents":["risk","psychology"]}\n\n',
      'event: agent_start\ndata: {"type":"agent_start","agent":"risk"}\n\n',
      'event: agent_token\ndata: {"type":"agent_token","agent":"risk","token":"hello"}\n\n',
      'event: agent_done\ndata: {"type":"agent_done","agent":"risk","citations":["trade:abc"]}\n\n',
      'event: synthesis_token\ndata: {"type":"synthesis_token","token":"final"}\n\n',
      'event: done\ndata: {"type":"done"}\n\n',
    ]);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, body: stream } as unknown as Response)),
    );

    const handlers = blankHandlers();
    const controller = streamAgentAsk({ question: 'edge?' }, handlers);

    await new Promise((r) => setTimeout(r, 20));
    expect(handlers.onRouting).toHaveBeenCalledWith(['risk', 'psychology']);
    expect(handlers.onAgentStart).toHaveBeenCalledWith('risk');
    expect(handlers.onAgentToken).toHaveBeenCalledWith('risk', 'hello');
    expect(handlers.onAgentDone).toHaveBeenCalledWith('risk', ['trade:abc']);
    expect(handlers.onSynthesisToken).toHaveBeenCalledWith('final');
    expect(handlers.onDone).toHaveBeenCalledTimes(1);
    expect(controller).toBeInstanceOf(AbortController);
  });

  it('signals onError on non-2xx HTTP responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 403, body: null } as unknown as Response)),
    );

    const handlers = blankHandlers();
    streamAgentAsk({ question: 'x' }, handlers);

    await new Promise((r) => setTimeout(r, 20));
    expect(handlers.onError).toHaveBeenCalled();
  });

  it('signals onError when fetch rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );

    const handlers = blankHandlers();
    streamAgentAsk({ question: 'x' }, handlers);

    await new Promise((r) => setTimeout(r, 20));
    expect(handlers.onError).toHaveBeenCalled();
  });
});
