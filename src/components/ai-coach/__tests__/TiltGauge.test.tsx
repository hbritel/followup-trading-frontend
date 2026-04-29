import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import React from 'react';

// ---- Mocks ----

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, opts?: unknown) => {
      // Support interpolation of {{score}} for the tooltip key
      if (typeof opts === 'object' && opts && 'score' in opts) {
        const score = (opts as { score: number; defaultValue?: string }).score;
        const defVal = (opts as { defaultValue?: string }).defaultValue;
        if (defVal) return defVal.replace('{{score}}', String(score));
        return `${key}:${score}`;
      }
      if (typeof opts === 'string') return opts;
      return key;
    },
  }),
}));

const { tiltState } = vi.hoisted(() => ({
  tiltState: {
    data: null as null | {
      score: number;
      factors: string;
      scoreDate: string;
      thresholdLabel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
    },
    isLoading: false,
  },
}));

vi.mock('@/hooks/useTiltScore', () => ({
  useTiltScore: () => tiltState,
}));

vi.mock('@/hooks/useAccountLabel', () => ({
  useAccountLabel: () => () => null,
}));

import TiltGauge from '../TiltGauge';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  );
};

const setTilt = (score: number, label: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED') => {
  tiltState.data = {
    score,
    factors: 'mocked',
    scoreDate: '2026-04-29',
    thresholdLabel: label,
  };
  tiltState.isLoading = false;
};

describe('TiltGauge', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    tiltState.data = null;
    tiltState.isLoading = false;
  });

  describe('compact variant', () => {
    it('renders a green badge for low scores (GREEN zone)', () => {
      setTilt(15, 'GREEN');
      render(<TiltGauge variant="compact" />, { wrapper });

      const badge = screen.getByTestId('tilt-compact');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-zone', 'GREEN');
      expect(badge.className).toMatch(/green/);
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('renders a yellow badge for monitor zone (YELLOW)', () => {
      setTilt(50, 'YELLOW');
      render(<TiltGauge variant="compact" />, { wrapper });

      const badge = screen.getByTestId('tilt-compact');
      expect(badge).toHaveAttribute('data-zone', 'YELLOW');
      expect(badge.className).toMatch(/yellow/);
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('renders an orange badge for caution zone (ORANGE)', () => {
      setTilt(75, 'ORANGE');
      render(<TiltGauge variant="compact" />, { wrapper });

      const badge = screen.getByTestId('tilt-compact');
      expect(badge).toHaveAttribute('data-zone', 'ORANGE');
      expect(badge.className).toMatch(/orange/);
      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('renders a red badge for stop zone (RED)', () => {
      setTilt(90, 'RED');
      render(<TiltGauge variant="compact" />, { wrapper });

      const badge = screen.getByTestId('tilt-compact');
      expect(badge).toHaveAttribute('data-zone', 'RED');
      expect(badge.className).toMatch(/red/);
      expect(screen.getByText('90')).toBeInTheDocument();
    });

    it('renders a skeleton while loading', () => {
      tiltState.isLoading = true;
      render(<TiltGauge variant="compact" />, { wrapper });
      expect(screen.getByTestId('tilt-compact-skeleton')).toBeInTheDocument();
    });

    it('navigates to /ai-coach on click', () => {
      setTilt(40, 'YELLOW');
      render(<TiltGauge variant="compact" />, { wrapper });

      fireEvent.click(screen.getByTestId('tilt-compact'));
      expect(navigateMock).toHaveBeenCalledWith('/ai-coach');
    });

    it('exposes an aria-label with the tooltip text for accessibility', () => {
      setTilt(40, 'YELLOW');
      render(<TiltGauge variant="compact" />, { wrapper });
      const badge = screen.getByTestId('tilt-compact');
      expect(badge.getAttribute('aria-label')).toMatch(/40/);
      expect(badge.getAttribute('aria-label')).toMatch(/click to see details/i);
    });
  });

  describe('full variant (unchanged behavior)', () => {
    it('renders the full SVG gauge by default', () => {
      setTilt(30, 'GREEN');
      const { container } = render(<TiltGauge />, { wrapper });

      // Full mode renders SVG arc — compact does not
      expect(container.querySelector('svg')).not.toBeNull();
      expect(screen.queryByTestId('tilt-compact')).not.toBeInTheDocument();
    });

    it('still respects the legacy `compact` boolean prop', () => {
      setTilt(30, 'GREEN');
      render(<TiltGauge compact />, { wrapper });
      // Legacy prop should now produce the new compact badge
      expect(screen.getByTestId('tilt-compact')).toBeInTheDocument();
    });
  });
});
