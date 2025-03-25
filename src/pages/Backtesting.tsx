
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider } from "@/components/ui/sidebar";
import Navbar from '@/components/dashboard/Navbar';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import BacktestForm from '@/components/backtesting/BacktestForm';
import BacktestResults from '@/components/backtesting/BacktestResults';
import BacktestHistory from '@/components/backtesting/BacktestHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Backtesting = () => {
  const { t } = useTranslation();
  
  useEffect(() => {
    document.title = "Backtesting | Followup Trading";
  }, []);
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-accent/10">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 px-4 py-4 md:px-6 md:py-6 overflow-auto">
            <div className="max-w-screen-2xl mx-auto space-y-6">
              <h1 className="text-2xl font-bold animate-fade-in">{t('pages.backtesting')}</h1>
              
              <Tabs defaultValue="new" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="new">{t('backtesting.newBacktest')}</TabsTrigger>
                  <TabsTrigger value="results">{t('backtesting.results')}</TabsTrigger>
                  <TabsTrigger value="history">{t('backtesting.history')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="new" className="space-y-4">
                  <BacktestForm />
                </TabsContent>
                
                <TabsContent value="results" className="space-y-4">
                  <BacktestResults />
                </TabsContent>
                
                <TabsContent value="history" className="space-y-4">
                  <BacktestHistory />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Backtesting;
