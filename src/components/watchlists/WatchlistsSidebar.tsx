
import React from 'react';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface WatchlistItem {
  id: number;
  name: string;
  description: string;
  symbols: number;
}

interface WatchlistsSidebarProps {
  watchlists: WatchlistItem[];
  activeWatchlist: string;
  onSelectWatchlist: (id: string) => void;
  onAddWatchlist: () => void;
  onEditWatchlist: (watchlist: WatchlistItem) => void;
  onDeleteWatchlist: (id: number) => void;
}

const WatchlistsSidebar: React.FC<WatchlistsSidebarProps> = ({
  watchlists,
  activeWatchlist,
  onSelectWatchlist,
  onAddWatchlist,
  onEditWatchlist,
  onDeleteWatchlist
}) => {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>My Watchlists</CardTitle>
        <CardDescription>
          {watchlists.length} watchlists
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {watchlists.map((watchlist) => (
            <div key={watchlist.id} className="flex flex-col space-y-1">
              <Button
                variant={activeWatchlist === watchlist.id.toString() ? 'default' : 'outline'}
                className="w-full justify-between"
                onClick={() => onSelectWatchlist(watchlist.id.toString())}
              >
                <div className="flex flex-col items-start">
                  <span>{watchlist.name}</span>
                  <span className="text-xs text-muted-foreground">{watchlist.symbols} symbols</span>
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
            Add Watchlist
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WatchlistsSidebar;
