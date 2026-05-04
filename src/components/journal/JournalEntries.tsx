
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, BookOpen, Plus, Sun, CloudSun, Moon, ClipboardList } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { format, parseISO, isValid, type Locale } from 'date-fns';
import { enUS, fr, es } from 'date-fns/locale';
import { useBrokerConnections } from '@/hooks/useBrokers';

const resolveDateLocale = (lng: string): Locale => {
  if (lng.startsWith('fr')) return fr;
  if (lng.startsWith('es')) return es;
  return enUS;
};
import type { JournalEntryResponseDto, JournalSessionLabel } from '@/types/dto';

interface JournalEntriesProps {
  entries: JournalEntryResponseDto[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onNewEntry?: () => void;
}

const MOOD_CONFIG: Record<number, { label: string; dotColor: string; bgColor: string; textColor: string }> = {
  1: { label: 'Terrible', dotColor: 'bg-red-500',     bgColor: 'bg-red-500/10',     textColor: 'text-red-400' },
  2: { label: 'Bad',      dotColor: 'bg-orange-500',  bgColor: 'bg-orange-500/10',  textColor: 'text-orange-400' },
  3: { label: 'Okay',     dotColor: 'bg-amber-500',   bgColor: 'bg-amber-500/10',   textColor: 'text-amber-400' },
  4: { label: 'Good',     dotColor: 'bg-lime-500',    bgColor: 'bg-lime-500/10',    textColor: 'text-lime-400' },
  5: { label: 'Great',    dotColor: 'bg-emerald-500', bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-400' },
};

const MOOD_LABEL_KEYS: Record<number, string> = {
  1: 'journal.moodTerrible',
  2: 'journal.moodBad',
  3: 'journal.moodOkay',
  4: 'journal.moodGood',
  5: 'journal.moodGreat',
};

const SESSION_LABEL_KEYS: Record<JournalSessionLabel, string> = {
  MORNING:   'journal.sessionMorning',
  AFTERNOON: 'journal.sessionAfternoon',
  EVENING:   'journal.sessionEvening',
  REVIEW:    'journal.sessionReview',
};

const SESSION_ICONS: Record<JournalSessionLabel, React.ElementType> = {
  MORNING:   Sun,
  AFTERNOON: CloudSun,
  EVENING:   Moon,
  REVIEW:    ClipboardList,
};

const SESSION_BADGE_CLASSES: Record<JournalSessionLabel, string> = {
  MORNING:   'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
  AFTERNOON: 'border-sky-500/50 bg-sky-500/10 text-sky-400',
  EVENING:   'border-indigo-500/50 bg-indigo-500/10 text-indigo-400',
  REVIEW:    'border-violet-500/50 bg-violet-500/10 text-violet-400',
};

interface GroupedEntries {
  monthLabel: string;
  entries: JournalEntryResponseDto[];
}

function groupByMonth(
  entries: JournalEntryResponseDto[],
  locale: Locale,
): GroupedEntries[] {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const groups = new Map<string, JournalEntryResponseDto[]>();

  sorted.forEach((entry) => {
    const parsed = parseISO(entry.date);
    const key = isValid(parsed) ? format(parsed, 'MMMM yyyy', { locale }) : 'Unknown';
    const existing = groups.get(key) ?? [];
    existing.push(entry);
    groups.set(key, existing);
  });

  return Array.from(groups.entries()).map(([monthLabel, groupEntries]) => ({
    monthLabel,
    entries: groupEntries,
  }));
}

const JournalEntries: React.FC<JournalEntriesProps> = ({
  entries,
  onView,
  onEdit,
  onDelete,
  onNewEntry,
}) => {
  const { t, i18n } = useTranslation();
  const { data: connections } = useBrokerConnections();
  const dateLocale = React.useMemo(() => resolveDateLocale(i18n.language), [i18n.language]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="rounded-full p-5 bg-accent/10 border border-border">
          <BookOpen className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-base text-foreground">{t('journal.noEntries')}</p>
          <p className="text-sm text-muted-foreground max-w-xs">{t('journal.noEntriesDescription')}</p>
        </div>
        {onNewEntry && (
          <Button onClick={onNewEntry} className="mt-2 gap-2">
            <Plus className="h-4 w-4" />
            {t('journal.startJournaling')}
          </Button>
        )}
      </div>
    );
  }

  const groups = groupByMonth(entries, dateLocale);

  return (
    <div className="space-y-8">
      {groups.map(({ monthLabel, entries: groupEntries }) => (
        <div key={monthLabel} className="space-y-3">
          <h3 className="label-caps text-muted-foreground px-1">{monthLabel}</h3>
          <div className="space-y-2">
            {groupEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                connections={connections ?? []}
                dateLocale={dateLocale}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

interface EntryCardProps {
  entry: JournalEntryResponseDto;
  connections: import('@/services/broker.service').BrokerConnectionResponse[];
  dateLocale: Locale;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, connections, dateLocale, onView, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const mood = MOOD_CONFIG[entry.mood] ?? MOOD_CONFIG[3];
  const moodLabelKey = MOOD_LABEL_KEYS[entry.mood] ?? 'journal.moodOkay';

  const parsed = parseISO(entry.date);
  const dayNum = isValid(parsed) ? format(parsed, 'd', { locale: dateLocale }) : '--';
  const dayName = isValid(parsed) ? format(parsed, 'EEE', { locale: dateLocale }) : '';

  const tagList = entry.tags
    ? entry.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    : [];

  const sessionLabel = entry.sessionLabel ?? null;
  const SessionIcon = sessionLabel ? SESSION_ICONS[sessionLabel] : null;

  const accountName = entry.brokerConnectionId
    ? (() => {
        const conn = connections.find((c) => c.id === entry.brokerConnectionId);
        if (!conn) return null;
        return conn.displayName
          ?? `${conn.brokerDisplayName ?? conn.brokerCode ?? conn.brokerType}${conn.accountIdentifier ? ` — ${conn.accountIdentifier}` : ''}`;
      })()
    : null;

  return (
    /* Outer wrapper owns the group + relative context so the action bar can be
       absolutely positioned outside the <button> — no nested interactive elements. */
    <div className="relative group">
      <button
        type="button"
        className={cn(
          "glass-card rounded-xl p-4 flex gap-4 cursor-pointer w-full text-left pr-20",
          "hover:border-border/80 transition-all duration-150"
        )}
        onClick={() => onView(entry.id)}
      >
        {/* Date column */}
        <div className="flex flex-col items-center justify-start min-w-[3rem] pt-0.5">
          <span className="font-mono text-2xl font-bold leading-none tabular-nums text-foreground">
            {dayNum}
          </span>
          <span className="font-mono text-[0.65rem] uppercase text-muted-foreground tracking-wider mt-0.5">
            {dayName}
          </span>
        </div>

        {/* Divider */}
        <div className={cn("w-0.5 rounded-full self-stretch", mood.dotColor, "opacity-60")} />

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Mood badge */}
            <span className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2 py-0.5",
              mood.bgColor, mood.textColor
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full", mood.dotColor)} />
              {t(moodLabelKey)}
            </span>

            {/* Session label badge */}
            {sessionLabel && SessionIcon && (
              <span className={cn(
                "inline-flex items-center gap-1 text-xs font-medium rounded-full border px-2 py-0.5",
                SESSION_BADGE_CLASSES[sessionLabel]
              )}>
                <SessionIcon className="h-3 w-3 shrink-0" />
                {t(SESSION_LABEL_KEYS[sessionLabel])}
              </span>
            )}
          </div>

          {/* Account name */}
          {accountName && (
            <p className="text-[0.7rem] text-muted-foreground/70 font-mono truncate">
              {accountName}
            </p>
          )}

          {entry.content && (
            <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2">
              {entry.content}
            </p>
          )}

          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {tagList.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="font-mono text-[0.65rem] px-1.5 py-0 h-5 border-border/60 text-muted-foreground"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </button>

      {/* Action buttons — sibling of <button>, absolutely positioned top-right */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => onEdit(entry.id)}
          aria-label={t('journal.editEntry')}
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label={t('journal.deleteEntry')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('journal.deleteEntry')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('journal.deleteEntryConfirmation')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(entry.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default JournalEntries;
