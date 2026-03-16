import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { UserFollowDto } from '@/types/dto';

interface TraderCardProps {
  trader: UserFollowDto;
  onFollow: (userId: string) => void;
  onUnfollow: (userId: string) => void;
  isPending?: boolean;
}

const TraderCard: React.FC<TraderCardProps> = ({ trader, onFollow, onUnfollow, isPending = false }) => {
  const { t } = useTranslation();

  const handleToggle = () => {
    if (trader.isFollowing) {
      onUnfollow(trader.id);
    } else {
      onFollow(trader.id);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 flex items-center justify-between gap-4">
      {/* Avatar + info */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar placeholder */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/40 to-violet-700/40 border border-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-300 select-none">
          {trader.username.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white truncate">{trader.username}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-violet-500/30 text-violet-400">
              {trader.level}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {trader.followerCount.toLocaleString()} {t('social.followers')}
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {trader.badgeCount} {t('social.badges')}
            </span>
          </div>
        </div>
      </div>

      {/* Follow button */}
      <Button
        size="sm"
        variant={trader.isFollowing ? 'default' : 'outline'}
        disabled={isPending}
        onClick={handleToggle}
        className={
          trader.isFollowing
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0'
            : 'flex-shrink-0 border-white/20 text-white hover:bg-white/5'
        }
      >
        {trader.isFollowing ? t('social.following') : t('social.follow')}
      </Button>
    </div>
  );
};

export default TraderCard;
