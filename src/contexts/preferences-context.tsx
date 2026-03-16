// src/contexts/preferences-context.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { UserPreferencesDto } from '@/types/dto';
import { useAuth } from './auth-context'; // Pour savoir si l'utilisateur est connecté
import { userService } from '@/services/user.service';

interface PreferencesContextType {
    preferences: Partial<UserPreferencesDto> | null;
    isLoadingPrefs: boolean;
    setPreference: <K extends keyof UserPreferencesDto>(key: K, value: UserPreferencesDto[K]) => void;
    savePreferences: () => Promise<void>;
    refreshPreferences: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [preferences, setPreferences] = useState<Partial<UserPreferencesDto> | null>(null);
    const [isLoadingPrefs, setIsLoadingPrefs] = useState<boolean>(true); // Commence à true

    const loadPreferences = useCallback(async () => {
        if (!isAuthenticated || !user) {
            setPreferences(null);
            setIsLoadingPrefs(false);
            return;
        }
        setIsLoadingPrefs(true);
        try {
            const prefs = await userService.getUserPreferences();
            setPreferences(prefs);
        } catch (error) {
            console.error("Failed to load preferences in context:", error);
            setPreferences({}); // Mettre un objet vide en cas d'erreur ? ou null ?
        } finally {
            setIsLoadingPrefs(false);
        }
    }, [isAuthenticated, user]); // Dépend de l'état d'authentification

    useEffect(() => {
        loadPreferences();
    }, [loadPreferences]); // Charger au montage et si l'auth change

    // Fonction pour mettre à jour une préférence dans le contexte
    const setPreference = useCallback(<K extends keyof UserPreferencesDto>(
        key: K,
        value: UserPreferencesDto[K]
    ) => {
        setPreferences(prev => (prev ? { ...prev, [key]: value } : { [key]: value }));
    }, []);

    // Fonction pour sauvegarder les préférences actuelles via l'API
    const savePreferences = useCallback(async () => {
        if (!preferences || !isAuthenticated) return;
        setIsLoadingPrefs(true); // Indiquer le chargement pendant la sauvegarde
        try {
            const { updatedAt, ...prefsToSave } = preferences; // Exclure updatedAt si besoin
            const savedPrefs = await userService.updateUserPreferences(prefsToSave);
            setPreferences(savedPrefs); // Mettre à jour avec les données sauvegardées
            console.log("Preferences saved via context.");
        } catch (error) {
            console.error("Failed to save preferences via context:", error);
            throw error; // Propager l'erreur pour affichage (ex: toast dans Settings)
        } finally {
            setIsLoadingPrefs(false);
        }
    }, [preferences, isAuthenticated]);


    // --- APPLY VISUAL PREFERENCES ---
    useEffect(() => {
        const body = document.body;
        const html = document.documentElement;

        // Clean previous classes
        body.classList.remove('theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-red');
        html.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');

        if (preferences) {
            // Accent color → overrides --primary CSS variable via body class
            body.classList.add(`theme-${preferences.accentColor || 'blue'}`);

            // Font size → applied on <html> so all rem-based values scale
            html.classList.add(`font-size-${preferences.fontSize || 'medium'}`);
        } else {
            body.classList.add('theme-blue');
            html.classList.add('font-size-medium');
        }
    }, [preferences]);

    return (
        <PreferencesContext.Provider value={{ preferences, isLoadingPrefs, setPreference, savePreferences, refreshPreferences: loadPreferences }}>
            {children}
        </PreferencesContext.Provider>
    );
};

export const usePreferences = (): PreferencesContextType => {
    const context = useContext(PreferencesContext);
    if (context === undefined) {
        throw new Error('usePreferences must be used within a PreferencesProvider');
    }
    return context;
};