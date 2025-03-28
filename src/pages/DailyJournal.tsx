
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider } from "@/components/ui/sidebar";
import Navbar from '@/components/dashboard/Navbar';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import JournalEntryForm from '@/components/journal/JournalEntryForm';
import JournalEntries from '@/components/journal/JournalEntries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const DailyJournal = () => {
  const { t } = useTranslation();
  const [viewEntryId, setViewEntryId] = useState<number | null>(null);
  const [editEntryId, setEditEntryId] = useState<number | null>(null);
  
  useEffect(() => {
    document.title = "Daily Journal | Followup Trading";
  }, []);
  
  // Mock data for journal entries - in a real app this would come from an API
  const journalEntries = [
    { 
      id: 1, 
      date: new Date(2023, 10, 15), 
      title: "Weekly market review", 
      marketConditions: "Bullish",
      trades: 3,
      content: "This week the market showed strong bullish momentum. Tech stocks performed particularly well with NVIDIA leading the rally."
    },
    { 
      id: 2, 
      date: new Date(2023, 10, 12), 
      title: "Earnings analysis", 
      marketConditions: "Mixed",
      trades: 2,
      content: "Mixed earnings results today. Some companies beat expectations while others missed. Overall market sentiment remains cautious."
    },
    { 
      id: 3, 
      date: new Date(2023, 10, 8), 
      title: "Market reversal strategy", 
      marketConditions: "Bearish",
      trades: 1,
      content: "Developing a strategy for market reversals. Key indicators to watch include volume, price action, and sector rotation."
    },
    { 
      id: 4, 
      date: new Date(2023, 10, 5), 
      title: "Breakout pattern study", 
      marketConditions: "Bullish",
      trades: 4,
      content: "Studied several breakout patterns today. Found that cup and handle patterns have been particularly reliable in the current market conditions."
    },
  ];
  
  const currentEntry = journalEntries.find(entry => entry.id === viewEntryId || entry.id === editEntryId);
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-accent/10">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 px-4 py-4 md:px-6 md:py-6 overflow-auto">
            <div className="max-w-screen-2xl mx-auto space-y-6">
              <h1 className="text-2xl font-bold animate-fade-in">{t('pages.dailyJournal')}</h1>
              
              <Tabs defaultValue="entries" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="entries">{t('journal.entries')}</TabsTrigger>
                  <TabsTrigger value="new">{t('journal.newEntry')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="entries" className="space-y-4">
                  <JournalEntries 
                    entries={journalEntries}
                    onView={(id) => setViewEntryId(id)}
                    onEdit={(id) => setEditEntryId(id)}
                    onDelete={(id) => console.log('Delete entry:', id)}
                  />
                </TabsContent>
                
                <TabsContent value="new" className="space-y-4">
                  <JournalEntryForm />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
      
      {/* View Entry Dialog */}
      <Dialog open={viewEntryId !== null} onOpenChange={() => setViewEntryId(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{currentEntry?.title}</DialogTitle>
            <DialogDescription>
              {currentEntry?.date.toLocaleDateString()} - {currentEntry?.marketConditions}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="prose max-w-none">
              <p>{currentEntry?.content}</p>
            </div>
            {currentEntry?.trades > 0 && (
              <div className="text-sm text-muted-foreground">
                {t('journal.relatedTrades')}: {currentEntry.trades}
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
              onSubmit={() => setEditEntryId(null)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default DailyJournal;
