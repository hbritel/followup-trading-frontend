import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Award, Loader2, TrendingUp, BarChart2, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePublicProfile } from '@/hooks/useGamification';
import BadgeCard from '@/components/gamification/BadgeCard';

const LEVEL_COLORS: Record<string, string> = {
  ROOKIE: 'bg-slate-500',
  APPRENTICE: 'bg-blue-600',
  TRADER: 'bg-green-600',
  SKILLED: 'bg-amber-500',
  ADVANCED: 'bg-violet-600',
  EXPERT: 'bg-rose-500',
  MASTER: 'bg-indigo-600',
  ELITE: 'bg-amber-400',
  LEGEND: 'bg-gradient-to-r from-amber-400 to-violet-500',
  GOAT: 'bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-400',
};

const PublicProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { t } = useTranslation();
  const { data: profile, isLoading, isError } = usePublicProfile(username);

  const levelBgClass =
    LEVEL_COLORS[profile?.levelName?.toUpperCase() ?? ''] ?? LEVEL_COLORS.ROOKIE;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050506] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-[#050506] flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">404</h1>
          <p className="text-muted-foreground text-lg">
            {t('gamification.profileNotFound', 'Profile not found')}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            @{username} has not set up a public profile
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/">{t('gamification.joinCta', 'Join FollowUp Trading')}</Link>
        </Button>
      </div>
    );
  }

  const unlockedBadges = profile.badges.filter((b) => b.unlockedAt !== null);

  return (
    <div className="min-h-screen bg-[#050506] py-12 px-4">
      {/* Ambient blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[45%] h-[45%] rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-amber-500/8 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto space-y-8">

        {/* Profile header */}
        <div className="text-center space-y-4">
          {/* Level circle */}
          <div className="flex justify-center">
            <div
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-2xl',
                levelBgClass,
              )}
            >
              {profile.levelName?.charAt(0) ?? 'R'}
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white">@{profile.username}</h1>
            <p className="text-violet-400 font-medium mt-1">{profile.levelName}</p>
            <p className="text-muted-foreground text-sm mt-0.5">
              {profile.xp.toLocaleString()} {t('gamification.xp', 'XP')}
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/8 rounded-2xl p-4 text-center">
            <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{profile.winRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Win Rate</p>
          </div>
          <div className="bg-white/5 border border-white/8 rounded-2xl p-4 text-center">
            <BarChart2 className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{profile.sharpeRatio.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Sharpe Ratio</p>
          </div>
          <div className="bg-white/5 border border-white/8 rounded-2xl p-4 text-center">
            <Hash className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{profile.totalTrades}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Trades</p>
          </div>
        </div>

        {/* Badges */}
        {unlockedBadges.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="text-white font-semibold">
                {t('gamification.badges', 'Badges')} ({unlockedBadges.length})
              </h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {unlockedBadges.map((badge) => (
                <BadgeCard key={badge.badgeType} badge={badge} />
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center border-t border-white/8 pt-8 space-y-3">
          <p className="text-muted-foreground text-sm">
            Track your own trading performance and compete with others
          </p>
          <Button asChild className="bg-violet-600 hover:bg-violet-500">
            <Link to="/auth/signup">
              {t('gamification.joinCta', 'Join FollowUp Trading')}
            </Link>
          </Button>
        </div>

      </div>
    </div>
  );
};

export default PublicProfile;
