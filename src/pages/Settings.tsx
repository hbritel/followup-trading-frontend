// src/pages/Settings.tsx

import React, {useCallback, useEffect, useMemo, useState} from 'react'; // Ajout React et useCallback
import {usePreferences} from '@/contexts/preferences-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Switch} from '@/components/ui/switch';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Separator} from '@/components/ui/separator';
import {useToast} from '@/hooks/use-toast';
import ChangePasswordDialog from '@/components/dialogs/ChangePasswordDialog';
import ConfirmLogoutDialog from '@/components/dialogs/ConfirmLogoutDialog'; // Gardé pour l'instant
import type {Theme} from '@/components/providers/theme-provider';
import {useTheme} from '@/components/providers/theme-provider';
import {useTranslation} from 'react-i18next'; // Ajouter i18n
// Imports nécessaires pour MFA
import {useAuth} from '@/contexts/auth-context';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Laptop, Loader2, Monitor, ShieldCheck, Smartphone} from 'lucide-react';
import {authService} from '@/services/auth.service';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type {SessionDto, UserPreferencesDto} from '@/types/dto';
import {format} from 'date-fns';
import {sessionService} from "@/services/session.service.ts";
import TrustedDevicesManager from '@/components/security/TrustedDevicesManager';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Helper simple pour deviner le type d'appareil depuis le User Agent
const getDeviceIcon = (userAgent: string | null): React.ReactNode => {
    const ua = userAgent?.toLowerCase() || '';
    if (ua.includes('iphone') || ua.includes('android') || ua.includes('mobile')) {
        return <Smartphone className="h-5 w-5 mr-2 text-muted-foreground"/>;
    }
    if (ua.includes('macintosh') || ua.includes('mac os')) {
        return <Laptop className="h-5 w-5 mr-2 text-muted-foreground"/>;
    }
    if (ua.includes('windows') || ua.includes('linux')) {
        return <Monitor className="h-5 w-5 mr-2 text-muted-foreground"/>; // Ou Laptop ?
    }
    return <Monitor className="h-5 w-5 mr-2 text-muted-foreground"/>; // Défaut
};

// Helper pour formater la date de manière lisible
const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
        return format(new Date(dateString), "PPpp"); // Ex: Sep 21, 2023, 4:15:30 PM
    } catch {
        return dateString; // Fallback si format invalide
    }
}

