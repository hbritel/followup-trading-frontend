import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  Award,
  Flame,
  Loader2,
  Lock,
  Star,
  Trophy,
  TrendingUp,
  Zap,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import BadgeGrid from '@/components/gamification/BadgeGrid';
import ProfileCard from '@/components/gamification/ProfileCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useBadges, useGamificationProfile } from '@/hooks/useGamification';
import { BADGE_TARGETS } from '@/components/gamification/badgeConstants';
import { cn } from '@/lib/utils';
import type { BadgeDto, GamificationProfileDto } from '@/types/dto';

/* ─── Level metadata ─────────────────────────────────────────── */

const LEVEL_GRADIENT: Record<string, string> = {
  ROOKIE: 'from-slate-600 to-slate-500',
  APPRENTICE: 'from-blue-700 to-blue-500',
  TRADER: 'from-green-700 to-green-500',
  SKILLED: 'from-amber-600 to-amber-400',
  ADVANCED: 'from-primary to-primary/70',
  EXPERT: 'from-rose-600 to-rose-400',
  MASTER: 'from-indigo-700 to-indigo-500',
  ELITE: 'from-amber-500 to-yellow-300',
  LEGEND: 'from-amber-400 via-orange-400 to-primary',
  GOAT: 'from-pink-500 via-primary to-cyan-400',
};

const LEVEL_GLOW: Record<string, string> = {
  ROOKIE: '',
  APPRENTICE: 'shadow-blue-500/25',
  TRADER: 'shadow-green-500/25',
  SKILLED: 'shadow-amber-500/25',
  ADVANCED: 'shadow-primary/25',
  EXPERT: 'shadow-rose-500/25',
  MASTER: 'shadow-indigo-500/25',
  ELITE: 'shadow-amber-400/30',
  LEGEND: 'shadow-amber-400/30',
  GOAT: 'shadow-pink-500/30',
};

function getLevelKey(levelName: string | null | undefined): string {
  return (levelName ?? 'ROOKIE').toUpperCase();
}

/* ─── Hero Skeleton ──────────────────────────────────────────── */

const HeroSkeleton: React.FC = () => (
  <div className="glass-card rounded-2xl p-6 md:p-8 space-y-4">
    <div className="flex flex-col md:flex-row gap-6">
      {/* Left — level badge + user info */}
      <div className="flex items-center gap-4 flex-1">
        <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-2 w-full mt-2" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      {/* Right — stat cards */}
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-28 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

/* ─── Hero stat card ─────────────────────────────────────────── */

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  accent: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subValue, accent }) => (
  <div
    className={cn(
      'glass-card rounded-xl px-4 py-3 flex flex-col items-center gap-1 text-center min-w-[100px]',
      'border transition-all duration-200',
      accent,
    )}
  >
    <div className="text-muted-foreground">{icon}</div>
    <p className="kpi-value text-xl text-foreground">{value}</p>
    {subValue && <p className="text-[10px] text-muted-foreground">{subValue}</p>}
    <p className="label-caps text-muted-foreground/70 text-[9px] mt-0.5">{label}</p>
  </div>
);

/* ─── Hero Section ───────────────────────────────────────────── */

interface HeroSectionProps {
  profile: GamificationProfileDto;
  unlockedCount: number;
  totalCount: number;
}

const HeroSection: React.FC<HeroSectionProps> = ({ profile, unlockedCount, totalCount }) => {
  const { t } = useTranslation();
  const levelKey = getLevelKey(profile.levelName);
  const gradientClass = LEVEL_GRADIENT[levelKey] ?? LEVEL_GRADIENT.ROOKIE;
  const glowClass = LEVEL_GLOW[levelKey] ?? '';
  const levelBadgeShadow = glowClass ? `shadow-lg ${glowClass}` : 'shadow-2xl';

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* ── Left: level badge + identity ── */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Circular level badge */}
          <div
            className={cn(
              'flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center',
              'text-white dark:text-white text-2xl font-black bg-gradient-to-br',
              gradientClass,
              levelBadgeShadow,
            )}
            aria-label={`${t('gamification.level', 'Level')} ${profile.levelName}`}
          >
            {profile.levelName?.charAt(0) ?? 'R'}
          </div>

          {/* Name + XP */}
          <div className="flex-1 min-w-0 space-y-1">
            {profile.username ? (
              <h2 className="text-xl font-bold text-foreground truncate">@{profile.username}</h2>
            ) : (
              <h2 className="text-xl font-bold text-muted-foreground italic truncate">
                {t('gamification.noUsername', 'Anonymous Trader')}
              </h2>
            )}

            <p
              className={cn(
                'text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r',
                gradientClass,
              )}
            >
              {profile.levelName}
            </p>

            <p className="text-xs text-muted-foreground">
              <span className="kpi-value text-foreground text-base">
                {profile.xp.toLocaleString()}
              </span>{' '}
              {t('gamification.xp', 'XP')}
            </p>

            {/* XP progress bar */}
            <div className="space-y-1 pt-0.5">
              <Progress
                value={Math.min(100, profile.xpProgress)}
                className="h-1.5"
                aria-label={`${t('gamification.xpProgress', 'XP progress')} ${Math.round(profile.xpProgress)}%`}
              />
              <p className="text-[10px] text-muted-foreground">
                {profile.xpToNextLevel.toLocaleString()}{' '}
                {t('gamification.xpToNext', 'XP to next level')}
                {' · '}
                {Math.round(profile.xpProgress)}%
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: stat cards ── */}
        <div className="flex flex-wrap gap-3 md:flex-nowrap self-stretch md:self-auto">
          <StatCard
            icon={<Trophy className="w-4 h-4 text-amber-400" aria-hidden="true" />}
            label={t('gamification.badgesUnlocked', 'Badges Unlocked')}
            value={`${unlockedCount}`}
            subValue={`/ ${totalCount}`}
            accent="border-amber-500/20 hover:border-amber-500/40"
          />
          <StatCard
            icon={<Flame className="w-4 h-4 text-rose-400" aria-hidden="true" />}
            label={t('gamification.currentStreak', 'Current Streak')}
            value={`${profile.currentStreak}`}
            subValue={t('gamification.days', 'days')}
            accent="border-rose-500/20 hover:border-rose-500/40"
          />
          <StatCard
            icon={<Star className="w-4 h-4 text-indigo-400" aria-hidden="true" />}
            label={t('gamification.longestStreak', 'Longest Streak')}
            value={`${profile.longestStreak}`}
            subValue={t('gamification.days', 'days')}
            accent="border-indigo-500/20 hover:border-indigo-500/40"
          />
        </div>
      </div>
    </div>
  );
};

