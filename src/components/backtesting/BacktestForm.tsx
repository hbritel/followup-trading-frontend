
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const BacktestForm = () => {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Backtest form submitted');
    // TODO: Implement form submission
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('backtesting.newBacktest')}</CardTitle>
        <CardDescription>{t('backtesting.newBacktestDescription')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('backtesting.backtestName')}</Label>
              <Input id="name" placeholder={t('backtesting.backtestNamePlaceholder')} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="strategy">{t('backtesting.strategy')}</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t('backtesting.selectStrategy')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakout">Breakout Strategy</SelectItem>
                  <SelectItem value="ma-crossover">Moving Average Crossover</SelectItem>
                  <SelectItem value="rsi-divergence">RSI Divergence</SelectItem>
                  <SelectItem value="gap-and-go">Gap and Go</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">{t('backtesting.symbol')}</Label>
              <Input id="symbol" placeholder="AAPL, MSFT, GOOGL..." />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeframe">{t('backtesting.timeframe')}</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t('backtesting.selectTimeframe')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 Minute</SelectItem>
                  <SelectItem value="5m">5 Minutes</SelectItem>
                  <SelectItem value="15m">15 Minutes</SelectItem>
                  <SelectItem value="30m">30 Minutes</SelectItem>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="4h">4 Hours</SelectItem>
                  <SelectItem value="1d">Daily</SelectItem>
                  <SelectItem value="1w">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('backtesting.startDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>{t('backtesting.pickDate')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>{t('backtesting.endDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>{t('backtesting.pickDate')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initial-capital">{t('backtesting.initialCapital')}</Label>
              <Input id="initial-capital" type="number" placeholder="10000" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="position-size">{t('backtesting.positionSize')}</Label>
              <div className="flex items-center space-x-2">
                <Input id="position-size" type="number" placeholder="2" />
                <span>%</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="parameters">{t('backtesting.strategyParameters')}</Label>
            <Textarea 
              id="parameters" 
              placeholder={t('backtesting.strategyParametersPlaceholder')} 
              className="min-h-20"
            />
          </div>
          
          <div className="space-y-3">
            <Label>{t('backtesting.advancedOptions')}</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="slippage" />
                <Label htmlFor="slippage" className="font-normal">
                  {t('backtesting.includeSlippage')}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="commission" />
                <Label htmlFor="commission" className="font-normal">
                  {t('backtesting.includeCommission')}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="visualize" defaultChecked />
                <Label htmlFor="visualize" className="font-normal">
                  {t('backtesting.visualizeResults')}
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline">{t('common.cancel')}</Button>
          <Button type="submit">{t('backtesting.runBacktest')}</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default BacktestForm;
