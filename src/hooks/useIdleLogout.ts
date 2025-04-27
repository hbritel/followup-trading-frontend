// src/hooks/useIdleLogout.ts
import {useEffect, useState, useCallback, Dispatch, SetStateAction} from 'react';
import { useIdleTimer } from 'react-idle-timer';
import { useAuth } from '@/contexts/auth-context';
import { userService } from '@/services/user.service';
import { useToast } from '@/components/ui/use-toast'; // Utiliser le hook standard

const DEFAULT_TIMEOUT_MINUTES = 30; // Timeout par défaut si non défini ou erreur

interface UseIdleLogoutReturn {
    isIdleModalOpen: boolean;
    setIsIdleModalOpen: Dispatch<SetStateAction<boolean>>; // Type correct pour setIsIdleModalOpen
    resetTimer: () => void; // Type pour la fonction reset
    activateTimer: () => void; // Type pour la fonction activate (même si non utilisée dans DashboardLayout pour l'instant)
}

export function useIdleLogout(): UseIdleLogoutReturn {
    const { isAuthenticated, logout, user } = useAuth();
    const { toast } = useToast();
    const [timeoutMinutes, setTimeoutMinutes] = useState<number>(DEFAULT_TIMEOUT_MINUTES);
    const [isIdleModalOpen, setIsIdleModalOpen] = useState<boolean>(false);  // Pour un dialogue d'avertissement

    // Récupérer le timeout depuis les préférences utilisateur
    useEffect(() => {
        let isMounted = true;
        const fetchTimeoutPreference = async () => {
            if (isAuthenticated && user) { // S'assurer que l'utilisateur est chargé
                try {
                    const prefs = await userService.getUserPreferences();
                    if (isMounted && prefs.inactivityTimeoutMinutes && prefs.inactivityTimeoutMinutes > 0) {
                        console.log(`Setting inactivity timeout to ${prefs.inactivityTimeoutMinutes} minutes.`);
                        setTimeoutMinutes(prefs.inactivityTimeoutMinutes);
                    } else if (isMounted) {
                        console.log(`Inactivity timeout is disabled or not set, using default/disabled.`);
                        // Mettre une valeur très grande ou gérer spécifiquement la désactivation
                        // Pour l'instant, une valeur très grande désactive pratiquement le timer
                        setTimeoutMinutes(Infinity); // Désactiver le timer
                    }
                } catch (error) {
                    console.error("Failed to fetch inactivity timeout preference:", error);
                    if (isMounted) {
                        setTimeoutMinutes(DEFAULT_TIMEOUT_MINUTES); // Fallback au défaut en cas d'erreur
                    }
                }
            } else if (isMounted) {
                // Non authentifié, désactiver le timer
                setTimeoutMinutes(Infinity);
            }
        };

        fetchTimeoutPreference();
        return () => { isMounted = false }; // Cleanup
    }, [isAuthenticated, user]); // Re-vérifier si l'utilisateur change


    // Handler appelé quand le timer expire (utilisateur est inactif)
    const handleOnIdle = useCallback((event?: Event) => {
        console.log('User is idle', event);
        if (isAuthenticated && timeoutMinutes !== Infinity) {
            toast({
                title: "Session Expired",
                description: "You have been logged out due to inactivity.",
                variant: "destructive" // Ou 'warning'
            });
            logout(); // Déconnecter l'utilisateur
        }
    }, [logout, isAuthenticated, timeoutMinutes, toast]);

    // Handler appelé quand l'utilisateur redevient actif après avoir été inactif
    const handleOnActive = useCallback((event?: Event) => {
        console.log('User is active', event);
        // On pourrait fermer un dialogue d'avertissement ici si on en avait un
        setIsIdleModalOpen(false);
    }, []);

    // Handler appelé un peu avant l'expiration pour afficher un avertissement (optionnel)
    const handleOnPrompt = useCallback((event?: Event) => {
        console.log('User is idle and will be logged out soon', event);
        if (isAuthenticated && timeoutMinutes !== Infinity) {
            setIsIdleModalOpen(true); // Ouvre le dialogue d'avertissement
            // Le dialogue devrait avoir un bouton "Stay Logged In" qui appelle `reset()` ou `activate()`
        }
    }, [isAuthenticated, timeoutMinutes]);

    // Configuration de react-idle-timer
    const { getRemainingTime, getLastActiveTime, start, reset, activate } = useIdleTimer({
        // timeout: 1000 * 60 * timeoutMinutes, // Délai d'inactivité total en ms
        timeout: timeoutMinutes === Infinity ? undefined : 1000 * 60 * timeoutMinutes, // Ne pas définir si désactivé
        promptBeforeIdle: 1000 * 30, // Afficher l'avertissement 30s avant (optionnel)
        onIdle: handleOnIdle,       // Fonction à appeler quand inactif
        onActive: handleOnActive,     // Fonction à appeler quand redevient actif
        onPrompt: handleOnPrompt,    // Fonction à appeler avant expiration (pour avertissement)
        debounce: 500,             // Réduire la fréquence des vérifications d'activité
        disabled: timeoutMinutes === Infinity || !isAuthenticated, // Désactiver si Infinity ou non auth
        startOnMount: true,       // Démarrer le timer au montage
        // events: [...] // Par défaut écoute les événements courants
    });

    // Retourner l'état du dialogue et les fonctions pour le gérer si nécessaire
    return { isIdleModalOpen, setIsIdleModalOpen, resetTimer: reset, activateTimer: activate };
}