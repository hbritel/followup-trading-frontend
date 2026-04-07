import React from 'react';
import { format } from 'date-fns';
import { RefreshCw, Loader2, Brain, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBriefing, useGenerateBriefing } from '@/hooks/useBriefing';

/** Minimal inline markdown renderer — handles **bold** and bullet lists */
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-1 text-sm text-foreground">
      {lines.map((line, i) => {
        // Bullet point
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          const content = line.trim().slice(2);
          return (
            <div key={i} className="flex gap-2">
              <span className="text-muted-foreground mt-0.5">•</span>
              <span dangerouslySetInnerHTML={{ __html: renderInline(content) }} />
            </div>
          );
        }
        // Empty line
        if (!line.trim()) return <div key={i} className="h-1" />;
        // Normal paragraph
        return (
          <p
            key={i}
            dangerouslySetInnerHTML={{ __html: renderInline(line) }}
          />
        );
      })}
    </div>
  );
};

const renderInline = (text: string): string => {
  // **bold** → <strong>bold</strong>
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};

interface BriefingCardProps {
  accountId?: string;
}

const BriefingCard: React.FC<BriefingCardProps> = ({ accountId }) => {
  const { data: briefing, isLoading } = useBriefing(accountId);
  const { mutate: generate, isPending: isGenerating } = useGenerateBriefing(accountId);

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6 space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">
            {briefing
              ? `Daily Briefing — ${format(new Date(briefing.briefingDate), 'MMM d, yyyy')}`
              : 'Daily Briefing'}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => generate()}
          disabled={isGenerating}
          title="Regenerate briefing"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-1.5 text-xs">{briefing ? 'Regenerate' : 'Generate'}</span>
        </Button>
      </div>

      {/* Content */}
      {briefing ? (
        <div className="space-y-3">
          <SimpleMarkdown text={briefing.content} />
          {briefing.warnings && (
            <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Warnings:</strong> {briefing.warnings}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Brain className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No briefing for today yet. Generate one to get started.
          </p>
        </div>
      )}

      {/* Footer disclaimer */}
      <p className="text-[10px] text-muted-foreground/60 pt-1 border-t border-border/40">
        Based on your historical data. Not investment advice.
      </p>
    </div>
  );
};

export default BriefingCard;
