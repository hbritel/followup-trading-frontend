import React from 'react';
import {
  Award,
  BarChart2,
  BookText,
  Calendar,
  CheckCircle2,
  Flame,
  Lock,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { BadgeDto } from '@/types/dto';

export const ICON_MAP: Record<string, React.ElementType> = {
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

const CATEGORY_STYLES: Record<string, { card: string; icon: string; progress: string; check: string }> = {
  TRADING: {
    card: 'border-amber-300 dark:border-amber-500/40 from-amber-50 to-white dark:from-amber-500/15 dark:to-transparent',
    icon: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    progress: 'bg-amber-400',
    check: 'text-amber-500',
  },
  DISCIPLINE: {
    card: 'border-blue-300 dark:border-blue-500/40 from-blue-50 to-white dark:from-blue-500/15 dark:to-transparent',
    icon: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    progress: 'bg-blue-400',
    check: 'text-blue-500',
  },
  PERFORMANCE: {
    card: 'border-emerald-300 dark:border-emerald-500/40 from-emerald-50 to-white dark:from-emerald-500/15 dark:to-transparent',
    icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    progress: 'bg-emerald-400',
    check: 'text-emerald-500',
  },
};

const DEFAULT_STYLE = {
  card: 'border-border from-muted/30 to-transparent',
  icon: 'bg-muted text-muted-foreground',
  progress: 'bg-primary',
  check: 'text-primary',
};

interface BadgeCardProps {
  badge: BadgeDto;
  progressPercent?: number;
  progressHint?: string;
  size?: 'default' | 'featured';
  showNewPill?: boolean;
}

const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  progressPercent,
  progressHint,
  size = 'default',
  showNewPill = false,
}) => {
  const { t } = useTranslation();
  const isLocked = badge.unlockedAt === null;
  const IconComponent = ICON_MAP[badge.badgeType] ?? Award;
  const styles = CATEGORY_STYLES[badge.category] ?? DEFAULT_STYLE;

  const formattedDate = badge.unlockedAt
    ? new Date(badge.unlockedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const isFeatured = size === 'featured';
  const iconBoxSize = isFeatured ? 'w-14 h-14' : 'w-11 h-11';
  const iconInnerSize = isFeatured ? 'w-7 h-7' : 'w-5 h-5';

  return (
    <div
      className={cn(
        // Fixed height so all cards are uniform
        'relative flex flex-col items-center text-center rounded-2xl border bg-gradient-to-b',
        'transition-all duration-200 cursor-default',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        isFeatured ? 'p-5 min-h-[200px]' : 'p-4 min-h-[170px]',
        isLocked
          ? 'border-border from-muted/30 to-transparent opacity-60 hover:opacity-75'
          : cn(styles.card, 'hover:scale-[1.02] hover:shadow-md'),
      )}
      tabIndex={0}
      role="article"
      aria-label={`${badge.title} — ${isLocked ? t('gamification.locked', 'Locked') : t('gamification.unlocked', 'Unlocked')}`}
    >
      {/* Status indicator: top-right corner */}
      {!isLocked && showNewPill && (
        <span className="absolute top-2.5 right-2.5 bg-amber-400 text-amber-900 text-[9px] font-bold tracking-widest uppercase rounded-full px-1.5 py-0.5 leading-none select-none">
          {t('gamification.new', 'NEW')}
        </span>
      )}
      {!isLocked && !showNewPill && (
        <div className={cn('absolute top-2.5 right-2.5', styles.check)}>
          <CheckCircle2 className="w-4 h-4" aria-label={t('gamification.unlocked', 'Unlocked')} />
        </div>
      )}
      {isLocked && (
        <div className="absolute top-2.5 right-2.5 text-muted-foreground/50">
          <Lock className="w-3.5 h-3.5" aria-label={t('gamification.locked', 'Locked')} />
        </div>
      )}

      {/* Icon */}
      <div
        className={cn(
          'rounded-full flex items-center justify-center flex-shrink-0 mt-1',
          iconBoxSize,
          isLocked ? 'bg-muted text-muted-foreground/40' : styles.icon,
        )}
      >
        <IconComponent className={iconInnerSize} aria-hidden="true" />
      </div>

      {/* Title */}
      <p
        className={cn(
          'font-semibold leading-tight mt-2.5',
          isFeatured ? 'text-sm' : 'text-xs',
          isLocked ? 'text-muted-foreground' : 'text-foreground',
        )}
      >
        {badge.title}
      </p>

      {/* Description — always visible so users know what the badge requires */}
      <p
        className={cn(
          'leading-snug mt-1 flex-1',
          isFeatured ? 'text-[11px]' : 'text-[10px]',
          'text-muted-foreground',
        )}
      >
        {badge.description}
      </p>

      {/* Bottom area: progress (locked) or unlock date (unlocked) */}
      <div className="w-full mt-2">
        {isLocked && progressPercent !== undefined && (
          <div className="space-y-1">
            <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-700', styles.progress)}
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                role="progressbar"
                aria-valuenow={Math.round(progressPercent)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            {progressHint && (
              <p className="text-[9px] text-muted-foreground/70 font-medium">{progressHint}</p>
            )}
          </div>
        )}

        {isLocked && progressPercent === undefined && (
          <p className="text-[9px] text-muted-foreground/50 italic">
            {t('gamification.howToUnlock', 'Keep trading to unlock')}
          </p>
        )}

        {!isLocked && formattedDate && (
          <p className="text-[9px] text-muted-foreground/60">
            {t('gamification.unlockedOn', 'Unlocked')} {formattedDate}
          </p>
        )}
      </div>
    </div>
  );
};

export default BadgeCard;
