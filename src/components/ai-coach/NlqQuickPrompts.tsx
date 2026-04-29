import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Identifier of each suggested prompt. Stable so analytics or hooks can refer
 * to a chip by id without coupling to its translated copy.
 */
const PROMPT_IDS = [
  'prompt1',
  'prompt2',
  'prompt3',
  'prompt4',
  'prompt5',
] as const;

/** French defaults — used as fallback when an i18n key is missing. */
const PROMPT_DEFAULTS_FR: Record<(typeof PROMPT_IDS)[number], string> = {
  prompt1: 'Mon meilleur mois',
  prompt2: 'Mes pertes vendredi',
  prompt3: 'Mon top 3 symboles',
  prompt4: 'Mon win rate par heure',
  prompt5: 'Mes trades sur Vantage cette semaine',
};

interface NlqQuickPromptsProps {
  /** Called with the resolved prompt text when a chip is clicked. */
  onSelect: (prompt: string) => void;
  /** Disable all chips while a request is in-flight. */
  disabled?: boolean;
  className?: string;
}

/**
 * Horizontal row of suggested NLQ prompts displayed above the AI Coach chat
 * when the conversation is empty. Each chip resolves through i18n
 * ({@code aiCoach.nlq.promptN}) and falls back to the French copy when a key
 * is missing.
 */
const NlqQuickPrompts: React.FC<NlqQuickPromptsProps> = ({
  onSelect,
  disabled = false,
  className,
}) => {
  const { t } = useTranslation();

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {PROMPT_IDS.map((id) => {
        const text = t(`aiCoach.nlq.${id}`, PROMPT_DEFAULTS_FR[id]);
        return (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(text)}
            className={cn(
              'group inline-flex items-center gap-1.5 rounded-full border border-border/60',
              'bg-background/60 px-3 py-1.5 text-sm font-medium text-muted-foreground',
              'transition-[transform,background-color,border-color,color] duration-150',
              'hover:scale-[1.02] hover:border-primary/40 hover:bg-primary/5 hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
            )}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400/70 transition-colors group-hover:text-amber-400" />
            <span>{text}</span>
          </button>
        );
      })}
    </div>
  );
};

export default NlqQuickPrompts;
