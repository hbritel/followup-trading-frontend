
import React, { useEffect, useState } from 'react';
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
  const [lastScrollY, setLastScrollY] = useState(0);
  const [shouldCollapseSidebar, setShouldCollapseSidebar] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // If scrolled more than 100px down, collapse the sidebar
      if (currentScrollY > 100 && !shouldCollapseSidebar) {
        setShouldCollapseSidebar(true);
      }
      
      // If scrolled back up to less than 50px, expand the sidebar
      if (currentScrollY < 50 && shouldCollapseSidebar) {
        setShouldCollapseSidebar(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, shouldCollapseSidebar]);

  return (
    <SidebarProvider defaultOpen={!shouldCollapseSidebar}>
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar />
        <main className="flex flex-col flex-1 w-full">
          <Navbar />
          <div className="flex-1 p-4 pb-6 md:p-6 overflow-x-hidden">
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
