
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider } from "@/components/ui/sidebar";
import Navbar from '@/components/dashboard/Navbar';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import TradingViewChart from '@/components/tradereplay/TradingViewChart';
import TradeSelector from '@/components/tradereplay/TradeSelector';
import ReplayControls from '@/components/tradereplay/ReplayControls';

const TradeReplay = () => {
  const { t } = useTranslation();
  
  useEffect(() => {
    document.title = "Trade Replay | Followup Trading";
  }, []);
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-accent/10">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 px-4 py-4 md:px-6 md:py-6 overflow-auto">
            <div className="max-w-screen-2xl mx-auto space-y-6">
              <h1 className="text-2xl font-bold animate-fade-in">{t('pages.tradeReplay')}</h1>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-card border rounded-lg p-4">
                  <TradeSelector />
                </div>
                
                <div className="bg-card border rounded-lg p-4 h-[600px]">
                  <TradingViewChart />
                </div>
                
                <div className="bg-card border rounded-lg p-4">
                  <ReplayControls />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default TradeReplay;
