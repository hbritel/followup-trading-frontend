
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, parseISO, isValid, startOfMonth, isSameMonth, type Locale } from 'date-fns';
import { enUS, fr, es } from 'date-fns/locale';
import { Plus, ChevronDown, ChevronUp, Sun, CloudSun, Moon, ClipboardList } from 'lucide-react';
import type { JournalSessionLabel, JournalEntryRequestDto } from '@/types/dto';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import JournalEntryForm from '@/components/journal/JournalEntryForm';
import JournalEntries from '@/components/journal/JournalEntries';
import JournalCalendar from '@/components/journal/JournalCalendar';
import PlanGatedSection from '@/components/subscription/PlanGatedSection';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  useJournalEntries,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDeleteJournalEntry,
} from '@/hooks/useJournal';
import { useBrokerConnections } from '@/hooks/useBrokers';

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

const MOOD_AVG_COLORS: Record<number, string> = {
  1: 'text-red-400',
  2: 'text-orange-400',
  3: 'text-amber-400',
  4: 'text-lime-400',
  5: 'text-emerald-400',
};

const DailyJournal = () => {
  const { t, i18n } = useTranslation();
  const dateLocale: Locale = useMemo(() => {
    if (i18n.language.startsWith('fr')) return fr;
    if (i18n.language.startsWith('es')) return es;
    return enUS;
  }, [i18n.language]);
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [newEntryDate, setNewEntryDate] = useState<Date | undefined>(undefined);
  const [editEntryId, setEditEntryId] = useState<string | null>(null);
  const [viewEntryId, setViewEntryId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Citation deep-link from AI Coach (e.g. /daily-journal?focus=UUID).
  const focusEntryId = searchParams.get('focus');

  const { data: entries, isLoading } = useJournalEntries();
  const { data: connections } = useBrokerConnections();
  const createEntry = useCreateJournalEntry();
  const updateEntry = useUpdateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();

  const journalEntries = entries ?? [];

  // Consume citation deep-link: open the targeted journal entry once the
  // entries list has loaded. Strips the `?focus=` param afterwards so a
  // refresh / back-nav doesn't re-open the dialog.
  useEffect(() => {
    if (!focusEntryId) return;
    if (journalEntries.length === 0) return;
    const found = journalEntries.find((e) => e.id === focusEntryId);
    if (found) {
      setViewEntryId(focusEntryId);
    } else {
      toast({
        title: t('journal.notFound', 'Journal entry not found'),
        description: t('journal.notFoundDesc', 'Citation may be stale or out of scope.'),
        variant: 'destructive',
      });
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('focus');
      return next;
    }, { replace: true });
  }, [focusEntryId, journalEntries, setSearchParams, toast, t]);

  // Entries for the selected month
  const monthEntries = useMemo(() => {
    return journalEntries.filter((e) => {
      const parsed = parseISO(e.date);
      return isValid(parsed) && isSameMonth(parsed, selectedMonth);
    });
  }, [journalEntries, selectedMonth]);

  // Average mood for the month (rounded)
  const avgMood = useMemo(() => {
    if (monthEntries.length === 0) return null;
    const sum = monthEntries.reduce((acc, e) => acc + e.mood, 0);
    return Math.round(sum / monthEntries.length);
  }, [monthEntries]);

  const currentEntry = journalEntries.find(
    (e) => e.id === editEntryId || e.id === viewEntryId
  );

  const handleCreate = (data: JournalEntryRequestDto) => {
    createEntry.mutate(data, {
      onSuccess: () => {
        toast({ title: t('journal.entryCreated') });
        setNewEntryOpen(false);
        setNewEntryDate(undefined);
      },
    });
  };

  const handleUpdate = (data: JournalEntryRequestDto) => {
    if (!editEntryId) return;
    updateEntry.mutate({ id: editEntryId, data }, {
      onSuccess: () => {
        toast({ title: t('journal.entryUpdated') });
        setEditEntryId(null);
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteEntry.mutate(id, {
      onSuccess: () => {
        toast({ title: t('journal.entryDeleted') });
      },
    });
  };

  const openNewEntry = (date?: Date) => {
    setNewEntryDate(date);
    setNewEntryOpen(true);
  };

  const handleCalendarSelectDate = (date: Date) => {
    // Jump to that month in the entry list
    setSelectedMonth(startOfMonth(date));
  };

  return (
    <DashboardLayout pageTitle={t('pages.dailyJournal')}>
      <PageTransition>
        <div className="flex gap-6 h-full">

          {/* ── Left sidebar: calendar (hidden on mobile) ── */}
          <aside className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
            <div className="glass-card rounded-2xl p-4 space-y-3">
              {/* New Entry button */}
              <Button
                className="w-full gap-2"
                onClick={() => openNewEntry()}
              >
                <Plus className="h-4 w-4" />
                {t('journal.newEntry')}
              </Button>

              {/* Calendar — STARTER+ only */}
              <PlanGatedSection
                requiredPlan="STARTER"
                feature={t('journal.calendarView', 'Journal calendar view')}
                showBlurredPreview
              >
                <JournalCalendar
                  entries={journalEntries}
                  selectedMonth={selectedMonth}
                  onMonthChange={(m) => setSelectedMonth(startOfMonth(m))}
                  onSelectDate={handleCalendarSelectDate}
                  onNewEntryForDate={openNewEntry}
                />
              </PlanGatedSection>
            </div>

            {/* Monthly summary card */}
            <div className="glass-card rounded-2xl p-4 space-y-3">
              <p className="label-caps text-muted-foreground">{t('journal.monthSummary')}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('journal.entriesCount')}</span>
                <span className="kpi-value font-mono">{monthEntries.length}</span>
              </div>
              {avgMood !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('journal.averageMood')}</span>
                  <span className={cn("kpi-value font-mono", MOOD_AVG_COLORS[avgMood] ?? 'text-foreground')}>
                    {avgMood}/5
                  </span>
                </div>
              )}
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0 space-y-4">

            {/* Mobile header row */}
            <div className="flex items-center justify-between lg:hidden gap-2">
              <Button
                className="gap-2"
                onClick={() => openNewEntry()}
              >
                <Plus className="h-4 w-4" />
                {t('journal.newEntry')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setCalendarOpen((v) => !v)}
                aria-expanded={calendarOpen}
              >
                {t('journal.calendar')}
                {calendarOpen
                  ? <ChevronUp className="h-3.5 w-3.5" />
                  : <ChevronDown className="h-3.5 w-3.5" />
                }
              </Button>
            </div>

            {/* Mobile collapsible calendar — STARTER+ only */}
            {calendarOpen && (
              <PlanGatedSection
                requiredPlan="STARTER"
                feature={t('journal.calendarView', 'Journal calendar view')}
                showBlurredPreview
                className="lg:hidden"
              >
                <div className="glass-card rounded-2xl p-4">
                  <JournalCalendar
                    entries={journalEntries}
                    selectedMonth={selectedMonth}
                    onMonthChange={(m) => setSelectedMonth(startOfMonth(m))}
                    onSelectDate={handleCalendarSelectDate}
                    onNewEntryForDate={openNewEntry}
                  />
                </div>
              </PlanGatedSection>
            )}

            {/* Entry list header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground capitalize">
                  {format(selectedMonth, 'MMMM yyyy', { locale: dateLocale })}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {monthEntries.length} {t('journal.entriesCount')}
                  {avgMood !== null && (
                    <> &middot; {t('journal.averageMood')}{' '}
                      <span className={cn(MOOD_AVG_COLORS[avgMood] ?? '')}>
                        {avgMood}/5
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Entry list */}
            {isLoading ? (
              <div className="space-y-3">
                {['sk-0', 'sk-1', 'sk-2', 'sk-3'].map((k) => (
                  <Skeleton key={k} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <JournalEntries
                entries={monthEntries}
                onView={(id) => setViewEntryId(id)}
                onEdit={(id) => setEditEntryId(id)}
                onDelete={handleDelete}
                onNewEntry={() => openNewEntry()}
              />
            )}
          </main>
        </div>

        {/* ── New Entry dialog ── */}
        <Dialog open={newEntryOpen} onOpenChange={(open) => {
          setNewEntryOpen(open);
          if (!open) setNewEntryDate(undefined);
        }}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{t('journal.newEntry')}</DialogTitle>
            </DialogHeader>
            <div className="mt-2">
              <JournalEntryForm
                initialDate={newEntryDate}
                onSubmit={handleCreate}
                onCancel={() => {
                  setNewEntryOpen(false);
                  setNewEntryDate(undefined);
                }}
                isLoading={createEntry.isPending}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* ── View Entry dialog ── */}
        <Dialog open={viewEntryId !== null} onOpenChange={() => setViewEntryId(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-mono text-lg">{currentEntry?.date}</DialogTitle>
            </DialogHeader>
            {currentEntry && (() => {
              const sessionLabel = currentEntry.sessionLabel ?? null;
              const SessionIcon = sessionLabel ? SESSION_ICONS[sessionLabel] : null;
              const viewAccountName = currentEntry.brokerConnectionId
                ? (() => {
                    const conn = (connections ?? []).find((c) => c.id === currentEntry.brokerConnectionId);
                    if (!conn) return null;
                    if (conn.displayName) return conn.displayName;
                    const brokerLabel = conn.brokerDisplayName ?? conn.brokerCode ?? conn.brokerType;
                    const accountSuffix = conn.accountIdentifier ? ` — ${conn.accountIdentifier}` : '';
                    return `${brokerLabel}${accountSuffix}`;
                  })()
                : null;
              return (
                <div className="space-y-4 mt-2">
                  {/* Meta row: session + account */}
                  {(sessionLabel || viewAccountName) && (
                    <div className="flex flex-wrap items-center gap-2">
                      {sessionLabel && SessionIcon && (
                        <span className={cn(
                          "inline-flex items-center gap-1 text-xs font-medium rounded-full border px-2.5 py-0.5",
                          SESSION_BADGE_CLASSES[sessionLabel]
                        )}>
                          <SessionIcon className="h-3 w-3 shrink-0" />
                          {t(SESSION_LABEL_KEYS[sessionLabel])}
                        </span>
                      )}
                      {viewAccountName && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {viewAccountName}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="label-caps">{t('journal.mood')}:</span>
                    <span className={cn(
                      "kpi-value text-lg px-3 py-1 rounded-lg font-mono",
                      currentEntry.mood === 1 && "bg-red-500/20 text-red-400",
                      currentEntry.mood === 2 && "bg-orange-500/20 text-orange-400",
                      currentEntry.mood === 3 && "bg-amber-500/20 text-amber-400",
                      currentEntry.mood === 4 && "bg-lime-500/20 text-lime-400",
                      currentEntry.mood === 5 && "bg-emerald-500/20 text-emerald-400",
                    )}>
                      {currentEntry.mood}/5
                    </span>
                  </div>
                  {currentEntry.content && (
                    <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {currentEntry.content}
                    </div>
                  )}
                  {currentEntry.tags && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border">
                      <span className="label-caps text-muted-foreground self-center mr-1">
                        {t('journal.tags')}:
                      </span>
                      {currentEntry.tags
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                        .map((tag) => (
                          <span
                            key={tag}
                            className="font-mono text-xs border border-border rounded px-1.5 py-0.5 bg-accent/10"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* ── Edit Entry dialog ── */}
        <Dialog open={editEntryId !== null} onOpenChange={() => setEditEntryId(null)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{t('journal.editEntry')}</DialogTitle>
            </DialogHeader>
            <div className="mt-2">
              <JournalEntryForm
                initialValues={currentEntry}
                onSubmit={handleUpdate}
                onCancel={() => setEditEntryId(null)}
                isLoading={updateEntry.isPending}
              />
            </div>
          </DialogContent>
        </Dialog>
      </PageTransition>
    </DashboardLayout>
  );
};

export default DailyJournal;
