
import React from 'react';
import { Button } from '@/components/ui/button';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { Pencil, PlusCircle } from 'lucide-react';

interface WatchlistHeaderProps {
  title: string;
  description: string;
  onEditClick: () => void;
  onAddSymbolClick: () => void;
}

const WatchlistHeader: React.FC<WatchlistHeaderProps> = ({
  title,
  description,
  onEditClick,
  onAddSymbolClick
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onEditClick}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
        
        <Button variant="outline" size="sm" onClick={onAddSymbolClick}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Symbol
        </Button>
      </div>
    </div>
  );
};

export default WatchlistHeader;
