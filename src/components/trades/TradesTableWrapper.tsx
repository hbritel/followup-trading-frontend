
import React from 'react';
import { useTranslation } from 'react-i18next';
import { TradesTable } from '@/components/trades/TradesTable';
import { Card } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AdvancedFilters {
  dateRange: { from: Date | null; to: Date | null };
  profitRange: { min: number | null; max: number | null };
  tags: string[];
}

export interface Trade {
  id: string;
  symbol: string;
  type: string;                  // backend sends direction as type (long, short, etc.)
  status: string;                // backend sends OPEN/CLOSED, mapped to lowercase
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  direction?: string;
  profit?: number;
  profitPercentage?: number;
  fees?: number;
  commission?: number;
  swap?: number;
  currency?: string;
  strategy?: string;
  notes?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  balance?: number;
}

export interface TradesTableWrapperProps {
  trades: Trade[];
  visibleColumns: Record<string, boolean>;
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
  advancedFilters?: AdvancedFilters;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (size: number) => void;
  totalTrades: number;
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
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  totalTrades,
  onEdit,
  onDelete,
  onView
}) => {
  const { t } = useTranslation();
  const totalPages = Math.ceil(totalTrades / itemsPerPage);
  
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink onClick={() => onPageChange(1)}>
            1
          </PaginationLink>
        </PaginationItem>
      );
      
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => onPageChange(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      items.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-auto">
        <TradesTable
          trades={trades}
          visibleColumns={visibleColumns}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          advancedFilters={advancedFilters}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      </div>
      
      {totalTrades > 0 && (
        <div className="border-t p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div>
              {t('trades.showing', {
                from: Math.min((currentPage - 1) * itemsPerPage + 1, totalTrades),
                to: Math.min(currentPage * itemsPerPage, totalTrades),
                total: totalTrades
              })}
            </div>
            
            {onItemsPerPageChange && (
              <div className="flex items-center gap-2">
                <span>{t('trades.rowsPerPage', 'Rows per page')}</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => onItemsPerPageChange(Number(value))}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={itemsPerPage.toString()} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 50, 100].map((pageSize) => (
                      <SelectItem key={pageSize} value={pageSize.toString()}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  aria-disabled={currentPage === 1}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {renderPaginationItems()}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  aria-disabled={currentPage === totalPages || totalPages === 0}
                  className={(currentPage === totalPages || totalPages === 0) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </Card>
  );
};
