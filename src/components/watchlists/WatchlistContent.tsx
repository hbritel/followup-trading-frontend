
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import WatchlistHeader from './WatchlistHeader';
import StockTable, { StockData } from './StockTable';

interface WatchlistContentProps {
  title: string;
  description: string;
  stocks: StockData[];
  searchQuery: string;
  showFavorites: boolean;
  onEditClick: () => void;
  onAddSymbolClick: () => void;
  onSearchChange: (query: string) => void;
  onToggleFavorites: (value: string) => void;
  onToggleStarred: (symbol: string) => void;
  onRemoveSymbol: (symbol: string) => void;
}

const WatchlistContent: React.FC<WatchlistContentProps> = ({
  title,
  description,
  stocks,
  searchQuery,
  showFavorites,
  onEditClick,
  onAddSymbolClick,
  onSearchChange,
  onToggleFavorites,
  onToggleStarred,
  onRemoveSymbol
}) => {
  // Filter stocks based on search query and favorites filter
  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        stock.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return showFavorites ? (matchesSearch && stock.starred) : matchesSearch;
  });

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="pb-3">
        <WatchlistHeader
          title={title}
          description={description}
          onEditClick={onEditClick}
          onAddSymbolClick={onAddSymbolClick}
        />
      </CardHeader>
      <CardContent>
        <StockTable 
          stocks={filteredStocks}
          searchQuery={searchQuery}
          showFavorites={showFavorites}
          onSearchChange={onSearchChange}
          onToggleFavorites={onToggleFavorites}
          onToggleStarred={onToggleStarred}
          onRemoveSymbol={onRemoveSymbol}
        />
      </CardContent>
    </Card>
  );
};

export default WatchlistContent;
