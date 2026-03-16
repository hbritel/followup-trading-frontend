import React from 'react';
import { TrendingUp, Calendar, HelpCircle, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface Suggestion {
  icon: React.ElementType;
  textKey: string;
  fallback: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    icon: TrendingUp,
    textKey: 'ai.suggestion1',
    fallback: 'What are my strongest trading patterns?',
  },
  {
    icon: Calendar,
    textKey: 'ai.suggestion2',
    fallback: 'Analyze my performance this week',
  },
  {
    icon: HelpCircle,
    textKey: 'ai.suggestion3',
    fallback: 'Why do I lose on Fridays?',
  },
  {
    icon: Target,
    textKey: 'ai.suggestion4',
    fallback: "What's my optimal position size?",
  },
];

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ onSelect }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <p className="label-caps text-muted-foreground">{t('ai.suggestedQuestions', 'Suggested questions')}</p>
      <div className="grid w-full grid-cols-2 gap-2">
        {SUGGESTIONS.map(({ icon: Icon, textKey, fallback }) => {
          const label = t(textKey, fallback);
          return (
            <button
              key={textKey}
              type="button"
              onClick={() => onSelect(label)}
              className={cn(
                'glass-card flex cursor-pointer flex-col items-start gap-2 rounded-xl p-3',
                'text-left text-sm transition-colors duration-150',
                'hover:border-primary/30 hover:text-foreground',
                'text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-amber-400" />
              <span className="leading-snug">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestedQuestions;
