import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Loader2, BookOpen, Search } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import StrategyCard from '@/components/social/StrategyCard';
import ShareStrategyDialog from '@/components/social/ShareStrategyDialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useMarketplace, useLikeStrategy, useCopyStrategy } from '@/hooks/useSocial';
import { toast } from '@/hooks/use-toast';

type SortType = 'popular' | 'recent';

const StrategyMarketplace: React.FC = () => {
  const { t } = useTranslation();
  const [sort, setSort] = useState<SortType>('popular');
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = `${t('social.marketplace')} | FollowUp Trading`;
  }, [t]);

  const { data: strategies, isLoading, isError } = useMarketplace(sort);

  const filteredStrategies = useMemo(() => {
    if (!strategies) return [];
    const q = search.trim().toLowerCase();
    if (!q) return strategies;
    return strategies.filter((s) => s.name.toLowerCase().includes(q));
  }, [strategies, search]);
  const likeMutation = useLikeStrategy();
  const copyMutation = useCopyStrategy();

  const handleLike = (strategyId: string, isLiked: boolean) => {
    likeMutation.mutate({ strategyId, isLiked });
  };

  const handleCopy = async (strategyId: string) => {
    try {
      await copyMutation.mutateAsync(strategyId);
      toast({ title: t('social.copySuccess') });
    } catch {
      toast({ title: t('common.error'), description: t('social.copyError'), variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout pageTitle={t('social.marketplace')}>
      <PageTransition className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-primary" />
              {t('social.marketplace')}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t('social.marketplaceSubtitle')}
            </p>
          </div>
          <ShareStrategyDialog />
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('social.searchStrategies', 'Search strategies...')}
              className="pl-9"
            />
          </div>
          <Tabs value={sort} onValueChange={(v) => setSort(v as SortType)}>
            <TabsList>
              <TabsTrigger value="popular">{t('social.popular')}</TabsTrigger>
              <TabsTrigger value="recent">{t('social.recent')}</TabsTrigger>
            </TabsList>
          </Tabs>
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
        {!isLoading && !isError && filteredStrategies.length === 0 && (
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-white">{t('social.emptyMarketplaceTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('social.emptyMarketplaceDesc')}</p>
            </div>
          </div>
        )}

        {/* Strategy grid */}
        {!isLoading && filteredStrategies.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStrategies.map((strategy) => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                onLike={handleLike}
                onCopy={handleCopy}
                isLikePending={likeMutation.isPending}
                isCopyPending={copyMutation.isPending}
              />
            ))}
          </div>
        )}
      </PageTransition>
    </DashboardLayout>
  );
};

export default StrategyMarketplace;
