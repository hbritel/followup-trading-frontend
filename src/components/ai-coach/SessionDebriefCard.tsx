import React from 'react';
import { format } from 'date-fns';
import { Loader2, RefreshCw, TrendingUp, Star, AlertTriangle } from 'lucide-react';
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
        'h-12 w-12 rounded-full border-2 flex items-center justify-center font-bold text-lg flex-shrink-0',
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

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="space-y-1 text-sm text-foreground">
      {text.split('\n').map((line, i) => {
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          const content = line.trim().slice(2);
          return (
            <div key={i} className="flex gap-2">
              <span className="text-muted-foreground mt-0.5">•</span>
              <span dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </div>
          );
        }
        if (!line.trim()) return <div key={i} className="h-1" />;
        return (
          <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        );
      })}
    </div>
  );
};

interface SessionDebriefCardProps {
  accountId?: string;
}

const SessionDebriefCard: React.FC<SessionDebriefCardProps> = ({ accountId }) => {
  const { data: debrief, isLoading } = useDebrief(accountId);
  const { mutate: generate, isPending: isGenerating } = useGenerateDebrief(accountId);

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6 space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">
            {debrief
              ? `Session Debrief — ${format(new Date(debrief.sessionDate), 'MMM d, yyyy')}`
              : 'Session Debrief'}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => generate()}
          disabled={isGenerating}
          title="Generate session debrief"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-1.5 text-xs">
            {debrief ? 'Regenerate' : 'Generate Debrief'}
          </span>
        </Button>
      </div>

      {debrief ? (
        <div className="space-y-4">
          {/* Score + stats row */}
          <div className="flex items-center gap-4">
            {debrief.sessionScore !== undefined && (
              <ScoreCircle score={debrief.sessionScore} />
            )}
            <div className="flex gap-4 flex-wrap text-sm text-muted-foreground">
              {debrief.tradesCount !== undefined && (
                <span><strong className="text-foreground">{debrief.tradesCount}</strong> trades</span>
              )}
              {debrief.sessionPnl !== undefined && (
                <span>
                  P&L:{' '}
                  <strong className={debrief.sessionPnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {debrief.sessionPnl >= 0 ? '+' : ''}{debrief.sessionPnl.toFixed(2)}
                  </strong>
                </span>
              )}
              {debrief.winRate !== undefined && (
                <span>Win rate: <strong className="text-foreground">{(debrief.winRate * 100).toFixed(0)}%</strong></span>
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
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">Strengths</p>
              </div>
              <SimpleMarkdown text={debrief.strengths} />
            </div>
          )}

          {/* Improvements */}
          {debrief.improvements && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Areas for Improvement</p>
              </div>
              <SimpleMarkdown text={debrief.improvements} />
            </div>
          )}

          {/* Tomorrow recommendation */}
          {debrief.tomorrowRecommendation && (
            <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
              <p className="text-xs font-semibold text-primary mb-1">For Tomorrow</p>
              <p className="text-sm text-foreground">{debrief.tomorrowRecommendation}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <TrendingUp className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No session debrief yet. Generate one to review your trading session.
          </p>
        </div>
      )}

      {/* Footer disclaimer */}
      <p className="text-[10px] text-muted-foreground/60 pt-1 border-t border-border/40">
        AI-generated analysis based on your trading data. Not investment advice.
      </p>
    </div>
  );
};

export default SessionDebriefCard;