const Settings = () => {
    const {t} = useTranslation();
    const {toast} = useToast();
    const {theme, setTheme} = useTheme();

    // --- États NON-MFA ---
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [mobileNotifications, setMobileNotifications] = useState(true);
    const [alertsEnabled, setAlertsEnabled] = useState(true);
    const [tradeConfirmations, setTradeConfirmations] = useState(true);
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [logoutAllDevicesOpen, setLogoutAllDevicesOpen] = useState(false);

    // --- États MFA ---
    const {user, isLoading: isAuthLoading, confirmMfaSetup, disableMfa} = useAuth();
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isLoadingSetup, setIsLoadingSetup] = useState(false);
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showDisableConfirm, setShowDisableConfirm] = useState(false);
    const [isDisabling, setIsDisabling] = useState(false);
    // Initialiser à 'loading' pour attendre la fin du chargement user
    const [mfaStatus, setMfaStatus] = useState<'loading' | 'disabled' | 'setup_qr' | 'setup_verify' | 'enabled'>('loading');

    // État pour TOUTES les préférences utilisateur modifiables
    // Initialiser avec null ou un objet vide pour indiquer qu'elles ne sont pas encore chargées
    // const [preferences, setPreferences] = useState<Partial<UserPreferencesDto> | null>(null);
    // const [isLoadingPrefs, setIsLoadingPrefs] = useState(false);
    // --- Utilisation du contexte Preferences ---
    const {preferences, isLoadingPrefs, setPreference, savePreferences} = usePreferences();

    // --- États pour Device Management ---
    const [sessions, setSessions] = useState<SessionDto[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [errorSessions, setErrorSessions] = useState<string | null>(null);
    // --- Fin États Device Management ---

    // --- Charger les sessions au montage ou quand l'utilisateur change ---
    useEffect(() => {
        const fetchSessions = async () => {
            setIsLoadingSessions(true);
            setErrorSessions(null);
            try {
                const activeSessions = await sessionService.getActiveSessions();
                setSessions(activeSessions);
            } catch (error) {
                console.error("Failed to load sessions:", error);
                setErrorSessions("Could not load session data.");
                // Afficher un toast si nécessaire
                // toast({ title: "Error", description: "Could not load session data.", variant: "destructive" });
            } finally {
                setIsLoadingSessions(false);
            }
        };

        if (user) { // Charger seulement si l'utilisateur est connecté
            fetchSessions();
        } else {
            setSessions([]); // Vider si l'utilisateur se déconnecte
        }
    }, [user]); // Recharger si l'utilisateur change

    // --- State pour le dialog de confirmation de révocation ---
    const [revokeSessionId, setRevokeSessionId] = useState<string | null>(null);

    // --- Handler pour révoquer une session ---
    const handleRevokeSession = async (sessionId: string) => {
        try {
            await sessionService.revokeSession(sessionId);
            toast({title: "Session Revoked", description: "The session has been successfully revoked."});
            const activeSessions = await sessionService.getActiveSessions();
            setSessions(activeSessions);
        } catch (error) {
            console.error(`Failed to revoke session ${sessionId}:`, error);
            const errorMessage = sessionService.getErrorMessage(error);
            toast({title: "Error Revoking Session", description: errorMessage, variant: "destructive"});
        } finally {
            setRevokeSessionId(null);
        }
    };

    // --- Handler pour mettre à jour une préférence spécifique ---
    // Utilisation d'un type générique pour le rendre réutilisable
    const handlePreferenceChange = <K extends keyof UserPreferencesDto>(
        key: K,
        // L'entrée peut toujours être une chaîne (du Select) ou le type correct (du Switch)
        value: UserPreferencesDto[K] | string
    ) => {
        // Déclarer la variable qui contiendra la valeur finale correctement typée
        let finalValue: UserPreferencesDto[K] | null;

        if (key === 'inactivityTimeoutMinutes') {
            // Ici, nous savons que 'value' vient du Select et est une string
            // ou potentiellement le type UserPreferencesDto[K] si l'état initial était chargé
            const numValue = parseInt(value as string, 10); // Convertir en nombre

            // Calculer la valeur finale (number ou null)
            const timeoutValue = (!isNaN(numValue) && numValue > 0) ? numValue : null;

            // Assigner à finalValue. TypeScript a besoin d'aide ici car il ne relie pas dynamiquement
            // key === '...' à UserPreferencesDto[K]. Nous affirmons que timeoutValue (number | null)
            // est un type valide pour UserPreferencesDto['inactivityTimeoutMinutes'].
            finalValue = timeoutValue as UserPreferencesDto[K];

        } else if (key === 'theme') { // Gérer le thème via le contexte de thème ET le contexte de prefs
            const validTheme = ['light', 'dark', 'system'].includes(value as string) ? value as Theme : 'system';
            setTheme(validTheme); // Met à jour le ThemeProvider
            finalValue = validTheme as UserPreferencesDto[K]; // Met à jour l'état des préférences
        } else {
            // Conversion pour les booléens venant de Switch si nécessaire
            if (typeof value === 'boolean' && (key === 'showChartVolume' || key === 'showExtendedHours')) {
                finalValue = value as UserPreferencesDto[K];
            }
            // Gérer autres types si besoin (ex: string pour selects)
            else if (typeof value === 'string') {
                finalValue = value as UserPreferencesDto[K];
            } else {
                console.warn(`Unhandled type for key ${String(key)} in handlePreferenceChange`);
                return; // Ne pas mettre à jour si type inconnu
            }
        }

        // Mettre à jour l'état. 'finalValue' a maintenant le type UserPreferencesDto[K] | null,
        // ce qui est compatible avec Partial<UserPreferencesDto>.
        console.log(`Updating preference ${String(key)} to`, finalValue); // Log
        setPreference(key, finalValue); // Met à jour le contexte
    };

    const handleGenericPreferenceChange = useCallback(<K extends keyof UserPreferencesDto>(
        key: K,
        value: UserPreferencesDto[K]
    ) => {
        setPreference(key, value); // Appelle la fonction du contexte PreferencesProvider
    }, [setPreference]);

    // --- Fonctions MFA (intégrées ici) ---
    // Mettre à jour mfaStatus SEULEMENT quand user/isAuthLoading changent
    // ET que nous ne sommes PAS déjà dans un processus de setup
    useEffect(() => {
        console.log(`useEffect[user, isAuthLoading] fired. isAuthLoading: ${isAuthLoading}, user?.mfaEnabled: ${user?.mfaEnabled}, current mfaStatus: ${mfaStatus}`);
        if (isAuthLoading) {
            setMfaStatus('loading');
        } else if (user && mfaStatus !== 'setup_qr' && mfaStatus !== 'setup_verify') { // <- NE PAS écraser si en cours de setup
            setMfaStatus(user.mfaEnabled ? 'enabled' : 'disabled');
            if (user.mfaEnabled) {
                setQrCodeUrl('');
                setSecret('');
                setVerificationCode(''); // Cleanup si activé
            }
        } else if (!user && !isAuthLoading) {
            setMfaStatus('disabled'); // Ou un état d'erreur si l'utilisateur devrait être là
        }
    }, [user, isAuthLoading]); // Retirer mfaStatus des dépendances ici pour éviter boucle infinie potentielle

    const handleStartSetup = useCallback(async () => {
        if (mfaStatus !== 'disabled' || !user) return;
        console.log("handleStartSetup called");
        setIsLoadingSetup(true);
        setQrCodeUrl('');
        setSecret(''); // Reset
        try {
            // Appel DIRECT au service pour initialiser, SANS changer l'état global
            const response = await authService.initMfaSetup(user.id);
            console.log("initMfaSetup service response:", response);
            setQrCodeUrl(response.qrCodeUri);
            setSecret(response.secret);
            setMfaStatus('setup_qr'); // Mise à jour de l'état LOCAL uniquement
        } catch (error) {
            console.error("Error in handleStartSetup:", error);
            const errorMessage = authService.getErrorMessage(error);
            toast({title: t('error.error'), description: errorMessage, variant: 'destructive'});
            setMfaStatus('disabled'); // Revenir si erreur
        } finally {
            setIsLoadingSetup(false);
        }
    }, [mfaStatus, toast, t, user]); // user est une dépendance maintenant

    const handleCancelSetup = useCallback(() => {
        setMfaStatus('disabled');
        setQrCodeUrl('');
        setSecret('');
        setVerificationCode('');
    }, []);


    // Utilise maintenant la fonction du contexte pour confirmer
    const handleVerifySetupCode = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!user || mfaStatus !== 'setup_verify') return;
        console.log("handleVerifySetupCode called with code:", verificationCode);

        setIsVerifying(true);
        try {
            // Appel à la fonction du CONTEXTE qui gère l'API ET le refresh du user global
            await confirmMfaSetup(user.id, verificationCode);
            console.log("confirmMfaSetup (context) successful.");
            // Le useEffect mettra à jour mfaStatus car 'user' aura changé dans le contexte
            // Forcer ici par sécurité pour l'UI immédiate:
            setMfaStatus('enabled');
            toast({title: t('success.success'), description: t('auth.mfaSetupVerified')});
            setVerificationCode(''); // Reset field
        } catch (error) {
            console.error("Error in handleVerifySetupCode:", error);
            const errorMessage = authService.getErrorMessage(error);
            toast({title: t('auth.verificationFailedTitle'), description: errorMessage, variant: 'destructive'});
            // Rester sur 'setup_verify'
        } finally {
            setIsVerifying(false);
        }
    }, [user, verificationCode, mfaStatus, toast, t, confirmMfaSetup]); // Ajouter confirmMfaSetup


    // Utilise maintenant la fonction du contexte pour désactiver
    const handleConfirmDisable = useCallback(async () => {
        if (mfaStatus !== 'enabled' || !passwordConfirm || !user) return;
        console.log("handleConfirmDisable called");

        setIsDisabling(true);
        try {
            // Appel à la fonction du CONTEXTE
            await disableMfa(passwordConfirm);
            console.log("disableMfa (context) successful.");
            // Le useEffect mettra à jour mfaStatus car 'user' aura changé dans le contexte
            // Forcer ici par sécurité pour l'UI immédiate:
            setMfaStatus('disabled');
            toast({title: t('success.success'), description: t('auth.mfaDisabledSuccess')});
            setShowDisableConfirm(false);
            setPasswordConfirm('');
        } catch (error) {
            console.error("Error in handleConfirmDisable:", error);
            const errorMessage = authService.getErrorMessage(error);
            toast({title: t('auth.mfaDisableFailed'), description: errorMessage, variant: 'destructive'});
        } finally {
            setIsDisabling(false);
        }
    }, [passwordConfirm, mfaStatus, toast, t, user, disableMfa]); // Ajouter disableMfa
    // --- Fin Fonctions MFA ---


    const toggleDarkMode = (checked: boolean) => {
        handlePreferenceChange('theme', checked ? 'dark' : 'light');
        toast({title: checked ? "Dark mode enabled" : "Light mode enabled"});
    };

    // --- Handler Sauvegarde (modifié pour utiliser l'état 'preferences') ---
    const handleSaveChanges = async (section: string) => { // Rendre async
        try {
            await savePreferences(); // Appelle la fonction de sauvegarde du contexte
            toast({
                title: `${section} settings saved`,
                description: "Your changes have been saved successfully.",
            });
        } catch (error) {
            const errorMessage = authService.getErrorMessage(error); // Utiliser un getErrorMessage ici
            toast({title: "Error Saving Settings", description: errorMessage, variant: "destructive"});
        }
    };

    // --- Memoisation pour le rendu MFA (évite recalculs inutiles) ---
    const mfaSectionContent = useMemo(() => {
        console.log("Rendering MFA section with status:", mfaStatus); // Log de rendu
        switch (mfaStatus) {
            case 'enabled':
                return (
                    <Alert variant="success">
                        <ShieldCheck className="h-5 w-5"/>
                        <AlertTitle>{t('auth.mfaEnabledTitle')}</AlertTitle>
                        <AlertDescription>{t('auth.mfaEnabledDesc')}</AlertDescription>
                    </Alert>
                );
            case 'setup_qr':
                return (
                    <div className="space-y-4 rounded-md border p-4">
                        <h4 className="font-medium">{t('auth.twoFactorAuthSetup')} - Step 1/2</h4>
                        <p className="text-sm text-muted-foreground">{t('auth.scanInstruction')}</p>
                        <div
                            className="flex justify-center items-center p-4 bg-white rounded-md border max-w-xs mx-auto min-h-[212px]">
                            {isLoadingSetup ? (
                                <Loader2 className="h-10 w-10 animate-spin text-primary"/>
                            ) : qrCodeUrl ? (
                                <img src={qrCodeUrl} alt="MFA QR Code" width={180} height={180}
                                     onError={(e) => console.error("QR Image Load Error:", e)}/>
                            ) : (
                                <p className="text-xs text-destructive text-center">{t('auth.qrCodeLoadError')}</p>
                            )}
                        </div>
                        <details className="text-xs text-muted-foreground text-center cursor-pointer">
                            <summary>{t('auth.cantScan')}</summary>
                            <p className="mt-2 select-all font-mono bg-muted p-2 rounded break-all">{secret || 'Loading secret...'}</p>
                        </details>
                        <div className="flex gap-2">
                            <Button onClick={() => setMfaStatus('setup_verify')}
                                    className="flex-1">{t('common.next')}</Button>
                            <Button variant="outline" onClick={handleCancelSetup}
                                    className="flex-1">{t('common.cancel')}</Button>
                        </div>
                    </div>
                );
            case 'setup_verify':
                return (
                    <form onSubmit={handleVerifySetupCode} className="space-y-4 rounded-md border p-4">
                        <h4 className="font-medium">{t('auth.twoFactorAuthSetup')} - Step 2/2</h4>
                        <p className="text-sm text-muted-foreground">{t('auth.enterCodeToVerify')}</p>
                        <div className="space-y-2">
                            <Label htmlFor="verificationCodeSetup">{t('common.verificationCode')}</Label>
                            <Input
                                id="verificationCodeSetup" type="text" inputMode="numeric" pattern="[0-9]*"
                                maxLength={6}
                                placeholder="123456" value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                className="text-center text-lg tracking-widest" required autoComplete="one-time-code"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" className="flex-1"
                                    disabled={isVerifying || verificationCode.length !== 6}>
                                {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                {t('common.verifyAndEnable')}
                            </Button>
                            <Button variant="outline" onClick={() => setMfaStatus('setup_qr')}
                                    className="flex-1">{t('common.back')}</Button>
                        </div>
                    </form>
                );
            case 'loading':
                return <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin"/></div>;
            case 'disabled': // Pas besoin d'afficher quoi que ce soit ici car le switch est "off"
            default:
                return null; // Masquer la section si disabled ou état inconnu
        }
    }, [mfaStatus, isLoadingSetup, qrCodeUrl, secret, verificationCode, isVerifying, t, handleCancelSetup, handleVerifySetupCode]); // Dépendances pour useMemo

    return (
        <DashboardLayout pageTitle={t('settings.title')}>
            <div className="space-y-6">
                <Tabs defaultValue="general" className="space-y-6"> {/* Garder General par défaut */}
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general">{t('settings.general')}</TabsTrigger>
                        <TabsTrigger value="notifications">{t('settings.notifications')}</TabsTrigger>
                        {/*<TabsTrigger value="appearance">{t('settings.appearance')}</TabsTrigger>*/}
                        <TabsTrigger value="security">{t('settings.security')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>General Settings</CardTitle>
                                <CardDescription>Manage your general application preferences</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Time & Region</h3>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="timezone">Timezone</Label>
                                            <Select defaultValue="America/New_York">
                                                <SelectTrigger id="timezone">
                                                    <SelectValue placeholder="Select timezone"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                                                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                                                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                                                    <SelectItem value="America/Los_Angeles">Pacific Time
                                                        (PT)</SelectItem>
                                                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="date-format">Date Format</Label>
                                            <Select defaultValue="MM/DD/YYYY">
                                                <SelectTrigger id="date-format">
                                                    <SelectValue placeholder="Select date format"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="currency">Currency</Label>
                                            <Select defaultValue="USD">
                                                <SelectTrigger id="currency">
                                                    <SelectValue placeholder="Select currency"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="USD">USD ($)</SelectItem>
                                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                                    <SelectItem value="GBP">GBP (£)</SelectItem>
                                                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                                                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="number-format">Number Format</Label>
                                            <Select defaultValue="dot">
                                                <SelectTrigger id="number-format">
                                                    <SelectValue placeholder="Select number format"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="dot">1,234.56</SelectItem>
                                                    <SelectItem value="comma">1.234,56</SelectItem>
                                                    <SelectItem value="space">1 234,56</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <Separator/>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Default View Settings</h3>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="default-page">Default Landing Page</Label>
                                            <Select defaultValue="dashboard">
                                                <SelectTrigger id="default-page">
                                                    <SelectValue placeholder="Select default page"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="dashboard">Dashboard</SelectItem>
                                                    <SelectItem value="trades">Trades</SelectItem>
                                                    <SelectItem value="performance">Performance</SelectItem>
                                                    <SelectItem value="watchlists">Watchlists</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="default-period">Default Time Period</Label>
                                            <Select defaultValue="1m">
                                                <SelectTrigger id="default-period">
                                                    <SelectValue placeholder="Select default period"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1d">1 Day</SelectItem>
                                                    <SelectItem value="1w">1 Week</SelectItem>
                                                    <SelectItem value="1m">1 Month</SelectItem>
                                                    <SelectItem value="3m">3 Months</SelectItem>
                                                    <SelectItem value="1y">1 Year</SelectItem>
                                                    <SelectItem value="all">All Time</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <Separator/>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Data Refresh</h3>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="auto-refresh">Auto-Refresh Interval</Label>
                                            <Select defaultValue="5">
                                                <SelectTrigger id="auto-refresh">
                                                    <SelectValue placeholder="Select refresh interval"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">Disabled</SelectItem>
                                                    <SelectItem value="1">1 Minute</SelectItem>
                                                    <SelectItem value="5">5 Minutes</SelectItem>
                                                    <SelectItem value="15">15 Minutes</SelectItem>
                                                    <SelectItem value="30">30 Minutes</SelectItem>
                                                    <SelectItem value="60">1 Hour</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Real-time Market Data</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Enable real-time market data updates
                                            </p>
                                        </div>
                                        <Switch defaultChecked={true}/>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        onClick={() => handleSaveChanges('General')}>{t('common.saveChanges')}</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notifications" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Settings</CardTitle>
                                <CardDescription>Manage how you receive notifications</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Afficher un loader si les préférences chargent */}
                                {isLoadingPrefs && (
                                    <div className="flex justify-center items-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                    </div>
                                )}

                                {!isLoadingPrefs && preferences && ( // Afficher seulement si les préférences sont chargées
                                    <>
                                        {/* --- Section Notification Channels --- */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">{t('settings.notificationChannels')}</h3>
                                            {/* Email Notifications */}
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="email-notifications">{t('settings.emailNotifications')}</Label>
                                                    <p className="text-sm text-muted-foreground">{t('settings.emailNotificationsDesc')}</p>
                                                </div>
                                                <Switch
                                                    id="email-notifications"
                                                    checked={preferences?.emailNotificationsEnabled ?? true}
                                                    onCheckedChange={(checked) => handleGenericPreferenceChange('emailNotificationsEnabled', checked)}
                                                    disabled={isLoadingPrefs}
                                                />
                                            </div>

                                            {/* Mobile Notifications */}
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="mobile-notifications">{t('settings.mobileNotifications')}</Label>
                                                    <p className="text-sm text-muted-foreground">{t('settings.mobileNotificationsDesc')}</p>
                                                </div>
                                                <Switch
                                                    id="mobile-notifications"
                                                    checked={preferences?.mobilePushNotificationsEnabled ?? true}
                                                    onCheckedChange={(checked) => handleGenericPreferenceChange('mobilePushNotificationsEnabled', checked)}
                                                    disabled={isLoadingPrefs}
                                                />
                                            </div>

                                            {/* Browser Notifications */}
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="browser-notifications">{t('settings.browserNotifications')}</Label>
                                                    <p className="text-sm text-muted-foreground">{t('settings.browserNotificationsDesc')}</p>
                                                </div>
                                                <Switch
                                                    id="browser-notifications"
                                                    checked={preferences?.browserPushNotificationsEnabled ?? true}
                                                    onCheckedChange={(checked) => handleGenericPreferenceChange('browserPushNotificationsEnabled', checked)}
                                                    disabled={isLoadingPrefs}
                                                />
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* --- Section Notification Types --- */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">{t('settings.notificationTypes')}</h3>
                                            {/* Price Alerts */}
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="price-alerts">{t('settings.priceAlerts')}</Label>
                                                    <p className="text-sm text-muted-foreground">{t('settings.priceAlertsDesc')}</p>
                                                </div>
                                                <Switch
                                                    id="price-alerts"
                                                    checked={preferences?.priceAlertsEnabled ?? true}
                                                    onCheckedChange={(checked) => handleGenericPreferenceChange('priceAlertsEnabled', checked)}
                                                    disabled={isLoadingPrefs}
                                                />
                                            </div>

                                            {/* Trade Confirmations */}
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="trade-confirmations">{t('settings.tradeConfirmations')}</Label>
                                                    <p className="text-sm text-muted-foreground">{t('settings.tradeConfirmationsDesc')}</p>
                                                </div>
                                                <Switch
                                                    id="trade-confirmations"
                                                    checked={preferences?.tradeConfirmationsEnabled ?? true}
                                                    onCheckedChange={(checked) => handleGenericPreferenceChange('tradeConfirmationsEnabled', checked)}
                                                    disabled={isLoadingPrefs}
                                                />
                                            </div>

                                            {/* News Alerts */}
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="news-alerts">{t('settings.newsAlerts')}</Label>
                                                    <p className="text-sm text-muted-foreground">{t('settings.newsAlertsDesc')}</p>
                                                </div>
                                                <Switch
                                                    id="news-alerts"
                                                    checked={preferences?.newsAlertsEnabled ?? false} // Peut-être false par défaut
                                                    onCheckedChange={(checked) => handleGenericPreferenceChange('newsAlertsEnabled', checked)}
                                                    disabled={isLoadingPrefs}
                                                />
                                            </div>

                                            {/* Earnings Announcements */}
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="earnings-announcements">{t('settings.earningsAnnouncements')}</Label>
                                                    <p className="text-sm text-muted-foreground">{t('settings.earningsAnnouncementsDesc')}</p>
                                                </div>
                                                <Switch
                                                    id="earnings-announcements"
                                                    checked={preferences?.earningsAnnouncementsEnabled ?? true}
                                                    onCheckedChange={(checked) => handleGenericPreferenceChange('earningsAnnouncementsEnabled', checked)}
                                                    disabled={isLoadingPrefs}
                                                />
                                            </div>

                                            {/* Account Activity */}
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="account-activity">{t('settings.accountActivity')}</Label>
                                                    <p className="text-sm text-muted-foreground">{t('settings.accountActivityDesc')}</p>
                                                </div>
                                                <Switch
                                                    id="account-activity"
                                                    checked={preferences?.accountActivityNotificationsEnabled ?? true}
                                                    onCheckedChange={(checked) => handleGenericPreferenceChange('accountActivityNotificationsEnabled', checked)}
                                                    disabled={isLoadingPrefs}
                                                />
                                            </div>
                                        </div>

                                        {/* --- Bouton Sauvegarder --- */}
                                        <div className="flex justify-end">
                                            <Button onClick={() => handleSaveChanges('Notifications')} disabled={isLoadingPrefs}>
                                                {isLoadingPrefs ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                                {t('common.saveChanges')}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('settings.securityTitle')}</CardTitle>
                                <CardDescription>{t('settings.securityDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Section Authentification */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">{t('settings.authentication')}</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">{t('common.emailAddress')}</Label>
                                        <Input id="email" value={user?.email || ''} readOnly disabled/>
                                    </div>

                                    {/* --- Section MFA Intégrée --- */}
                                    <div className="flex items-center justify-between pt-4">
                                        <div className="space-y-0.5">
                                            <Label
                                                htmlFor="two-factor-auth-switch">{t('settings.twoFactorAuth')}</Label>
                                            <p className="text-sm text-muted-foreground">{t('settings.twoFactorAuthDesc')}</p>
                                        </div>
                                        {mfaStatus === 'loading' ? (<Loader2 className="h-5 w-5 animate-spin"/>)
                                            : (
                                                <Switch
                                                    id="two-factor-auth-switch"
                                                    checked={mfaStatus === 'enabled' || mfaStatus === 'setup_qr' || mfaStatus === 'setup_verify'}
                                                    onCheckedChange={(checked) => {
                                                        console.log(`Switch changed to ${checked}, current status: ${mfaStatus}`);
                                                        if (checked && mfaStatus === 'disabled') {
                                                            handleStartSetup(); // Appel correct
                                                        } else if (!checked && mfaStatus === 'enabled') {
                                                            setShowDisableConfirm(true); // Appel correct
                                                        } else if (!checked && (mfaStatus === 'setup_qr' || mfaStatus === 'setup_verify')) {
                                                            handleCancelSetup(); // Appel correct
                                                        }
                                                    }}
                                                    disabled={isAuthLoading || isLoadingSetup || isDisabling}
                                                    aria-label={t('settings.twoFactorAuth')}
                                                />
                                            )}
                                    </div>

                                    {/* Affichage conditionnel rendu par useMemo */}
                                    <div
                                        className={`pl-2 mt-4 space-y-4 ${mfaStatus !== 'disabled' && mfaStatus !== 'loading' ? 'border-l-2 border-border ml-1' : ''}`}>
                                        {mfaSectionContent} {/* Utilisation du contenu mémorisé */}
                                    </div>


                                    {/* Fin Section MFA Intégrée --- */}

                                    {/* Bouton Changer Mot de Passe (conservé) */}
                                    <div className="pt-4">
                                        <Button variant="outline" className="w-full sm:w-auto"
                                                onClick={() => setChangePasswordOpen(true)} disabled={isAuthLoading}>
                                            {t('settings.changePassword')}
                                        </Button>
                                    </div>
                                </div>

                                <Separator/>

                                {/* Section Session Security (conservée) */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Session Security</h3>

                                    {/* Auto Logout (Switch lié à la logique d'idle timer, pas directement à une pref) */}
                                    {/* Pour l'instant, on peut juste l'afficher comme info */}
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Auto Logout</Label>
                                            <p className="text-sm text-muted-foreground">
                                                {preferences?.inactivityTimeoutMinutes && preferences.inactivityTimeoutMinutes > 0
                                                    ? `Enabled (${preferences.inactivityTimeoutMinutes} minutes)`
                                                    : "Disabled"}
                                            </p>
                                        </div>
                                        {/* Le switch ici serait redondant si contrôlé par le timeout */}
                                        {/* <Switch defaultChecked={true} /> */}
                                    </div>

                                    {/* Inactivity Timeout (Connecté à l'état 'preferences') */}
                                    <div className="space-y-2">
                                        <Label htmlFor="timeout">Inactivity Timeout</Label>
                                        <Select
                                            value={preferences?.inactivityTimeoutMinutes?.toString() ?? '0'} // Utiliser '0' pour "Disabled"
                                            onValueChange={(value) => handlePreferenceChange('inactivityTimeoutMinutes', value)}
                                            disabled={isLoadingPrefs}
                                        >
                                            <SelectTrigger id="timeout">
                                                <SelectValue placeholder="Select timeout period"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0">Disabled</SelectItem> {/* Option Désactivé */}
                                                <SelectItem value="5">5 minutes</SelectItem>
                                                <SelectItem value="15">15 minutes</SelectItem>
                                                <SelectItem value="30">30 minutes</SelectItem>
                                                <SelectItem value="60">1 hour</SelectItem>
                                                <SelectItem value="120">2 hours</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Require Password for Trades</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Require password confirmation for trade actions
                                            </p>
                                        </div>
                                        <Switch defaultChecked={true}
                                            // TODO: Connecter à une préférence utilisateur
                                            // checked={preferences?.requirePasswordForTrades ?? true}
                                            // onCheckedChange={(checked) => handlePreferenceChange('requirePasswordForTrades', checked)}
                                                disabled={isLoadingPrefs}
                                        />
                                    </div>

                                    {/* Bouton de sauvegarde spécifique à cette section */}
                                    <div className="flex justify-end pt-4">
                                        <Button onClick={() => handleSaveChanges('Session')} disabled={isLoadingPrefs}>
                                            {isLoadingPrefs ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                            Save Session Settings
                                        </Button>
                                    </div>
                                </div>

                                <Separator/>

                                {/* --- Section des appareils (maintenant via TrustedDevicesManager) --- */}
                                {/* Si TrustedDevicesManager gère aussi le bouton "Logout All Other Devices",
                            vous n'aurez peut-être pas besoin du bouton séparé ci-dessous.
                            Vérifiez ce que fait TrustedDevicesManager.
                            Pour l'instant, je garde le bouton ici pour le connecter. */}
                                <TrustedDevicesManager/>

                                {/* Pas de bouton Save Changes global pour l'onglet Sécurité */}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <ChangePasswordDialog
                open={changePasswordOpen}
                onOpenChange={setChangePasswordOpen}
            />

            {/* Dialogue de confirmation pour déconnecter les autres appareils (conservé) */}
            <ConfirmLogoutDialog
                open={logoutAllDevicesOpen}
                onOpenChange={setLogoutAllDevicesOpen}
            />

            {/* Dialogue de confirmation pour désactiver MFA (ajouté ici) */}
            <Dialog open={showDisableConfirm} onOpenChange={setShowDisableConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('auth.confirmDisableMfaTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('auth.confirmDisableMfaDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <Label htmlFor="passwordConfirmDisable">{t('common.currentPassword')}</Label>
                        <Input
                            id="passwordConfirmDisable"
                            type="password"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            placeholder={t('settings.enterPasswordPlaceholder')} // Traduire
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowDisableConfirm(false);
                            setPasswordConfirm('');
                        }}>{t('common.cancel')}</Button>
                        <Button variant="destructive" onClick={handleConfirmDisable}
                                disabled={isDisabling || !passwordConfirm}>
                            {isDisabling ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {t('auth.disableMFA')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AlertDialog for session revocation confirmation */}
            <AlertDialog open={revokeSessionId !== null} onOpenChange={(open) => { if (!open) setRevokeSessionId(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('settings.revokeSessionTitle', 'Revoke Session')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('settings.revokeSessionDescription', 'Are you sure you want to revoke this session? You might be logged out if it\'s your current session.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => revokeSessionId && handleRevokeSession(revokeSessionId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {t('settings.revokeSession', 'Revoke')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
};

export default Settings;