
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Loader2, Sun, CloudSun, Moon, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useBrokerConnections } from "@/hooks/useBrokers";
import type { JournalEntryResponseDto, JournalEntryRequestDto, JournalSessionLabel } from '@/types/dto';

interface JournalEntryFormProps {
  initialValues?: JournalEntryResponseDto;
  initialDate?: Date;
  onSubmit?: (data: JournalEntryRequestDto) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const MOOD_OPTIONS = [
  { value: 1, labelKey: 'journal.moodTerrible', color: 'border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20' },
  { value: 2, labelKey: 'journal.moodBad', color: 'border-orange-500 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20' },
  { value: 3, labelKey: 'journal.moodOkay', color: 'border-amber-500 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' },
  { value: 4, labelKey: 'journal.moodGood', color: 'border-lime-500 bg-lime-500/10 text-lime-400 hover:bg-lime-500/20' },
  { value: 5, labelKey: 'journal.moodGreat', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' },
] as const;

const MOOD_SELECTED_COLORS: Record<number, string> = {
  1: 'border-red-500 bg-red-500/30 text-red-300 ring-2 ring-red-500/40',
  2: 'border-orange-500 bg-orange-500/30 text-orange-300 ring-2 ring-orange-500/40',
  3: 'border-amber-500 bg-amber-500/30 text-amber-300 ring-2 ring-amber-500/40',
  4: 'border-lime-500 bg-lime-500/30 text-lime-300 ring-2 ring-lime-500/40',
  5: 'border-emerald-500 bg-emerald-500/30 text-emerald-300 ring-2 ring-emerald-500/40',
};

interface SessionOption {
  value: JournalSessionLabel;
  labelKey: string;
  Icon: React.ElementType;
}

const SESSION_OPTIONS: SessionOption[] = [
  { value: 'MORNING',   labelKey: 'journal.morning',   Icon: Sun },
  { value: 'AFTERNOON', labelKey: 'journal.afternoon', Icon: CloudSun },
  { value: 'EVENING',   labelKey: 'journal.evening',   Icon: Moon },
  { value: 'REVIEW',    labelKey: 'journal.review',    Icon: ClipboardList },
];

const SESSION_COLORS: Record<JournalSessionLabel, { base: string; selected: string }> = {
  MORNING:   { base: 'border-yellow-500 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20', selected: 'border-yellow-400 bg-yellow-500/30 text-yellow-300 ring-2 ring-yellow-500/40' },
  AFTERNOON: { base: 'border-sky-500 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20',             selected: 'border-sky-400 bg-sky-500/30 text-sky-300 ring-2 ring-sky-500/40' },
  EVENING:   { base: 'border-indigo-500 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20', selected: 'border-indigo-400 bg-indigo-500/30 text-indigo-300 ring-2 ring-indigo-500/40' },
  REVIEW:    { base: 'border-violet-500 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20', selected: 'border-violet-400 bg-violet-500/30 text-violet-300 ring-2 ring-violet-500/40' },
};

const JournalEntryForm: React.FC<JournalEntryFormProps> = ({
  initialValues,
  initialDate,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const { t } = useTranslation();
  const { data: connections } = useBrokerConnections();

  const resolveInitialDate = () => {
    if (initialValues?.date) return new Date(initialValues.date);
    if (initialDate) return initialDate;
    return new Date();
  };

  const [date, setDate] = useState<Date | undefined>(resolveInitialDate);
  const [mood, setMood] = useState<number>(initialValues?.mood ?? 3);
  const [content, setContent] = useState(initialValues?.content ?? '');
  const [tags, setTags] = useState(initialValues?.tags ?? '');
  const [brokerConnectionId, setBrokerConnectionId] = useState<string>(
    initialValues?.brokerConnectionId ?? '__all__'
  );
  const [sessionLabel, setSessionLabel] = useState<JournalSessionLabel | null>(
    initialValues?.sessionLabel ?? null
  );

  const handleSessionClick = (value: JournalSessionLabel) => {
    setSessionLabel((prev) => (prev === value ? null : value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !onSubmit) return;
    onSubmit({
      date: format(date, 'yyyy-MM-dd'),
      mood,
      content: content || null,
      tags: tags || null,
      linkedTradeIds: initialValues?.linkedTradeIds ?? null,
      brokerConnectionId: brokerConnectionId === '__all__' ? null : brokerConnectionId,
      sessionLabel: sessionLabel ?? null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Date picker */}
      <div className="space-y-2">
        <Label htmlFor="date" className="label-caps">{t('journal.date')}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal font-mono",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>{t('journal.pickDate')}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Account selector */}
      <div className="space-y-2">
        <Label htmlFor="brokerConnection" className="label-caps">{t('journal.account')}</Label>
        <Select
          value={brokerConnectionId}
          onValueChange={setBrokerConnectionId}
        >
          <SelectTrigger id="brokerConnection" className="w-full">
            <SelectValue placeholder={t('journal.allAccounts')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('journal.allAccounts')}</SelectItem>
            {(connections ?? []).filter((conn) => conn.id).map((conn) => {
              const label = conn.displayName
                ?? `${conn.brokerDisplayName ?? conn.brokerCode ?? conn.brokerType}${conn.accountIdentifier ? ` — ${conn.accountIdentifier}` : ''}`;
              return (
                <SelectItem key={conn.id} value={conn.id}>
                  {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Session label selector */}
      <div className="space-y-2">
        <Label className="label-caps">{t('journal.sessionLabel')}</Label>
        <div className="flex gap-2 flex-wrap">
          {SESSION_OPTIONS.map(({ value, labelKey, Icon }) => {
            const colors = SESSION_COLORS[value];
            const isSelected = sessionLabel === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleSessionClick(value)}
                className={cn(
                  "flex-1 min-w-[80px] rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                  "inline-flex items-center justify-center gap-1.5",
                  isSelected ? colors.selected : colors.base
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {t(labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mood selector */}
      <div className="space-y-2">
        <Label className="label-caps">{t('journal.mood')}</Label>
        <div className="flex gap-2 flex-wrap">
          {MOOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMood(option.value)}
              className={cn(
                "flex-1 min-w-[70px] rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                mood === option.value
                  ? MOOD_SELECTED_COLORS[option.value]
                  : option.color
              )}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="content" className="label-caps">{t('journal.content')}</Label>
        <Textarea
          id="content"
          placeholder={t('journal.contentPlaceholder')}
          className="min-h-48 resize-y"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags" className="label-caps">{t('journal.tags')}</Label>
        <Input
          id="tags"
          placeholder={t('journal.tagsPlaceholder')}
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {t('journal.tagsHelper')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isLoading || !date} className="min-w-24">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('journal.saving')}
            </>
          ) : (
            t('common.save')
          )}
        </Button>
      </div>
    </form>
  );
};

export default JournalEntryForm;
