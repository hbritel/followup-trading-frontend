
import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card } from '@/components/ui/card';

interface DateRangeFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onApply: () => void;
  onReset: () => void;
  isOpen: boolean;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onReset,
  isOpen
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <Card className="p-4 mb-4">
      <h3 className="text-lg font-medium mb-4">{t('trades.dateRangeFilter')}</h3>
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="w-full md:w-auto">
          <label className="text-sm font-medium mb-1 block">
            {t('trades.startDate')}
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full md:w-[240px] justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : <span>{t('trades.pickStartDate')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate || undefined}
                onSelect={onStartDateChange}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="w-full md:w-auto">
          <label className="text-sm font-medium mb-1 block">
            {t('trades.endDate')}
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full md:w-[240px] justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>{t('trades.pickEndDate')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate || undefined}
                onSelect={onEndDateChange}
                disabled={(date) => startDate ? date < startDate : false}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2 self-end mt-auto">
          <Button variant="outline" onClick={onReset}>
            {t('common.reset')}
          </Button>
          <Button onClick={onApply}>
            {t('common.apply')}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default DateRangeFilter;
