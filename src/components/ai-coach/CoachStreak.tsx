import React from 'react';
import { Flame, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useCoachStreak } from '@/hooks/useCoachStreak';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const CoachStreak: React.FC = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useCoachStreak();

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-6 w-24 mb-2" />
        <Skeleton className="h-2 w-full" />
      </div>
    );
  }

  const streak = data?.streak ?? 0;
  const last7Days = data?.last7Days ?? Array(7).fill(false);

  const flameColor =
    streak >= 7
      ? 'text-orange-400'
      : streak >= 3
        ? 'text-amber-400'
        : streak > 0
          ? 'text-yellow-500'
          : 'text-muted-foreground/40';

  const motivationText =
    streak > 0
      ? t('ai.streakKeepUp', 'Keep it up!')
      : t('ai.streakStart', 'Start your streak today!');

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('ai.streakTitle', 'Coaching Streak')}
        </h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors" />
          </TooltipTrigger>
          <TooltipContent side="bottom" align="center" sideOffset={4} avoidCollisions className="max-w-[280px] text-xs leading-relaxed z-50">
            {t('ai.streakInfo', 'Tracks consecutive days you engaged with the AI coach (briefing, debrief, or chat). Consistency builds discipline.')}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2.5 mb-2">
        <Flame className={cn('h-5 w-5 flex-shrink-0', flameColor)} />
        <div>
          <p className="text-base font-bold leading-none">
            {streak > 0
              ? t('ai.streakDays', '{{count}} day streak', { count: streak })
              : '0'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{motivationText}</p>
        </div>
      </div>

      {/* Last 7 days dots */}
      <div className="flex items-center gap-1.5">
        {last7Days.map((engaged, i) => {
          const isToday = i === 6;
          return (
            <div
              key={i}
              className={cn(
                'flex-1 h-2 rounded-full transition-colors',
                engaged
                  ? 'bg-green-500'
                  : isToday
                    ? 'bg-muted-foreground/20 ring-1 ring-muted-foreground/40 ring-offset-0'
                    : 'bg-muted-foreground/20',
              )}
              title={
                isToday
                  ? t('common.today', 'Today')
                  : `${6 - i} ${t('common.daysAgo', 'days ago')}`
              }
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground/50">
          {t('timeAgo.daysAgo', { count: 6, defaultValue: '6d ago' })}
        </span>
        <span className="text-[10px] text-muted-foreground/50">
          {t('common.today', 'Today')}
        </span>
      </div>
    </div>
  );
};

export default CoachStreak;
