import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Loader2, Search, Users } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import TraderCard from '@/components/social/TraderCard';
import { Input } from '@/components/ui/input';
import { useTraders, useFollow, useUnfollow } from '@/hooks/useSocial';

const TradersDirectory: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    document.title = 'Traders | FollowUp Trading';
  }, []);

  // Debounce search input by 400ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: traders, isLoading, isError } = useTraders(debouncedSearch || undefined);
  const followMutation = useFollow();
  const unfollowMutation = useUnfollow();

  const isPending = followMutation.isPending || unfollowMutation.isPending;

  return (
    <DashboardLayout pageTitle={t('social.traders')}>
      <PageTransition className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-violet-400" />
            {t('social.traders')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('social.tradersSubtitle')}
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('social.searchTraders')}
            className="pl-9 bg-white/5 border-white/10"
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">{t('common.errorLoading')}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && (!traders || traders.length === 0) && (
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <Users className="w-7 h-7 text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-white">
                {debouncedSearch ? t('social.noTradersFound') : t('social.emptyTradersTitle')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{t('social.emptyTradersDesc')}</p>
            </div>
          </div>
        )}

        {/* Traders grid */}
        {!isLoading && traders && traders.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {traders.map((trader) => (
              <TraderCard
                key={trader.id}
                trader={trader}
                onFollow={(id) => followMutation.mutate(id)}
                onUnfollow={(id) => unfollowMutation.mutate(id)}
                isPending={isPending}
              />
            ))}
          </div>
        )}
      </PageTransition>
    </DashboardLayout>
  );
};

export default TradersDirectory;
