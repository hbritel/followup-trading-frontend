import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationFooterProps {
  page: number;
  totalPages: number;
  totalElements: number;
  onPrev: () => void;
  onNext: () => void;
}

const PaginationFooter: React.FC<PaginationFooterProps> = ({
  page,
  totalPages,
  totalElements,
  onPrev,
  onNext,
}) => {
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-3 pt-6"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={onPrev}
        disabled={page === 0}
        aria-label={t('mentor.directory.pagination.prev')}
        className="gap-1"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        {t('mentor.directory.pagination.prev')}
      </Button>

      <span className="text-sm text-muted-foreground tabular-nums select-none">
        {t('mentor.directory.pagination.ofTotal', {
          page: page + 1,
          total: totalPages,
          count: totalElements,
        })}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={page >= totalPages - 1}
        aria-label={t('mentor.directory.pagination.next')}
        className="gap-1"
      >
        {t('mentor.directory.pagination.next')}
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </Button>
    </nav>
  );
};

export default PaginationFooter;
