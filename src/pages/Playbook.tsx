
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider } from "@/components/ui/sidebar";
import Navbar from '@/components/dashboard/Navbar';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import StrategyList from '@/components/playbook/StrategyList';
import StrategyForm from '@/components/playbook/StrategyForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Playbook = () => {
  const { t } = useTranslation();
  
  useEffect(() => {
    document.title = "Playbook | Followup Trading";
  }, []);
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-accent/10">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 px-4 py-4 md:px-6 md:py-6 overflow-auto">
            <div className="max-w-screen-2xl mx-auto space-y-6">
              <h1 className="text-2xl font-bold animate-fade-in">{t('pages.playbook')}</h1>
              
              <Tabs defaultValue="strategies" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="strategies">{t('playbook.strategies')}</TabsTrigger>
                  <TabsTrigger value="new">{t('playbook.newStrategy')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="strategies" className="space-y-4">
                  <StrategyList />
                </TabsContent>
                
                <TabsContent value="new" className="space-y-4">
                  <StrategyForm />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Playbook;
