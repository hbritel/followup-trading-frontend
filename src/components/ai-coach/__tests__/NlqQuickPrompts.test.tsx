import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ---- Mocks --------------------------------------------------------------

// i18n that returns the fallback (FR copy) so the assertions read like the UI.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

import NlqQuickPrompts from '../NlqQuickPrompts';

const FR_PROMPTS = [
  'Mon meilleur mois',
  'Mes pertes vendredi',
  'Mon top 3 symboles',
  'Mon win rate par heure',
  'Mes trades sur Vantage cette semaine',
];

describe('NlqQuickPrompts', () => {
  let onSelect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSelect = vi.fn();
  });

  it('renders all 5 prompt chips', () => {
    render(<NlqQuickPrompts onSelect={onSelect} />);
    for (const prompt of FR_PROMPTS) {
      expect(screen.getByRole('button', { name: new RegExp(prompt, 'i') })).toBeInTheDocument();
    }
  });

  it('calls onSelect with the chip text when clicked', () => {
    render(<NlqQuickPrompts onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /mes pertes vendredi/i }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('Mes pertes vendredi');
  });

  it('forwards the exact translated text for each chip', () => {
    render(<NlqQuickPrompts onSelect={onSelect} />);
    for (const prompt of FR_PROMPTS) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(prompt, 'i') }));
    }
    expect(onSelect).toHaveBeenCalledTimes(FR_PROMPTS.length);
    for (let i = 0; i < FR_PROMPTS.length; i++) {
      expect(onSelect).toHaveBeenNthCalledWith(i + 1, FR_PROMPTS[i]);
    }
  });

  it('uses the FR fallback when an i18n key is missing', () => {
    // The mocked t() returns the fallback when the key is missing — this is
    // exactly the behaviour we expect in production for absent translations.
    render(<NlqQuickPrompts onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: /mon meilleur mois/i })).toBeInTheDocument();
  });

  it('disables every chip when disabled is true', () => {
    render(<NlqQuickPrompts onSelect={onSelect} disabled />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
    for (const btn of buttons) {
      expect(btn).toBeDisabled();
    }
    fireEvent.click(buttons[0]);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
