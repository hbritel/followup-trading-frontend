import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Medal,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeaderboard } from '@/hooks/useGamification';
import { useGamificationProfile } from '@/hooks/useGamification';
import type { LeaderboardEntryDto } from '@/types/dto';

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = 'week' | 'month' | 'all';

// ─── Level colours (mirrored from ProfileCard / Badges page) ─────────────────

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

const LEVEL_PILL_COLORS: Record<string, string> = {
  ROOKIE: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  APPRENTICE: 'bg-blue-600/15 text-blue-400 border-blue-600/20',
  TRADER: 'bg-green-600/15 text-green-500 border-green-600/20',
  SKILLED: 'bg-amber-500/15 text-amber-500 border-amber-500/20',
  ADVANCED: 'bg-primary/15 text-primary border-primary/20',
  EXPERT: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  MASTER: 'bg-indigo-600/15 text-indigo-400 border-indigo-600/20',
  ELITE: 'bg-amber-400/15 text-amber-400 border-amber-400/20',
  LEGEND: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
  GOAT: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function levelKey(levelName: string): string {
  return levelName?.toUpperCase() ?? 'ROOKIE';
}

function LevelDot({ levelName }: { levelName: string }) {
  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full flex-shrink-0',
        LEVEL_DOT_COLORS[levelKey(levelName)] ?? 'bg-slate-500',
      )}
    />
  );
}

function LevelPill({ levelName }: { levelName: string }) {
  const key = levelKey(levelName);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border',
        LEVEL_PILL_COLORS[key] ?? LEVEL_PILL_COLORS.ROOKIE,
      )}
    >
      <LevelDot levelName={levelName} />
      {levelName}
    </span>
  );
}

// ─── Podium ───────────────────────────────────────────────────────────────────

interface PodiumCardProps {
  readonly entry: LeaderboardEntryDto;
  readonly isCurrentUser: boolean;
}

function PodiumCard({ entry, isCurrentUser }: PodiumCardProps) {
  const { t } = useTranslation();

  const config = {
    1: {
      order: 'order-2 sm:order-2',
      height: 'py-8 sm:py-10',
      icon: <Crown className="w-7 h-7 text-amber-500" aria-hidden />,
      ring: 'ring-2 ring-amber-500/40',
      gradient: 'from-amber-500/10 to-amber-600/5',
      rankLabel: 'text-amber-500',
      rankBadge: 'bg-amber-500/20 text-amber-500',
      scale: 'sm:scale-105',
    },
    2: {
      order: 'order-1 sm:order-1',
      height: 'py-6',
      icon: <Medal className="w-6 h-6 text-slate-400" aria-hidden />,
      ring: 'ring-1 ring-slate-400/30',
      gradient: 'from-slate-400/10 to-slate-500/5',
      rankLabel: 'text-slate-400',
      rankBadge: 'bg-slate-400/20 text-slate-400',
      scale: '',
    },
    3: {
      order: 'order-3 sm:order-3',
      height: 'py-6',
      icon: <Medal className="w-6 h-6 text-amber-700" aria-hidden />,
      ring: 'ring-1 ring-amber-700/30',
      gradient: 'from-amber-700/10 to-amber-800/5',
      rankLabel: 'text-amber-700',
      rankBadge: 'bg-amber-700/20 text-amber-700',
      scale: '',
    },
  } as const;

  const c = config[entry.rank as 1 | 2 | 3];
  if (!c) return null;

  return (
    <div
      className={cn(
        'relative flex flex-col items-center rounded-2xl border border-border',
        'bg-gradient-to-b',
        c.gradient,
        c.ring,
        c.height,
        c.order,
        c.scale,
        'px-4 gap-3 flex-1 min-w-0 transition-transform duration-200',
        isCurrentUser && 'ring-2 ring-primary/50',
      )}
    >
      {/* Rank badge */}
      <span
        className={cn(
          'absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-xs font-bold',
          c.rankBadge,
        )}
      >
        #{entry.rank}
      </span>

      {/* Medal icon */}
      <div className="mt-2">{c.icon}</div>

      {/* Avatar placeholder */}
      <div
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-foreground',
          LEVEL_DOT_COLORS[levelKey(entry.levelName)] ?? 'bg-slate-500',
          'bg-opacity-80',
        )}
        aria-hidden
      >
        {entry.username.charAt(0).toUpperCase()}
      </div>

      {/* Username */}
      <div className="text-center min-w-0 w-full">
        <p className="font-semibold text-sm text-foreground truncate">
          {entry.username}
          {isCurrentUser && (
            <span className="ml-1 text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium align-middle">
              {t('gamification.you', 'You')}
            </span>
          )}
        </p>
        <LevelPill levelName={entry.levelName} />
      </div>

      {/* Stats */}
      <div className="flex flex-col items-center gap-0.5 w-full">
        <p className={cn('font-mono text-sm font-bold', c.rankLabel)}>
          {entry.xp.toLocaleString()} {t('gamification.xp', 'XP')}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('gamification.winRate', 'Win')}{' '}
          <span className="text-foreground font-medium">
            {entry.winRate.toFixed(1)}%
          </span>
        </p>
      </div>
    </div>
  );
}

