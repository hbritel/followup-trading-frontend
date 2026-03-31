
import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <CardTitle className="text-gradient">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="rounded-xl" onClick={onEditClick}>
          <Pencil className="h-4 w-4 mr-2" />
          {t('common.edit')}
        </Button>
        <Button size="sm" className="rounded-xl" onClick={onAddSymbolClick}>
          <PlusCircle className="h-4 w-4 mr-2" />
          {t('watchlists.addSymbol')}
        </Button>
      </div>
    </div>
  );
};

export default WatchlistHeader;
