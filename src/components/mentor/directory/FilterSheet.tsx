import React from 'react';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import FilterRail, { type FilterValues } from './FilterRail';
import type { MentorTagDto } from '@/types/dto';

interface FilterSheetProps {
  tags: MentorTagDto[];
  languages: string[];
  values: FilterValues;
  onChange: (next: Partial<FilterValues>) => void;
  onClear: () => void;
  activeCount: number;
}

const FilterSheet: React.FC<FilterSheetProps> = ({
  tags,
  languages,
  values,
  onChange,
  onClear,
  activeCount,
}) => {
  const { t } = useTranslation();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 relative">
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          {t('mentor.directory.filters.mobileButton')}
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[320px] overflow-y-auto py-6">
        <SheetHeader className="mb-5">
          <SheetTitle>{t('mentor.directory.filters.niche')}</SheetTitle>
        </SheetHeader>
        <FilterRail
          tags={tags}
          languages={languages}
          values={values}
          onChange={onChange}
          onClear={onClear}
        />
      </SheetContent>
    </Sheet>
  );
};

export default FilterSheet;
