import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import CurrencyFlag from './CurrencyFlag';
import ImpactIndicator from './ImpactIndicator';
import type { EconomicCalendarFilters, EconomicEventImpact } from '@/types/dto';

interface CalendarFiltersProps {
  filters: EconomicCalendarFilters;
  onFiltersChange: (filters: EconomicCalendarFilters) => void;
  availableCurrencies: string[];
}

type DateRange = EconomicCalendarFilters['dateRange'];

const DATE_RANGE_OPTIONS: { value: DateRange; labelKey: string }[] = [
  { value: 'today', labelKey: 'calendar.today' },
  { value: 'tomorrow', labelKey: 'calendar.tomorrow' },
  { value: 'this_week', labelKey: 'calendar.thisWeek' },
  { value: 'next_week', labelKey: 'calendar.nextWeek' },
  { value: 'custom', labelKey: 'calendar.custom' },
];

const IMPACT_OPTIONS: { value: EconomicEventImpact; labelKey: string }[] = [
  { value: 'HIGH', labelKey: 'calendar.impactHigh' },
  { value: 'MEDIUM', labelKey: 'calendar.impactMedium' },
  { value: 'LOW', labelKey: 'calendar.impactLow' },
];

const CalendarFilters = ({
  filters,
  onFiltersChange,
  availableCurrencies,
}: CalendarFiltersProps) => {
  const { t } = useTranslation();

  const setDateRange = (dateRange: DateRange) => {
    onFiltersChange({
      ...filters,
      dateRange,
      startDate: dateRange !== 'custom' ? undefined : filters.startDate,
      endDate: dateRange !== 'custom' ? undefined : filters.endDate,
    });
  };

  const toggleCurrency = (currency: string) => {
    const next = filters.currencies.includes(currency)
      ? filters.currencies.filter((c) => c !== currency)
      : [...filters.currencies, currency];
    onFiltersChange({ ...filters, currencies: next });
  };

  const toggleAllCurrencies = () => {
    const allSelected = availableCurrencies.every((c) =>
      filters.currencies.includes(c),
    );
    onFiltersChange({
      ...filters,
      currencies: allSelected ? [] : [...availableCurrencies],
    });
  };

  const toggleImpact = (impact: EconomicEventImpact) => {
    const next = filters.impacts.includes(impact)
      ? filters.impacts.filter((i) => i !== impact)
      : [...filters.impacts, impact];
    onFiltersChange({ ...filters, impacts: next });
  };

  const allCurrenciesSelected = availableCurrencies.every((c) =>
    filters.currencies.includes(c),
  );

  return (
    <div className="flex flex-col gap-4 p-4 bg-card border rounded-lg">
      {/* Date range */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('calendar.dateRange')}
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {DATE_RANGE_OPTIONS.map(({ value, labelKey }) => (
            <button
              key={value}
              type="button"
              onClick={() => setDateRange(value)}
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                'border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                filters.dateRange === value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted',
              )}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        {filters.dateRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <div className="flex flex-col gap-1">
              <Label htmlFor="cal-start" className="text-xs text-muted-foreground">
                {t('calendar.startDate')}
              </Label>
              <Input
                id="cal-start"
                type="date"
                value={filters.startDate ?? ''}
                onChange={(e) =>
                  onFiltersChange({ ...filters, startDate: e.target.value || undefined })
                }
                className="h-8 w-36 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="cal-end" className="text-xs text-muted-foreground">
                {t('calendar.endDate')}
              </Label>
              <Input
                id="cal-end"
                type="date"
                value={filters.endDate ?? ''}
                onChange={(e) =>
                  onFiltersChange({ ...filters, endDate: e.target.value || undefined })
                }
                className="h-8 w-36 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Currency filter */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('calendar.currencies')}
        </Label>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAllCurrencies}
            className={cn(
              'h-6 px-2 text-xs rounded',
              allCurrenciesSelected
                ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                : 'text-muted-foreground',
            )}
          >
            {t('calendar.all')}
          </Button>
          {availableCurrencies.map((currency) => {
            const isActive = filters.currencies.includes(currency);
            return (
              <button
                key={currency}
                type="button"
                onClick={() => toggleCurrency(currency)}
                aria-pressed={isActive}
                className={cn(
                  'transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded',
                  isActive ? 'opacity-100' : 'opacity-40 hover:opacity-70',
                )}
              >
                <CurrencyFlag currency={currency} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Impact filter */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('calendar.impact')}
        </Label>
        <div className="flex flex-wrap gap-2">
          {IMPACT_OPTIONS.map(({ value, labelKey }) => {
            const isActive = filters.impacts.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleImpact(value)}
                aria-pressed={isActive}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-muted text-foreground border-border'
                    : 'bg-background text-muted-foreground border-border opacity-50 hover:opacity-75',
                )}
              >
                <ImpactIndicator impact={value} />
                <span>{t(labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarFilters;
