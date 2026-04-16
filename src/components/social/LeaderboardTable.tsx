import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import VerifiedBadge from '@/components/social/VerifiedBadge';
import type { LeaderboardEntryDto } from '@/types/dto';
import { cn } from '@/lib/utils';

// ---- Rank styling for top 3 ------------------------------------------------

const TOP_RANK_BORDERS: Record<number, string> = {
  1: 'border-l-2 border-l-amber-500',
  2: 'border-l-2 border-l-slate-400',
  3: 'border-l-2 border-l-amber-700',
};

// ---- Skeleton ---------------------------------------------------------------

function TableSkeleton() {
  return (
    <div className="space-y-2 rounded-xl border border-border p-3" aria-busy="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ---- Component --------------------------------------------------------------

interface LeaderboardTableProps {
  readonly entries: LeaderboardEntryDto[];
  readonly isLoading: boolean;
  readonly page: number;
  readonly totalEntries: number;
  readonly size: number;
  readonly onPageChange: (page: number) => void;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  entries,
  isLoading,
  page,
  totalEntries,
  size,
  onPageChange,
}) => {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(totalEntries / size));

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-muted-foreground text-sm">
          {t('leaderboard.noEntries', 'No ranked traders yet')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-14 text-center text-xs">
                {t('leaderboard.rank', 'Rank')}
              </TableHead>
              <TableHead className="text-xs">
                {t('leaderboard.trader', 'Trader')}
              </TableHead>
              <TableHead className="text-right text-xs font-semibold">
                {entries[0]?.criteriaLabel ?? 'Score'}
              </TableHead>
              <TableHead className="text-right hidden md:table-cell text-xs">
                {t('gamification.winRate', 'Win Rate')}
              </TableHead>
              <TableHead className="text-right hidden lg:table-cell text-xs">
                {t('leaderboard.sharpeRatio', 'Sharpe Ratio')}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {entries.map((entry) => (
              <TableRow
                key={entry.rank}
                className={cn(
                  'border-border transition-colors duration-150',
                  'hover:bg-muted/50',
                  TOP_RANK_BORDERS[entry.rank] ?? '',
                )}
              >
                {/* Rank */}
                <TableCell className="text-center">
                  <span className="text-muted-foreground text-sm font-medium tabular-nums">
                    #{entry.rank}
                  </span>
                </TableCell>

                {/* Trader */}
                <TableCell>
                  <div className="flex items-center gap-2 min-w-0">
                    <Link
                      to={`/trader/${entry.username}`}
                      className="font-medium text-sm text-foreground hover:text-primary transition-colors truncate"
                    >
                      {entry.username}
                    </Link>
                    {entry.isVerified && <VerifiedBadge className="flex-shrink-0" />}
                  </div>
                </TableCell>

                {/* Criteria Value (main column) */}
                <TableCell className="text-right">
                  <span className="font-bold text-sm text-foreground tabular-nums">
                    {typeof entry.criteriaValue === 'number'
                      ? entry.criteriaValue.toLocaleString(undefined, { maximumFractionDigits: 2 })
                      : entry.criteriaValue}
                  </span>
                </TableCell>

                {/* Win Rate */}
                <TableCell className="text-right hidden md:table-cell tabular-nums">
                  {entry.winRate != null ? (
                    <span
                      className={cn(
                        'text-sm font-medium',
                        entry.winRate >= 60
                          ? 'text-green-500'
                          : entry.winRate >= 45
                          ? 'text-foreground'
                          : 'text-rose-500',
                      )}
                    >
                      {entry.winRate.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>

                {/* Sharpe */}
                <TableCell className="text-right hidden lg:table-cell tabular-nums">
                  {entry.sharpeRatio != null ? (
                    <span className="text-sm text-muted-foreground">
                      {entry.sharpeRatio.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-3">
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
};

export default LeaderboardTable;
