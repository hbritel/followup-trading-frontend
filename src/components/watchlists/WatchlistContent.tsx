
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import WatchlistHeader from './WatchlistHeader';
import StockTable from './StockTable';
import type { WatchlistItemResponseDto } from '@/types/dto';

interface WatchlistContentProps {
  title: string;
  description: string;
  items: WatchlistItemResponseDto[];
  searchQuery: string;
  onEditClick: () => void;
  onAddSymbolClick: () => void;
  onSearchChange: (query: string) => void;
  onRemoveItem: (itemId: string) => void;
}

const WatchlistContent: React.FC<WatchlistContentProps> = ({
  title,
  description,
  items,
  searchQuery,
  onEditClick,
  onAddSymbolClick,
  onSearchChange,
  onRemoveItem
}) => {
  const filteredItems = items.filter(item =>
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          items={filteredItems}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onRemoveItem={onRemoveItem}
        />
      </CardContent>
    </Card>
  );
};

export default WatchlistContent;
