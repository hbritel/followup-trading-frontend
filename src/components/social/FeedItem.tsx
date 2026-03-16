import React from 'react';
import { BookOpen, Trophy, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { FeedItemDto } from '@/types/dto';

interface FeedItemProps {
  item: FeedItemDto;
}

const TYPE_CONFIG = {
  STRATEGY_SHARED: { icon: BookOpen, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  BADGE_EARNED: { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  MILESTONE: { icon: Star, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
} as const;

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

const FeedItem: React.FC<FeedItemProps> = ({ item }) => {
  const config = TYPE_CONFIG[item.type];
  const Icon = config.icon;

  return (
    <div className="glass-card rounded-2xl p-4 flex items-start gap-4">
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-violet-700/30 border border-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-300 select-none">
        {item.username.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-white text-sm">{item.username}</span>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-violet-500/30 text-violet-400"
          >
            {item.level}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
            {timeAgo(item.createdAt)}
          </span>
        </div>

        <p className="text-sm text-muted-foreground mt-1 break-words">{item.content}</p>
      </div>

      {/* Type icon badge */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}
      >
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
    </div>
  );
};

export default FeedItem;
