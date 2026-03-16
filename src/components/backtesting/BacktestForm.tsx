
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRunBacktest } from '@/hooks/useBacktests';
import { useToast } from '@/hooks/use-toast';

const BacktestForm = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const runBacktest = useRunBacktest();

  const [name, setName] = useState('');
  const [strategyDefinition, setStrategyDefinition] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: t('common.error'),
        description: t('backtesting.nameRequired'),
        variant: 'destructive',
      });
      return;
    }

    if (!startDate || !endDate) {
      toast({
        title: t('common.error'),
        description: t('backtesting.pickDate'),
        variant: 'destructive',
      });
      return;
    }

    runBacktest.mutate(
      {
        name: name.trim(),
        strategyDefinition: strategyDefinition.trim(),
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      },
      {
        onSuccess: () => {
          toast({
            title: t('backtesting.backtestStarted'),
            description: t('backtesting.backtestStartedDescription'),
          });
          setName('');
          setStrategyDefinition('');
          setStartDate(undefined);
          setEndDate(undefined);
        },
        onError: () => {
          toast({
            title: t('common.error'),
            description: t('backtesting.backtestFailed'),
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('backtesting.newBacktest')}</CardTitle>
        <CardDescription>{t('backtesting.newBacktestDescription')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('backtesting.backtestName')}</Label>
            <Input
              id="name"
              placeholder={t('backtesting.backtestNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategyDefinition">{t('backtesting.strategyDefinition')}</Label>
            <Textarea
              id="strategyDefinition"
              placeholder={t('backtesting.strategyDefinitionPlaceholder')}
              className="min-h-20 font-mono text-sm"
              value={strategyDefinition}
              onChange={(e) => setStrategyDefinition(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('backtesting.startDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : <span>{t('backtesting.pickDate')}</span>}
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
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : <span>{t('backtesting.pickDate')}</span>}
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
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => {
            setName('');
            setStrategyDefinition('');
            setStartDate(undefined);
            setEndDate(undefined);
          }}>
            {t('common.reset')}
          </Button>
          <Button type="submit" disabled={runBacktest.isPending}>
            {runBacktest.isPending ? t('common.loading') : t('backtesting.runBacktest')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default BacktestForm;
