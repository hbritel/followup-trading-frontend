
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider } from "@/components/ui/sidebar";
import Navbar from '@/components/dashboard/Navbar';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import TradingPatterns from '@/components/insights/TradingPatterns';
import MarketConditions from '@/components/insights/MarketConditions';
import PerformanceMetrics from '@/components/insights/PerformanceMetrics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Insights = () => {
  const { t } = useTranslation();
  
  useEffect(() => {
    document.title = "Insights | Followup Trading";
  }, []);
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-accent/10">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 px-4 py-4 md:px-6 md:py-6 overflow-auto">
            <div className="max-w-screen-2xl mx-auto space-y-6">
              <h1 className="text-2xl font-bold animate-fade-in">{t('pages.insights')}</h1>
              
              <Tabs defaultValue="metrics" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="metrics">{t('insights.metrics')}</TabsTrigger>
                  <TabsTrigger value="patterns">{t('insights.patterns')}</TabsTrigger>
                  <TabsTrigger value="market">{t('insights.marketConditions')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="metrics" className="space-y-4">
                  <PerformanceMetrics />
                </TabsContent>
                
                <TabsContent value="patterns" className="space-y-4">
                  <TradingPatterns />
                </TabsContent>
                
                <TabsContent value="market" className="space-y-4">
                  <MarketConditions />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Insights;
