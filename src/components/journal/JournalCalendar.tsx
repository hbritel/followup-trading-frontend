
import React from 'react';
import { cn } from '@/lib/utils';
import { SimpleCalendar } from '@/components/ui/simple-calendar';
import type { DayContentProps } from 'react-day-picker';
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
  // Group entries by date key
  const entryMap = React.useMemo(() => {
    const map = new Map<string, JournalEntryResponseDto[]>();
    entries.forEach((entry) => {
      const existing = map.get(entry.date) ?? [];
      existing.push(entry);
      map.set(entry.date, existing);
    });
    return map;
  }, [entries]);

  const handleDayClick = (day: Date) => {
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
  };

  const renderDay = ({ date: day }: DayContentProps) => {
    const key = [
      day.getFullYear(),
      String(day.getMonth() + 1).padStart(2, '0'),
      String(day.getDate()).padStart(2, '0'),
    ].join('-');
    const dayEntries = entryMap.get(key) ?? [];
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
  };

  return (
    <SimpleCalendar
      month={selectedMonth}
      onMonthChange={onMonthChange}
      onDayClick={handleDayClick}
      renderDay={renderDay}
      className="rounded-xl w-full"
    />
  );
};

export default JournalCalendar;
