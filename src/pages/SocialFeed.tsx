import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Newspaper,
  RefreshCw,
  Settings2,
  TrendingUp,
  BarChart2,
  Plus,
  MessageCircle,
  Rss,
  Globe,
  Loader2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import FeedCard from '@/components/marketfeed/FeedCard';
import { useMarketFeed, useMarketFeedSources, useToggleFeedSource, useDeleteFeedSource, useRecommendedSources, useSubscribeToSource } from '@/hooks/useMarketFeed';
import { marketFeedService } from '@/services/marketfeed.service';
import { useQueryClient } from '@tanstack/react-query';
import type { MarketFeedCategory, MarketFeedItemDto } from '@/types/dto';
import { useIsMobile } from '@/hooks/use-mobile';

// ── Category filter configuration ────────────────────────────────────────────

type ActiveTab = MarketFeedCategory | 'DISCOVER';

const CATEGORIES: { value: ActiveTab; labelKey: string; fallback: string; icon?: React.ElementType }[] = [
  { value: 'ALL',         labelKey: 'marketFeed.category.all',         fallback: 'All' },
  { value: 'FOREX',       labelKey: 'marketFeed.category.forex',       fallback: 'Forex' },
  { value: 'CRYPTO',      labelKey: 'marketFeed.category.crypto',      fallback: 'Crypto' },
  { value: 'STOCKS',      labelKey: 'marketFeed.category.stocks',      fallback: 'Stocks' },
  { value: 'COMMODITIES', labelKey: 'marketFeed.category.commodities', fallback: 'Commodities' },
  { value: 'MACRO',       labelKey: 'marketFeed.category.macro',       fallback: 'Macro' },
  { value: 'DISCOVER',    labelKey: 'marketFeed.category.discover',    fallback: 'Discover' },
];

// ── Skeleton card ─────────────────────────────────────────────────────────────

const FeedCardSkeleton: React.FC = () => (
  <div className="glass-card rounded-2xl p-4 border border-border break-inside-avoid mb-4 animate-pulse">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-lg bg-muted" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-2.5 w-16 rounded bg-muted" />
      </div>
      <div className="h-5 w-14 rounded-full bg-muted" />
    </div>
    <div className="h-4 w-full rounded bg-muted mb-1.5" />
    <div className="h-4 w-3/4 rounded bg-muted mb-3" />
    <div className="space-y-1.5">
      <div className="h-3 w-full rounded bg-muted" />
      <div className="h-3 w-5/6 rounded bg-muted" />
      <div className="h-3 w-2/3 rounded bg-muted" />
    </div>
  </div>
);

// ── Trending symbols sidebar panel ────────────────────────────────────────────

interface TrendingSymbolsProps {
  items: MarketFeedItemDto[];
}

