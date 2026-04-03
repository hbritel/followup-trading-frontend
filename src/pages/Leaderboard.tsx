import React from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Crown, ShieldCheck, TrendingUp, Zap } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import LeaderboardTable from '@/components/gamification/LeaderboardTable';
import { useGamificationProfile } from '@/hooks/useGamification';
import { cn } from '@/lib/utils';

// ─── "Your Position" strip ────────────────────────────────────────────────────

const LEVEL_DOT_COLORS: Record<string, string> = {
  ROOKIE: 'bg-slate-500',
  APPRENTICE: 'bg-blue-600',
  TRADER: 'bg-green-600',
  SKILLED: 'bg-amber-500',
  ADVANCED: 'bg-primary',
  EXPERT: 'bg-rose-500',
  MASTER: 'bg-indigo-600',
  ELITE: 'bg-amber-400',
  LEGEND: 'bg-gradient-to-r from-amber-400 to-primary',
  GOAT: 'bg-gradient-to-r from-pink-500 via-primary to-cyan-400',
};

interface StatItemProps {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly icon: React.ReactNode;
  readonly className?: string;
}

function StatItem({ label, value, icon, className }: StatItemProps) {
  return (
    <div className={cn('flex items-center gap-2 min-w-0', className)}>
      <div className="flex-shrink-0 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none">
          {label}
        </p>
        <p className="text-sm font-semibold text-foreground mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

function YourPositionCard() {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useGamificationProfile();

  if (isLoading) {
    return <div className="h-20 rounded-2xl bg-muted animate-pulse" aria-busy="true" />;
  }

  if (!profile) return null;

  const levelKey = profile.levelName?.toUpperCase() ?? 'ROOKIE';
  const dotColor = LEVEL_DOT_COLORS[levelKey] ?? 'bg-slate-500';

  return (
    <section
      aria-label={t('gamification.yourPosition', 'Your Position')}
      className={cn(
        'rounded-2xl border-2 border-primary/30 bg-primary/5',
        'px-4 py-4 sm:px-6',
        'relative overflow-hidden',
      )}
    >
      {/* Subtle background glow */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"
        aria-hidden
      />

      <div className="relative flex flex-wrap items-center gap-x-6 gap-y-3">
        {/* Label */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-primary" aria-hidden />
          <span className="text-sm font-semibold text-primary">
            {t('gamification.yourPosition', 'Your Position')}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 flex-1 min-w-0">
          {/* Level */}
          <StatItem
            label={t('gamification.level', 'Level')}
            value={
              <span className="flex items-center gap-1.5">
                <span
                  className={cn('inline-block w-2 h-2 rounded-full flex-shrink-0', dotColor)}
                />
                {profile.levelName}
              </span>
            }
            icon={<Crown className="w-3.5 h-3.5" />}
          />

          {/* XP */}
          <StatItem
            label={t('gamification.xp', 'XP')}
            value={
              <span className="font-mono tabular-nums">{profile.xp.toLocaleString()}</span>
            }
            icon={<Zap className="w-3.5 h-3.5" />}
          />

          {/* Badges */}
          <StatItem
            label={t('gamification.badges', 'Badges')}
            value={profile.badgeCount}
            icon={<Award className="w-3.5 h-3.5" />}
            className="hidden sm:flex"
          />

          {/* Streak */}
          <StatItem
            label={t('gamification.streak', 'Streak')}
            value={
              <span>
                {profile.currentStreak}{' '}
                <span className="text-muted-foreground font-normal text-xs">
                  {t('gamification.days', 'days')}
                </span>
              </span>
            }
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            className="hidden md:flex"
          />

          {/* XP to next level */}
          <div className="flex-1 min-w-[140px] max-w-xs hidden lg:block">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span className="uppercase tracking-wide">
                {t('gamification.nextLevel', 'Next Level')}
              </span>
              <span className="tabular-nums">{Math.round(profile.xpProgress)}%</span>
            </div>
            <progress
              className="w-full h-1.5 rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary"
              value={Math.round(profile.xpProgress)}
              max={100}
              aria-label={t('gamification.xpProgress', 'XP progress to next level')}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const Leaderboard: React.FC = () => {
  const { t } = useTranslation();

  return (
    <DashboardLayout pageTitle={t('gamification.leaderboard', 'Leaderboard')}>
      <PageTransition className="flex flex-col gap-6">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <Crown className="w-6 h-6 text-amber-500 flex-shrink-0" aria-hidden />
            {t('gamification.leaderboard', 'Leaderboard')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t(
              'gamification.leaderboardDescription',
              'Compare your performance with the community',
            )}
          </p>
        </div>

        {/* Current user position */}
        <YourPositionCard />

        {/* Rankings */}
        <LeaderboardTable />

      </PageTransition>
    </DashboardLayout>
  );
};

export default Leaderboard;
