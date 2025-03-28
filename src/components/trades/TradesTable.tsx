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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils';
import { Edit, Eye, MoreHorizontal, Trash2 } from 'lucide-react';

interface Trade {
  id: string;
  symbol: string;
  type: 'long' | 'short' | 'option' | 'future' | 'crypto' | 'forex';
  status: 'open' | 'closed' | 'pending' | 'cancelled';
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  profit?: number;
  profitPercentage?: number;
  strategy?: string;
  tags?: string[];
  notes?: string;
}

interface TradesTableProps {
  trades: Trade[];
  visibleColumns: Record<string, boolean>;
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
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
      case 'open':
        return 'default';
      case 'closed':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'long':
        return 'default';
      case 'short':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
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
            {visibleColumns.quantity && (
              <TableHead className="text-right">{t('trades.quantity')}</TableHead>
            )}
            {visibleColumns.profit && (
              <TableHead className="text-right">{t('trades.profit')}</TableHead>
            )}
            {visibleColumns.profitPercentage && (
              <TableHead className="text-right">{t('trades.profitPercentage')}</TableHead>
            )}
            {visibleColumns.strategy && (
              <TableHead>{t('trades.strategy')}</TableHead>
            )}
            {visibleColumns.tags && (
              <TableHead>{t('trades.tags')}</TableHead>
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
                  <TableCell>{formatDate(trade.exitDate)}</TableCell>
                )}
                {visibleColumns.entryPrice && (
                  <TableCell className="text-right">{formatCurrency(trade.entryPrice)}</TableCell>
                )}
                {visibleColumns.exitPrice && (
                  <TableCell className="text-right">
                    {trade.exitPrice !== undefined ? formatCurrency(trade.exitPrice) : '-'}
                  </TableCell>
                )}
                {visibleColumns.quantity && (
                  <TableCell className="text-right">{trade.quantity}</TableCell>
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
                {visibleColumns.strategy && (
                  <TableCell>{trade.strategy || '-'}</TableCell>
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
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">{t('common.openMenu')}</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t('trades.tradeActions')}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(trade.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t('common.view')}
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(trade.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem onClick={() => onDelete(trade.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
