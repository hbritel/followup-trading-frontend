import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OpenPositionDto } from '@/types/dto';

interface OpenPositionsPanelProps {
  positions?: OpenPositionDto[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const OpenPositionsPanel: React.FC<OpenPositionsPanelProps> = ({ positions }) => {
  const { t } = useTranslation();

  if (!positions || positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('dashboard.openPositions', 'Open Positions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('dashboard.noOpenPositions', 'No open positions')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {t('dashboard.openPositions', 'Open Positions')} ({positions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">{t('common.symbol', 'Symbol')}</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">{t('common.direction', 'Direction')}</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">{t('trades.entryPrice', 'Entry')}</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">{t('trades.currentPrice', 'Current')}</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">{t('trades.quantity', 'Qty')}</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">{t('dashboard.unrealizedPnL', 'Unrealized P&L')}</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr key={pos.tradeId} className="border-b last:border-0">
                  <td className="py-2 px-3 text-sm font-medium">{pos.symbol}</td>
                  <td className="py-2 px-3">
                    <Badge variant={pos.direction === 'LONG' ? 'default' : 'secondary'} className="text-xs">
                      {pos.direction}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 text-sm text-right">{formatCurrency(pos.entryPrice)}</td>
                  <td className="py-2 px-3 text-sm text-right">{formatCurrency(pos.currentPrice)}</td>
                  <td className="py-2 px-3 text-sm text-right">{pos.quantity}</td>
                  <td className={cn(
                    "py-2 px-3 text-sm text-right font-medium",
                    pos.unrealizedPnL >= 0 ? "text-profit" : "text-loss"
                  )}>
                    {formatCurrency(pos.unrealizedPnL)} ({pos.unrealizedPnLPercentage.toFixed(2)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OpenPositionsPanel;
