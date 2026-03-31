import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Loader2, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import BadgeGrid from '@/components/gamification/BadgeGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBadges, useGamificationProfile } from '@/hooks/useGamification';

const Badges: React.FC = () => {
  const { t } = useTranslation();
  const { data: badges, isLoading: badgesLoading, isError: badgesError, refetch: refetchBadges } = useBadges();
  const { data: profile, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = useGamificationProfile();

  const isLoading = badgesLoading || profileLoading;
  const isError = badgesError || profileError;

  const unlockedCount = badges?.filter((b) => b.unlockedAt !== null).length ?? 0;
  const totalCount = badges?.length ?? 0;

  const handleRetry = () => {
    refetchBadges();
    refetchProfile();
  };

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
              {t('gamification.achievementsSubtitle', 'Unlock badges by improving your trading habits and performance')}
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
                <p className="text-xl font-bold text-primary">
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
          ) : isError ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <div>
                  <p className="font-medium">{t('common.errorLoading')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('common.tryAgain')}</p>
                </div>
                <Button variant="outline" onClick={handleRetry}>
                  {t('common.retry')}
                </Button>
              </CardContent>
            </Card>
          ) : badges && badges.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/10 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-white">{t('gamification.noBadgesTitle', 'Start trading to earn badges')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('gamification.noBadgesDesc', 'Complete trades and improve your habits to unlock achievements')}</p>
              </div>
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
