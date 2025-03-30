
import React from 'react';
import { TradesTable } from '@/components/trades/TradesTable';

interface AdvancedFilters {
  dateRange: { from: Date | null; to: Date | null };
  profitRange: { min: number | null; max: number | null };
  tags: string[];
  // Add other advanced filter properties as needed
}

export interface TradesTableWrapperProps {
  trades: any[];
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
  // Here we could implement any logic to transform advancedFilters 
  // into something the TradesTable can use
  
  // Pass only the props that TradesTable accepts
  return (
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
  );
};
