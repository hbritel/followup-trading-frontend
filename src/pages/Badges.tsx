import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import BadgeGrid from '@/components/gamification/BadgeGrid';
import { useBadges, useGamificationProfile } from '@/hooks/useGamification';

const Badges: React.FC = () => {
  const { t } = useTranslation();
  const { data: badges, isLoading: badgesLoading } = useBadges();
  const { data: profile, isLoading: profileLoading } = useGamificationProfile();

  const isLoading = badgesLoading || profileLoading;

  const unlockedCount = badges?.filter((b) => b.unlockedAt !== null).length ?? 0;
  const totalCount = badges?.length ?? 0;

  return (
    <DashboardLayout pageTitle={t('gamification.achievements', 'Achievements')}>
      <PageTransition className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              {t('gamification.achievements', 'Achievements')}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Unlock badges by improving your trading habits and performance
            </p>
          </div>

          {/* Summary stats */}
          {!isLoading && profile && (
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xl font-bold text-white">
                  {unlockedCount}
                  <span className="text-muted-foreground text-sm font-normal">/{totalCount}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('gamification.badges', 'Badges')} {t('gamification.unlocked', 'Unlocked')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-violet-400">
                  {profile.xp.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('gamification.xp', 'Total XP')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Badge grid */}
        <div className="glass-card rounded-2xl p-4 md:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <BadgeGrid badges={badges ?? []} />
          )}
        </div>

      </PageTransition>
    </DashboardLayout>
  );
};

export default Badges;
