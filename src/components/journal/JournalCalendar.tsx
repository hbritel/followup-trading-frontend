
import React from 'react';
import { cn } from '@/lib/utils';
import { Calendar } from "@/components/ui/calendar";
import type { JournalEntryResponseDto } from '@/types/dto';

const MOOD_DOT_COLORS: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-amber-500',
  4: 'bg-lime-500',
  5: 'bg-emerald-500',
};

interface JournalCalendarProps {
  entries: JournalEntryResponseDto[];
  selectedMonth: Date;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
  onNewEntryForDate?: (date: Date) => void;
}

const JournalCalendar: React.FC<JournalCalendarProps> = ({
  entries,
  selectedMonth,
  onMonthChange,
  onSelectDate,
  onNewEntryForDate,
}) => {
  // Group entries by date key → array of entries (supports multiple per day)
  const entryMap = React.useMemo(() => {
    const map = new Map<string, JournalEntryResponseDto[]>();
    entries.forEach((entry) => {
      const existing = map.get(entry.date) ?? [];
      existing.push(entry);
      map.set(entry.date, existing);
    });
    return map;
  }, [entries]);

  return (
    <Calendar
      mode="single"
      month={selectedMonth}
      onMonthChange={onMonthChange}
      onDayClick={(day) => {
        const key = [
          day.getFullYear(),
          String(day.getMonth() + 1).padStart(2, '0'),
          String(day.getDate()).padStart(2, '0'),
        ].join('-');
        if (entryMap.has(key)) {
          onSelectDate(day);
        } else if (onNewEntryForDate) {
          onNewEntryForDate(day);
        }
      }}
      className="rounded-xl w-full"
      classNames={{
        months: 'flex flex-col',
        month: 'space-y-2',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md hover:bg-accent'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse',
        head_row: 'flex',
        head_cell: 'text-muted-foreground rounded-md flex-1 font-normal text-[0.7rem] text-center',
        row: 'flex w-full mt-1',
        cell: 'flex-1 text-center text-sm p-0 relative focus-within:relative focus-within:z-20',
        day: cn(
          'h-8 w-full p-0 font-normal rounded-md hover:bg-accent hover:text-accent-foreground',
          'inline-flex flex-col items-center justify-center gap-0 transition-colors'
        ),
        day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today: 'bg-accent/40 text-accent-foreground font-semibold',
        day_outside: 'text-muted-foreground opacity-30',
        day_disabled: 'text-muted-foreground opacity-30',
        day_hidden: 'invisible',
      }}
      components={{
        DayContent: ({ date: day }) => {
          const key = [
            day.getFullYear(),
            String(day.getMonth() + 1).padStart(2, '0'),
            String(day.getDate()).padStart(2, '0'),
          ].join('-');
          const dayEntries = entryMap.get(key) ?? [];
          // Show up to 4 dots; if there's only 1 entry use a slightly wider dot for visual balance
          const visibleEntries = dayEntries.slice(0, 4);

          return (
            <span className="relative flex flex-col items-center justify-center w-full h-full">
              <span className="text-xs leading-none">{day.getDate()}</span>
              {visibleEntries.length > 0 && (
                <span className="mt-0.5 flex items-center gap-0.5" aria-hidden="true">
                  {visibleEntries.map((entry, idx) => {
                    const dotColor = MOOD_DOT_COLORS[entry.mood] ?? 'bg-primary';
                    return (
                      <span
                        key={entry.id ?? idx}
                        className={cn(
                          'rounded-full',
                          dotColor,
                          visibleEntries.length === 1 ? 'h-1 w-2' : 'h-1 w-1'
                        )}
                      />
                    );
                  })}
                </span>
              )}
            </span>
          );
        },
      }}
    />
  );
};

export default JournalCalendar;
