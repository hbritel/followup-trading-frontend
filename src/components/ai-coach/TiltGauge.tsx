import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTiltScore } from '@/hooks/useTiltScore';
import { useAccountLabel } from '@/hooks/useAccountLabel';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const TILT_LABELS: Record<string, Record<string, string>> = {
  GREEN:  { en: 'Calm',    fr: 'Calme',     es: 'Calma' },
  YELLOW: { en: 'Monitor', fr: 'Surveiller', es: 'Monitorear' },
  ORANGE: { en: 'Caution', fr: 'Prudence',  es: 'Precaución' },
  RED:    { en: 'Stop',    fr: 'Stop',      es: 'Detener' },
};

type TiltVariant = 'full' | 'compact';

interface TiltGaugeProps {
  /**
   * Layout variant.
   * - 'full' (default): full gauge with arc, score, label, and account badge.
   * - 'compact': small clickable badge "Tilt: {score}" with zone color, tooltip, and navigation to /ai-coach.
   */
  variant?: TiltVariant;
  /** @deprecated use `variant="compact"` instead. Kept for backward-compat with existing callers. */
  compact?: boolean;
  accountId?: string;
  /** If false, disables WebSocket real-time updates (default: true) */
  enableRealtime?: boolean;
}

const getTextColor = (score: number): string => {
  if (score <= 30) return 'text-green-500';
  if (score <= 60) return 'text-yellow-500';
  if (score <= 80) return 'text-orange-500';
  return 'text-red-500';
};

const getStrokeColor = (score: number): string => {
  if (score <= 30) return '#22c55e';
  if (score <= 60) return '#eab308';
  if (score <= 80) return '#f97316';
  return '#ef4444';
};

/**
 * Returns the Tailwind classes for the compact badge background + foreground based on tilt zone.
 * Tuned for both light and dark themes.
 */
const getCompactBadgeClasses = (label: string): string => {
  switch (label) {
    case 'RED':
      return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/25';
    case 'ORANGE':
      return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/25';
    case 'YELLOW':
      return 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/25';
    case 'GREEN':
    default:
      return 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30 hover:bg-green-500/25';
  }
};

const TiltGauge: React.FC<TiltGaugeProps> = ({
  variant,
  compact,
  accountId,
  enableRealtime = true,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useTiltScore(accountId, enableRealtime);
  const getAccountLabelFn = useAccountLabel();

  // Resolve effective variant — prefer explicit `variant`, fall back to legacy `compact` boolean.
  const effectiveVariant: TiltVariant =
    variant ?? (compact ? 'compact' : 'full');
  const isCompact = effectiveVariant === 'compact';

  const score = data?.score ?? 0;
  const rawLabel = data?.thresholdLabel ?? 'GREEN';
  const lang = i18n.language?.substring(0, 2) ?? 'en';
  const label = TILT_LABELS[rawLabel]?.[lang] ?? TILT_LABELS[rawLabel]?.en ?? rawLabel;
  const accountLabel = getAccountLabelFn(data?.connectionId);

  // ---------------- Compact variant ----------------
  if (isCompact) {
    if (isLoading) {
      return (
        <div
          data-testid="tilt-compact-skeleton"
          className="h-7 w-20 rounded-full bg-muted/30 animate-pulse"
        />
      );
    }

    const tooltipText = t('aiCoach.tiltGauge.tooltip', { score, defaultValue: `Your current tilt: ${score}. Click to see details` });

    return (
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>
          <button
            type="button"
            data-testid="tilt-compact"
            data-zone={rawLabel}
            onClick={() => navigate('/ai-coach')}
            aria-label={tooltipText}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full border',
              'text-xs font-semibold tabular-nums tracking-tight',
              'transition-colors duration-150 cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
              getCompactBadgeClasses(rawLabel),
            )}
          >
            <span className="opacity-70">Tilt</span>
            <span>{score}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" sideOffset={4} className="text-xs">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    );
  }

  // ---------------- Full variant (existing behavior) ----------------
  const size = 96;
  const strokeWidth = 7;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-full bg-muted/30 animate-pulse w-24 h-24" />
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
          {/* Score arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getStrokeColor(score)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        {/* Center score */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold tabular-nums text-xl', getTextColor(score))}>
            {score}
          </span>
        </div>
      </div>
      <span
        className={cn(
          'text-xs font-semibold uppercase tracking-wider',
          getTextColor(score),
        )}
      >
        {label}
      </span>
      {accountLabel && (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 h-4 font-medium text-muted-foreground border-border/60 mt-0.5"
        >
          {accountLabel}
        </Badge>
      )}
    </div>
  );
};

export default TiltGauge;
