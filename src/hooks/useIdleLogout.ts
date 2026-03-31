// src/hooks/useIdleLogout.ts
import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { useIdleTimer } from 'react-idle-timer';
import { useAuth } from '@/contexts/auth-context';
import { usePreferences } from '@/contexts/preferences-context';
import { useToast } from '@/hooks/use-toast';

interface UseIdleLogoutReturn {
    isIdleModalOpen: boolean;
    setIsIdleModalOpen: Dispatch<SetStateAction<boolean>>;
    resetTimer: () => void;
    activateTimer: () => void;
}

export function useIdleLogout(): UseIdleLogoutReturn {
    const { isAuthenticated, logout } = useAuth();
    const { preferences } = usePreferences();
    const { toast } = useToast();
    const [isIdleModalOpen, setIsIdleModalOpen] = useState<boolean>(false);

    // Derive timeout directly from shared preferences context.
    // This reacts immediately when the user saves a new value in Settings.
    const savedTimeout = preferences?.inactivityTimeoutMinutes;
    const timeoutMinutes =
        savedTimeout && savedTimeout > 0 ? savedTimeout : Infinity;

    const handleOnIdle = useCallback(() => {
        if (isAuthenticated && timeoutMinutes !== Infinity) {
            toast({
                title: "Session Expired",
                description: "You have been logged out due to inactivity.",
                variant: "destructive",
            });
            logout();
        }
    }, [logout, isAuthenticated, timeoutMinutes, toast]);

    const handleOnActive = useCallback(() => {
        setIsIdleModalOpen(false);
    }, []);

    const handleOnPrompt = useCallback(() => {
        if (isAuthenticated && timeoutMinutes !== Infinity) {
            setIsIdleModalOpen(true);
        }
    }, [isAuthenticated, timeoutMinutes]);

    const { reset, activate } = useIdleTimer({
        timeout: timeoutMinutes === Infinity ? undefined : 1000 * 60 * timeoutMinutes,
        promptBeforeIdle: 1000 * 60, // warn 1 minute before
        onIdle: handleOnIdle,
        onActive: handleOnActive,
        onPrompt: handleOnPrompt,
        debounce: 500,
        disabled: timeoutMinutes === Infinity || !isAuthenticated,
        startOnMount: true,
    });

    return { isIdleModalOpen, setIsIdleModalOpen, resetTimer: reset, activateTimer: activate };
}
