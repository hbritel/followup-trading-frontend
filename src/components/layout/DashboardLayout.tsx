
import React, { useState, useEffect } from 'react';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  useEffect(() => {
    const handleScroll = () => {
      // Collapse sidebar when scrolling horizontally
      if (window.scrollX > 10) {
        setSidebarOpen(false);
      } else if (window.scrollX < 5) {
        setSidebarOpen(true);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
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
