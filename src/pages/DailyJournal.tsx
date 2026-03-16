
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import JournalEntryForm from '@/components/journal/JournalEntryForm';
import JournalEntries from '@/components/journal/JournalEntries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from '@/hooks/use-toast';
import { useJournalEntries, useCreateJournalEntry, useUpdateJournalEntry, useDeleteJournalEntry } from '@/hooks/useJournal';
import type { JournalEntryRequestDto } from '@/types/dto';

const DailyJournal = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [viewEntryId, setViewEntryId] = useState<string | null>(null);
  const [editEntryId, setEditEntryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('entries');

  const { data: entries, isLoading } = useJournalEntries();
  const createEntry = useCreateJournalEntry();
  const updateEntry = useUpdateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();

  const journalEntries = entries ?? [];
  const currentEntry = journalEntries.find(entry => entry.id === viewEntryId || entry.id === editEntryId);

  const handleCreate = (data: JournalEntryRequestDto) => {
    createEntry.mutate(data, {
      onSuccess: () => {
        toast({ title: t('journal.entryCreated') });
        setActiveTab('entries');
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

  return (
    <DashboardLayout pageTitle={t('pages.dailyJournal')}>
      <PageTransition>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="entries">{t('journal.entries')}</TabsTrigger>
          <TabsTrigger value="new">{t('journal.newEntry')}</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <JournalEntries
              entries={journalEntries}
              onView={(id) => setViewEntryId(id)}
              onEdit={(id) => setEditEntryId(id)}
              onDelete={handleDelete}
            />
          )}
        </TabsContent>

        <TabsContent value="new" className="space-y-4">
          <div className="glass-card rounded-2xl p-6">
            <JournalEntryForm
              onSubmit={handleCreate}
              onCancel={() => setActiveTab('entries')}
              isLoading={createEntry.isPending}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* View Entry Dialog */}
      <Dialog open={viewEntryId !== null} onOpenChange={() => setViewEntryId(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-lg">{currentEntry?.date}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="label-caps">{t('journal.mood')}:</span>
              <span className={cn(
                "kpi-value text-2xl px-3 py-1 rounded-lg",
                currentEntry?.mood === 1 && "bg-red-500/20 text-red-400",
                currentEntry?.mood === 2 && "bg-orange-500/20 text-orange-400",
                currentEntry?.mood === 3 && "bg-amber-500/20 text-amber-400",
                currentEntry?.mood === 4 && "bg-lime-500/20 text-lime-400",
                currentEntry?.mood === 5 && "bg-emerald-500/20 text-emerald-400",
              )}>{currentEntry?.mood}/5</span>
            </div>
            {currentEntry?.content && (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p>{currentEntry.content}</p>
              </div>
            )}
            {currentEntry?.tags && (
              <div className="flex flex-wrap gap-1 text-sm text-muted-foreground">
                <span className="label-caps mr-1">{t('journal.tags')}:</span>
                {currentEntry.tags.split(',').map((tag, i) => (
                  <span key={i} className="font-mono text-xs border border-border rounded px-1.5 py-0.5 bg-accent/10">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={editEntryId !== null} onOpenChange={() => setEditEntryId(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('journal.editEntry')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
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
