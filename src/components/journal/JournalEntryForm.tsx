
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const JournalEntryForm = () => {
  const { t } = useTranslation();
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Journal entry submitted');
    // TODO: Implement form submission
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('journal.newEntry')}</CardTitle>
        <CardDescription>{t('journal.newEntryDescription')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">{t('journal.date')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>{t('journal.pickDate')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">{t('journal.title')}</Label>
            <Input id="title" placeholder={t('journal.titlePlaceholder')} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="market-conditions">{t('journal.marketConditions')}</Label>
            <Input id="market-conditions" placeholder={t('journal.marketConditionsPlaceholder')} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="trades">{t('journal.tradesExecuted')}</Label>
            <Input id="trades" placeholder={t('journal.tradesExecutedPlaceholder')} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">{t('journal.content')}</Label>
            <Textarea 
              id="content" 
              placeholder={t('journal.contentPlaceholder')} 
              className="min-h-32"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lessons">{t('journal.lessonsLearned')}</Label>
            <Textarea 
              id="lessons" 
              placeholder={t('journal.lessonsLearnedPlaceholder')} 
              className="min-h-20"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="emotions">{t('journal.emotions')}</Label>
            <Input id="emotions" placeholder={t('journal.emotionsPlaceholder')} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline">{t('common.cancel')}</Button>
          <Button type="submit">{t('common.save')}</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default JournalEntryForm;
