import React from 'react';
import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useGamificationProfile } from '@/hooks/useGamification';

const LEVEL_COLORS: Record<string, string> = {
  ROOKIE: 'bg-slate-500 text-slate-100',
  APPRENTICE: 'bg-blue-600 text-blue-100',
  TRADER: 'bg-green-600 text-green-100',
  SKILLED: 'bg-amber-500 text-amber-100',
  ADVANCED: 'bg-violet-600 text-violet-100',
  EXPERT: 'bg-rose-500 text-rose-100',
  MASTER: 'bg-indigo-600 text-indigo-100',
  ELITE: 'bg-amber-400 text-amber-900',
  LEGEND: 'bg-gradient-to-r from-amber-400 to-violet-500 text-white',
  GOAT: 'bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-400 text-white',
};

const getLevelInitial = (levelName: string) => levelName.charAt(0).toUpperCase();

interface XpProgressBarProps {
  className?: string;
}

const XpProgressBar: React.FC<XpProgressBarProps> = ({ className }) => {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useGamificationProfile();

  if (isLoading || !profile) {
    return (
      <div
        className={cn(
          'glass-card rounded-2xl px-4 py-2.5 flex items-center gap-3 min-w-[220px]',
          className,
        )}
      >
        <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
        <div className="flex-1 space-y-1">
          <div className="h-2 bg-white/10 rounded-full animate-pulse w-3/4" />
          <div className="h-1.5 bg-white/10 rounded-full animate-pulse w-full" />
        </div>
      </div>
    );
  }

  const levelColorClass =
    LEVEL_COLORS[profile.levelName?.toUpperCase()] ?? LEVEL_COLORS.ROOKIE;

  return (
    <div
      className={cn(
        'glass-card rounded-2xl px-4 py-2.5 flex items-center gap-3 min-w-[220px]',
        className,
      )}
    >
      {/* Level badge */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-md',
          levelColorClass,
        )}
      >
        {getLevelInitial(profile.levelName ?? 'R')}
      </div>

      {/* XP info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-xs font-medium text-white/80 truncate">
            {profile.levelName}
          </span>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {profile.xp.toLocaleString()} {t('gamification.xp', 'XP')}
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-700"
            style={{ width: `${Math.min(100, profile.xpProgress)}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[9px] text-muted-foreground">
            {profile.xpToNextLevel.toLocaleString()} {t('gamification.xpToNext', 'to next')}
          </span>
        </div>
      </div>

      {/* Streak */}
      {profile.currentStreak > 0 && (
        <div className="flex-shrink-0 flex items-center gap-1 text-amber-400">
          <Flame className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">{profile.currentStreak}</span>
        </div>
      )}
    </div>
  );
};

export default XpProgressBar;
