import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search as SearchIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { SpreadType } from '@/types/dto';

export type DteFilter = 'any' | 'lt7' | 'd7_30' | 'd30_60' | 'gt60';
export type SortKey = 'dte' | 'pnl' | 'detected' | 'underlying';

export interface SpreadsFilterValue {
  readonly search: string;
  readonly spreadType: SpreadType | 'ALL';
  readonly dte: DteFilter;
  readonly sort: SortKey;
}

export const DEFAULT_FILTERS: SpreadsFilterValue = {
  search: '',
  spreadType: 'ALL',
  dte: 'any',
  sort: 'detected',
};

const SPREAD_TYPES: readonly (SpreadType | 'ALL')[] = [
  'ALL',
  'VERTICAL_CALL',
  'VERTICAL_PUT',
  'STRADDLE',
  'STRANGLE',
  'IRON_CONDOR',
  'IRON_BUTTERFLY',
  'BUTTERFLY_CALL',
  'BUTTERFLY_PUT',
  'CALENDAR',
  'DIAGONAL',
  'COVERED_CALL',
  'PROTECTIVE_PUT',
  'COLLAR',
  'CUSTOM',
] as const;

function formatSpreadType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface SpreadsFiltersProps {
  readonly value: SpreadsFilterValue;
  readonly onChange: (value: SpreadsFilterValue) => void;
}

const SpreadsFilters: React.FC<SpreadsFiltersProps> = ({ value, onChange }) => {
  const { t } = useTranslation();

  const isDefault =
    value.search === '' &&
    value.spreadType === 'ALL' &&
    value.dte === 'any' &&
    value.sort === 'detected';

  return (
    <div className="flex flex-col md:flex-row gap-2">
      <div className="relative flex-1 min-w-0">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
        <Input
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          placeholder={t('options.filter.searchPlaceholder', 'Search underlying (AAPL, SPY...)')}
          className="pl-9"
          aria-label={t('options.filter.search', 'Search')}
        />
      </div>

      <Select
        value={value.spreadType}
        onValueChange={(v) => onChange({ ...value, spreadType: v as SpreadType | 'ALL' })}
      >
        <SelectTrigger className="md:w-[200px]" aria-label={t('options.filter.type', 'Type')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SPREAD_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {type === 'ALL'
                ? t('options.filter.allTypes', 'All types')
                : formatSpreadType(type)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.dte}
        onValueChange={(v) => onChange({ ...value, dte: v as DteFilter })}
      >
        <SelectTrigger className="md:w-[160px]" aria-label={t('options.filter.dte', 'DTE')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">{t('options.filter.dteAny', 'Any DTE')}</SelectItem>
          <SelectItem value="lt7">{t('options.filter.dteLt7', '< 7 days')}</SelectItem>
          <SelectItem value="d7_30">{t('options.filter.dte7_30', '7 — 30 days')}</SelectItem>
          <SelectItem value="d30_60">{t('options.filter.dte30_60', '30 — 60 days')}</SelectItem>
          <SelectItem value="gt60">{t('options.filter.dteGt60', '> 60 days')}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={value.sort}
        onValueChange={(v) => onChange({ ...value, sort: v as SortKey })}
      >
        <SelectTrigger className="md:w-[180px]" aria-label={t('options.filter.sort', 'Sort')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="detected">
            {t('options.filter.sortDetected', 'Sort: most recent')}
          </SelectItem>
          <SelectItem value="dte">{t('options.filter.sortDte', 'Sort: DTE ascending')}</SelectItem>
          <SelectItem value="pnl">{t('options.filter.sortPnl', 'Sort: P&L descending')}</SelectItem>
          <SelectItem value="underlying">
            {t('options.filter.sortUnderlying', 'Sort: underlying')}
          </SelectItem>
        </SelectContent>
      </Select>

      {!isDefault && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="text-muted-foreground hover:text-white"
          aria-label={t('options.filter.clear', 'Clear filters')}
        >
          <X className="w-4 h-4 mr-1" />
          {t('options.filter.clear', 'Clear')}
        </Button>
      )}
    </div>
  );
};

export default SpreadsFilters;
