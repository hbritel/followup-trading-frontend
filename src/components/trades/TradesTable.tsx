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
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils';
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
}) => {
  const { t } = useTranslation();

  const filteredTrades = trades.filter((trade) => {
    const matchesSearch =
      searchQuery === '' ||
      trade.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trade.strategy && trade.strategy.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (trade.notes && trade.notes.toLowerCase().includes(searchQuery.toLowerCase()));

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

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'long': return 'default';
      case 'short': return 'destructive';
      default: return 'outline';
    }
  };

  const getDirectionBadgeVariant = (direction: string) => {
    switch (direction) {
      case 'long': return 'default';
      case 'short': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="w-full">
      <Table className="min-w-max">
        <TableHeader>
          <TableRow>
            {visibleColumns.symbol && (
              <TableHead>{t('trades.symbol')}</TableHead>
            )}
            {visibleColumns.type && (
              <TableHead>{t('trades.type')}</TableHead>
            )}
            {visibleColumns.status && (
              <TableHead>{t('trades.status')}</TableHead>
            )}
            {visibleColumns.entryDate && (
              <TableHead>{t('trades.entryDate')}</TableHead>
            )}
            {visibleColumns.exitDate && (
              <TableHead>{t('trades.exitDate')}</TableHead>
            )}
            {visibleColumns.entryPrice && (
              <TableHead className="text-right">{t('trades.entryPrice')}</TableHead>
            )}
            {visibleColumns.exitPrice && (
              <TableHead className="text-right">{t('trades.exitPrice')}</TableHead>
            )}
            {visibleColumns.stopLoss && (
              <TableHead className="text-right">{t('trades.stopLoss')}</TableHead>
            )}
            {visibleColumns.takeProfit && (
              <TableHead className="text-right">{t('trades.takeProfit')}</TableHead>
            )}
            {visibleColumns.quantity && (
              <TableHead className="text-right">{t('trades.quantity')}</TableHead>
            )}
            {visibleColumns.direction && (
              <TableHead>{t('trades.direction')}</TableHead>
            )}
            {visibleColumns.profit && (
              <TableHead className="text-right">{t('trades.profit')}</TableHead>
            )}
            {visibleColumns.profitPercentage && (
              <TableHead className="text-right">{t('trades.profitPercentage')}</TableHead>
            )}
            {visibleColumns.fees && (
              <TableHead className="text-right">{t('trades.fees')}</TableHead>
            )}
            {visibleColumns.strategy && (
              <TableHead>{t('trades.strategy')}</TableHead>
            )}
            {visibleColumns.notes && (
              <TableHead>{t('trades.notes')}</TableHead>
            )}
            {visibleColumns.tags && (
              <TableHead>{t('trades.tags')}</TableHead>
            )}
            {visibleColumns.createdAt && (
              <TableHead>{t('trades.createdAt')}</TableHead>
            )}
            {visibleColumns.updatedAt && (
              <TableHead>{t('trades.updatedAt')}</TableHead>
            )}
            <TableHead className="text-right">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTrades.length > 0 ? (
            filteredTrades.map((trade) => (
              <TableRow key={trade.id}>
                {visibleColumns.symbol && (
                  <TableCell className="font-medium">{trade.symbol}</TableCell>
                )}
                {visibleColumns.type && (
                  <TableCell>
                    <Badge variant={getTypeBadgeVariant(trade.type)}>
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
                {visibleColumns.entryDate && (
                  <TableCell>{formatDate(trade.entryDate)}</TableCell>
                )}
                {visibleColumns.exitDate && (
                  <TableCell>{trade.exitDate ? formatDate(trade.exitDate) : '-'}</TableCell>
                )}
                {visibleColumns.entryPrice && (
                  <TableCell className="text-right">{formatCurrency(trade.entryPrice)}</TableCell>
                )}
                {visibleColumns.exitPrice && (
                  <TableCell className="text-right">
                    {trade.exitPrice !== undefined ? formatCurrency(trade.exitPrice) : '-'}
                  </TableCell>
                )}
                {visibleColumns.stopLoss && (
                  <TableCell className="text-right">
                    {trade.stopLoss !== undefined ? formatCurrency(trade.stopLoss) : '-'}
                  </TableCell>
                )}
                {visibleColumns.takeProfit && (
                  <TableCell className="text-right">
                    {trade.takeProfit !== undefined ? formatCurrency(trade.takeProfit) : '-'}
                  </TableCell>
                )}
                {visibleColumns.quantity && (
                  <TableCell className="text-right">{trade.quantity}</TableCell>
                )}
                {visibleColumns.direction && (
                  <TableCell>
                    {trade.direction ? (
                      <Badge variant={getDirectionBadgeVariant(trade.direction)}>
                        {t(`trades.${trade.direction}`)}
                      </Badge>
                    ) : '-'}
                  </TableCell>
                )}
                {visibleColumns.profit && (
                  <TableCell className="text-right">
                    {trade.profit !== undefined ? (
                      <span className={trade.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(trade.profit)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                )}
                {visibleColumns.profitPercentage && (
                  <TableCell className="text-right">
                    {trade.profitPercentage !== undefined ? (
                      <span
                        className={
                          trade.profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {formatPercentage(trade.profitPercentage)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                )}
                {visibleColumns.fees && (
                  <TableCell className="text-right">
                    {trade.fees !== undefined ? formatCurrency(trade.fees) : '-'}
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
                      {trade.tags && trade.tags.length > 0 ? (
                        trade.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            {tag}
                          </Badge>
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
                <TableCell className="text-right">
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
