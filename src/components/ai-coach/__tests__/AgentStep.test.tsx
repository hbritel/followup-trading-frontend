import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k: string, fallback?: string) => fallback ?? _k }),
}));
vi.mock('@/lib/chatMarkdown', () => ({
  renderChatMarkdown: (md: string) => md,
}));

import AgentStep from '../AgentStep';
import type { AgentState } from '@/types/agent';

const baseState: AgentState = {
  type: 'risk',
  status: 'pending',
  partialContent: '',
  finalCitations: [],
};

describe('AgentStep', () => {
  it('exposes data-agent attribute matching the type', () => {
    const { container } = render(<AgentStep agent="risk" state={baseState} />);
    expect((container.firstChild as HTMLElement).getAttribute('data-agent')).toBe('risk');
  });

  it('renders partial content while running', () => {
    render(
      <AgentStep
        agent="risk"
        state={{ ...baseState, status: 'running', partialContent: 'Your max drawdown was 12%' }}
      />,
    );
    expect(screen.getByText(/Your max drawdown was 12%/)).toBeTruthy();
  });

  it('applies the destructive styling on error', () => {
    const { container } = render(
      <AgentStep agent="data" state={{ ...baseState, type: 'data', status: 'error' }} />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('border-destructive/40');
  });

  it('renders citations strip when citations are present', () => {
    render(
      <AgentStep
        agent="data"
        state={{
          type: 'data',
          status: 'done',
          partialContent: 'final answer',
          finalCitations: ['trade:abc', 'trade:def'],
        }}
      />,
    );
    expect(screen.getByText(/trade:abc/)).toBeTruthy();
    expect(screen.getByText(/trade:def/)).toBeTruthy();
  });
});
