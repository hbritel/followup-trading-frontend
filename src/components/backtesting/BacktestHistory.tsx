
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, FlaskConical } from 'lucide-react';
import { useBacktests, useDeleteBacktest } from '@/hooks/useBacktests';
import { useToast } from '@/hooks/use-toast';
import type { BacktestResponseDto, BacktestStatus } from '@/types/dto';

const statusVariant = (status: BacktestStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'COMPLETED':
      return 'default';
    case 'RUNNING':
    case 'PENDING':
      return 'secondary';
    case 'FAILED':
      return 'destructive';
    default:
      return 'outline';
  }
};

const formatNullableNumber = (value: number | null, suffix = ''): string => {
  if (value == null) return '-';
  return `${value}${suffix}`;
};

const formatWinRate = (value: number | null): string => {
  if (value == null) return '-';
  return `${(value * 100).toFixed(1)}%`;
};

const formatPnl = (value: number | null): { text: string; className: string } => {
  if (value == null) return { text: '-', className: '' };
  const formatted = `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const className = value >= 0 ? 'text-green-500' : 'text-red-500';
  return { text: formatted, className };
};

const BacktestHistory = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: backtests, isLoading } = useBacktests();
  const deleteBacktest = useDeleteBacktest();

  const handleDelete = (id: string) => {
    deleteBacktest.mutate(id, {
      onSuccess: () => {
        toast({
          title: t('backtesting.backtestDeleted'),
          description: t('backtesting.backtestDeletedDescription'),
        });
      },
      onError: () => {
        toast({
          title: t('common.error'),
          description: t('backtesting.deleteFailed'),
          variant: 'destructive',
        });
      },
    });
  };

  const renderLoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-1">{t('backtesting.noBacktests')}</h3>
      <p className="text-muted-foreground">{t('backtesting.noBacktestsDescription')}</p>
    </div>
  );

  const renderRow = (backtest: BacktestResponseDto) => {
    const pnl = formatPnl(backtest.totalPnl);
    return (
      <TableRow key={backtest.id}>
        <TableCell className="font-medium">{backtest.name}</TableCell>
        <TableCell>
          <Badge variant={statusVariant(backtest.status)}>
            {t(`backtesting.${backtest.status.toLowerCase()}`)}
          </Badge>
        </TableCell>
        <TableCell>
          {backtest.startDate} - {backtest.endDate}
        </TableCell>
        <TableCell>
          {formatNullableNumber(backtest.totalTrades)}
        </TableCell>
        <TableCell>
          {formatWinRate(backtest.winRate)}
        </TableCell>
        <TableCell>
          <span className={pnl.className}>{pnl.text}</span>
        </TableCell>
        <TableCell className="text-right">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleDelete(backtest.id)}
            disabled={deleteBacktest.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    );
  };

  const renderTable = () => {
    const hasBacktests = backtests && backtests.length > 0;
    if (!hasBacktests) {
      return renderEmptyState();
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('backtesting.name')}</TableHead>
            <TableHead>{t('reports.status')}</TableHead>
            <TableHead>{t('backtesting.period')}</TableHead>
            <TableHead>{t('backtesting.totalTrades')}</TableHead>
            <TableHead>{t('backtesting.winRate')}</TableHead>
            <TableHead>{t('backtesting.profit')}</TableHead>
            <TableHead className="text-right">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {backtests.map(renderRow)}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('backtesting.backtestHistory')}</CardTitle>
        <CardDescription>{t('backtesting.backtestHistoryDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? renderLoadingSkeleton() : renderTable()}
      </CardContent>
    </Card>
  );
};

export default BacktestHistory;
