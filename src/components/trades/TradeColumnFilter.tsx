
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Columns } from 'lucide-react';

interface TradeColumnFilterProps {
  visibleColumns: {
    symbol: boolean;
    type: boolean;
    price: boolean;
    quantity: boolean;
    date: boolean;
    status: boolean;
    pl: boolean;
    entryPrice: boolean;
    exitPrice: boolean;
    stoploss: boolean;
    takeProfit: boolean;
    fees: boolean;
    notes: boolean;
    createdAt: boolean;
    updatedAt: boolean;
    plPercentage: boolean;
  };
  onVisibilityChange: (columnName: string) => void;
}

const TradeColumnFilter: React.FC<TradeColumnFilterProps> = ({ 
  visibleColumns, 
  onVisibilityChange 
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Columns className="h-4 w-4 mr-2" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuCheckboxItem
          checked={visibleColumns.symbol}
          onCheckedChange={() => onVisibilityChange('symbol')}
        >
          Symbol
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={visibleColumns.type}
          onCheckedChange={() => onVisibilityChange('type')}
        >
          Type
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={visibleColumns.price}
          onCheckedChange={() => onVisibilityChange('price')}
        >
          Price
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={visibleColumns.entryPrice}
          onCheckedChange={() => onVisibilityChange('entryPrice')}
        >
          Entry Price
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={visibleColumns.exitPrice}
          onCheckedChange={() => onVisibilityChange('exitPrice')}
        >
          Exit Price
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={visibleColumns.quantity}
          onCheckedChange={() => onVisibilityChange('quantity')}
        >
          Quantity
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={visibleColumns.date}
          onCheckedChange={() => onVisibilityChange('date')}
        >
          Date
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={visibleColumns.stoploss}
          onCheckedChange={() => onVisibilityChange('stoploss')}
        >
          Stop Loss
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={visibleColumns.takeProfit}
          onCheckedChange={() => onVisibilityChange('takeProfit')}
        >
          Take Profit
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={visibleColumns.fees}
          onCheckedChange={() => onVisibilityChange('fees')}
        >
          Fees
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={visibleColumns.status}
          onCheckedChange={() => onVisibilityChange('status')}
        >
          Status
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={visibleColumns.pl}
          onCheckedChange={() => onVisibilityChange('pl')}
        >
          P&L
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={visibleColumns.plPercentage}
          onCheckedChange={() => onVisibilityChange('plPercentage')}
        >
          P&L %
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={visibleColumns.notes}
          onCheckedChange={() => onVisibilityChange('notes')}
        >
          Notes
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={visibleColumns.createdAt}
          onCheckedChange={() => onVisibilityChange('createdAt')}
        >
          Created At
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={visibleColumns.updatedAt}
          onCheckedChange={() => onVisibilityChange('updatedAt')}
        >
          Updated At
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TradeColumnFilter;
