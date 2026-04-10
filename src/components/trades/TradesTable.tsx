import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TableActions } from '@/components/trades/TableActions';
import { formatCurrency, formatDate, formatPercentage, cn } from '@/lib/utils';
import { Trade } from './TradesTableWrapper';

interface AdvancedFilters {
  dateRange: { from: Date | null; to: Date | null };
  profitRange: { min: number | null; max: number | null };
  tags: string[];
}

interface TradesTableProps {
  trades: Trade[];
  visibleColumns: Record<string, boolean>;
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
  advancedFilters?: AdvancedFilters;
  onEdit?: (tradeId: string) => void;
  onDelete?: (tradeId: string) => void;
  onView?: (tradeId: string) => void;
  highlightTradeId?: string | null;
}

export const TradesTable: React.FC<TradesTableProps> = ({
  trades,
  visibleColumns,
  searchQuery,
  statusFilter,
  typeFilter,
  advancedFilters,
  onEdit,
  onDelete,
  onView,
  highlightTradeId,
}) => {
  const { t } = useTranslation();

  const filteredTrades = trades.filter((trade) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      trade.symbol.toLowerCase().includes(q) ||
      (trade.strategy && trade.strategy.toLowerCase().includes(q)) ||
      (trade.notes && trade.notes.toLowerCase().includes(q)) ||
      (trade.tags && trade.tags.some(tag => tag.toLowerCase().includes(q)));

    const matchesStatus = statusFilter === 'all' || trade.status === statusFilter;
    const matchesType = typeFilter === 'all' || trade.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'closed': return 'secondary';
      case 'pending': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getDirectionClassName = (type: string) => {
    switch (type) {
      case 'long': return 'border-primary/30 text-primary bg-primary/10';
      case 'short': return 'border-destructive/30 text-destructive bg-destructive/10';
      default: return '';
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[1200px] table-fixed">
        <TableHeader>
          <TableRow>
            {visibleColumns.symbol && (
              <TableHead className="label-caps w-[90px]">{t('trades.symbol')}</TableHead>
            )}
            {visibleColumns.type && (
              <TableHead className="label-caps w-[70px]">{t('trades.type')}</TableHead>
            )}
            {visibleColumns.status && (
              <TableHead className="label-caps w-[80px]">{t('trades.status')}</TableHead>
            )}
            {visibleColumns.accountType && (
              <TableHead className="label-caps w-[70px]">{t('trades.accountType', 'Account Type')}</TableHead>
            )}
            {visibleColumns.entryDate && (
              <TableHead className="label-caps w-[110px]">{t('trades.entryDate')}</TableHead>
            )}
            {visibleColumns.exitDate && (
              <TableHead className="label-caps w-[110px]">{t('trades.exitDate')}</TableHead>
            )}
            {visibleColumns.entryPrice && (
              <TableHead className="label-caps text-right w-[100px]">{t('trades.entryPrice')}</TableHead>
            )}
            {visibleColumns.exitPrice && (
              <TableHead className="label-caps text-right w-[100px]">{t('trades.exitPrice')}</TableHead>
            )}
            {visibleColumns.stopLoss && (
              <TableHead className="label-caps text-right w-[90px]">{t('trades.stopLoss')}</TableHead>
            )}
            {visibleColumns.takeProfit && (
              <TableHead className="label-caps text-right w-[90px]">{t('trades.takeProfit')}</TableHead>
            )}
            {visibleColumns.quantity && (
              <TableHead className="label-caps text-right w-[70px]">{t('trades.quantity')}</TableHead>
            )}
            {visibleColumns.balance && (
              <TableHead className="label-caps text-right w-[90px]">{t('trades.balance', 'Balance')}</TableHead>
            )}
            {visibleColumns.profit && (
              <TableHead className="label-caps text-right w-[100px]">{t('trades.profit')}</TableHead>
            )}
            {visibleColumns.profitPercentage && (
              <TableHead className="label-caps text-right w-[70px]">{t('trades.profitPercentage')}</TableHead>
            )}
            {visibleColumns.fees && (
              <TableHead className="label-caps text-right w-[70px]">{t('trades.fees')}</TableHead>
            )}
            {visibleColumns.currency && (
              <TableHead className="label-caps w-[60px]">{t('trades.currency', 'Currency')}</TableHead>
            )}
            {visibleColumns.strategy && (
              <TableHead className="label-caps w-[100px]">{t('trades.strategy')}</TableHead>
            )}
            {visibleColumns.notes && (
              <TableHead className="label-caps w-[120px]">{t('trades.notes')}</TableHead>
            )}
            {visibleColumns.tags && (
              <TableHead className="label-caps w-[100px]">{t('trades.tags')}</TableHead>
            )}
            {visibleColumns.createdAt && (
              <TableHead className="label-caps w-[100px]">{t('trades.createdAt')}</TableHead>
            )}
            {visibleColumns.updatedAt && (
              <TableHead className="label-caps w-[100px]">{t('trades.updatedAt')}</TableHead>
            )}
            <TableHead className="label-caps text-right w-[60px]">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTrades.length > 0 ? (
            filteredTrades.map((trade) => (
              <TableRow
                key={trade.id}
                className={[
                  trade.id === highlightTradeId ? 'ring-2 ring-primary/50 bg-primary/5' : '',
                  onView ? 'cursor-pointer hover:bg-muted/50 transition-colors' : '',
                ].join(' ')}
                onClick={() => onView?.(trade.id)}
              >
                {visibleColumns.symbol && (
                  <TableCell className="font-mono font-semibold">{trade.symbol}</TableCell>
                )}
                {visibleColumns.type && (
                  <TableCell>
                    <Badge variant="outline" className={`capitalize font-mono text-xs border backdrop-blur-sm ${getDirectionClassName(trade.type)}`}>
                      {t(`trades.${trade.type}`)}
                    </Badge>
                  </TableCell>
                )}
                {visibleColumns.status && (
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(trade.status)}>
                      {t(`trades.${trade.status}`)}
                    </Badge>
                  </TableCell>
                )}
                {visibleColumns.accountType && (
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      trade.accountType === 'DEMO'
                        ? "border-amber-500/30 text-amber-600 bg-amber-500/10"
                        : "border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                    )}>
                      {trade.accountType === 'DEMO' ? t('accounts.demo', 'Demo') : t('accounts.real', 'Real')}
                    </Badge>
                  </TableCell>
                )}
                {visibleColumns.entryDate && (
                  <TableCell className="font-mono tabular-nums text-sm">{formatDate(trade.entryDate)}</TableCell>
                )}
                {visibleColumns.exitDate && (
                  <TableCell className="font-mono tabular-nums text-sm">{trade.exitDate ? formatDate(trade.exitDate) : '-'}</TableCell>
                )}
                {visibleColumns.entryPrice && (
                  <TableCell className="text-right font-mono tabular-nums">{formatCurrency(trade.entryPrice, trade.currency)}</TableCell>
                )}
                {visibleColumns.exitPrice && (
                  <TableCell className="text-right font-mono tabular-nums">
                    {trade.exitPrice !== undefined ? formatCurrency(trade.exitPrice, trade.currency) : '-'}
                  </TableCell>
                )}
                {visibleColumns.stopLoss && (
                  <TableCell className="text-right font-mono tabular-nums">
                    {trade.stopLoss !== undefined ? formatCurrency(trade.stopLoss, trade.currency) : '-'}
                  </TableCell>
                )}
                {visibleColumns.takeProfit && (
                  <TableCell className="text-right font-mono tabular-nums">
                    {trade.takeProfit !== undefined ? formatCurrency(trade.takeProfit, trade.currency) : '-'}
                  </TableCell>
                )}
                {visibleColumns.quantity && (
                  <TableCell className="text-right font-mono tabular-nums">{trade.quantity}</TableCell>
                )}
                {visibleColumns.balance && (
                  <TableCell className="text-right font-medium">
                    {trade.balance !== undefined ? (
                      <span className={trade.balance >= 0 ? 'text-profit' : 'text-loss'}>
                        {formatCurrency(trade.balance, trade.currency)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                )}
                {visibleColumns.profit && (
                  <TableCell className="text-right font-mono tabular-nums font-semibold">
                    {trade.profit !== undefined ? (
                      <span className={trade.profit >= 0 ? 'text-profit' : 'text-loss'}>
                        {formatCurrency(trade.profit, trade.currency)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                )}
                {visibleColumns.profitPercentage && (
                  <TableCell className="text-right font-mono tabular-nums font-semibold">
                    {trade.profitPercentage !== undefined ? (
                      <span className={trade.profitPercentage >= 0 ? 'text-profit' : 'text-loss'}>
                        {formatPercentage(trade.profitPercentage)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                )}
                {visibleColumns.fees && (
                  <TableCell className="text-right font-mono tabular-nums">
                    {trade.fees !== undefined ? formatCurrency(trade.fees, trade.currency) : '-'}
                  </TableCell>
                )}
                {visibleColumns.currency && (
                  <TableCell>
                    {trade.currency ? (
                      <Badge variant="outline">{trade.currency}</Badge>
                    ) : '-'}
                  </TableCell>
                )}
                {visibleColumns.strategy && (
                  <TableCell>{trade.strategy || '-'}</TableCell>
                )}
                {visibleColumns.notes && (
                  <TableCell>
                    <div className="max-w-xs truncate">{trade.notes || '-'}</div>
                  </TableCell>
                )}
                {visibleColumns.tags && (
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {trade.tagObjects && trade.tagObjects.length > 0 ? (
                        trade.tagObjects.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-xs gap-1 pr-1.5"
                            style={{
                              borderColor: tag.color + '40',
                              backgroundColor: tag.color + '15',
                              color: tag.color,
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </Badge>
                        ))
                      ) : trade.tags && trade.tags.length > 0 ? (
                        trade.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">{tag}</Badge>
                        ))
                      ) : (
                        '-'
                      )}
                    </div>
                  </TableCell>
                )}
                {visibleColumns.createdAt && (
                  <TableCell>{trade.createdAt ? formatDate(trade.createdAt) : '-'}</TableCell>
                )}
                {visibleColumns.updatedAt && (
                  <TableCell>{trade.updatedAt ? formatDate(trade.updatedAt) : '-'}</TableCell>
                )}
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <TableActions
                    tradeId={trade.id}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={Object.values(visibleColumns).filter(Boolean).length + 1}
                className="h-24 text-center"
              >
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? t('trades.noTradesFound')
                  : t('trades.noTrades')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
