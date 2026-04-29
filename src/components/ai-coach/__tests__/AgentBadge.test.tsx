import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k: string, fallback?: string) => fallback ?? _k }),
}));

import AgentBadge from '../AgentBadge';

describe('AgentBadge', () => {
  it('renders the agent label as text content', () => {
    render(<AgentBadge type="risk" status="pending" />);
    expect(screen.getByLabelText(/Risk/i)).toBeTruthy();
  });

  it('marks the running status with a pulse animation', () => {
    const { container } = render(<AgentBadge type="psychology" status="running" />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('animate-pulse');
  });

  it('exposes data-agent and data-status attributes for each type/status pair', () => {
    const types = ['risk', 'psychology', 'strategy', 'data', 'education'] as const;
    for (const type of types) {
      const { container, unmount } = render(<AgentBadge type={type} status="done" />);
      const root = container.firstChild as HTMLElement;
      expect(root.getAttribute('data-agent')).toBe(type);
      expect(root.getAttribute('data-status')).toBe('done');
      unmount();
    }
  });

  it('invokes onClick when activated', () => {
    const onClick = vi.fn();
    render(<AgentBadge type="data" status="done" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders without onClick as a non-interactive element', () => {
    render(<AgentBadge type="strategy" status="error" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
