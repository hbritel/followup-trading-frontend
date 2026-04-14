import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Award,
  Crown,
  Shield,
  ShieldCheck,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import LeaderboardSummaryCard from '@/components/social/LeaderboardSummaryCard';
import SocialLeaderboardTable from '@/components/social/LeaderboardTable';
import { useLeaderboard, useLeaderboardSummary } from '@/hooks/useLeaderboard';
import { useGamificationProfile } from '@/hooks/useGamification';
import { cn } from '@/lib/utils';
import type { LeaderboardEntryDto } from '@/types/dto';

// ---- Leaderboard types with config ------------------------------------------

const LEADERBOARD_TYPES = [
  'TOP_PERFORMERS',
  'MOST_CONSISTENT',
  'BEST_RISK_MANAGER',
  'RISING_STARS',
  'PROP_FIRM_CHAMPIONS',
] as const;

type LeaderboardType = (typeof LEADERBOARD_TYPES)[number];

const TYPE_CONFIG: Record<
  LeaderboardType,
  { icon: React.ReactNode; labelKey: string }
> = {
  TOP_PERFORMERS: {
    icon: <Trophy className="w-5 h-5" />,
    labelKey: 'leaderboard.topPerformers',
  },
  MOST_CONSISTENT: {
    icon: <Shield className="w-5 h-5" />,
    labelKey: 'leaderboard.mostConsistent',
  },
  BEST_RISK_MANAGER: {
    icon: <Target className="w-5 h-5" />,
    labelKey: 'leaderboard.bestRiskManager',
  },
  RISING_STARS: {
    icon: <TrendingUp className="w-5 h-5" />,
    labelKey: 'leaderboard.risingStars',
  },
  PROP_FIRM_CHAMPIONS: {
    icon: <Award className="w-5 h-5" />,
    labelKey: 'leaderboard.propFirmChampions',
  },
};

// ---- "Your Position" strip (reused from gamification) -----------------------

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
      <div
        className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"
        aria-hidden
      />

      <div className="relative flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-primary" aria-hidden />
          <span className="text-sm font-semibold text-primary">
            {t('gamification.yourPosition', 'Your Position')}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 flex-1 min-w-0">
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

          <StatItem
            label={t('gamification.xp', 'XP')}
            value={
              <span className="font-mono tabular-nums">{profile.xp.toLocaleString()}</span>
            }
            icon={<Zap className="w-3.5 h-3.5" />}
          />

          <StatItem
            label={t('gamification.badges', 'Badges')}
            value={profile.badgeCount}
            icon={<Award className="w-3.5 h-3.5" />}
            className="hidden sm:flex"
          />

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

// ---- Summary grid view ------------------------------------------------------

interface SummaryGridProps {
  readonly summary: Record<string, LeaderboardEntryDto[]>;
  readonly onViewAll: (type: LeaderboardType) => void;
}

function SummaryGrid({ summary, onViewAll }: SummaryGridProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {LEADERBOARD_TYPES.map((type) => {
        const config = TYPE_CONFIG[type];
        const entries = summary[type] ?? [];
        return (
          <LeaderboardSummaryCard
            key={type}
            type={type}
            label={t(config.labelKey)}
            icon={config.icon}
            entries={entries}
            onViewAll={() => onViewAll(type)}
          />
        );
      })}
    </div>
  );
}

// ---- Tab detail view --------------------------------------------------------

function TabDetailView({
  selectedType,
  onTypeChange,
}: {
  readonly selectedType: LeaderboardType;
  readonly onTypeChange: (type: LeaderboardType) => void;
}) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);

  // Reset page when type changes
  const handleTypeChange = useCallback(
    (value: string) => {
      onTypeChange(value as LeaderboardType);
      setPage(0);
    },
    [onTypeChange],
  );

  const { data, isLoading } = useLeaderboard(selectedType, page, 20);

  return (
    <div className="space-y-4">
      <Tabs value={selectedType} onValueChange={handleTypeChange}>
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          {LEADERBOARD_TYPES.map((type) => {
            const config = TYPE_CONFIG[type];
            return (
              <TabsTrigger
                key={type}
                value={type}
                className="cursor-pointer text-xs gap-1.5 py-2"
              >
                {config.icon}
                <span className="hidden sm:inline">{t(config.labelKey)}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {LEADERBOARD_TYPES.map((type) => (
          <TabsContent key={type} value={type} className="mt-4">
            <SocialLeaderboardTable
              entries={data?.entries ?? []}
              isLoading={isLoading}
              page={page}
              totalEntries={data?.totalEntries ?? 0}
              size={20}
              onPageChange={setPage}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// ---- Page -------------------------------------------------------------------

const Leaderboard: React.FC = () => {
  const { t } = useTranslation();
  const [view, setView] = useState<'summary' | 'detail'>('summary');
  const [selectedType, setSelectedType] = useState<LeaderboardType>('TOP_PERFORMERS');

  const { data: summary, isLoading: summaryLoading } = useLeaderboardSummary();

  const handleViewAll = useCallback((type: LeaderboardType) => {
    setSelectedType(type);
    setView('detail');
  }, []);

  const handleBackToSummary = useCallback(() => {
    setView('summary');
  }, []);

  return (
    <DashboardLayout pageTitle={t('leaderboard.title', 'Leaderboard')}>
      <PageTransition className="flex flex-col gap-6">
        {/* Page header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
              <Crown className="w-6 h-6 text-amber-500 flex-shrink-0" aria-hidden />
              {t('leaderboard.title', 'Leaderboard')}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t(
                'gamification.leaderboardDescription',
                'Compare your performance with the community',
              )}
            </p>
          </div>

          {view === 'detail' && (
            <button
              type="button"
              onClick={handleBackToSummary}
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium cursor-pointer"
            >
              &larr; {t('common.back', 'Back')}
            </button>
          )}
        </div>

        {/* Current user position */}
        <YourPositionCard />

        {/* Content */}
        {view === 'summary' ? (
          summaryLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-52 rounded-2xl bg-muted animate-pulse"
                  aria-busy="true"
                />
              ))}
            </div>
          ) : (
            <SummaryGrid
              summary={summary ?? {}}
              onViewAll={handleViewAll}
            />
          )
        ) : (
          <TabDetailView
            selectedType={selectedType}
            onTypeChange={setSelectedType}
          />
        )}
      </PageTransition>
    </DashboardLayout>
  );
};

export default Leaderboard;
