import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
    t: (key: string, fallback?: unknown) => {
      if (typeof fallback === 'string') return fallback;
      const opts = fallback as { defaultValue?: string } | undefined;
      return opts?.defaultValue ?? key;
    },
  }),
}));

const { briefingState } = vi.hoisted(() => ({
  briefingState: {
    data: null as null | {
      id: string;
      briefingDate: string;
      content: string;
      warnings?: string;
      strengths?: string;
      status: string;
      generatedAt: string;
    },
    isLoading: false,
  },
}));

vi.mock('@/hooks/useBriefing', () => ({
  useBriefing: () => briefingState,
  useGenerateBriefing: () => ({ mutate: vi.fn(), isPending: false }),
}));

import BriefingCard from '../BriefingCard';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

const setBriefing = (overrides: Partial<typeof briefingState['data']> = {}) => {
  briefingState.data = {
    id: 'b-1',
    briefingDate: '2026-04-29',
    content: '## Today\n\nFocus on plan adherence.',
    warnings: '- Avoid revenge trading after losses\n- Don\'t exceed 2% per trade\n- Skip news windows',
    strengths: '- Strong R:R discipline\n- Good plan adherence\n- Low intraday DD',
    status: 'GENERATED',
    generatedAt: '2026-04-29T07:00:00Z',
    ...overrides,
  };
  briefingState.isLoading = false;
};

describe('BriefingCard', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    briefingState.data = null;
    briefingState.isLoading = false;
  });

  describe('compact variant', () => {
    it('renders only the first 2 warnings and 2 strengths', () => {
      setBriefing();
      render(<BriefingCard variant="compact" />, { wrapper });

      // Title + CTA visible
      expect(screen.getByTestId('briefing-compact')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view full briefing/i })).toBeInTheDocument();

      // Only first 2 warnings
      expect(screen.getByText('Avoid revenge trading after losses')).toBeInTheDocument();
      expect(screen.getByText("Don't exceed 2% per trade")).toBeInTheDocument();
      expect(screen.queryByText('Skip news windows')).not.toBeInTheDocument();

      // Only first 2 strengths
      expect(screen.getByText('Strong R:R discipline')).toBeInTheDocument();
      expect(screen.getByText('Good plan adherence')).toBeInTheDocument();
      expect(screen.queryByText('Low intraday DD')).not.toBeInTheDocument();
    });

    it('renders skeleton while loading', () => {
      briefingState.isLoading = true;
      render(<BriefingCard variant="compact" />, { wrapper });
      expect(screen.getByTestId('briefing-compact-skeleton')).toBeInTheDocument();
    });

    it('returns null when no briefing is available', () => {
      briefingState.data = null;
      briefingState.isLoading = false;
      const { container } = render(<BriefingCard variant="compact" />, { wrapper });
      expect(container.firstChild).toBeNull();
    });

    it('CTA navigates to /ai-coach', () => {
      setBriefing();
      render(<BriefingCard variant="compact" />, { wrapper });

      fireEvent.click(screen.getByRole('button', { name: /view full briefing/i }));
      expect(navigateMock).toHaveBeenCalledWith('/ai-coach');
    });
  });

  describe('full variant (unchanged behavior)', () => {
    it('renders the full briefing content with all warnings', () => {
      setBriefing();
      render(<BriefingCard variant="full" />, { wrapper });

      // Full content header is visible (markdown heading)
      expect(screen.getByText(/Today/)).toBeInTheDocument();
      // The full warnings string is shown verbatim (rendered inside the warnings panel)
      const warningsPanel = screen.getByText(/Avoid revenge trading after losses/);
      expect(warningsPanel).toBeInTheDocument();
      // No "view full briefing" CTA in full mode
      expect(screen.queryByRole('button', { name: /view full briefing/i })).not.toBeInTheDocument();
    });

    it('defaults to full variant when no variant prop provided', () => {
      setBriefing();
      render(<BriefingCard />, { wrapper });
      expect(screen.queryByTestId('briefing-compact')).not.toBeInTheDocument();
      // Full variant exposes the regenerate/generate button
      expect(screen.getByRole('button', { name: /regenerate|generate/i })).toBeInTheDocument();
    });
  });
});
