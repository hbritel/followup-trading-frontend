
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Pencil,
  PlusCircle,
  Search,
  Trash2,
  Bell,
  X,
  Loader2,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useSymbolSpecifications } from '@/hooks/useSymbolSpecifications';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import UsageLimitIndicator from '@/components/subscription/UsageLimitIndicator';
import type { WatchlistItemResponseDto } from '@/types/dto';

// Symbols-per-watchlist limits per plan
const SYMBOL_LIMITS: Record<string, number> = {
  FREE: 10,
  STARTER: 25,
  PRO: 50,
  ELITE: 2147483647,
};

interface WatchlistContentProps {
  title: string;
  description: string;
  items: WatchlistItemResponseDto[];
  onEditClick: () => void;
  onAddSymbolClick: () => void;
  onRemoveItem: (itemId: string) => void;
  onCreateAlert: (itemId: string) => void;
  isAdding?: boolean;
  isCreatingAlert?: boolean;
}

const WatchlistContent: React.FC<WatchlistContentProps> = ({
  title,
  description,
  items,
  onEditClick,
  onAddSymbolClick,
  onRemoveItem,
  onCreateAlert,
  isAdding,
  isCreatingAlert,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentPlan } = useFeatureFlags();
  const [filterQuery, setFilterQuery] = useState('');

  const symbolLimit = SYMBOL_LIMITS[currentPlan] ?? 10;
  const isUnlimitedSymbols = symbolLimit >= 2147483647;
  const atSymbolLimit = !isUnlimitedSymbols && items.length >= symbolLimit;
  const showSymbolCounter = !isUnlimitedSymbols;

  const filteredItems = useMemo(() => {
    if (!filterQuery) return items;
    const q = filterQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.symbol.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q))
    );
  }, [items, filterQuery]);

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
    <Card className="glass-card rounded-2xl h-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-gradient">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {showSymbolCounter && (
              <UsageLimitIndicator
                used={items.length}
                max={symbolLimit}
                label={t('watchlists.symbols', 'Symbols')}
                showBar={false}
              />
            )}
            <Button variant="outline" size="sm" className="rounded-xl" onClick={onEditClick}>
              <Pencil className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </Button>
            <Button
              size="sm"
              className="rounded-xl"
              onClick={onAddSymbolClick}
              disabled={atSymbolLimit}
              title={atSymbolLimit ? t('watchlists.symbolLimitReached', 'Symbol limit reached. Upgrade your plan to add more symbols.') : undefined}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              {t('watchlists.addSymbol')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter existing items */}
        {items.length > 0 && (
          <div className="relative w-full max-w-sm mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('watchlists.filterSymbols')}
              className="pl-8 rounded-xl"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>
        )}

        {/* Symbol table */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{t('watchlists.noItemsTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('watchlists.noItemsDesc')}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={onAddSymbolClick}
              disabled={atSymbolLimit}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              {t('watchlists.addSymbol')}
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="label-caps">{t('watchlists.symbol')}</TableHead>
                  <TableHead className="hidden md:table-cell label-caps">{t('watchlists.notes')}</TableHead>
                  <TableHead className="text-right label-caps">{t('watchlists.alertPrice')}</TableHead>
                  <TableHead className="hidden lg:table-cell text-right label-caps">{t('watchlists.addedAt')}</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t('watchlists.noItemsMatchSearch')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className="group">
                      <TableCell>
                        <span className="font-mono font-medium">{item.symbol}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                        {item.notes || <span className="text-muted-foreground/50">-</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.alertPrice != null ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {item.alertId && (
                              <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                {item.alertCondition === 'ABOVE' ? '↑' : item.alertCondition === 'BELOW' ? '↓' : '↕'}
                              </Badge>
                            )}
                            <Badge variant="outline" className="font-mono tabular-nums">
                              ${item.alertPrice.toFixed(2)}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right text-muted-foreground text-xs">
                        {formatDate(item.addedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={
                              item.alertId
                                ? t('watchlists.viewAlert')
                                : t('watchlists.createPriceAlert')
                            }
                            onClick={() => {
                              if (item.alertId) {
                                navigate(`/alerts?symbol=${encodeURIComponent(item.symbol)}&watchlist=${encodeURIComponent(title)}`);
                              } else if (item.alertPrice) {
                                onCreateAlert(item.id);
                              } else {
                                navigate(`/alerts?symbol=${encodeURIComponent(item.symbol)}&watchlist=${encodeURIComponent(title)}`);
                              }
                            }}
                          >
                            <Bell className={cn('h-4 w-4', item.alertId && 'text-amber-500 fill-amber-500')} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
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
        )}
      </CardContent>
    </Card>
  );
};

export default WatchlistContent;
