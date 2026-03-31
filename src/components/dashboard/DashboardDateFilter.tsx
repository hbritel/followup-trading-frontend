import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DayPicker } from 'react-day-picker';
import { buttonVariants } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PRESETS = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: 'YTD', value: 'ytd' },
  { label: '1Y', value: '1y' },
  { label: 'All', value: 'all' },
] as const;

export type DatePreset = typeof PRESETS[number]['value'];

function toISODate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function computeDateRange(preset: string): { startDate?: string; endDate?: string } {
  if (preset === 'all') return {};

  const now = new Date();
  const endDate = toISODate(now);
  let start: Date;

  switch (preset) {
    case '1d':
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      break;
    case '1w':
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7));
      break;
    case '1m':
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, now.getUTCDate()));
      break;
    case '3m':
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, now.getUTCDate()));
      break;
    case 'ytd':
      start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      break;
    case '1y':
      start = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()));
      break;
    default:
      return {};
  }

  return { startDate: toISODate(start), endDate };
}

interface DashboardDateFilterProps {
  preset: string;
  onPresetChange: (preset: string) => void;
  customStart: Date | null;
  customEnd: Date | null;
  onCustomStartChange: (date: Date | null) => void;
  onCustomEndChange: (date: Date | null) => void;
}

/**
 * Inline calendar that does NOT use captionLayout="dropdown-buttons".
 * Uses plain "buttons" navigation to avoid react-day-picker v8 dropdown bugs.
 * Month/year dropdowns are rendered manually above the calendar grid.
 */
function SimpleCalendar({
  selected,
  onSelect,
  disabled,
  month,
  onMonthChange,
}: {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  disabled?: { before?: Date; after?: Date };
  month?: Date;
  onMonthChange?: (date: Date) => void;
}) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState<Date>(month ?? selected ?? today);

  useEffect(() => {
    if (month) setCurrentMonth(month);
  }, [month]);

  const handleMonthChange = (m: Date) => {
    setCurrentMonth(m);
    onMonthChange?.(m);
  };

  // Manual month/year dropdowns
  const years: number[] = [];
  for (let y = 2015; y <= today.getFullYear() + 1; y++) years.push(y);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(Number(e.target.value));
    handleMonthChange(newDate);
  };

  const handleMonthSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(Number(e.target.value));
    handleMonthChange(newDate);
  };

  // Build proper disabled matcher (only include defined constraints)
  const disabledMatcher: Array<{ before?: Date } | { after?: Date }> = [];
  if (disabled?.before) disabledMatcher.push({ before: disabled.before });
  if (disabled?.after) disabledMatcher.push({ after: disabled.after });

  return (
    <div>
      {/* Manual dropdowns for month and year */}
      <div className="flex items-center justify-center gap-1 mb-2">
        <select
          value={currentMonth.getMonth()}
          onChange={handleMonthSelectChange}
          className="appearance-none bg-transparent border border-border rounded-md px-2 py-1 text-sm font-medium cursor-pointer hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {months.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
        <select
          value={currentMonth.getFullYear()}
          onChange={handleYearChange}
          className="appearance-none bg-transparent border border-border rounded-md px-2 py-1 text-sm font-medium cursor-pointer hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <DayPicker
        mode="single"
        showOutsideDays
        selected={selected}
        onSelect={onSelect}
        month={currentMonth}
        onMonthChange={handleMonthChange}
        disabled={disabledMatcher.length > 0 ? disabledMatcher : undefined}
        className="p-3"
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center gap-1",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
          ),
          day_range_end: "day-range-end",
          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
        }}
        components={{
          IconLeft: () => <ChevronLeft className="h-4 w-4" />,
          IconRight: () => <ChevronRight className="h-4 w-4" />,
        }}
      />
    </div>
  );
}

const DashboardDateFilter: React.FC<DashboardDateFilterProps> = ({
  preset,
  onPresetChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const isCustom = preset === 'custom';

  // Controlled month for end date calendar — follows start date selection
  const [endMonth, setEndMonth] = useState<Date>(customStart ?? new Date());

  useEffect(() => {
    if (customStart) setEndMonth(customStart);
  }, [customStart]);

  const handlePresetClick = useCallback((value: string) => {
    onPresetChange(value);
    onCustomStartChange(null);
    onCustomEndChange(null);
  }, [onPresetChange, onCustomStartChange, onCustomEndChange]);

  const formatDateShort = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const customLabel = isCustom && customStart && customEnd
    ? `${formatDateShort(customStart)} - ${formatDateShort(customEnd)}`
    : isCustom && customStart
      ? `From ${formatDateShort(customStart)}`
      : 'Custom';

  return (
    <div className="flex items-center gap-2">
      <div className="flex bg-slate-100 dark:bg-black/40 rounded-lg p-1 border border-slate-200 dark:border-white/5">
        {PRESETS.map((p) => (
          <Button
            key={p.value}
            variant={preset === p.value ? 'secondary' : 'ghost'}
            size="sm"
            className={cn(
              'h-7 px-3 text-xs font-medium rounded-md transition-all',
              preset === p.value
                ? 'bg-white dark:bg-primary/20 text-primary shadow-sm dark:shadow-[0_0_10px_rgba(var(--primary),0.2)]'
                : 'text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
            )}
            onClick={() => handlePresetClick(p.value)}
          >
            {p.label}
          </Button>
        ))}

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={isCustom ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'h-7 px-3 text-xs font-medium rounded-md transition-all gap-1.5',
                isCustom
                  ? 'bg-white dark:bg-primary/20 text-primary shadow-sm dark:shadow-[0_0_10px_rgba(var(--primary),0.2)]'
                  : 'text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
              )}
            >
              <CalendarIcon className="h-3 w-3 text-foreground" />
              {customLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="flex gap-0">
              <div className="border-r p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Start Date</p>
                <SimpleCalendar
                  selected={customStart ?? undefined}
                  onSelect={(date) => {
                    if (date) {
                      // Set preset FIRST, then date — so consumers using
                      // independent useState setters batch correctly.
                      // For consumers using a single object state (TradeReplay),
                      // the onCustomStartChange callback handles both.
                      onPresetChange('custom');
                      onCustomStartChange(date);
                    }
                  }}
                  disabled={{ after: customEnd ?? new Date() }}
                />
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">End Date</p>
                <SimpleCalendar
                  selected={customEnd ?? undefined}
                  month={endMonth}
                  onMonthChange={setEndMonth}
                  onSelect={(date) => {
                    if (date) {
                      onPresetChange('custom');
                      onCustomEndChange(date);
                      if (customStart) setCalendarOpen(false);
                    }
                  }}
                  disabled={{
                    before: customStart ?? undefined,
                    after: new Date(),
                  }}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default DashboardDateFilter;
