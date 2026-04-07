import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Search, Loader2, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { useSymbolSearch } from '@/hooks/useSymbolSearch';
import type { StrategyResponseDto } from '@/types/dto';

interface NewSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategies: StrategyResponseDto[];
  onSubmit: (data: {
    name: string;
    symbol: string;
    strategyId: string | null;
    timeframe: string;
    startDate: string;
    endDate: string;
    initialCapital: number;
    icon: string;
  }) => void;
  isPending?: boolean;
}

const SESSION_EMOJIS = [
  '📈', '📉', '💰', '💎', '🏦', '🪙', '💵', '💹',
  '🔥', '⭐', '🎯', '🛡️', '⚡', '🌍', '🏆', '🔔',
  '📊', '💡', '🚀', '👀',
];

const TIMEFRAMES = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '1d', label: 'Daily (1D)' },
  { value: '1wk', label: 'Weekly (1W)' },
];

const NewSessionDialog: React.FC<NewSessionDialogProps> = ({
  open, onOpenChange, strategies, onSubmit, isPending,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [symbol, setSymbol] = useState('');
  const [strategyId, setStrategyId] = useState<string>('__none__');
  const [timeframe, setTimeframe] = useState('1d');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Touched state — only show errors after user has interacted with the field
  const [touched, setTouched] = useState({ name: false, symbol: false, startDate: false, endDate: false });

  // Yahoo Finance date limits per timeframe (range-based, not absolute)
  const { minDate, maxDate, maxRangeDays } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let rangeDays: number;
    switch (timeframe) {
      case '1m':  rangeDays = 7; break;
      case '5m':  rangeDays = 7; break;
      case '15m': rangeDays = 60; break;
      case '30m': rangeDays = 60; break;
      case '1h':  rangeDays = 730; break;
      default:    rangeDays = 36500; break; // ~100 years = no limit
    }
    const min = new Date(today);
    min.setDate(min.getDate() - rangeDays);
    return { minDate: min, maxDate: today, maxRangeDays: rangeDays };
  }, [timeframe]);

  // Max end date = start date + maxRangeDays (or today, whichever is earlier)
  const maxEndDate = useMemo(() => {
    if (!startDate) return maxDate;
    const maxEnd = new Date(startDate);
    maxEnd.setDate(maxEnd.getDate() + maxRangeDays);
    return maxEnd < maxDate ? maxEnd : maxDate;
  }, [startDate, maxRangeDays, maxDate]);

  // Clear dates that fall outside the new range when timeframe changes
  useEffect(() => {
    if (startDate && startDate < minDate) setStartDate(undefined);
    if (endDate && endDate < minDate) setEndDate(undefined);
  }, [timeframe]);
  const [initialCapital, setInitialCapital] = useState('10000');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: searchResults = [], isLoading: searchLoading } = useSymbolSearch(symbol);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = () => {
    // Mark all required fields as touched to show validation errors
    setTouched({ name: true, symbol: true, startDate: true, endDate: true });
    if (!name || !symbol || !startDate || !endDate) return;
    onSubmit({
      name,
      symbol: symbol.toUpperCase(),
      strategyId: strategyId === '__none__' ? null : strategyId,
      timeframe,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      initialCapital: Number.parseFloat(initialCapital) || 10000,
      icon,
    });
    setName('');
    setIcon('');
    setSymbol('');
    setStrategyId('__none__');
    setTimeframe('1d');
    setStartDate(undefined);
    setEndDate(undefined);
    setInitialCapital('10000');
    setTouched({ name: false, symbol: false, startDate: false, endDate: false });
  };

  const isValid = !!(name && symbol && startDate && endDate);

  // Per-field error visibility (only after touch)
  const errors = {
    name: touched.name && !name,
    symbol: touched.symbol && !symbol,
    startDate: touched.startDate && !startDate,
    endDate: touched.endDate && !endDate,
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset touched state when dialog closes so validation doesn't linger
      setTouched({ name: false, symbol: false, startDate: false, endDate: false });
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('backtesting.newSession')}</DialogTitle>
          <DialogDescription>{t('backtesting.newSessionDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Icon + Session Name */}
          <div className="space-y-2">
            <Label>
              {t('backtesting.sessionName')}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'w-10 h-10 rounded-xl border flex items-center justify-center text-xl shrink-0 transition-colors cursor-pointer',
                      icon ? 'bg-primary/10 border-primary/30' : 'bg-muted/50 hover:bg-muted'
                    )}
                  >
                    {icon || <BarChart3 className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                    {SESSION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={cn(
                          'w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all',
                          icon === emoji ? 'bg-primary/15 ring-2 ring-primary scale-110' : 'bg-muted/50 hover:bg-muted hover:scale-105'
                        )}
                        onClick={() => setIcon(icon === emoji ? '' : emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Input
                className={cn('flex-1', errors.name && 'border-destructive focus-visible:ring-destructive')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                placeholder={t('backtesting.sessionNamePlaceholder')}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-destructive">{t('backtesting.nameRequired', 'Session name is required')}</p>
            )}
          </div>

          {/* Symbol with autocomplete */}
          <div className="space-y-2">
            <Label>
              {t('backtesting.symbol')}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                className={cn('pl-8', errors.symbol && 'border-destructive focus-visible:ring-destructive')}
                value={symbol}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setSymbol(val);
                  setShowSuggestions(val.length >= 2);
                  if (!name) setName(`${val} Backtest`);
                }}
                onFocus={() => { if (symbol.length >= 2) setShowSuggestions(true); }}
                onBlur={() => setTouched((prev) => ({ ...prev, symbol: true }))}
                placeholder={t('backtesting.symbolPlaceholder')}
                autoComplete="off"
              />
              {searchLoading && symbol.length >= 2 && (
                <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {showSuggestions && searchResults.length > 0 && (
                <div ref={suggestionsRef} className="absolute z-50 mt-1 w-full rounded-xl border bg-popover shadow-lg overflow-hidden">
                  <div className="max-h-[180px] overflow-y-auto py-1">
                    {searchResults.map((s) => (
                      <button
                        key={`${s.symbol}-${s.source}`}
                        type="button"
                        className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left"
                        onClick={() => {
                          setSymbol(s.symbol);
                          if (!name || name.endsWith(' Backtest')) setName(`${s.symbol} Backtest`);
                          setShowSuggestions(false);
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-medium">{s.symbol}</span>
                          <span className="text-muted-foreground truncate text-xs">{s.displayName}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">{s.assetType}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {errors.symbol && (
              <p className="text-xs text-destructive">{t('backtesting.symbolRequired', 'Symbol is required')}</p>
            )}
          </div>

          {/* Strategy + Timeframe in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('backtesting.strategy')}</Label>
              <Select value={strategyId} onValueChange={setStrategyId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('backtesting.selectStrategy')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('backtesting.noStrategy')}</SelectItem>
                  {strategies.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('backtesting.timeframe')}</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map((tf) => (
                    <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>
                {t('backtesting.startDate')}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground',
                      errors.startDate && 'border-destructive',
                    )}
                    onBlur={() => setTouched((prev) => ({ ...prev, startDate: true }))}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'yyyy-MM-dd') : t('backtesting.pickDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => {
                      setStartDate(d);
                      setTouched((prev) => ({ ...prev, startDate: true }));
                    }}
                    disabled={(date) => date < minDate || date > maxDate}
                    defaultMonth={minDate > new Date(2020, 0, 1) ? minDate : undefined}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && (
                <p className="text-xs text-destructive">{t('backtesting.startDateRequired', 'Start date is required')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>
                {t('backtesting.endDate')}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground',
                      errors.endDate && 'border-destructive',
                    )}
                    onBlur={() => setTouched((prev) => ({ ...prev, endDate: true }))}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'yyyy-MM-dd') : t('backtesting.pickDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(d) => {
                      setEndDate(d);
                      setTouched((prev) => ({ ...prev, endDate: true }));
                    }}
                    disabled={(date) => date < (startDate ?? minDate) || date > maxEndDate}
                    defaultMonth={startDate ?? (minDate > new Date(2020, 0, 1) ? minDate : undefined)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.endDate && (
                <p className="text-xs text-destructive">{t('backtesting.endDateRequired', 'End date is required')}</p>
              )}
            </div>
          </div>

          {/* Initial Capital */}
          <div className="space-y-2">
            <Label>{t('backtesting.initialCapital')}</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
              <Input
                className="pl-7"
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                placeholder="10000"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('backtesting.createSession')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewSessionDialog;