const TrendingSymbols: React.FC<TrendingSymbolsProps> = ({ items }) => {
  const { t } = useTranslation();

  const trendingSymbols = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      if (!item.symbols) continue;
      for (const sym of item.symbols) {
        counts[sym] = (counts[sym] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [items]);

  if (trendingSymbols.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          {t('marketFeed.trending.title', 'Trending Symbols')}
        </h3>
      </div>
      <ul className="space-y-2">
        {trendingSymbols.map(([sym, count], idx) => (
          <li key={sym} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground w-4 text-right">{idx + 1}</span>
              <span className="text-xs font-mono font-semibold text-foreground">{sym}</span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {count} {t('marketFeed.trending.mentions', 'mentions')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ── Source settings panel ─────────────────────────────────────────────────────

const SourceSettings: React.FC<{ onSourceChange?: () => void }> = ({ onSourceChange }) => {
  const { t } = useTranslation();
  const { data: sources, isLoading } = useMarketFeedSources();
  const { mutate: toggleSource } = useToggleFeedSource();
  const deleteMutation = useDeleteFeedSource();
  const subscribeMutation = useSubscribeToSource();
  const [showAddForm, setShowAddForm] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [customType, setCustomType] = useState<'REDDIT' | 'RSS' | 'TWITTER'>('RSS');

  const handleAddCustom = () => {
    if (!customLabel.trim() || !customKey.trim()) return;
    const sourceKey = customType === 'REDDIT' ? customKey.replace(/^r\//, '') : customKey;
    subscribeMutation.mutate(
      { source: customType, sourceKey, label: customLabel, categories: ['ALL' as any] },
      { onSuccess: () => { setCustomLabel(''); setCustomKey(''); setShowAddForm(false); } },
    );
  };

  return (
    <div className="glass-card rounded-2xl p-4 border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {t('marketFeed.sources.title', 'My Sources')}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          {t('marketFeed.sources.add', 'Add')}
        </Button>
      </div>

      {/* Add custom source form */}
      {showAddForm && (
        <div className="space-y-2 p-3 rounded-xl bg-muted/50 border border-border">
          <div className="flex gap-2">
            {(['RSS', 'REDDIT', 'TWITTER'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setCustomType(type)}
                className={cn(
                  'text-[10px] px-2 py-1 rounded-full font-medium transition-colors',
                  customType === type ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {type === 'REDDIT' ? 'Reddit' : type === 'TWITTER' ? 'X / Twitter' : 'RSS'}
              </button>
            ))}
          </div>
          <input
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder={t('marketFeed.sources.labelPlaceholder', 'Name (e.g. r/forex)')}
            className="w-full h-8 text-xs rounded-lg border border-border bg-background px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
            placeholder={
              customType === 'REDDIT' ? 'forex' :
              customType === 'TWITTER' ? '@username' :
              'https://example.com/rss.xml'
            }
            className="w-full h-8 text-xs rounded-lg border border-border bg-background px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button
            size="sm"
            className="w-full h-7 text-xs"
            disabled={!customLabel.trim() || !customKey.trim() || subscribeMutation.isPending}
            onClick={handleAddCustom}
          >
            {subscribeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : t('marketFeed.sources.addSource', 'Add source')}
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-5 w-9 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (!sources || sources.length === 0) && (
        <p className="text-xs text-muted-foreground">
          {t('marketFeed.sources.empty', 'No sources configured. Add one above or use recommended sources.')}
        </p>
      )}

      {sources && sources.length > 0 && (
        <ul className="space-y-2">
          {sources.map((src) => {
            const Icon = SOURCE_ICONS[src.source] ?? Newspaper;
            const colorClass = SOURCE_COLORS[src.source] ?? 'text-muted-foreground';
            return (
              <li key={src.id} className="flex items-center gap-2">
                <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', colorClass.split(' ')[0])} />
                <span className="text-xs text-foreground flex-1 truncate" title={src.label}>
                  {src.label}
                </span>
                <Switch
                  checked={src.enabled}
                  onCheckedChange={(enabled) => {
                    toggleSource({ sourceId: src.id, enabled });
                    onSourceChange?.();
                  }}
                  aria-label={`Toggle ${src.label}`}
                  className="scale-75"
                />
                <button
                  onClick={() => deleteMutation.mutate(src.id, { onSuccess: () => onSourceChange?.() })}
                  className="text-muted-foreground/50 hover:text-destructive transition-colors p-0.5"
                  aria-label={`Delete ${src.label}`}
                  title={t('common.delete', 'Delete')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// ── Source icon helper ───────────────────────────────────────────────────────

const SOURCE_ICONS: Record<string, React.ElementType> = {
  REDDIT: MessageCircle,
  TWITTER: Globe,
  RSS: Rss,
  NEWS_API: Newspaper,
};

const SOURCE_COLORS: Record<string, string> = {
  REDDIT: 'text-orange-500 bg-orange-500/10',
  TWITTER: 'text-sky-500 bg-sky-500/10',
  RSS: 'text-emerald-500 bg-emerald-500/10',
  NEWS_API: 'text-indigo-500 bg-indigo-500/10',
};

// ── Feed Onboarding (shown when feed is empty) ──────────────────────────────

const FeedOnboarding: React.FC<{ onSourceChange?: () => void }> = ({ onSourceChange }) => {
  const { t } = useTranslation();
  const { data: recommended, isLoading: recLoading } = useRecommendedSources();
  const { data: existingSources } = useMarketFeedSources();
  const subscribeMutation = useSubscribeToSource();

  // Pre-populate with already-subscribed sourceKeys so they show as checked
  const existingKeys = useMemo(() => {
    const keys = new Set<string>();
    (existingSources ?? []).forEach((s) => keys.add(s.source + ':' + s.sourceKey));
    return keys;
  }, [existingSources]);
  const [localSubscribed, setLocalSubscribed] = useState<Set<string>>(new Set());
  const isSubscribed = (rec: { source: string; sourceKey: string }) =>
    localSubscribed.has(rec.sourceKey) || existingKeys.has(rec.source + ':' + rec.sourceKey);

  const handleSubscribe = (rec: { source: string; sourceKey: string; label: string; categories: string[] }) => {
    subscribeMutation.mutate(
      {
        source: rec.source as any,
        sourceKey: rec.sourceKey,
        label: rec.label,
        categories: rec.categories as any[],
      },
      {
        onSuccess: () => {
          setLocalSubscribed((prev) => new Set(prev).add(rec.sourceKey));
        },
      },
    );
  };

  return (
    <div className="glass-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 text-center">
        <div className="mx-auto mb-3 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground">
          {t('marketFeed.onboarding.title', 'Set up your Market Feed')}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          {t('marketFeed.onboarding.desc', 'Based on your trading activity, we recommend these sources. Subscribe to start receiving news.')}
        </p>
      </div>

      {/* Recommended sources */}
      <div className="px-6 pb-6">
        {recLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !recommended || recommended.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>{t('marketFeed.onboarding.noRec', 'No recommendations yet. Start trading to get personalized sources.')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommended.map((rec) => {
              const Icon = SOURCE_ICONS[rec.source] ?? Newspaper;
              const colorClass = SOURCE_COLORS[rec.source] ?? 'text-muted-foreground bg-muted';
              const alreadySubscribed = isSubscribed(rec);

              return (
                <div
                  key={rec.sourceKey}
                  className={cn(
                    'rounded-xl border p-4 flex items-start gap-3 transition-all duration-200',
                    alreadySubscribed
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border hover:border-border/80 hover:bg-muted/30',
                  )}
                >
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{rec.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{rec.reason}</p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {rec.categories.map((cat: string) => (
                        <span
                          key={cat}
                          className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={alreadySubscribed ? 'ghost' : 'default'}
                    className="flex-shrink-0 h-8"
                    disabled={alreadySubscribed || subscribeMutation.isPending}
                    onClick={() => handleSubscribe(rec)}
                  >
                    {alreadySubscribed ? (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    ) : subscribeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        {t('marketFeed.onboarding.subscribe', 'Add')}
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {localSubscribed.size > 0 && (
          <div className="mt-4 text-center">
            <Button
              onClick={() => onSourceChange?.()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {t('marketFeed.onboarding.loadFeed', 'Load my feed')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const SocialFeed: React.FC = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>('ALL');
  const [page, setPage] = useState(0);
  const [allItems, setAllItems] = useState<MarketFeedItemDto[]>([]);

  const isDiscoverMode = activeTab === 'DISCOVER';
  const feedCategory = isDiscoverMode ? 'ALL' : activeTab as MarketFeedCategory;

  const { data: sourcesData } = useMarketFeedSources();
  const hasSources = (sourcesData ?? []).filter(s => s.enabled).length > 0;

  // Only fetch feed when not in discover mode
  const { data, isLoading, isFetching, isError, refetch, dataUpdatedAt } = useMarketFeed(feedCategory, page);

  // Accumulate items across pages; reset when category or data changes at page 0
  useEffect(() => {
    if (page === 0) {
      setAllItems(data?.items ?? []);
    } else if (data?.items) {
      setAllItems((prev) => [...prev, ...data.items]);
    }
  }, [data, page]);

  // Reset pagination on tab change — only if actually changing
  const handleTabChange = (tab: ActiveTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    if (tab !== 'DISCOVER') {
      setPage(0);
      setAllItems([]);
    }
  };

  // Reset feed when sources change (add/delete/toggle) or user clicks Refresh
  const resetFeed = useCallback(async () => {
    setPage(0);
    setAllItems([]);
    // 1. Bust server-side Redis cache
    try {
      await marketFeedService.getFeed({ category: feedCategory, page: 0, size: 1, refresh: true });
    } catch { /* ignore */ }
    // 2. Remove React Query cache entirely so it's forced to re-fetch
    queryClient.removeQueries({ queryKey: ['market-feed'] });
    // 3. Re-fetch — after removeQueries, useMarketFeed will trigger a fresh fetch
    refetch();
  }, [feedCategory, queryClient, refetch]);

  const totalPages = data?.totalPages ?? 1;
  const hasMore = page < totalPages - 1;

  const lastUpdated = useMemo(() => {
    if (!dataUpdatedAt) return null;
    try {
      return new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return null;
    }
  }, [dataUpdatedAt]);

  useEffect(() => {
    document.title = `${t('marketFeed.title', 'Market Feed')} | FollowUp Trading`;
  }, [t]);

  // ── Sidebar content (shared between desktop panel and mobile sheet) ──────────

  const SidebarContent = (
    <div className="flex flex-col gap-4">
      <TrendingSymbols items={allItems} />
      <SourceSettings onSourceChange={resetFeed} />
    </div>
  );

  return (
    <DashboardLayout pageTitle={t('marketFeed.title', 'Market Feed')}>
      <PageTransition className="flex flex-col gap-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Newspaper className="w-6 h-6 text-primary" />
              {t('marketFeed.title', 'Market Feed')}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t('marketFeed.subtitle', 'Real-time financial news from Reddit, Twitter, RSS and more')}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                {t('marketFeed.live', 'Live')}
              </span>
              {lastUpdated && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  &middot; {t('marketFeed.updatedAt', 'Updated')} {lastUpdated}
                </span>
              )}
            </div>

            {/* Mobile: source settings sheet trigger */}
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" aria-label={t('marketFeed.sidebarTitle', 'Feed Settings')}>
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 overflow-y-auto">
                  <SheetHeader className="mb-4">
                    <SheetTitle>{t('marketFeed.sidebarTitle', 'Feed Settings')}</SheetTitle>
                  </SheetHeader>
                  {SidebarContent}
                </SheetContent>
              </Sheet>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPage(0);
                setAllItems([]);
                refetch();
              }}
              disabled={isFetching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              {t('common.refresh', 'Refresh')}
            </Button>
          </div>
        </div>

        {/* ── Category filter bar ── */}
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label={t('marketFeed.categoryFilter', 'Category filter')}>
          {CATEGORIES.map(({ value, labelKey, fallback }) => {
            const isActive = activeTab === value;
            const isDiscover = value === 'DISCOVER';
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleTabChange(value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150',
                  'border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                  isActive
                    ? isDiscover
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20'
                      : 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                    : isDiscover
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/20'
                      : 'bg-muted text-muted-foreground border-border hover:border-primary/40 hover:text-foreground',
                )}
                aria-pressed={isActive}
              >
                {isDiscover && <Sparkles className="w-3.5 h-3.5 inline mr-1" />}
                {t(labelKey, fallback)}
              </button>
            );
          })}
        </div>

        {/* ── Main layout: feed + sidebar ── */}
        <div className="flex gap-6 items-start">

          {/* ── Feed area ── */}
          <div className="flex-1 min-w-0">

            {/* DISCOVER tab — always shows onboarding/recommendations */}
            {isDiscoverMode && (
              <FeedOnboarding onSourceChange={() => { handleTabChange('ALL'); resetFeed(); }} />
            )}

            {/* Feed content — only when NOT in discover mode */}
            {!isDiscoverMode && (
              <>
                {/* Error state */}
                {isError && (
                  <div className="glass-card rounded-2xl p-8 text-center border border-border">
                    <p className="text-muted-foreground">{t('common.errorLoading', 'Failed to load. Please try again.')}</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                      {t('common.retry', 'Retry')}
                    </Button>
                  </div>
                )}

                {/* Skeleton loading — initial load only */}
                {isLoading && allItems.length === 0 && (
                  <div className="xl:columns-2 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <FeedCardSkeleton key={i} />
                    ))}
                  </div>
                )}

                {/* Empty state — no sources → nudge to Discover tab */}
                {!isLoading && !isError && allItems.length === 0 && !hasSources && (
                  <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-4 text-center border border-border">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {t('marketFeed.empty.noSources', 'No sources configured')}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('marketFeed.empty.goDiscover', 'Click the Discover tab to find and add sources based on your trading activity.')}
                      </p>
                    </div>
                    <Button onClick={() => handleTabChange('DISCOVER')} className="gap-2">
                      <Sparkles className="w-4 h-4" />
                      {t('marketFeed.category.discover', 'Discover')}
                    </Button>
                  </div>
                )}

                {/* Empty state — sources exist but no items found */}
                {!isLoading && !isError && allItems.length === 0 && hasSources && (
                  <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-4 text-center border border-border">
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                      <Newspaper className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {t('marketFeed.empty.title', 'No news available')}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('marketFeed.empty.descWithSources', 'Your sources are configured but no new items were found. Try refreshing or check back later.')}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {t('common.refresh', 'Refresh')}
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Feed cards — masonry columns (only when not in discover) */}
            {!isDiscoverMode && allItems.length > 0 && (
              <div className="xl:columns-2 gap-4">
                {allItems.map((item) => (
                  <FeedCard key={item.id} item={item} />
                ))}

                {isFetching && page > 0 && (
                  <>
                    <FeedCardSkeleton />
                    <FeedCardSkeleton />
                  </>
                )}
              </div>
            )}

            {/* Load more */}
            {!isDiscoverMode && !isLoading && !isError && allItems.length > 0 && hasMore && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isFetching}
                >
                  {isFetching
                    ? t('common.loading', 'Loading...')
                    : t('marketFeed.loadMore', 'Load more')}
                </Button>
              </div>
            )}
          </div>

          {/* ── Desktop sidebar ── */}
          {!isMobile && (
            <aside className="hidden lg:flex flex-col gap-4 w-64 flex-shrink-0 sticky top-6">
              {SidebarContent}
            </aside>
          )}
        </div>

      </PageTransition>
    </DashboardLayout>
  );
};

export default SocialFeed;
