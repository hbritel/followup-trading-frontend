import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DirectorySortKey } from '@/types/dto';

const SORT_OPTIONS: DirectorySortKey[] = [
  'RELEVANCE',
  'NEWEST',
  'MOST_STUDENTS',
  'HIGHEST_RATED',
  'LOWEST_PRICE',
];

const SORT_KEY_MAP: Record<DirectorySortKey, string> = {
  RELEVANCE: 'sort.relevance',
  NEWEST: 'sort.newest',
  MOST_STUDENTS: 'sort.mostStudents',
  HIGHEST_RATED: 'sort.highestRated',
  LOWEST_PRICE: 'sort.lowestPrice',
};

interface SortDropdownProps {
  value: DirectorySortKey;
  onChange: (value: DirectorySortKey) => void;
}

const SortDropdown: React.FC<SortDropdownProps> = ({ value, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
      <Select value={value} onValueChange={(v) => onChange(v as DirectorySortKey)}>
        <SelectTrigger className="h-9 w-[180px] text-sm">
          <SelectValue placeholder={t('mentor.directory.sort.label')} />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt} className="text-sm">
              {t(`mentor.directory.${SORT_KEY_MAP[opt]}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SortDropdown;