// ─── Podium Section ───────────────────────────────────────────────────────────

interface LeaderboardPodiumProps {
  readonly entries: LeaderboardEntryDto[];
  readonly currentUsername?: string;
}

export function LeaderboardPodium({ entries, currentUsername }: LeaderboardPodiumProps) {
  const top3 = entries.filter((e) => e.rank <= 3).sort((a, b) => a.rank - b.rank);
  if (top3.length === 0) return null;

  return (
    <section
      aria-label="Top 3 podium"
      className="flex flex-col sm:flex-row items-end justify-center gap-4 sm:gap-3 px-2 py-6"
    >
      {/* On mobile: 1st on top, then 2nd and 3rd side by side below */}
      {/* On sm+: arranged as 2nd | 1st | 3rd with 1st taller */}
      {top3.map((entry) => (
        <PodiumCard
          key={entry.rank}
          entry={entry}
          isCurrentUser={entry.username === currentUsername}
        />
      ))}
    </section>
  );
}

// ─── Rankings Table ───────────────────────────────────────────────────────────

interface LeaderboardRankingsProps {
  readonly entries: LeaderboardEntryDto[];
  readonly currentUsername?: string;
  readonly page: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
}

export function LeaderboardRankings({
  entries,
  currentUsername,
  page,
  totalPages,
  onPageChange,
}: LeaderboardRankingsProps) {
  const { t } = useTranslation();

  // Exclude top-3 from the table (they are shown in the podium)
  const rankingsRows = entries.filter((e) => e.rank > 3);

  if (rankingsRows.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="w-12 text-center text-xs">
              {t('gamification.rank', '#')}
            </TableHead>
            <TableHead className="text-xs">{t('common.username', 'User')}</TableHead>
            <TableHead className="hidden sm:table-cell text-xs">
              {t('gamification.level', 'Level')}
            </TableHead>
            <TableHead className="text-right text-xs font-medium">
              {t('gamification.xp', 'XP')}
            </TableHead>
            <TableHead className="text-right hidden md:table-cell text-xs">
              {t('gamification.badges', 'Badges')}
            </TableHead>
            <TableHead className="text-right hidden md:table-cell text-xs">
              {t('gamification.winRate', 'Win Rate')}
            </TableHead>
            <TableHead className="text-right hidden lg:table-cell text-xs">
              {t('gamification.sharpe', 'Sharpe')}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rankingsRows.map((entry) => {
            const isCurrentUser = entry.username === currentUsername;
            return (
              <TableRow
                key={entry.rank}
                className={cn(
                  'border-border transition-colors duration-150 cursor-default',
                  'hover:bg-muted/50',
                  isCurrentUser &&
                    'bg-primary/5 border-l-2 border-l-primary hover:bg-primary/8',
                )}
              >
                {/* Rank */}
                <TableCell className="text-center">
                  <span className="text-muted-foreground text-sm font-medium tabular-nums">
                    {entry.rank}
                  </span>
                </TableCell>

                {/* Username */}
                <TableCell>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-sm text-foreground truncate">
                      {entry.username}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                        {t('gamification.you', 'You')}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Level */}
                <TableCell className="hidden sm:table-cell">
                  <LevelPill levelName={entry.levelName} />
                </TableCell>

                {/* XP */}
                <TableCell className="text-right font-mono text-sm text-foreground tabular-nums">
                  {entry.xp.toLocaleString()}
                </TableCell>

                {/* Badges */}
                <TableCell className="text-right text-sm text-muted-foreground hidden md:table-cell tabular-nums">
                  {entry.badgeCount}
                </TableCell>

                {/* Win Rate */}
                <TableCell className="text-right text-sm hidden md:table-cell tabular-nums">
                  <span
                    className={cn(
                      'font-medium',
                      entry.winRate >= 60
                        ? 'text-green-500'
                        : entry.winRate >= 45
                        ? 'text-foreground'
                        : 'text-rose-500',
                    )}
                  >
                    {entry.winRate.toFixed(1)}%
                  </span>
                </TableCell>

                {/* Sharpe */}
                <TableCell className="text-right text-sm text-muted-foreground hidden lg:table-cell tabular-nums">
                  {entry.sharpeRatio.toFixed(2)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-3 border-t border-border">
          <Button
            variant="ghost"
            size="icon"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
            className="cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
            className="cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LeaderboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading leaderboard">
      {/* Podium skeleton */}
      <div className="flex flex-col sm:flex-row items-end justify-center gap-3 px-2 py-6">
        {[2, 1, 3].map((rank) => (
          <div
            key={rank}
            className={cn(
              'flex-1 rounded-2xl border border-border bg-muted animate-pulse',
              rank === 1 ? 'h-52' : 'h-44',
            )}
          />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="space-y-2 rounded-xl border border-border p-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function LeaderboardEmpty() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <Trophy className="w-12 h-12 text-muted-foreground/40" aria-hidden />
      <div>
        <p className="text-foreground font-medium">
          {t('gamification.noRankingsTitle', 'No rankings yet')}
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          {t(
            'gamification.noRankingsDescription',
            'Start trading to appear on the leaderboard',
          )}
        </p>
      </div>
    </div>
  );
}

// ─── Main Export (used by Leaderboard page) ───────────────────────────────────

const LeaderboardTable: React.FC = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('all');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useLeaderboard(period, page, 20);
  const { data: myProfile } = useGamificationProfile();

  const periods: { value: Period; label: string }[] = [
    { value: 'week', label: t('gamification.week', 'This Week') },
    { value: 'month', label: t('gamification.month', 'This Month') },
    { value: 'all', label: t('gamification.allTime', 'All Time') },
  ];

  const handlePeriodChange = (p: string) => {
    setPeriod(p as Period);
    setPage(0);
  };

  const currentUsername = myProfile?.username;
  const entries = data?.content ?? [];
  const hasData = entries.length > 0;

  return (
    <div className="space-y-4">
      {/* Period tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Tabs value={period} onValueChange={handlePeriodChange}>
          <TabsList>
            {periods.map((p) => (
              <TabsTrigger
                key={p.value}
                value={p.value}
                className="cursor-pointer"
              >
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" aria-hidden />
          {t('gamification.liveRankings', 'Live rankings')}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LeaderboardSkeleton />
      ) : !hasData ? (
        <LeaderboardEmpty />
      ) : (
        <>
          {/* Podium (top 3) */}
          <LeaderboardPodium
            entries={entries}
            currentUsername={currentUsername}
          />

          {/* Rankings table (rank 4+) */}
          {entries.some((e) => e.rank > 3) && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">
                {t('gamification.fullRankings', 'Full Rankings')}
              </p>
              <LeaderboardRankings
                entries={entries}
                currentUsername={currentUsername}
                page={page}
                totalPages={data?.totalPages ?? 1}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LeaderboardTable;
