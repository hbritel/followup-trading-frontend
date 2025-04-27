
import React from 'react';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIdleLogout } from '@/hooks/useIdleLogout';

// --- Optionnel: Dialogue d'avertissement ---
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
// --- Fin Optionnel ---


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
              {/* ... (Titre et contenu) ... */}
              {children}
            </div>
          </main>
          {/* {!isMobile && <SidebarRail />} <- S'assurer que SidebarRail est utilisé si besoin */}
        </div>
      </SidebarProvider>
  );
};

export default DashboardLayout;