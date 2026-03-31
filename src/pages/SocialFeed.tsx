import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Rss, Loader2, Users, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import FeedItem from '@/components/social/FeedItem';
import { useFeed } from '@/hooks/useSocial';

const SocialFeed: React.FC = () => {
  const { t } = useTranslation();
  const { data: feedItems, isLoading, isError, refetch } = useFeed();

  useEffect(() => {
    document.title = `${t('social.feed')} | FollowUp Trading`;
  }, [t]);

  return (
    <DashboardLayout pageTitle={t('social.feed')}>
      <PageTransition className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Rss className="w-6 h-6 text-primary" />
              {t('social.feed')}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t('social.feedSubtitle')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t('common.refresh', 'Refresh')}
          </Button>
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
        {!isLoading && !isError && (!feedItems || feedItems.length === 0) && (
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-white">{t('social.emptyFeedTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('social.emptyFeedDesc')}</p>
            </div>
          </div>
        )}

        {/* Feed items */}
        {!isLoading && feedItems && feedItems.length > 0 && (
          <div className="flex flex-col gap-3">
            {feedItems.map((item) => (
              <FeedItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </PageTransition>
    </DashboardLayout>
  );
};

export default SocialFeed;
