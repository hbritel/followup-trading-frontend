import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRESETS = [
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

  const handlePresetClick = (value: string) => {
    onPresetChange(value);
    onCustomStartChange(null);
    onCustomEndChange(null);
  };

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
              <CalendarIcon className="h-3 w-3" />
              {customLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="flex gap-0">
              <div className="border-r p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Start Date</p>
                <Calendar
                  mode="single"
                  selected={customStart ?? undefined}
                  onSelect={(date) => {
                    onCustomStartChange(date ?? null);
                    onPresetChange('custom');
                  }}
                  disabled={{ after: customEnd || new Date() }}
                  initialFocus
                />
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">End Date</p>
                <Calendar
                  mode="single"
                  selected={customEnd ?? undefined}
                  onSelect={(date) => {
                    onCustomEndChange(date ?? null);
                    onPresetChange('custom');
                    if (date && customStart) setCalendarOpen(false);
                  }}
                  disabled={{ before: customStart || undefined, after: new Date() }}
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
