import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, MessageCircle, Rss, Newspaper, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { MarketFeedItemDto, MarketFeedSource } from '@/types/dto';
import { formatDistanceToNow } from 'date-fns';

interface FeedCardProps {
  item: MarketFeedItemDto;
}

const SOURCE_CONFIG: Record<MarketFeedSource, { icon: React.ElementType; color: string; label: string }> = {
  REDDIT: { icon: MessageCircle, color: 'text-orange-500', label: 'Reddit' },
  TWITTER: { icon: MessageCircle, color: 'text-sky-500', label: 'Twitter' },
  RSS: { icon: Rss, color: 'text-green-500', label: 'RSS' },
  NEWS_API: { icon: Newspaper, color: 'text-indigo-500', label: 'News' },
};

const SENTIMENT_CONFIG = {
  BULLISH: {
    icon: TrendingUp,
    label: 'Bullish',
    className: 'text-green-600 bg-green-500/10 border-green-500/20',
  },
  BEARISH: {
    icon: TrendingDown,
    label: 'Bearish',
    className: 'text-red-500 bg-red-500/10 border-red-500/20',
  },
  NEUTRAL: {
    icon: Minus,
    label: 'Neutral',
    className: 'text-muted-foreground bg-muted border-border',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  FOREX: 'Forex',
  CRYPTO: 'Crypto',
  STOCKS: 'Stocks',
  COMMODITIES: 'Commodities',
  MACRO: 'Macro',
  ALL: 'General',
};

function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return '';
  }
}

const FeedCard: React.FC<FeedCardProps> = ({ item }) => {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);
  const src = SOURCE_CONFIG[item.source] ?? SOURCE_CONFIG.NEWS_API;
  const SourceIcon = src.icon;
  const showImage = item.imageUrl && !imgError;

  const handleClick = () => {
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="article"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={[
        'glass-card rounded-2xl p-4 border border-border',
        'cursor-pointer transition-all duration-200',
        'hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/10',
        'hover:border-primary/20',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        'break-inside-avoid mb-4',
      ].join(' ')}
    >
      {/* Top row: source icon + meta + category */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <SourceIcon className={`w-4 h-4 ${src.color}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-foreground">{src.label}</span>
              {item.subreddit && (
                <span className="text-xs text-muted-foreground">r/{item.subreddit}</span>
              )}
              {item.author && (
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  @{item.author}
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground">{timeAgo(item.publishedAt)}</span>
          </div>
        </div>
        <span className="flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
          {CATEGORY_LABELS[item.category] ?? item.category}
        </span>
      </div>

      {/* Optional image — hidden on load error */}
      {showImage && (
        <div className="mb-3 rounded-xl overflow-hidden bg-muted aspect-video">
          <img
            src={item.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        </div>
      )}

      {/* Title */}
      <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1.5 leading-snug">
        {item.title}
      </h3>

      {/* Summary */}
      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-3">
        {item.summary}
      </p>

      {/* Bottom row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Sentiment pill */}
          {item.sentiment && (() => {
            const s = SENTIMENT_CONFIG[item.sentiment];
            const SIcon = s.icon;
            return (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${s.className}`}
                aria-label={t(`marketFeed.sentiment.${item.sentiment.toLowerCase()}`, s.label)}
              >
                <SIcon className="w-3 h-3" aria-hidden="true" />
                {s.label}
              </span>
            );
          })()}

          {/* Symbol badges */}
          {item.symbols && item.symbols.slice(0, 4).map((sym) => (
            <span
              key={sym}
              className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border"
            >
              {sym}
            </span>
          ))}
          {item.symbols && item.symbols.length > 4 && (
            <span className="text-[10px] text-muted-foreground">
              +{item.symbols.length - 4}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Score */}
          {item.score !== undefined && item.score > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {item.score >= 1000 ? `${(item.score / 1000).toFixed(1)}k` : item.score}
            </span>
          )}
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};

export default FeedCard;