/* ─── Next-badge callout ─────────────────────────────────────── */

/** Find the locked badge that is closest to being unlocked */
function findClosestBadge(
  badges: BadgeDto[],
  tradeCount: number,
): { badge: BadgeDto; progressPercent: number; remaining: number } | null {
  let bestCandidate: { badge: BadgeDto; progressPercent: number; remaining: number } | null = null;

  for (const badge of badges) {
    if (badge.unlockedAt !== null) continue;

    const target = BADGE_TARGETS[badge.badgeType];
    if (!target) continue;

    const pct = Math.min(99, Math.round((tradeCount / target) * 100));
    if (pct <= 0) continue;

    if (!bestCandidate || pct > bestCandidate.progressPercent) {
      bestCandidate = {
        badge,
        progressPercent: pct,
        remaining: Math.max(1, target - tradeCount),
      };
    }
  }

  return bestCandidate;
}

interface NextBadgeCalloutProps {
  badges: BadgeDto[];
  tradeCount: number;
}

const NextBadgeCallout: React.FC<NextBadgeCalloutProps> = ({ badges, tradeCount }) => {
  const { t } = useTranslation();

  const candidate = useMemo(
    () => findClosestBadge(badges, tradeCount),
    [badges, tradeCount],
  );

  if (!candidate) return null;

  const { badge, progressPercent, remaining } = candidate;

  const categoryColor: Record<string, string> = {
    TRADING: 'border-amber-300 dark:border-amber-500/30 from-amber-50 dark:from-amber-500/10 to-transparent',
    DISCIPLINE: 'border-blue-300 dark:border-blue-500/30 from-blue-50 dark:from-blue-500/10 to-transparent',
    PERFORMANCE: 'border-emerald-300 dark:border-emerald-500/30 from-emerald-50 dark:from-emerald-500/10 to-transparent',
  };
  const barColor: Record<string, string> = {
    TRADING: 'bg-amber-400',
    DISCIPLINE: 'bg-blue-400',
    PERFORMANCE: 'bg-emerald-400',
  };
  const cardClass = categoryColor[badge.category] ?? 'border-border from-muted/50 to-transparent';
  const barClass = barColor[badge.category] ?? 'bg-primary';

  return (
    <div
      className={cn(
        'rounded-2xl border bg-gradient-to-r p-4 md:p-5 flex items-center gap-4',
        cardClass,
      )}
      role="region"
      aria-label={t('gamification.nextBadge', 'Next badge to unlock')}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        <TrendingUp className="w-5 h-5 text-amber-400" aria-hidden="true" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="label-caps text-muted-foreground/60 text-[9px]">
            {t('gamification.nextBadgeLabel', 'Next badge to unlock')}
          </p>
        </div>
        <p className="text-sm font-semibold text-foreground truncate">{badge.title}</p>
        <p className="text-xs text-muted-foreground truncate">{badge.description}</p>

        {/* Progress bar */}
        <div className="space-y-1 pt-0.5">
          <div
            className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-700', barClass)}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {progressPercent}% {t('gamification.complete', 'complete')}
            {' · '}
            {remaining} {t('gamification.moreTrades', 'more trades')}
          </p>
        </div>
      </div>

      {/* Lock indicator */}
      <div className="flex-shrink-0 opacity-40">
        <Lock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
      </div>
    </div>
  );
};

/* ─── Empty state ────────────────────────────────────────────── */

