import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onClearFilters: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onClearFilters }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center">
        <Users className="w-7 h-7 text-muted-foreground/50" aria-hidden="true" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <p className="font-semibold text-base">{t('mentor.directory.empty.title')}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onClearFilters}>
        {t('mentor.directory.empty.clearFilters')}
      </Button>
    </div>
  );
};

export default EmptyState;
