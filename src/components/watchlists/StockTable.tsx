
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { WatchlistItemResponseDto } from '@/types/dto';

interface StockTableProps {
  items: WatchlistItemResponseDto[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRemoveItem: (itemId: string) => void;
}

const StockTable: React.FC<StockTableProps> = ({
  items,
  searchQuery,
  onSearchChange,
  onRemoveItem
}) => {
  const { t } = useTranslation();

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <div className="flex justify-between mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('watchlists.searchSymbols')}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('watchlists.symbol')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('watchlists.notes')}</TableHead>
              <TableHead className="text-right">{t('watchlists.alertPrice')}</TableHead>
              <TableHead className="hidden lg:table-cell text-right">{t('watchlists.addedAt')}</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {searchQuery
                    ? t('watchlists.noItemsMatchSearch')
                    : t('watchlists.noItems')}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.symbol}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                    {item.notes || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.alertPrice != null ? `$${item.alertPrice.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right text-muted-foreground">
                    {formatDate(item.addedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default StockTable;
