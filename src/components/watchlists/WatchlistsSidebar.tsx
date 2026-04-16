
import React from 'react';
import { PlusCircle, Edit2, Trash2, List, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { WatchlistResponseDto } from '@/types/dto';

interface WatchlistsSidebarProps {
  watchlists: WatchlistResponseDto[];
  activeWatchlist: string;
  onSelectWatchlist: (id: string) => void;
  onAddWatchlist: () => void;
  onEditWatchlist: (watchlist: WatchlistResponseDto) => void;
  onDeleteWatchlist: (id: string) => void;
}

const WatchlistsSidebar: React.FC<WatchlistsSidebarProps> = ({
  watchlists,
  activeWatchlist,
  onSelectWatchlist,
  onAddWatchlist,
  onEditWatchlist,
  onDeleteWatchlist
}) => {
  const { t } = useTranslation();

  return (
    <Card className="glass-card rounded-2xl lg:col-span-1">
      <CardHeader className="pb-3">
        <CardTitle className="label-caps">{t('watchlists.myWatchlists')}</CardTitle>
        <CardDescription>
          {t('watchlists.watchlistCount', { count: watchlists.length })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {watchlists.map((watchlist) => {
          const isActive = activeWatchlist === watchlist.id;
          const isSuspended = watchlist.suspendedByPlan;
          return (
            <div
              key={watchlist.id}
              className={cn(
                'group flex items-center justify-between rounded-xl px-3 py-2.5 cursor-pointer transition-colors',
                isActive
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-muted/50',
                isSuspended && 'opacity-50'
              )}
              onClick={() => onSelectWatchlist(watchlist.id)}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn(
                  'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                  isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {watchlist.icon ? (
                    <span className="text-lg leading-none">{watchlist.icon}</span>
                  ) : (
                    <List className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isSuspended && (
                      <Lock className="h-3 w-3 text-amber-400 flex-shrink-0" />
                    )}
                    <p className={cn(
                      'text-sm font-medium truncate',
                      isActive && 'text-primary'
                    )}>{watchlist.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('watchlists.symbolCount', { count: watchlist.items.length })}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditWatchlist(watchlist);
                  }}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteWatchlist(watchlist.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
        <Button
          variant="outline"
          className="w-full mt-3 rounded-xl"
          onClick={onAddWatchlist}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {t('watchlists.addWatchlist')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default WatchlistsSidebar;
