import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { BacktestResponseDto } from '@/types/dto';

interface EditSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: BacktestResponseDto | null;
  onSubmit: (data: {
    name: string;
    symbol: string;
    timeframe: string;
    startDate: string;
    endDate: string;
  }) => void;
  isPending?: boolean;
}

const TIMEFRAMES = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '1d', label: 'Daily (1D)' },
  { value: '1wk', label: 'Weekly (1W)' },
];

const EditSessionDialog: React.FC<EditSessionDialogProps> = ({
  open, onOpenChange, session, onSubmit, isPending,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [timeframe, setTimeframe] = useState('1d');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Populate from session when dialog opens
  useEffect(() => {
    if (session && open) {
      setName(session.name);
      setSymbol(session.symbol ?? '');
      setTimeframe(session.timeframe ?? '1d');
      setStartDate(session.startDate ? new Date(session.startDate) : undefined);
      setEndDate(session.endDate ? new Date(session.endDate) : undefined);
    }
  }, [session, open]);

  // Date limits per timeframe
  const { minDate, maxDate, maxRangeDays } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let rangeDays: number;
    switch (timeframe) {
      case '1m': case '5m': rangeDays = 7; break;
      case '15m': case '30m': rangeDays = 60; break;
      case '1h': rangeDays = 730; break;
      default: rangeDays = 36500; break;
    }
    const min = new Date(today);
    min.setDate(min.getDate() - rangeDays);
    return { minDate: min, maxDate: today, maxRangeDays: rangeDays };
  }, [timeframe]);

  const maxEndDate = useMemo(() => {
    if (!startDate) return maxDate;
    const maxEnd = new Date(startDate);
    maxEnd.setDate(maxEnd.getDate() + maxRangeDays);
    return maxEnd < maxDate ? maxEnd : maxDate;
  }, [startDate, maxRangeDays, maxDate]);

  useEffect(() => {
    if (startDate && startDate < minDate) setStartDate(undefined);
    if (endDate && endDate < minDate) setEndDate(undefined);
  }, [timeframe]);

  const handleSubmit = () => {
    if (!name || !symbol || !startDate || !endDate) return;
    onSubmit({
      name,
      symbol: symbol.toUpperCase(),
      timeframe,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    });
  };

  const isValid = name && symbol && startDate && endDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('backtesting.editSession')}</DialogTitle>
          <DialogDescription>{t('backtesting.editSessionDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t('backtesting.sessionName')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>{t('backtesting.symbol')}</Label>
            <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
          </div>

          <div className="space-y-2">
            <Label>{t('backtesting.timeframe')}</Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEFRAMES.map((tf) => (
                  <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('backtesting.startDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !startDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'yyyy-MM-dd') : t('backtesting.pickDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < minDate || date > maxDate}
                    defaultMonth={startDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>{t('backtesting.endDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !endDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'yyyy-MM-dd') : t('backtesting.pickDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < (startDate ?? minDate) || date > maxEndDate}
                    defaultMonth={endDate ?? startDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSessionDialog;
