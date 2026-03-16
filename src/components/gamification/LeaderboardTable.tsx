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
import { ChevronLeft, ChevronRight, Medal, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeaderboard } from '@/hooks/useGamification';
import { useGamificationProfile } from '@/hooks/useGamification';

type Period = 'week' | 'month' | 'all';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

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

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <Tabs value={period} onValueChange={handlePeriodChange}>
          <TabsList>
            {periods.map((p) => (
              <TabsTrigger key={p.value} value={p.value}>
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !data || data.content.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 text-sm">
          {t('common.noData')}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5">
                  <TableHead className="w-12 text-center">{t('gamification.rank', '#')}</TableHead>
                  <TableHead>{t('common.username', 'User')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('gamification.level', 'Level')}</TableHead>
                  <TableHead className="text-right">{t('gamification.xp', 'XP')}</TableHead>
                  <TableHead className="text-right hidden md:table-cell">{t('gamification.badges', 'Badges')}</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Win Rate</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Sharpe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.map((entry) => {
                  const isCurrentUser = entry.username === myProfile?.username;
                  const isTopThree = entry.rank <= 3;

                  return (
                    <TableRow
                      key={entry.rank}
                      className={cn(
                        'border-white/5 transition-colors',
                        isCurrentUser &&
                          'border border-violet-500/30 bg-violet-500/5',
                      )}
                    >
                      {/* Rank */}
                      <TableCell className="text-center font-bold">
                        {isTopThree ? (
                          <span style={{ color: MEDAL_COLORS[entry.rank - 1] }}>
                            {entry.rank === 1 ? (
                              <Trophy className="w-4 h-4 inline" />
                            ) : (
                              <Medal className="w-4 h-4 inline" />
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">{entry.rank}</span>
                        )}
                      </TableCell>

                      {/* Username */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {entry.username}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[9px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full font-medium">
                              You
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Level */}
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {entry.levelName}
                      </TableCell>

                      {/* XP */}
                      <TableCell className="text-right font-mono text-sm">
                        {entry.xp.toLocaleString()}
                      </TableCell>

                      {/* Badges */}
                      <TableCell className="text-right text-sm hidden md:table-cell">
                        {entry.badgeCount}
                      </TableCell>

                      {/* Win Rate */}
                      <TableCell className="text-right text-sm hidden md:table-cell">
                        {entry.winRate.toFixed(1)}%
                      </TableCell>

                      {/* Sharpe */}
                      <TableCell className="text-right text-sm hidden lg:table-cell">
                        {entry.sharpeRatio.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="ghost"
                size="icon"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {page + 1} / {data.totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                disabled={page >= data.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LeaderboardTable;
