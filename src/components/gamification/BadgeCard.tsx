import React from 'react';
import {
  Award,
  BarChart2,
  BookText,
  Calendar,
  Flame,
  Lock,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BadgeDto } from '@/types/dto';

const ICON_MAP: Record<string, React.ElementType> = {
  FIRST_TRADE: Zap,
  TRADES_10: TrendingUp,
  TRADES_50: TrendingUp,
  TRADES_100: TrendingUp,
  TRADES_500: TrendingUp,
  WIN_STREAK: Flame,
  JOURNAL_STREAK: BookText,
  ALWAYS_STOP_LOSS: Shield,
  RR_RESPECTED: Target,
  WIN_RATE: Award,
  SHARPE: BarChart2,
  LOW_DRAWDOWN: TrendingDown,
  PROFITABLE_MONTH: Calendar,
  PROFITABLE_MONTHS_3: Trophy,
};

const CATEGORY_BORDER: Record<string, string> = {
  TRADING: 'border-amber-500/30',
  DISCIPLINE: 'border-blue-500/30',
  PERFORMANCE: 'border-emerald-500/30',
};

const CATEGORY_ICON_BG: Record<string, string> = {
  TRADING: 'bg-amber-500/15 text-amber-400',
  DISCIPLINE: 'bg-blue-500/15 text-blue-400',
  PERFORMANCE: 'bg-emerald-500/15 text-emerald-400',
};

interface BadgeCardProps {
  badge: BadgeDto;
}

const BadgeCard: React.FC<BadgeCardProps> = ({ badge }) => {
  const isLocked = badge.unlockedAt === null;
  const IconComponent = ICON_MAP[badge.badgeType] ?? Award;
  const borderClass = CATEGORY_BORDER[badge.category] ?? 'border-white/10';
  const iconBgClass = CATEGORY_ICON_BG[badge.category] ?? 'bg-white/10 text-white/60';

  const formattedDate = badge.unlockedAt
    ? new Date(badge.unlockedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      className={cn(
        'glass-card rounded-xl p-4 flex flex-col items-center gap-2 text-center border transition-all duration-200',
        isLocked
          ? 'opacity-40 grayscale border-white/5'
          : cn(borderClass, 'hover:scale-[1.02]'),
      )}
    >
      {/* Icon container */}
      <div className="relative">
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center',
            isLocked ? 'bg-white/10 text-white/30' : iconBgClass,
          )}
        >
          <IconComponent className="w-6 h-6" />
        </div>
        {isLocked && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-700 border border-white/10 flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-white/60" />
          </div>
        )}
      </div>

      {/* Title */}
      <p className="text-xs font-semibold text-white/90 leading-tight">{badge.title}</p>

      {/* Description */}
      <p className="text-[10px] text-muted-foreground leading-snug">{badge.description}</p>

      {/* Unlocked date */}
      {formattedDate && (
        <p className="text-[9px] text-muted-foreground/60 mt-auto">{formattedDate}</p>
      )}
    </div>
  );
};

export default BadgeCard;
