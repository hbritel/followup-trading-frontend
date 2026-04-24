import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Loader2, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SessionOfferingDto } from '@/types/dto';

interface Props {
  offering: SessionOfferingDto;
  onConfirm: (scheduledAt: string) => void;
  isPending?: boolean;
}

const SLOT_MINUTES = 30;

const buildDays = (): Date[] => {
  const days: Date[] = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i + 1);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
};

const buildSlots = (day: Date): string[] => {
  const slots: string[] = [];
  for (let h = 8; h < 22; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      const d = new Date(day);
      d.setHours(h, m, 0, 0);
      slots.push(d.toISOString());
    }
  }
  return slots;
};

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const SessionBookingCalendar: React.FC<Props> = ({ offering, onConfirm, isPending }) => {
  const { t } = useTranslation();
  const days = useMemo(() => buildDays(), []);

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string | undefined>(undefined);

  const weekStart = weekOffset * 7;
  const weekDays = days.slice(weekStart, weekStart + 7);
  const slots = useMemo(() => (selectedDay ? buildSlots(selectedDay) : []), [selectedDay]);

  const fmtDay = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const fmtSlot = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const fmtPrice = (cents: number, currency: string) => {
    const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
    return `${sym}${(cents / 100).toFixed(2)}`;
  };

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setSelectedSlot(undefined);
  };

  const handleConfirm = () => {
    if (selectedSlot) onConfirm(selectedSlot);
  };

  return (
    <div className="space-y-5">
      {/* Offering summary */}
      <div className="rounded-xl bg-muted/20 border border-border/40 p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm">{offering.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {offering.durationMinutes}
            {t('mentor.sessions.min', ' min')}
            {' · '}
            <span className="inline-flex items-center gap-0.5">
              <DollarSign className="w-3 h-3" aria-hidden="true" />
              {fmtPrice(offering.priceCents, offering.currency)}
            </span>
          </p>
        </div>
      </div>

      {/* Week navigation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('mentor.sessions.calendar.pickDay', 'Select a day')}
          </p>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={weekOffset === 0}
              onClick={() => setWeekOffset((v) => v - 1)}
              aria-label={t('mentor.sessions.calendar.prevWeek', 'Previous week')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={weekStart + 7 >= days.length}
              onClick={() => setWeekOffset((v) => v + 1)}
              aria-label={t('mentor.sessions.calendar.nextWeek', 'Next week')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${weekDays.length}, minmax(0,1fr))` }}
          role="group"
          aria-label={t('mentor.sessions.calendar.days', 'Available days')}
        >
          {weekDays.map((d) => {
            const isSelected = selectedDay?.toDateString() === d.toDateString();
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => handleDayClick(d)}
                className={[
                  'flex flex-col items-center gap-0.5 rounded-xl px-1 py-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/30 hover:bg-muted/60 text-foreground',
                ].join(' ')}
                aria-pressed={isSelected}
              >
                <span className="text-[10px] font-normal opacity-70">
                  {DAY_LABELS[d.getDay()]}
                </span>
                <span>{fmtDay(d)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDay && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('mentor.sessions.calendar.pickTime', 'Select a time')}
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {slots.map((iso) => {
              const isSelected = selectedSlot === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedSlot(iso)}
                  className={[
                    'rounded-lg px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/30 hover:bg-muted/60',
                  ].join(' ')}
                  aria-pressed={isSelected}
                >
                  {fmtSlot(iso)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirm */}
      <Button
        className="w-full"
        disabled={!selectedSlot || isPending}
        onClick={handleConfirm}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {selectedSlot
          ? t('mentor.sessions.calendar.confirm', 'Confirm {{time}}', {
              time: new Date(selectedSlot).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
            })
          : t('mentor.sessions.calendar.selectFirst', 'Select a slot to continue')}
      </Button>
    </div>
  );
};

export default SessionBookingCalendar;
