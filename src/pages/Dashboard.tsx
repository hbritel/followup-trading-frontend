
import React, { useEffect } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import Navbar from '@/components/dashboard/Navbar';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import TradingStats from '@/components/dashboard/TradingStats';
import TradeTable from '@/components/dashboard/TradeTable';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import AccountSummary from '@/components/dashboard/AccountSummary';
import TradingCalendar from '@/components/dashboard/Calendar';
import { useIsMobile } from '@/hooks/use-mobile';

const Dashboard = () => {
  const isMobile = useIsMobile();
  
  useEffect(() => {
    document.title = "Dashboard | DashNest Trader";
  }, []);
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-accent/10">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 px-3 py-3 md:px-6 md:py-6 overflow-auto">
            <div className="max-w-screen-2xl mx-auto space-y-4 md:space-y-6">
              <h1 className="text-xl md:text-2xl font-bold animate-fade-in">Dashboard</h1>
              <TradingStats />
              
              <div className="grid grid-cols-1 gap-4 md:gap-6">
                <PerformanceChart />
                <AccountSummary />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <TradeTable />
                  {!isMobile && <TradingCalendar />}
                  {isMobile && (
                    <div className="md:hidden">
                      <TradingCalendar />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
