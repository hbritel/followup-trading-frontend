import React from 'react';
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
  const hasEnoughData = entries.length >= 1;

  return (
    <div className="space-y-3">
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
        <div className="space-y-3">
          {/* Legend */}
          <div className="flex items-center justify-end gap-4 text-[10px] text-muted-foreground mb-1">
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-3 rounded-full bg-emerald-500/60" />
              {t('ai.winRate', 'Win Rate')}
            </span>
            <span>{t('ai.avgPnl', 'Avg P&L')}</span>
          </div>
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
              <div key={entry.emotion} className="flex items-center gap-2" title={`${label}: ${winRatePct}% win rate, ${pnlFormatted} avg P&L, ${entry.tradeCount} trades`}>
                <span className="text-base w-6 flex-shrink-0 text-center">{emoji}</span>
                <div className="w-20 flex-shrink-0">
                  <span className="text-xs text-muted-foreground truncate block">
                    {label}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                    {entry.tradeCount} {entry.tradeCount === 1 ? 'trade' : 'trades'}
                  </span>
                </div>
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
                    'text-xs font-mono font-medium tabular-nums w-10 text-right flex-shrink-0',
                    isPositive ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {winRatePct}%
                </span>
                <span
                  className={cn(
                    'text-xs font-mono tabular-nums w-14 text-right flex-shrink-0',
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
