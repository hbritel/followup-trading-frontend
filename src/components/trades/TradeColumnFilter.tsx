
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TradeColumnFilterProps {
  visibleColumns: Record<string, boolean>;
  onChange: (column: string, visible: boolean) => void;
  onApply: () => void;
  onReset: () => void;
}

const TradeColumnFilter: React.FC<TradeColumnFilterProps> = ({
  visibleColumns,
  onChange,
  onApply,
  onReset
}) => {
  const { t } = useTranslation();
  
  const allColumns = [
    { id: 'symbol', label: t('trades.symbol') },
    { id: 'type', label: t('trades.type') },
    { id: 'status', label: t('trades.status') },
    { id: 'entryDate', label: t('trades.entryDate') },
    { id: 'exitDate', label: t('trades.exitDate') },
    { id: 'entryPrice', label: t('trades.entryPrice') },
    { id: 'exitPrice', label: t('trades.exitPrice') },
    { id: 'stopLoss', label: t('trades.stopLoss') },
    { id: 'takeProfit', label: t('trades.takeProfit') },
    { id: 'quantity', label: t('trades.quantity') },
    { id: 'direction', label: t('trades.direction') },
    { id: 'profit', label: t('trades.profit') },
    { id: 'profitPercentage', label: t('trades.profitPercentage') },
    { id: 'fees', label: t('trades.fees') },
    { id: 'notes', label: t('trades.notes') },
    { id: 'strategy', label: t('trades.strategy') },
    { id: 'tags', label: t('trades.tags') },
    { id: 'createdAt', label: t('trades.createdAt') },
    { id: 'updatedAt', label: t('trades.updatedAt') }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{t('trades.columnVisibility')}</h3>
      <ScrollArea className="h-auto max-h-72 w-auto pr-2">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {allColumns.map(column => (
            <div key={column.id} className="flex items-center space-x-2">
              <Checkbox 
                id={`column-${column.id}`} 
                checked={visibleColumns[column.id] || false}
                onCheckedChange={(checked) => onChange(column.id, checked as boolean)}
              />
              <Label htmlFor={`column-${column.id}`}>{column.label}</Label>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onReset}>{t('common.reset')}</Button>
        <Button onClick={onApply}>{t('common.apply')}</Button>
      </div>
    </div>
  );
};

export default TradeColumnFilter;
