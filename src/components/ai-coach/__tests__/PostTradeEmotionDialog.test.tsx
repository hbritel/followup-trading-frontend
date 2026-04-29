import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ---- Hoisted state ------------------------------------------------------

const { promptState, emotionLogState } = vi.hoisted(() => ({
  promptState: {
    activePrompt: null as null | { tradeId: string },
    dismissCurrent: vi.fn(),
    skipAll: vi.fn(),
  },
  emotionLogState: {
    existing: null as null | Record<string, unknown>,
    isLoading: false,
    mutate: vi.fn(),
    isPending: false,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      // EmotionPicker passes only the key for emotion labels and uses the
      // fallback form for "Save Psychology Entry". Map a few common ones to
      // friendly strings so role-based queries can find them.
      const map: Record<string, string> = {
        'emotions.calm': 'Calm',
        'emotions.confident': 'Confident',
        'emotions.stressed': 'Stressed',
        'emotions.fomo': 'FOMO',
        'emotions.revenge': 'Revenge',
        'emotions.disciplined': 'Disciplined',
        'emotions.fearful': 'Fearful',
        'emotions.euphoric': 'Euphoric',
      };
      return map[key] ?? fallback ?? key;
    },
  }),
}));

vi.mock('../../../hooks/usePostTradeEmotionPrompt', () => ({
  POST_TRADE_PROMPT_OPT_OUT_KEY: 'postTradeEmotionPrompt.optOut',
  usePostTradeEmotionPrompt: () => promptState,
}));

vi.mock('../../../hooks/useEmotionLog', () => ({
  useEmotionLog: () => ({ data: emotionLogState.existing, isLoading: emotionLogState.isLoading }),
  useLogEmotion: () => ({ mutate: emotionLogState.mutate, isPending: emotionLogState.isPending }),
}));

import PostTradeEmotionDialog from '../PostTradeEmotionDialog';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  promptState.activePrompt = null;
  promptState.dismissCurrent.mockReset();
  promptState.skipAll.mockReset();
  emotionLogState.existing = null;
  emotionLogState.isLoading = false;
  emotionLogState.mutate.mockReset();
  emotionLogState.isPending = false;
  try {
    window.localStorage.removeItem('postTradeEmotionPrompt.optOut');
  } catch {
    /* ignore */
  }
});

describe('PostTradeEmotionDialog', () => {
  it('renders nothing when no active prompt', () => {
    const { container } = render(<PostTradeEmotionDialog />, { wrapper });
    expect(container.firstChild).toBeNull();
  });

  it('opens with title when an active prompt exists', () => {
    promptState.activePrompt = { tradeId: 'trade-42' };
    render(<PostTradeEmotionDialog />, { wrapper });
    expect(
      screen.getByText('Comment vous sentiez-vous sur ce trade ?'),
    ).toBeInTheDocument();
  });

  it('logs the emotion when the user submits the picker', () => {
    promptState.activePrompt = { tradeId: 'trade-42' };
    render(<PostTradeEmotionDialog />, { wrapper });

    // EmotionPicker shows the chips immediately. Click "Calm" then save.
    fireEvent.click(screen.getByRole('button', { name: /Calm/i }));
    fireEvent.click(screen.getByRole('button', { name: /Save Psychology Entry/i }));

    expect(emotionLogState.mutate).toHaveBeenCalledTimes(1);
    expect(emotionLogState.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ emotionAfter: 'CALM' }),
    );
  });

  it('"Plus tard" dismisses the current prompt without logging', () => {
    promptState.activePrompt = { tradeId: 'trade-42' };
    render(<PostTradeEmotionDialog />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /Plus tard/i }));
    expect(promptState.dismissCurrent).toHaveBeenCalledTimes(1);
    expect(emotionLogState.mutate).not.toHaveBeenCalled();
  });

  it('"Ne plus me demander" persists opt-out and clears the queue', () => {
    promptState.activePrompt = { tradeId: 'trade-42' };
    render(<PostTradeEmotionDialog />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /Ne plus me demander/i }));
    expect(promptState.skipAll).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('postTradeEmotionPrompt.optOut')).toBe('true');
  });
});
