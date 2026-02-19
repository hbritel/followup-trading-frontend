
import React from 'react';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIdleLogout } from '@/hooks/useIdleLogout';

// Importer les composants nécessaires pour le dialogue d'avertissement
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
  // AlertDialogCancel // On n'a pas besoin de Cancel ici, juste de l'action
} from "@/components/ui/alert-dialog";
import { useTranslation } from 'react-i18next'; // Ajouter pour traduire le dialogue


interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
                                                           children,
                                                           pageTitle = "Dashboard"
                                                         }) => {
  const isMobile = useIsMobile();
  const { t } = useTranslation(); // Hook de traduction

  // --- Appel du hook d'inactivité ---
  // Récupérer les fonctions et états nécessaires
  const { isIdleModalOpen, setIsIdleModalOpen, resetTimer, activateTimer } = useIdleLogout();
  // 'resetTimer' et 'activateTimer' de useIdleTimer font essentiellement la même chose:
  // réinitialiser le timer et remettre l'état à 'active'. Utilisons 'activateTimer' pour la clarté sémantique.

  // --- Fin Appel hook ---

  // Fonction appelée par le bouton "Stay Logged In"
  const handleStayLoggedIn = () => {
    console.log("User chose to stay logged in. Activating timer.");
    activateTimer(); // Réinitialise le timer et l'état d'inactivité
    setIsIdleModalOpen(false); // Ferme le dialogue
  };

  return (
      <SidebarProvider defaultOpen={!isMobile}>
        {/* Nebula Background Mesh */}
        <div className="fixed inset-0 z-[-1] bg-background pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[120px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-secondary/5 blur-[100px]" />
        </div>

        <div className="flex h-screen w-full bg-transparent overflow-hidden">
          <DashboardSidebar />
          <main className="flex flex-col flex-1 w-full overflow-hidden bg-transparent">
            <Navbar />
            <div className="flex-1 p-4 pb-6 md:p-6 overflow-auto">
              {/* ... (Titre et contenu) ... */}
              {children}
            </div>
          </main>
          {/* {!isMobile && <SidebarRail />} <- S'assurer qu'il est utilisé si besoin */}
        </div>

        {/* --- Dialogue d'avertissement d'inactivité --- */}
        {/* Utiliser onOpenChange pour synchroniser la fermeture si l'utilisateur clique en dehors */}
        <AlertDialog open={isIdleModalOpen} onOpenChange={setIsIdleModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('session.idleTitle')}</AlertDialogTitle> {/* Traduire */}
              <AlertDialogDescription>
                {t('session.idleWarning')} {/* Traduire */}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {/* L'action principale est de rester connecté */}
              <AlertDialogAction onClick={handleStayLoggedIn}>
                {t('session.stayLoggedIn')} {/* Traduire */}
              </AlertDialogAction>
              {/* On pourrait ajouter un bouton "Logout Now" qui appelle explicitement logout()
                   <AlertDialogCancel onClick={() => logout()}>
                       {t('session.logoutNow')}
                   </AlertDialogCancel>
                   Mais ce n'est pas strictement nécessaire, car la déconnexion se fera automatiquement.
                   */}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* --- Fin Dialogue --- */}

      </SidebarProvider>
  );
};

export default DashboardLayout;