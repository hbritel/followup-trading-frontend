
import React from 'react';
import { TradesTable } from '@/components/trades/TradesTable';
import { Card } from '@/components/ui/card';

interface AdvancedFilters {
  dateRange: { from: Date | null; to: Date | null };
  profitRange: { min: number | null; max: number | null };
  tags: string[];
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'long' | 'short' | 'option' | 'future' | 'crypto' | 'forex';
  status: 'open' | 'closed' | 'pending' | 'cancelled';
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  direction?: 'long' | 'short';
  profit?: number;
  profitPercentage?: number;
  fees?: number;
  strategy?: string;
  notes?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TradesTableWrapperProps {
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

export const TradesTableWrapper: React.FC<TradesTableWrapperProps> = ({
  trades,
  visibleColumns,
  searchQuery,
  statusFilter,
  typeFilter,
  advancedFilters,
  onEdit,
  onDelete,
  onView
}) => {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-auto">
        <TradesTable
          trades={trades}
          visibleColumns={visibleColumns}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      </div>
    </Card>
  );
};
