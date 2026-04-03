import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sparkles } from 'lucide-react';
import BadgeCard from './BadgeCard';
import { BADGE_TARGETS } from './badgeConstants';
import type { BadgeDto } from '@/types/dto';
import { cn } from '@/lib/utils';

interface BadgeGridProps {
  badges: BadgeDto[];
  /** Approximate count of trades the user has completed — used to derive progress on trade-count badges */
  tradeCount?: number;
}

type CategoryFilter = 'ALL' | 'TRADING' | 'DISCIPLINE' | 'PERFORMANCE';

/** Derive a 0-100 progress value + hint string for locked badges that have a known target */
function deriveBadgeProgress(
  badge: BadgeDto,
  tradeCount: number,
): { progressPercent: number; progressHint: string } | undefined {
  const target = BADGE_TARGETS[badge.badgeType];
  if (!target || tradeCount <= 0) return undefined;
  const pct = Math.min(99, Math.round((tradeCount / target) * 100));
  const remaining = Math.max(1, target - tradeCount);
  return { progressPercent: pct, progressHint: `${remaining} more trades` };
}

/** Returns true if badge was unlocked within the past 30 days */
function isRecentlyUnlocked(badge: BadgeDto): boolean {
  if (!badge.unlockedAt) return false;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return new Date(badge.unlockedAt).getTime() > thirtyDaysAgo;
}

const BadgeGrid: React.FC<BadgeGridProps> = ({ badges, tradeCount = 0 }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CategoryFilter>('ALL');

  const recentlyUnlocked = badges.filter(isRecentlyUnlocked);

  const filtered =
    activeTab === 'ALL' ? badges : badges.filter((b) => b.category === activeTab);

  const tabs: { value: CategoryFilter; label: string; color: string }[] = [
    { value: 'ALL', label: t('gamification.all', 'All'), color: '' },
    {
      value: 'TRADING',
      label: t('gamification.trading', 'Trading'),
      color: 'data-[state=active]:text-amber-400',
    },
    {
      value: 'DISCIPLINE',
      label: t('gamification.discipline', 'Discipline'),
      color: 'data-[state=active]:text-blue-400',
    },
    {
      value: 'PERFORMANCE',
      label: t('gamification.performance', 'Performance'),
      color: 'data-[state=active]:text-emerald-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Recently unlocked strip */}
      {recentlyUnlocked.length > 0 && (
        <section aria-label={t('gamification.recentlyUnlocked', 'Recently Unlocked')}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-foreground">
              {t('gamification.recentlyUnlocked', 'Recently Unlocked')}
            </h3>
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-400/15 text-amber-400 text-[10px] font-bold">
              {recentlyUnlocked.length}
            </span>
          </div>

          {/* Horizontal scroll strip */}
          <div
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
            role="list"
            aria-label={t('gamification.recentlyUnlocked', 'Recently Unlocked')}
          >
            {recentlyUnlocked.map((badge) => (
              <div
                key={badge.badgeType}
                role="listitem"
                className="flex-shrink-0 w-44 snap-start"
              >
                <BadgeCard badge={badge} size="featured" showNewPill />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Category tabs + grid */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CategoryFilter)}>
        <TabsList className="mb-4">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn('transition-colors duration-150', tab.color)}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">
                {t('common.noData')}
              </p>
            ) : (
              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3"
                role="list"
                aria-label={`${tab.label} ${t('gamification.badges', 'badges')}`}
              >
                {filtered.map((badge) => {
                  const progress =
                    badge.unlockedAt === null
                      ? deriveBadgeProgress(badge, tradeCount)
                      : undefined;
                  return (
                    <div key={badge.badgeType} role="listitem">
                      <BadgeCard
                        badge={badge}
                        progressPercent={progress?.progressPercent}
                        progressHint={progress?.progressHint}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default BadgeGrid;
