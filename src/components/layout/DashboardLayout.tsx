
import React from 'react';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import { SidebarProvider, SidebarTrigger, SidebarRail } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children,
  pageTitle = "Dashboard"
}) => {
  const isMobile = useIsMobile();
  
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <DashboardSidebar />
        <main className="flex flex-col flex-1 w-full overflow-hidden">
          <Navbar />
          <div className="flex-1 p-4 pb-6 md:p-6 overflow-auto">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold">{pageTitle}</h1>
            </div>
            <div className="overflow-auto">
              {children}
            </div>
          </div>
        </main>
        {!isMobile && <SidebarRail />}
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
