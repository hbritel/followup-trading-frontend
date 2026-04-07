
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSymbolSearch } from '@/hooks/useSymbolSearch';
import { cn } from '@/lib/utils';
import { Search, Loader2, ArrowUp, ArrowDown, ArrowUpDown, Bell, ChevronDown, Mail, Smartphone, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export interface SymbolFormValues {
  symbol: string;
  notes: string;
  alertPrice: string;
  alertCondition: string;
  alertName: string;
  notifyEmail: boolean;
  notifyPush: boolean;
}

interface SymbolFormProps {
  onSubmit: (data: SymbolFormValues) => void;
  isPending?: boolean;
}

const SymbolForm: React.FC<SymbolFormProps> = ({ onSubmit, isPending = false }) => {
  const { t } = useTranslation();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [symbolInput, setSymbolInput] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: searchResults = [], isLoading: searchLoading } = useSymbolSearch(symbolInput);

  const form = useForm<SymbolFormValues>({
    defaultValues: {
      symbol: '',
      notes: '',
      alertPrice: '',
      alertCondition: 'CROSSES',
      alertName: '',
      notifyEmail: false,
      notifyPush: true,
    },
  });

  const watchedSymbol = form.watch('symbol');
  const watchedAlertPrice = form.watch('alertPrice');

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectSymbol = (symbol: string) => {
    setSymbolInput(symbol);
    form.setValue('symbol', symbol, { shouldValidate: true });
    setShowSuggestions(false);
  };

  const getAssetTypeBadge = (assetType: string) => {
    const colors: Record<string, string> = {
      FOREX: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      CRYPTO: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      INDEX: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      COMMODITY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      STOCK: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
    };
    return colors[assetType] || colors.STOCK;
  };

  const getSourceBadge = (source: string) => {
    if (source === 'LOCAL') return null;
    return (
      <Badge variant="outline" className="text-[9px] shrink-0 ml-1 opacity-60">
        Yahoo
      </Badge>
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="symbol"
          rules={{ required: t('watchlists.symbolRequired') }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('watchlists.symbol')}</FormLabel>
              <div className="relative">
                <FormControl>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={inputRef}
                      placeholder={t('watchlists.symbolSearchPlaceholder')}
                      className="pl-8"
                      value={symbolInput}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setSymbolInput(val);
                        field.onChange(val);
                        setShowSuggestions(val.length >= 2);
                      }}
                      onFocus={() => {
                        if (symbolInput.length >= 2) setShowSuggestions(true);
                      }}
                      autoComplete="off"
                    />
                    {searchLoading && symbolInput.length >= 2 && (
                      <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </FormControl>

                {/* Suggestions dropdown */}
                {showSuggestions && searchResults.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 mt-1 w-full rounded-xl border bg-popover shadow-lg overflow-hidden"
                  >
                    <div className="max-h-[200px] overflow-y-auto py-1">
                      {searchResults.map((s) => (
                        <button
                          key={`${s.symbol}-${s.source}`}
                          type="button"
                          className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left"
                          onClick={() => selectSymbol(s.symbol)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono font-medium">{s.symbol}</span>
                            <span className="text-muted-foreground truncate text-xs">
                              {s.displayName}
                            </span>
                            {getSourceBadge(s.source)}
                          </div>
                          <Badge
                            variant="secondary"
                            className={cn('text-[10px] shrink-0 ml-2', getAssetTypeBadge(s.assetType))}
                          >
                            {s.assetType}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* No results hint */}
                {showSuggestions && symbolInput.length >= 2 && searchResults.length === 0 && !searchLoading && (
                  <div className="absolute z-50 mt-1 w-full rounded-xl border bg-popover shadow-lg p-3 text-sm text-muted-foreground text-center">
                    {t('watchlists.noSymbolsFound')}
                  </div>
                )}
              </div>
              <FormDescription>{t('watchlists.symbolSearchHint')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('watchlists.notes')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('watchlists.notesPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Alert Configuration — Collapsible section */}
        <Collapsible open={alertOpen} onOpenChange={setAlertOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex items-center justify-between w-full rounded-xl border px-4 py-3 text-sm transition-colors',
                alertOpen || watchedAlertPrice
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-border/50 bg-muted/30 hover:bg-muted/50'
              )}
            >
              <div className="flex items-center gap-2">
                <Bell className={cn('h-4 w-4', alertOpen || watchedAlertPrice ? 'text-amber-500' : 'text-muted-foreground')} />
                <span className="font-medium">
                  {watchedAlertPrice
                    ? t('watchlists.alertConfigured')
                    : t('watchlists.addAlert')}
                </span>
                {watchedAlertPrice && (
                  <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {watchedAlertPrice}
                  </Badge>
                )}
              </div>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', alertOpen && 'rotate-180')} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3">
            {/* Alert Price + Condition — side by side */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="alertPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('watchlists.alertPrice')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="2300.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alertCondition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('watchlists.alertCondition')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ABOVE">
                          <div className="flex items-center gap-2">
                            <ArrowUp className="h-3.5 w-3.5 text-green-500" />
                            {t('watchlists.conditionAbove')}
                          </div>
                        </SelectItem>
                        <SelectItem value="BELOW">
                          <div className="flex items-center gap-2">
                            <ArrowDown className="h-3.5 w-3.5 text-red-500" />
                            {t('watchlists.conditionBelow')}
                          </div>
                        </SelectItem>
                        <SelectItem value="CROSSES">
                          <div className="flex items-center gap-2">
                            <ArrowUpDown className="h-3.5 w-3.5 text-amber-500" />
                            {t('watchlists.conditionCrosses')}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Alert Name — auto-generated but editable */}
            {watchedAlertPrice && (
              <>
                <FormField
                  control={form.control}
                  name="alertName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('watchlists.alertName')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={watchedSymbol ? `${watchedSymbol} price alert` : t('watchlists.alertNamePlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>{t('watchlists.alertNameDescription')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notification toggles */}
                <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('watchlists.notifications')}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                      <Label htmlFor="notifyPush" className="text-sm">{t('watchlists.pushNotification')}</Label>
                    </div>
                    <Switch
                      id="notifyPush"
                      checked={form.watch('notifyPush')}
                      onCheckedChange={(checked) => form.setValue('notifyPush', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <Label htmlFor="notifyEmail" className="text-sm">{t('watchlists.emailNotification')}</Label>
                    </div>
                    <Switch
                      id="notifyEmail"
                      checked={form.watch('notifyEmail')}
                      onCheckedChange={(checked) => form.setValue('notifyEmail', checked)}
                    />
                  </div>
                </div>
              </>
            )}
          </CollapsibleContent>
        </Collapsible>

        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.saving', 'Adding...')}
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {t('watchlists.addSymbol')}
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default SymbolForm;
