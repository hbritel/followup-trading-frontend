import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { AgentStreamHandlers } from '@/services/agentOrchestration.service';

const { streamAgentAskMock, getActiveOrchestrationMock, getOrchestrationByIdMock } = vi.hoisted(() => ({
  streamAgentAskMock: vi.fn(),
  getActiveOrchestrationMock: vi.fn(),
  getOrchestrationByIdMock: vi.fn(),
}));

vi.mock('@/services/agentOrchestration.service', () => ({
  streamAgentAsk: streamAgentAskMock,
  getActiveOrchestration: getActiveOrchestrationMock,
  getOrchestrationById: getOrchestrationByIdMock,
}));

import { useAgentOrchestration } from '../useAgentOrchestration';

interface CapturedSession {
  handlers: AgentStreamHandlers;
  controller: AbortController;
}

const captureSession = (): CapturedSession => {
  const calls = streamAgentAskMock.mock.calls;
  const results = streamAgentAskMock.mock.results;
  const lastIndex = calls.length - 1;
  return {
    handlers: calls[lastIndex][1] as AgentStreamHandlers,
    controller: results[lastIndex].value as AbortController,
  };
};

describe('useAgentOrchestration', () => {
  beforeEach(() => {
    streamAgentAskMock.mockReset();
    getActiveOrchestrationMock.mockReset();
    getOrchestrationByIdMock.mockReset();
    streamAgentAskMock.mockImplementation((_req, _h) => new AbortController());
    // Default: no persisted run on mount, so the hook starts idle.
    getActiveOrchestrationMock.mockResolvedValue(null);
  });

  it('starts in an idle state', () => {
    const { result } = renderHook(() => useAgentOrchestration());
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.selectedAgents).toEqual([]);
    expect(Array.from(result.current.agentStates.keys())).toEqual([]);
    expect(result.current.synthesisContent).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('updates state on routing → agent_start → agent_token → agent_done → synthesis → done', () => {
    const { result } = renderHook(() => useAgentOrchestration());

    act(() => {
      result.current.ask('Quel est mon edge ?');
    });
    expect(result.current.isStreaming).toBe(true);

    const { handlers } = captureSession();

    act(() => {
      handlers.onRouting(['risk', 'data']);
    });
    expect(result.current.selectedAgents).toEqual(['risk', 'data']);
    expect(result.current.agentStates.get('risk')?.status).toBe('pending');

    act(() => {
      handlers.onAgentStart('risk');
    });
    expect(result.current.agentStates.get('risk')?.status).toBe('running');

    act(() => {
      handlers.onAgentToken('risk', 'Your ');
      handlers.onAgentToken('risk', 'drawdown');
    });
    expect(result.current.agentStates.get('risk')?.partialContent).toBe('Your drawdown');

    act(() => {
      handlers.onAgentDone('risk', ['trade:abc'], '');
    });
    expect(result.current.agentStates.get('risk')?.status).toBe('done');
    expect(result.current.agentStates.get('risk')?.finalCitations).toEqual(['trade:abc']);

    act(() => {
      handlers.onSynthesisToken('Synth ');
      handlers.onSynthesisToken('text');
      handlers.onDone();
    });
    expect(result.current.synthesisContent).toBe('Synth text');
    expect(result.current.isStreaming).toBe(false);
  });

  it('captures errors via onError and stops streaming', () => {
    const { result } = renderHook(() => useAgentOrchestration());
    act(() => {
      result.current.ask('x');
    });
    const { handlers } = captureSession();

    act(() => {
      handlers.onError('upstream timeout');
    });

    expect(result.current.error).toBe('upstream timeout');
    expect(result.current.isStreaming).toBe(false);
  });

  it('cancels by aborting the in-flight controller', () => {
    const { result } = renderHook(() => useAgentOrchestration());
    act(() => {
      result.current.ask('x');
    });
    const { controller } = captureSession();
    const abortSpy = vi.spyOn(controller, 'abort');

    act(() => {
      result.current.cancel();
    });

    expect(abortSpy).toHaveBeenCalled();
    expect(result.current.isStreaming).toBe(false);
  });

  it('reset clears all orchestration state', () => {
    const { result } = renderHook(() => useAgentOrchestration());
    act(() => {
      result.current.ask('x');
    });
    const { handlers } = captureSession();
    act(() => {
      handlers.onRouting(['risk']);
      handlers.onSynthesisToken('partial');
    });
    expect(result.current.selectedAgents).not.toEqual([]);

    act(() => {
      result.current.reset();
    });

    expect(result.current.selectedAgents).toEqual([]);
    expect(result.current.synthesisContent).toBe('');
    expect(result.current.error).toBeNull();
  });
});
