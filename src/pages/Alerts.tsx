
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider } from "@/components/ui/sidebar";
import Navbar from '@/components/dashboard/Navbar';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import AlertManager from '@/components/alerts/AlertManager';

const Alerts = () => {
  const { t } = useTranslation();
  
  useEffect(() => {
    document.title = t('pages.alerts') + " | Followup Trading";
  }, [t]);
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-accent/10">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 px-4 py-4 md:px-6 md:py-6 overflow-auto">
            <div className="max-w-screen-2xl mx-auto space-y-6">
              <h1 className="text-2xl font-bold animate-fade-in">{t('pages.alerts')}</h1>
              <AlertManager />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Alerts;
