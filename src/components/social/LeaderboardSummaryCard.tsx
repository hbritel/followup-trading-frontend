import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import type { LeaderboardEntryDto } from '@/types/dto';
import { cn } from '@/lib/utils';
import VerifiedBadge from '@/components/social/VerifiedBadge';

const RANK_MEDALS = ['', '\u{1F947}', '\u{1F948}', '\u{1F949}'] as const;

interface LeaderboardSummaryCardProps {
  readonly type: string;
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly entries: LeaderboardEntryDto[];
  readonly onViewAll: () => void;
}

function CompactEntry({ entry }: { readonly entry: LeaderboardEntryDto }) {
  const medal = RANK_MEDALS[entry.rank] ?? '';

  return (
    <div className="flex items-center gap-3 py-2 px-1 group">
      {/* Rank medal or number */}
      <span className="w-6 text-center flex-shrink-0 text-sm" aria-label={`Rank ${entry.rank}`}>
        {medal || (
          <span className="text-muted-foreground font-mono tabular-nums text-xs">
            {entry.rank}
          </span>
        )}
      </span>

      {/* Username */}
      <Link
        to={`/trader/${entry.username}`}
        className="flex items-center gap-1.5 min-w-0 flex-1 text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
      >
        <span className="truncate">{entry.username}</span>
        {entry.isVerified && <VerifiedBadge className="scale-75 origin-left" />}
      </Link>

      {/* Criteria value */}
      <span className="flex-shrink-0 text-sm font-bold text-foreground tabular-nums">
        {typeof entry.criteriaValue === 'number'
          ? entry.criteriaValue.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : entry.criteriaValue}
      </span>
    </div>
  );
}

const LeaderboardSummaryCard: React.FC<LeaderboardSummaryCardProps> = ({
  type,
  label,
  icon,
  entries,
  onViewAll,
}) => {
  const { t } = useTranslation();

  return (
    <Card className="glass-card rounded-2xl overflow-hidden group hover:shadow-lg hover:shadow-primary/5 transition-shadow duration-300">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <div
            className={cn(
              'flex items-center justify-center w-9 h-9 rounded-xl',
              'bg-primary/10 text-primary',
            )}
          >
            {icon}
          </div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">{label}</h3>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-border/50" />

        {/* Top 3 entries */}
        <div className="px-4 py-1">
          {entries.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t('leaderboard.noEntries', 'No ranked traders yet')}
            </p>
          ) : (
            entries.slice(0, 3).map((entry) => (
              <CompactEntry key={`${type}-${entry.rank}`} entry={entry} />
            ))
          )}
        </div>

        {/* Footer link */}
        {entries.length > 0 && (
          <>
            <div className="mx-5 border-t border-border/50" />
            <button
              type="button"
              onClick={onViewAll}
              className="w-full px-5 py-3 text-xs font-medium text-primary hover:text-primary/80 transition-colors text-center cursor-pointer"
            >
              {t('leaderboard.viewAll', 'View all')} &rarr;
            </button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaderboardSummaryCard;
