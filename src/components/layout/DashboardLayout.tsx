
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      // Collapse sidebar when scrolling horizontally
      if (window.scrollX > 10) {
        setSidebarCollapsed(true);
      } else if (window.scrollX < 5) {
        setSidebarCollapsed(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar collapseState={sidebarCollapsed ? "collapsed" : "expanded"} />
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
