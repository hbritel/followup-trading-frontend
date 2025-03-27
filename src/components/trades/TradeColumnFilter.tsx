
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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
  // This is a placeholder component
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Column Visibility</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {Object.entries(visibleColumns).map(([column, isVisible]) => (
          <div key={column} className="flex items-center space-x-2">
            <Checkbox 
              id={`column-${column}`} 
              checked={isVisible}
              onCheckedChange={(checked) => onChange(column, checked as boolean)}
            />
            <Label htmlFor={`column-${column}`} className="capitalize">{column}</Label>
          </div>
        ))}
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onReset}>Reset</Button>
        <Button onClick={onApply}>Apply</Button>
      </div>
    </div>
  );
};

export default TradeColumnFilter;
