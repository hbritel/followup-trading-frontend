
import React from 'react';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>{t('watchlists.myWatchlists')}</CardTitle>
        <CardDescription>
          {t('watchlists.watchlistCount', { count: watchlists.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {watchlists.map((watchlist) => (
            <div key={watchlist.id} className="flex flex-col space-y-1">
              <Button
                variant={activeWatchlist === watchlist.id ? 'default' : 'outline'}
                className="w-full justify-between"
                onClick={() => onSelectWatchlist(watchlist.id)}
              >
                <div className="flex flex-col items-start">
                  <span>{watchlist.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {t('watchlists.symbolCount', { count: watchlist.items.length })}
                  </span>
                </div>
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditWatchlist(watchlist);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteWatchlist(watchlist.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={onAddWatchlist}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            {t('watchlists.addWatchlist')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WatchlistsSidebar;
