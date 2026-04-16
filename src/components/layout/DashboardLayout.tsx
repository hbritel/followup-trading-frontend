
import React, { useState, useCallback } from 'react';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import CommandPalette from '@/components/dashboard/CommandPalette';
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIdleLogout } from '@/hooks/useIdleLogout';
import { useOnboardingStatus } from '@/hooks/useOnboarding';
import { OnboardingWizard } from '@/components/onboarding';
import { useJournalReminder } from '@/hooks/useJournalReminder';
import { useLiveNotifications } from '@/hooks/useNotifications';
import JournalReminderPopup from '@/components/notifications/JournalReminderPopup';
import DunningBanner from '@/components/layout/DunningBanner';

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
  const [commandOpen, setCommandOpen] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  // Fetch onboarding status — only after auth. Errors are silently ignored (backend
  // may not have this endpoint yet; we never block the user).
  const { data: onboardingStatus, isError: onboardingError } = useOnboardingStatus();
  const showOnboarding =
    !onboardingDismissed &&
    !onboardingError &&
    onboardingStatus != null &&
    !onboardingStatus.completed;

  const handleOnboardingComplete = useCallback(() => {
    setOnboardingDismissed(true);
  }, []);

  // --- Journal reminder popup ---
  const { showReminder, trigger: triggerReminder, dismiss: dismissReminder, snooze: snoozeReminder } =
    useJournalReminder();

  // Connect WebSocket live notifications; intercept JOURNAL_REMINDER events
  useLiveNotifications({ onJournalReminder: triggerReminder });

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
    <>
      <DunningBanner />
      <SidebarProvider defaultOpen={!isMobile}>
        {/* Cinematic Ambient Background */}
        <div className="fixed inset-0 z-[-1] bg-background pointer-events-none overflow-hidden">
          <div className="ambient-blob ambient-blob-primary top-[-15%] left-[-5%] w-[45%] h-[45%]" />
          <div className="ambient-blob ambient-blob-gold bottom-[-10%] right-[-5%] w-[40%] h-[40%]" />
          <div className="ambient-blob ambient-blob-secondary top-[35%] left-[50%] w-[30%] h-[30%]" />
        </div>

        <div className="flex h-screen w-full bg-transparent overflow-hidden">
          <DashboardSidebar />
          <main className="flex flex-col flex-1 w-full overflow-hidden bg-transparent">
            <Navbar onOpenCommandPalette={() => setCommandOpen(true)} />
            <div className="flex-1 p-4 pb-6 md:p-6 overflow-auto">
              {/* ... (Titre et contenu) ... */}
              {children}
            </div>
          </main>
          {/* {!isMobile && <SidebarRail />} <- S'assurer qu'il est utilisé si besoin */}
        </div>

        {/* --- Command Palette --- */}
        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

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

      {/* --- Onboarding Wizard --- */}
      {showOnboarding && (
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      )}

      {/* --- Journal Reminder Popup --- */}
      {showReminder && (
        <JournalReminderPopup
          onDismiss={dismissReminder}
          onSnooze={snoozeReminder}
        />
      )}
    </>
  );
};

export default DashboardLayout;