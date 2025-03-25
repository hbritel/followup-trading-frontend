
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider } from "@/components/ui/sidebar";
import Navbar from '@/components/dashboard/Navbar';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import JournalEntryForm from '@/components/journal/JournalEntryForm';
import JournalCalendar from '@/components/journal/JournalCalendar';
import JournalEntries from '@/components/journal/JournalEntries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DailyJournal = () => {
  const { t } = useTranslation();
  
  useEffect(() => {
    document.title = "Daily Journal | Followup Trading";
  }, []);
  
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
                  <TabsTrigger value="calendar">{t('journal.calendar')}</TabsTrigger>
                  <TabsTrigger value="new">{t('journal.newEntry')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="entries" className="space-y-4">
                  <JournalEntries />
                </TabsContent>
                
                <TabsContent value="calendar" className="space-y-4">
                  <JournalCalendar />
                </TabsContent>
                
                <TabsContent value="new" className="space-y-4">
                  <JournalEntryForm />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DailyJournal;
