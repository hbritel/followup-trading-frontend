import React from 'react';
import { Loader2, RefreshCw, TrendingUp, Star, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebrief, useGenerateDebrief } from '@/hooks/useDebrief';
import { cn } from '@/lib/utils';

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
  const color =
    score >= 8 ? 'text-green-500' :
    score >= 5 ? 'text-yellow-500' :
    'text-red-500';

  return (
    <div
      className={cn(
        'h-12 w-12 rounded-full border-2 flex items-center justify-center font-bold text-lg tabular-nums flex-shrink-0',
        score >= 8 ? 'border-green-500/40 bg-green-500/10' :
        score >= 5 ? 'border-yellow-500/40 bg-yellow-500/10' :
        'border-red-500/40 bg-red-500/10',
        color
      )}
    >
      {score}
    </div>
  );
};

const formatInline = (text: string): string =>
  text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');

/** Strip the backend-injected English disclaimer so the page-level i18n disclaimer is used */
const DISCLAIMER_PATTERNS = [
  /\*?This analysis is based on your historical.*?responsibility\.\*?/gi,
  /\*?This is based on your historical.*?responsibility\.\*?/gi,
  /\*?Based on your historical data\..*?advice\.\*?/gi,
  /\*?Not investment advice\.\*?/gi,
];

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  let cleaned = text
    .replace(/^SESSION_SCORE:\s*\d+\s*$/gim, '')
    .replace(/^---+\s*$/gm, '')
    .trim();

  for (const pattern of DISCLAIMER_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  cleaned = cleaned.trim();

  return (
    <div className="space-y-1.5 text-sm text-foreground">
      {cleaned.split('\n').map((line, i) => {
        const trimmed = line.trim();

        // Headings → styled as section titles
        if (trimmed.startsWith('## ')) {
          return (
            <h4 key={i} className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-2 first:pt-0">
              {trimmed.replace(/^#+\s*/, '')}
            </h4>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h3 key={i} className="text-sm font-bold text-foreground pt-2 first:pt-0">
              {trimmed.replace(/^#+\s*/, '')}
            </h3>
          );
        }

        // Bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.slice(2);
          return (
            <div key={i} className="flex gap-2">
              <span className="text-muted-foreground mt-0.5 flex-shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
            </div>
          );
        }

        // Empty lines
        if (!trimmed) return <div key={i} className="h-1" />;

        // Regular paragraphs
        return (
          <p key={i} dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
        );
      })}
    </div>
  );
};

interface SessionDebriefCardProps {
  accountId?: string;
}

const SessionDebriefCard: React.FC<SessionDebriefCardProps> = ({ accountId }) => {
  const { t } = useTranslation();
  const { data: debrief, isLoading } = useDebrief(accountId);
  const { mutate: generate, isPending: isGenerating } = useGenerateDebrief(accountId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header — date + generate button */}
      <div className="flex items-center justify-between">
        {debrief ? (
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {new Date(debrief.sessionDate).toLocaleDateString()}
          </span>
        ) : (
          <span />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => generate()}
          disabled={isGenerating}
          className="h-7 text-xs gap-1.5"
        >
          {isGenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {debrief ? t('ai.regenerate') : t('ai.generateBtn')}
        </Button>
      </div>

      {debrief ? (
        <div className="space-y-3">
          {/* Score + stats row */}
          <div className="flex items-center gap-4">
            {debrief.sessionScore !== undefined && (
              <ScoreCircle score={debrief.sessionScore} />
            )}
            <div className="flex gap-4 flex-wrap text-sm text-muted-foreground">
              {debrief.tradesCount !== undefined && (
                <span><strong className="text-foreground tabular-nums">{debrief.tradesCount}</strong> trades</span>
              )}
              {debrief.sessionPnl !== undefined && (
                <span>
                  P&L:{' '}
                  <strong className={cn(
                    'tabular-nums',
                    debrief.sessionPnl >= 0 ? 'text-green-500' : 'text-red-500'
                  )}>
                    {debrief.sessionPnl >= 0 ? '+' : ''}{debrief.sessionPnl.toFixed(2)}
                  </strong>
                </span>
              )}
              {debrief.winRate !== undefined && (
                <span>Win rate: <strong className="text-foreground tabular-nums">{debrief.winRate.toFixed(0)}%</strong></span>
              )}
            </div>
          </div>

          {/* Summary */}
          <SimpleMarkdown text={debrief.summary} />

          {/* Strengths */}
          {debrief.strengths && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-green-500" />
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">{t('ai.debriefStrengths')}</p>
              </div>
              <SimpleMarkdown text={debrief.strengths} />
            </div>
          )}

          {/* Improvements */}
          {debrief.improvements && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{t('ai.debriefImprovements')}</p>
              </div>
              <SimpleMarkdown text={debrief.improvements} />
            </div>
          )}

          {/* Tomorrow recommendation */}
          {debrief.tomorrowRecommendation && (
            <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
              <p className="text-xs font-semibold text-primary mb-1">{t('ai.debriefTomorrow')}</p>
              <p className="text-sm text-foreground">{debrief.tomorrowRecommendation}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            {t('ai.debriefEmpty')}
          </p>
        </div>
      )}
    </div>
  );
};

export default SessionDebriefCard;
