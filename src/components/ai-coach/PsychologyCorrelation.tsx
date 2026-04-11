import React from 'react';
import { TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePsychologyCorrelation } from '@/hooks/usePsychologyCorrelation';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const EMOTION_EMOJI_MAP: Record<string, string> = {
  CALM: '😌',
  CONFIDENT: '💪',
  STRESSED: '😰',
  FOMO: '🤯',
  REVENGE: '😤',
  DISCIPLINED: '🎯',
  FEARFUL: '😨',
  EUPHORIC: '🤑',
};

const EMOTION_LABEL_MAP: Record<string, string> = {
  CALM: 'Calm',
  CONFIDENT: 'Confident',
  STRESSED: 'Stressed',
  FOMO: 'FOMO',
  REVENGE: 'Revenge',
  DISCIPLINED: 'Disciplined',
  FEARFUL: 'Fearful',
  EUPHORIC: 'Euphoric',
};

const PsychologyCorrelation: React.FC = () => {
  const { t } = useTranslation();
  const { data, isLoading } = usePsychologyCorrelation();

  const entries = data?.entries ?? [];
  const hasEnoughData = entries.length >= 3;

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {t('ai.psychologyTitle', 'Emotion vs Performance')}
        </h3>
        <TrendingUp className="h-4 w-4 text-emerald-400" />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && !hasEnoughData && (
        <p className="text-xs text-muted-foreground text-center py-3">
          {t('ai.psychologyEmpty', 'Log emotions on your trades to see patterns')}
        </p>
      )}

      {!isLoading && hasEnoughData && (
        <div className="space-y-2">
          {entries.map((entry) => {
            const emoji = EMOTION_EMOJI_MAP[entry.emotion] ?? '❓';
            const label = EMOTION_LABEL_MAP[entry.emotion] ?? entry.emotion;
            const winRatePct = Math.round(entry.winRate * 100);
            const isPositive = entry.winRate >= 0.5;
            const pnlFormatted =
              entry.avgPnl >= 0
                ? `+$${entry.avgPnl.toFixed(0)}`
                : `-$${Math.abs(entry.avgPnl).toFixed(0)}`;

            return (
              <div key={entry.emotion} className="flex items-center gap-2">
                <span className="text-base w-6 flex-shrink-0 text-center">{emoji}</span>
                <span className="text-xs text-muted-foreground w-20 flex-shrink-0 truncate">
                  {label}
                </span>
                <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      isPositive ? 'bg-emerald-500' : 'bg-red-500',
                    )}
                    style={{ width: `${winRatePct}%` }}
                  />
                </div>
                <span
                  className={cn(
                    'text-xs font-medium w-10 text-right flex-shrink-0',
                    isPositive ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {winRatePct}%
                </span>
                <span
                  className={cn(
                    'text-xs w-14 text-right flex-shrink-0',
                    entry.avgPnl >= 0 ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {pnlFormatted}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PsychologyCorrelation;
