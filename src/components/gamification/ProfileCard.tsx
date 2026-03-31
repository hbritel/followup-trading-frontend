import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Copy, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { gamificationService } from '@/services/gamification.service';
import { cn } from '@/lib/utils';
import type { GamificationProfileDto, BadgeDto } from '@/types/dto';
import { Award } from 'lucide-react';

const LEVEL_COLORS: Record<string, string> = {
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

interface ProfileCardProps {
  profile: GamificationProfileDto;
  recentBadges?: BadgeDto[];
  className?: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, recentBadges = [], className }) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const username = profile.username ?? 'anonymous';
  const levelBgClass = LEVEL_COLORS[profile.levelName?.toUpperCase()] ?? LEVEL_COLORS.ROOKIE;

  const handleDownload = async () => {
    if (!profile.username) {
      toast({ title: t('gamification.username', 'Set a username first'), variant: 'destructive' });
      return;
    }
    try {
      const url = gamificationService.getProfileCardUrl(profile.username);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${profile.username}-trading-card.png`;
      a.click();
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  const handleCopyLink = async () => {
    if (!profile.username) {
      toast({ title: t('gamification.username', 'Set a username first'), variant: 'destructive' });
      return;
    }
    const link = `${window.location.origin}/p/${profile.username}`;
    await navigator.clipboard.writeText(link);
    toast({ title: t('gamification.copyLink', 'Link copied!') });
  };

  const handleShareX = () => {
    if (!profile.username) return;
    const text = encodeURIComponent(
      `I'm a ${profile.levelName} trader with ${profile.xp.toLocaleString()} XP on FollowUp Trading! Check out my profile:`,
    );
    const url = encodeURIComponent(`${window.location.origin}/p/${profile.username}`);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener');
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Card preview */}
      <div className="bg-gradient-to-br from-[#0c0c10] to-[#1a1a2e] rounded-2xl p-6 border border-white/10 shadow-2xl">
        <div className="flex items-start gap-4 mb-4">
          {/* Level badge */}
          <div
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg flex-shrink-0',
              levelBgClass,
            )}
          >
            {profile.levelName?.charAt(0) ?? 'R'}
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-lg leading-tight truncate">
              {username === 'anonymous' ? (
                <span className="text-white/40 italic">{t('gamification.username', 'No username set')}</span>
              ) : (
                `@${username}`
              )}
            </h3>
            <p className="text-primary text-sm font-medium">{profile.levelName}</p>
            <p className="text-white/50 text-xs mt-0.5">
              {profile.xp.toLocaleString()} {t('gamification.xp', 'XP')}
            </p>
          </div>
        </div>

        {/* XP bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-white/50 mb-1">
            <span>{t('gamification.level', 'Level')} progress</span>
            <span>{Math.round(profile.xpProgress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700"
              style={{ width: `${profile.xpProgress}%` }}
            />
          </div>
        </div>

        {/* Top badges */}
        {recentBadges.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {recentBadges.slice(0, 6).map((badge) => (
              <div
                key={badge.badgeType}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                title={badge.title}
              >
                <Award className="w-4 h-4 text-amber-400" />
              </div>
            ))}
            {profile.badgeCount > 6 && (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/60 font-medium">
                +{profile.badgeCount - 6}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-w-[120px]"
          onClick={handleDownload}
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          {t('gamification.downloadCard', 'Download Card')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-w-[120px]"
          onClick={handleCopyLink}
        >
          <Copy className="w-3.5 h-3.5 mr-1.5" />
          {t('gamification.copyLink', 'Copy Link')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-w-[120px]"
          onClick={handleShareX}
        >
          <Twitter className="w-3.5 h-3.5 mr-1.5" />
          {t('gamification.shareOnX', 'Share on X')}
        </Button>
      </div>
    </div>
  );
};

export default ProfileCard;
