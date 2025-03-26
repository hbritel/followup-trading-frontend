
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Filter, 
  Repeat, 
  Calendar, 
  Hash, 
  ArrowUpDown, 
  Percent, 
  DollarSign, 
  BookOpen, 
  Tag, 
  BarChart,
  TrendingUp
} from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { format } from "date-fns";

// Define filter interface
interface FilterOptions {
  symbols: string[];
  strategies: string[];
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  status: string[];
  types: string[];
  tags: string[];
  profitRange: [number, number];
  riskRewardRange: [number, number];
  holdingPeriodRange: [number, number];
  winningTradesOnly: boolean;
  losingTradesOnly: boolean;
  withNotesOnly: boolean;
  marketAlignment: string;
  advancedFilters: {
    minProfitPercent?: number;
    maxDrawdown?: number;
    minEntryQuality?: number;
    minExitQuality?: number;
    hasStoploss?: boolean;
    hasTakeProfit?: boolean;
  };
}

// Default filter values
const defaultFilters: FilterOptions = {
  symbols: [],
  strategies: [],
  dateRange: {
    from: undefined,
    to: undefined,
  },
  status: [],
  types: [],
  tags: [],
  profitRange: [-1000, 1000],
  riskRewardRange: [0, 5],
  holdingPeriodRange: [0, 48],
  winningTradesOnly: false,
  losingTradesOnly: false,
  withNotesOnly: false,
  marketAlignment: 'any',
  advancedFilters: {},
};

// Sample data for filter options
const sampleSymbols = ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'NVDA', 'SPY', 'QQQ'];
const sampleStrategies = ['Breakout', 'Reversal', 'Trend Following', 'Scalping', 'Swing', 'Position'];
const sampleTags = ['Good Entry', 'Bad Exit', 'News Based', 'Earnings', 'Morning', 'Afternoon', 'Impulse', 'Emotional'];

interface AdvancedTradeFilterProps {
  onApplyFilters: (filters: FilterOptions) => void;
  activeFilters?: Partial<FilterOptions>;
}