const EmptyState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-5 py-20 text-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 flex items-center justify-center">
          <Trophy className="w-10 h-10 text-amber-400" aria-hidden="true" />
        </div>
        {/* Decorative rings */}
        <div className="absolute -inset-3 rounded-3xl border border-amber-400/10 pointer-events-none" />
        <div className="absolute -inset-6 rounded-[28px] border border-amber-400/5 pointer-events-none" />
        {/* Sparkle icons */}
        <Zap
          className="absolute -top-2 -right-2 w-4 h-4 text-amber-300/60 rotate-12"
          aria-hidden="true"
        />
        <Star
          className="absolute -bottom-1 -left-3 w-3 h-3 text-amber-300/40 -rotate-6"
          aria-hidden="true"
        />
      </div>

      <div className="space-y-2 max-w-xs">
        <p className="font-bold text-foreground text-lg">
          {t('gamification.noBadgesTitle', 'Start trading to earn badges')}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t(
            'gamification.noBadgesDesc',
            'Complete trades and improve your habits to unlock your first achievement. Every trade counts.',
          )}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Award className="w-4 h-4 text-muted-foreground/60" aria-hidden="true" />
        <span className="text-xs text-muted-foreground/60">
          {t('gamification.badgesWaiting', '14 badges waiting to be unlocked')}
        </span>
      </div>
    </div>
  );
};

/* ─── Error state ────────────────────────────────────────────── */

interface ErrorStateProps {
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ onRetry }) => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
        <div>
          <p className="font-medium">{t('common.errorLoading')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('common.tryAgain')}</p>
        </div>
        <Button variant="outline" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      </CardContent>
    </Card>
  );
};

/* ─── Page ───────────────────────────────────────────────────── */

const Badges: React.FC = () => {
  const { t } = useTranslation();
  const {
    data: badges,
    isLoading: badgesLoading,
    isError: badgesError,
    refetch: refetchBadges,
  } = useBadges();
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useGamificationProfile();

  const isLoading = badgesLoading || profileLoading;
  const isError = badgesError || profileError;

  const handleRetry = () => {
    refetchBadges();
    refetchProfile();
  };

  const unlockedBadges = useMemo(
    () => (badges ?? []).filter((b) => b.unlockedAt !== null),
    [badges],
  );
  const unlockedCount = unlockedBadges.length;
  const totalCount = badges?.length ?? 0;

  /** Approximate trade count from the TRADES_* badge progression.
   *  We pick the highest unlocked trade-count badge as the floor. */
  const estimatedTradeCount = useMemo(() => {
    const tradeBadgeTiers: Record<string, number> = {
      TRADES_500: 500,
      TRADES_100: 100,
      TRADES_50: 50,
      TRADES_10: 10,
    };
    for (const [badgeType, count] of Object.entries(tradeBadgeTiers)) {
      if (unlockedBadges.some((b) => b.badgeType === badgeType)) {
        return count;
      }
    }
    // No unlocked trade badge — return a small but nonzero estimate if any trade badge exists
    return 0;
  }, [unlockedBadges]);

  return (
    <DashboardLayout pageTitle={t('gamification.achievements', 'Achievements')}>
      <PageTransition className="flex flex-col gap-6">

        {/* ── Hero ── */}
        {isLoading ? (
          <HeroSkeleton />
        ) : isError ? (
          <ErrorState onRetry={handleRetry} />
        ) : profile ? (
          <HeroSection
            profile={profile}
            unlockedCount={unlockedCount}
            totalCount={totalCount}
          />
        ) : null}

        {/* ── Badge grid section ── */}
        {!isError && (
          <section
            aria-label={t('gamification.achievements', 'Achievements')}
            className="glass-card rounded-2xl p-4 md:p-6 space-y-6"
          >
            {/* Section header */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" aria-hidden="true" />
                {t('gamification.allBadges', 'All Badges')}
              </h2>
              {!isLoading && (
                <span className="label-caps text-muted-foreground/50 text-[10px]">
                  {unlockedCount}/{totalCount} {t('gamification.unlocked', 'unlocked')}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16" aria-label={t('common.loading', 'Loading')}>
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" aria-hidden="true" />
              </div>
            ) : badges && badges.length === 0 ? (
              <EmptyState />
            ) : badges ? (
              <>
                {/* Next badge callout — only when there is progress to show */}
                {estimatedTradeCount > 0 && (
                  <NextBadgeCallout badges={badges} tradeCount={estimatedTradeCount} />
                )}

                <BadgeGrid badges={badges} tradeCount={estimatedTradeCount} />
              </>
            ) : null}
          </section>
        )}

        {/* ── Profile / trading card section ── */}
        {!isLoading && !isError && profile && (
          <section
            aria-label={t('gamification.tradingCard', 'Your Trading Card')}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" aria-hidden="true" />
              <h2 className="text-base font-semibold text-foreground">
                {t('gamification.tradingCard', 'Your Trading Card')}
              </h2>
            </div>
            <div className="glass-card rounded-2xl p-4 md:p-6 max-w-md">
              <ProfileCard
                profile={profile}
                recentBadges={unlockedBadges}
              />
            </div>
          </section>
        )}

      </PageTransition>
    </DashboardLayout>
  );
};

export default Badges;
