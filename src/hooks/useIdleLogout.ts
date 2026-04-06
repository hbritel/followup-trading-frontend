// src/hooks/useIdleLogout.ts
import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { useIdleTimer } from 'react-idle-timer';
import { useAuth } from '@/contexts/auth-context';
import { usePreferences } from '@/contexts/preferences-context';
import { useToast } from '@/hooks/use-toast';
import { useTokenRefreshTimer } from '@/hooks/useTokenRefreshTimer';

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
    const [isIdle, setIsIdle] = useState(false);

    // Derive timeout directly from shared preferences context.
    // This reacts immediately when the user saves a new value in Settings.
    const savedTimeout = preferences?.inactivityTimeoutMinutes;
    const timeoutMinutes =
        savedTimeout && savedTimeout > 0 ? savedTimeout : Infinity;

    // Background token refresh — keeps JWT alive while user is within their
    // inactivity window. Stops when idle timeout fires (security: abandoned
    // sessions will NOT keep refreshing tokens).
    useTokenRefreshTimer(!isIdle && isAuthenticated);

    const handleOnIdle = useCallback(() => {
        setIsIdle(true);
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
        setIsIdle(false);
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