const AdvancedTradeFilter = ({ onApplyFilters, activeFilters = {} }: AdvancedTradeFilterProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    ...defaultFilters,
    ...activeFilters,
  });
  
  // Handle Reset Filters
  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };
  
  // Handle Apply Filters
  const handleApplyFilters = () => {
    onApplyFilters(filters);
    setIsOpen(false);
    
    toast({
      title: t('trades.filtersApplied'),
      description: t('trades.filtersAppliedDescription'),
    });
  };
  
  // Active filter count
  const getActiveFilterCount = (): number => {
    let count = 0;
    
    if (filters.symbols.length > 0) count++;
    if (filters.strategies.length > 0) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.status.length > 0) count++;
    if (filters.types.length > 0) count++;
    if (filters.tags.length > 0) count++;
    if (filters.profitRange[0] !== defaultFilters.profitRange[0] || 
        filters.profitRange[1] !== defaultFilters.profitRange[1]) count++;
    if (filters.riskRewardRange[0] !== defaultFilters.riskRewardRange[0] || 
        filters.riskRewardRange[1] !== defaultFilters.riskRewardRange[1]) count++;
    if (filters.holdingPeriodRange[0] !== defaultFilters.holdingPeriodRange[0] || 
        filters.holdingPeriodRange[1] !== defaultFilters.holdingPeriodRange[1]) count++;
    if (filters.winningTradesOnly) count++;
    if (filters.losingTradesOnly) count++;
    if (filters.withNotesOnly) count++;
    if (filters.marketAlignment !== 'any') count++;
    
    // Count advanced filters
    if (filters.advancedFilters.minProfitPercent !== undefined) count++;
    if (filters.advancedFilters.maxDrawdown !== undefined) count++;
    if (filters.advancedFilters.minEntryQuality !== undefined) count++;
    if (filters.advancedFilters.minExitQuality !== undefined) count++;
    if (filters.advancedFilters.hasStoploss !== undefined) count++;
    if (filters.advancedFilters.hasTakeProfit !== undefined) count++;
    
    return count;
  };
  
  // Toggle a value in an array filter
  const toggleArrayFilter = (array: string[], value: string): string[] => {
    return array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value];
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <Filter className="mr-2 h-4 w-4" />
          {t('trades.advancedFilters')}
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="ml-1 px-1">{getActiveFilterCount()}</Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('trades.advancedFilters')}</DialogTitle>
          <DialogDescription>
            {t('trades.advancedFiltersDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* First row: Basic filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Symbols */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base flex items-center">
                  <Hash className="mr-2 h-4 w-4" />
                  {t('trades.symbols')}
                </Label>
                {filters.symbols.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2"
                    onClick={() => setFilters({...filters, symbols: []})}
                  >
                    {t('common.clear')}
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {sampleSymbols.map((symbol) => (
                  <Badge 
                    key={symbol} 
                    variant={filters.symbols.includes(symbol) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setFilters({
                        ...filters, 
                        symbols: toggleArrayFilter(filters.symbols, symbol)
                      });
                    }}
                  >
                    {symbol}
                  </Badge>
                ))}
                <Badge 
                  variant="outline" 
                  className="cursor-pointer"
                  onClick={() => {
                    // In a real app, this would open a more comprehensive symbol selector
                    toast({
                      title: t('trades.moreSymbols'),
                      description: t('trades.moreSymbolsDescription'),
                    });
                  }}
                >
                  {t('trades.more')}...
                </Badge>
              </div>
            </div>
            
            {/* Strategies */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  {t('trades.strategies')}
                </Label>
                {filters.strategies.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2"
                    onClick={() => setFilters({...filters, strategies: []})}
                  >
                    {t('common.clear')}
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {sampleStrategies.map((strategy) => (
                  <Badge 
                    key={strategy} 
                    variant={filters.strategies.includes(strategy) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setFilters({
                        ...filters, 
                        strategies: toggleArrayFilter(filters.strategies, strategy)
                      });
                    }}
                  >
                    {strategy}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          {/* Second row: Date range, status, and type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-base flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                {t('trades.dateRange')}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="date-from">{t('trades.from')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant={"outline"}
                        className={`w-full justify-start text-left font-normal ${
                          !filters.dateRange.from && "text-muted-foreground"
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.from ? (
                          format(filters.dateRange.from, "PPP")
                        ) : (
                          <span>{t('trades.pickDate')}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarPicker
                        mode="single"
                        selected={filters.dateRange.from}
                        onSelect={(date) => setFilters({
                          ...filters, 
                          dateRange: {...filters.dateRange, from: date}
                        })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="date-to">{t('trades.to')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant={"outline"}
                        className={`w-full justify-start text-left font-normal ${
                          !filters.dateRange.to && "text-muted-foreground"
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.to ? (
                          format(filters.dateRange.to, "PPP")
                        ) : (
                          <span>{t('trades.pickDate')}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarPicker
                        mode="single"
                        selected={filters.dateRange.to}
                        onSelect={(date) => setFilters({
                          ...filters, 
                          dateRange: {...filters.dateRange, to: date}
                        })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            
            {/* Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base">{t('trades.status')}</Label>
                {filters.status.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2"
                    onClick={() => setFilters({...filters, status: []})}
                  >
                    {t('common.clear')}
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {['open', 'closed', 'pending', 'cancelled'].map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`status-${status}`} 
                      checked={filters.status.includes(status)}
                      onCheckedChange={() => {
                        setFilters({
                          ...filters, 
                          status: toggleArrayFilter(filters.status, status)
                        });
                      }}
                    />
                    <Label 
                      htmlFor={`status-${status}`}
                      className="text-sm font-normal capitalize"
                    >
                      {status}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Type */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base">{t('trades.type')}</Label>
                {filters.types.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2"
                    onClick={() => setFilters({...filters, types: []})}
                  >
                    {t('common.clear')}
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {['buy', 'sell', 'short', 'cover'].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`type-${type}`} 
                      checked={filters.types.includes(type)}
                      onCheckedChange={() => {
                        setFilters({
                          ...filters, 
                          types: toggleArrayFilter(filters.types, type)
                        });
                      }}
                    />
                    <Label 
                      htmlFor={`type-${type}`}
                      className="text-sm font-normal capitalize"
                    >
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Third row: Profit range, Risk/Reward, Holding period */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profit Range */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base flex items-center">
                  <DollarSign className="mr-2 h-4 w-4" />
                  {t('trades.profitRange')}
                </Label>
                <span className="text-sm">
                  ${filters.profitRange[0]} - ${filters.profitRange[1]}
                </span>
              </div>
              <Slider
                defaultValue={[filters.profitRange[0], filters.profitRange[1]]}
                min={-1000}
                max={1000}
                step={50}
                onValueChange={(value) => {
                  setFilters({
                    ...filters,
                    profitRange: [value[0], value[1]] as [number, number]
                  });
                }}
              />
            </div>
            
            {/* Risk/Reward Range */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base flex items-center">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  {t('trades.riskRewardRange')}
                </Label>
                <span className="text-sm">
                  {filters.riskRewardRange[0]}:1 - {filters.riskRewardRange[1]}:1
                </span>
              </div>
              <Slider
                defaultValue={[filters.riskRewardRange[0], filters.riskRewardRange[1]]}
                min={0}
                max={5}
                step={0.5}
                onValueChange={(value) => {
                  setFilters({
                    ...filters,
                    riskRewardRange: [value[0], value[1]] as [number, number]
                  });
                }}
              />
            </div>
            
            {/* Holding Period Range */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base flex items-center">
                  <Repeat className="mr-2 h-4 w-4" />
                  {t('trades.holdingPeriodRange')}
                </Label>
                <span className="text-sm">
                  {filters.holdingPeriodRange[0]} - {filters.holdingPeriodRange[1]} {t('trades.hours')}
                </span>
              </div>
              <Slider
                defaultValue={[filters.holdingPeriodRange[0], filters.holdingPeriodRange[1]]}
                min={0}
                max={48}
                step={1}
                onValueChange={(value) => {
                  setFilters({
                    ...filters,
                    holdingPeriodRange: [value[0], value[1]] as [number, number]
                  });
                }}
              />
            </div>
          </div>
          
          {/* Fourth row: Tags, Special filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tags */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base flex items-center">
                  <Tag className="mr-2 h-4 w-4" />
                  {t('trades.tags')}
                </Label>
                {filters.tags.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2"
                    onClick={() => setFilters({...filters, tags: []})}
                  >
                    {t('common.clear')}
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {sampleTags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant={filters.tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setFilters({
                        ...filters, 
                        tags: toggleArrayFilter(filters.tags, tag)
                      });
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Special Filters */}
            <div className="space-y-2">
              <Label className="text-base flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                {t('trades.specialFilters')}
              </Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="winning-trades" 
                    checked={filters.winningTradesOnly}
                    onCheckedChange={(checked) => {
                      setFilters({
                        ...filters, 
                        winningTradesOnly: !!checked,
                        losingTradesOnly: !!checked ? false : filters.losingTradesOnly
                      });
                    }}
                  />
                  <Label 
                    htmlFor="winning-trades"
                    className="text-sm font-normal"
                  >
                    {t('trades.winningTradesOnly')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="losing-trades" 
                    checked={filters.losingTradesOnly}
                    onCheckedChange={(checked) => {
                      setFilters({
                        ...filters, 
                        losingTradesOnly: !!checked,
                        winningTradesOnly: !!checked ? false : filters.winningTradesOnly
                      });
                    }}
                  />
                  <Label 
                    htmlFor="losing-trades"
                    className="text-sm font-normal"
                  >
                    {t('trades.losingTradesOnly')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="with-notes" 
                    checked={filters.withNotesOnly}
                    onCheckedChange={(checked) => {
                      setFilters({
                        ...filters, 
                        withNotesOnly: !!checked
                      });
                    }}
                  />
                  <Label 
                    htmlFor="with-notes"
                    className="text-sm font-normal"
                  >
                    {t('trades.withNotesOnly')}
                  </Label>
                </div>
              </div>
              
              <div className="mt-4">
                <Label htmlFor="market-alignment">{t('trades.marketAlignment')}</Label>
                <Select 
                  value={filters.marketAlignment} 
                  onValueChange={(value) => setFilters({...filters, marketAlignment: value})}
                >
                  <SelectTrigger id="market-alignment" className="mt-1">
                    <SelectValue placeholder={t('trades.selectMarketAlignment')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">{t('trades.any')}</SelectItem>
                    <SelectItem value="aligned">{t('trades.aligned')}</SelectItem>
                    <SelectItem value="contrary">{t('trades.contrary')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Fifth row: Advanced Filters */}
          <div className="space-y-2 border-t pt-4">
            <Label className="text-base flex items-center">
              <BarChart className="mr-2 h-4 w-4" />
              {t('trades.advancedMetricsFilters')}
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="min-profit-percent">{t('trades.minProfitPercent')}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    id="min-profit-percent" 
                    type="number" 
                    placeholder="0.00" 
                    value={filters.advancedFilters.minProfitPercent?.toString() || ''}
                    onChange={(e) => {
                      setFilters({
                        ...filters,
                        advancedFilters: {
                          ...filters.advancedFilters,
                          minProfitPercent: e.target.value ? parseFloat(e.target.value) : undefined
                        }
                      });
                    }}
                  />
                  <span>%</span>
                </div>
              </div>
              <div>
                <Label htmlFor="max-drawdown">{t('trades.maxDrawdown')}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    id="max-drawdown" 
                    type="number" 
                    placeholder="0.00" 
                    value={filters.advancedFilters.maxDrawdown?.toString() || ''}
                    onChange={(e) => {
                      setFilters({
                        ...filters,
                        advancedFilters: {
                          ...filters.advancedFilters,
                          maxDrawdown: e.target.value ? parseFloat(e.target.value) : undefined
                        }
                      });
                    }}
                  />
                  <span>%</span>
                </div>
              </div>
              <div>
                <Label htmlFor="min-entry-quality">{t('trades.minEntryQuality')}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Select 
                    value={filters.advancedFilters.minEntryQuality?.toString() || ''} 
                    onValueChange={(value) => {
                      setFilters({
                        ...filters,
                        advancedFilters: {
                          ...filters.advancedFilters,
                          minEntryQuality: value ? parseInt(value) : undefined
                        }
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('trades.any')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('trades.any')}</SelectItem>
                      <SelectItem value="1">1 - {t('trades.poor')}</SelectItem>
                      <SelectItem value="2">2 - {t('trades.fair')}</SelectItem>
                      <SelectItem value="3">3 - {t('trades.good')}</SelectItem>
                      <SelectItem value="4">4 - {t('trades.veryGood')}</SelectItem>
                      <SelectItem value="5">5 - {t('trades.excellent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="min-exit-quality">{t('trades.minExitQuality')}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Select 
                    value={filters.advancedFilters.minExitQuality?.toString() || ''} 
                    onValueChange={(value) => {
                      setFilters({
                        ...filters,
                        advancedFilters: {
                          ...filters.advancedFilters,
                          minExitQuality: value ? parseInt(value) : undefined
                        }
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('trades.any')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('trades.any')}</SelectItem>
                      <SelectItem value="1">1 - {t('trades.poor')}</SelectItem>
                      <SelectItem value="2">2 - {t('trades.fair')}</SelectItem>
                      <SelectItem value="3">3 - {t('trades.good')}</SelectItem>
                      <SelectItem value="4">4 - {t('trades.veryGood')}</SelectItem>
                      <SelectItem value="5">5 - {t('trades.excellent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="has-stoploss" 
                    checked={filters.advancedFilters.hasStoploss}
                    onCheckedChange={(checked) => {
                      setFilters({
                        ...filters,
                        advancedFilters: {
                          ...filters.advancedFilters,
                          hasStoploss: checked === true ? true : checked === false ? false : undefined
                        }
                      });
                    }}
                  />
                  <Label 
                    htmlFor="has-stoploss"
                    className="text-sm font-normal"
                  >
                    {t('trades.hasStoploss')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="has-takeprofit" 
                    checked={filters.advancedFilters.hasTakeProfit}
                    onCheckedChange={(checked) => {
                      setFilters({
                        ...filters,
                        advancedFilters: {
                          ...filters.advancedFilters,
                          hasTakeProfit: checked === true ? true : checked === false ? false : undefined
                        }
                      });
                    }}
                  />
                  <Label 
                    htmlFor="has-takeprofit"
                    className="text-sm font-normal"
                  >
                    {t('trades.hasTakeProfit')}
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={handleResetFilters}>
            {t('trades.resetFilters')}
          </Button>
          <Button onClick={handleApplyFilters}>
            {t('trades.applyFilters')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedTradeFilter;
