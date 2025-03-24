
import React from 'react';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import { SidebarProvider } from "@/components/ui/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children,
  pageTitle = "Dashboard"
}) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar />
        <main className="flex flex-col flex-1 w-full">
          <Navbar />
          <div className="flex-1 p-4 pb-6 md:p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">{pageTitle}</h1>
            </div>
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
