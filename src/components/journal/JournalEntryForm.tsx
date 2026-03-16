
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
import type { JournalEntryResponseDto, JournalEntryRequestDto } from '@/types/dto';

interface JournalEntryFormProps {
  initialValues?: JournalEntryResponseDto;
  onSubmit?: (data: JournalEntryRequestDto) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const JournalEntryForm: React.FC<JournalEntryFormProps> = ({ initialValues, onSubmit, onCancel, isLoading }) => {
  const { t } = useTranslation();
  const [date, setDate] = useState<Date | undefined>(
    initialValues?.date ? new Date(initialValues.date) : new Date()
  );
  const [mood, setMood] = useState<number>(initialValues?.mood ?? 3);
  const [content, setContent] = useState(initialValues?.content ?? '');
  const [tags, setTags] = useState(initialValues?.tags ?? '');
  const [linkedTradeIds, setLinkedTradeIds] = useState(initialValues?.linkedTradeIds ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !onSubmit) return;
    onSubmit({
      date: format(date, 'yyyy-MM-dd'),
      mood,
      content: content || null,
      tags: tags || null,
      linkedTradeIds: linkedTradeIds || null,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialValues ? t('journal.editEntry') : t('journal.newEntry')}</CardTitle>
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
            <Label>{t('journal.mood')}</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={mood === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMood(value)}
                >
                  {value}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              1 = {t('journal.moodVeryBad')}, 5 = {t('journal.moodGreat')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">{t('journal.content')}</Label>
            <Textarea
              id="content"
              placeholder={t('journal.contentPlaceholder')}
              className="min-h-32"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">{t('journal.tags')}</Label>
            <Input
              id="tags"
              placeholder={t('journal.tagsPlaceholder')}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedTradeIds">{t('journal.linkedTrades')}</Label>
            <Input
              id="linkedTradeIds"
              placeholder={t('journal.linkedTradesPlaceholder')}
              value={linkedTradeIds}
              onChange={(e) => setLinkedTradeIds(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={isLoading}>{t('common.save')}</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default JournalEntryForm;
