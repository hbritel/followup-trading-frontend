import React from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import LeaderboardTable from '@/components/gamification/LeaderboardTable';
import { useGamificationProfile } from '@/hooks/useGamification';

const Leaderboard: React.FC = () => {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useGamificationProfile();

  return (
    <DashboardLayout pageTitle={t('gamification.leaderboard', 'Leaderboard')}>
      <PageTransition className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-violet-400" />
              {t('gamification.leaderboard', 'Leaderboard')}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Compare your performance with the community
            </p>
          </div>

          {/* Current user rank highlight */}
          {!isLoading && profile && (
            <div className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-3">
              <div>
                <p className="text-xs text-muted-foreground">{t('gamification.yourRank', 'Your Rank')}</p>
                <p className="text-sm font-semibold text-violet-400">
                  {profile.levelName}
                </p>
              </div>
              <div className="border-l border-white/10 pl-3">
                <p className="text-xs text-muted-foreground">{t('gamification.xp', 'XP')}</p>
                <p className="text-sm font-semibold text-white">{profile.xp.toLocaleString()}</p>
              </div>
            </div>
          )}

          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Table */}
        <LeaderboardTable />

      </PageTransition>
    </DashboardLayout>
  );
};

export default Leaderboard;
