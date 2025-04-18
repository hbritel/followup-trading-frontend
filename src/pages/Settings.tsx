// src/pages/Settings.tsx

import React, {useCallback, useEffect, useMemo, useState} from 'react'; // Ajout React et useCallback
import DashboardLayout from '@/components/layout/DashboardLayout';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Switch} from '@/components/ui/switch';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Separator} from '@/components/ui/separator';
import {Badge} from '@/components/ui/badge';
import {useToast} from '@/components/ui/use-toast'; // Utiliser le hook shadcn/ui standard
import ChangePasswordDialog from '@/components/dialogs/ChangePasswordDialog';
import ConfirmLogoutDialog from '@/components/dialogs/ConfirmLogoutDialog'; // Gardé pour l'instant
import {useTheme} from '@/components/providers/theme-provider';
import {useTranslation} from 'react-i18next'; // Ajouter i18n
// Imports nécessaires pour MFA
import {useAuth} from '@/contexts/auth-context';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Loader2, ShieldCheck} from 'lucide-react';
import {authService} from '@/services/auth.service';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

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
        setQrCodeUrl(''); setSecret(''); // Reset
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
            toast({ title: t('error.error'), description: errorMessage, variant: 'destructive' });
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
            toast({ title: t('success.success'), description: t('auth.mfaSetupVerified') });
            setVerificationCode(''); // Reset field
        } catch (error) {
            console.error("Error in handleVerifySetupCode:", error);
            const errorMessage = authService.getErrorMessage(error);
            toast({ title: t('auth.verificationFailedTitle'), description: errorMessage, variant: 'destructive' });
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
            toast({ title: t('success.success'), description: t('auth.mfaDisabledSuccess') });
            setShowDisableConfirm(false);
            setPasswordConfirm('');
        } catch (error) {
            console.error("Error in handleConfirmDisable:", error);
            const errorMessage = authService.getErrorMessage(error);
            toast({ title: t('auth.mfaDisableFailed'), description: errorMessage, variant: 'destructive' });
        } finally {
            setIsDisabling(false);
        }
    }, [passwordConfirm, mfaStatus, toast, t, user, disableMfa]); // Ajouter disableMfa
    // --- Fin Fonctions MFA ---


    // --- Fonctions existantes (conservées) ---
    const toggleDarkMode = (checked: boolean) => {
        setTheme(checked ? 'dark' : 'light');
        toast({
            title: checked ? "Dark mode enabled" : "Light mode enabled",
            description: "Your preference has been saved.",
        });
    };

    const handleSaveChanges = (section: string) => {
        // Logique de sauvegarde spécifique à chaque section (non MFA)
        toast({
            title: `${section} settings saved`,
            description: "Your changes have been saved successfully.",
        });
    };
    // --- Fin Fonctions existantes ---

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
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="general">{t('settings.general')}</TabsTrigger>
                        <TabsTrigger value="notifications">{t('settings.notifications')}</TabsTrigger>
                        <TabsTrigger value="appearance">{t('settings.appearance')}</TabsTrigger>
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
                                    <Button onClick={() => handleSaveChanges('General')}>{t('common.saveChanges')}</Button>
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
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Notification Channels</h3>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Email Notifications</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive notifications via email
                                            </p>
                                        </div>
                                        <Switch
                                            checked={emailNotifications}
                                            onCheckedChange={setEmailNotifications}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Mobile Notifications</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive push notifications on your mobile device
                                            </p>
                                        </div>
                                        <Switch
                                            checked={mobileNotifications}
                                            onCheckedChange={setMobileNotifications}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Browser Notifications</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive notifications in your browser
                                            </p>
                                        </div>
                                        <Switch defaultChecked={true}/>
                                    </div>
                                </div>

                                <Separator/>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Notification Types</h3>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Price Alerts</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Get notified when price targets are hit
                                            </p>
                                        </div>
                                        <Switch
                                            checked={alertsEnabled}
                                            onCheckedChange={setAlertsEnabled}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Trade Confirmations</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Get notified about trade executions
                                            </p>
                                        </div>
                                        <Switch
                                            checked={tradeConfirmations}
                                            onCheckedChange={setTradeConfirmations}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>News Alerts</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Get notified about market news for watched securities
                                            </p>
                                        </div>
                                        <Switch defaultChecked={false}/>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Earnings Announcements</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Get notified about upcoming earnings reports
                                            </p>
                                        </div>
                                        <Switch defaultChecked={true}/>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Account Activity</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Get notified about login attempts and account changes
                                            </p>
                                        </div>
                                        <Switch defaultChecked={true}/>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={() => handleSaveChanges('Notifications')}>{t('common.saveChanges')}</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="appearance" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Appearance Settings</CardTitle>
                                <CardDescription>Customize the look and feel of your dashboard</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Theme</h3>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Dark Mode</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Switch between light and dark theme
                                            </p>
                                        </div>
                                        <Switch
                                            checked={theme === 'dark'}
                                            onCheckedChange={toggleDarkMode}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="theme-color">Accent Color</Label>
                                            <Select defaultValue="blue">
                                                <SelectTrigger id="theme-color">
                                                    <SelectValue placeholder="Select color theme"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="blue">Blue</SelectItem>
                                                    <SelectItem value="green">Green</SelectItem>
                                                    <SelectItem value="purple">Purple</SelectItem>
                                                    <SelectItem value="orange">Orange</SelectItem>
                                                    <SelectItem value="red">Red</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="font-size">Font Size</Label>
                                            <Select defaultValue="medium">
                                                <SelectTrigger id="font-size">
                                                    <SelectValue placeholder="Select font size"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="small">Small</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="large">Large</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="layout-density">Layout Density</Label>
                                            <Select defaultValue="comfortable">
                                                <SelectTrigger id="layout-density">
                                                    <SelectValue placeholder="Select layout density"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="compact">Compact</SelectItem>
                                                    <SelectItem value="comfortable">Comfortable</SelectItem>
                                                    <SelectItem value="spacious">Spacious</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <Separator/>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Chart Preferences</h3>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="chart-style">Default Chart Style</Label>
                                            <Select defaultValue="candle">
                                                <SelectTrigger id="chart-style">
                                                    <SelectValue placeholder="Select chart style"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="candle">Candlestick</SelectItem>
                                                    <SelectItem value="bar">OHLC Bars</SelectItem>
                                                    <SelectItem value="line">Line</SelectItem>
                                                    <SelectItem value="area">Area</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="chart-interval">Default Chart Interval</Label>
                                            <Select defaultValue="D">
                                                <SelectTrigger id="chart-interval">
                                                    <SelectValue placeholder="Select chart interval"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">1 Minute</SelectItem>
                                                    <SelectItem value="5">5 Minutes</SelectItem>
                                                    <SelectItem value="15">15 Minutes</SelectItem>
                                                    <SelectItem value="60">1 Hour</SelectItem>
                                                    <SelectItem value="D">Daily</SelectItem>
                                                    <SelectItem value="W">Weekly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Show Volume</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Display volume bars on charts
                                            </p>
                                        </div>
                                        <Switch defaultChecked={true}/>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Show Extended Hours</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Display pre-market and after-hours data
                                            </p>
                                        </div>
                                        <Switch defaultChecked={true}/>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={() => handleSaveChanges('Appearance')}>{t('common.saveChanges')}</Button>
                                </div>
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

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Auto Logout</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Automatically log out after period of inactivity
                                            </p>
                                        </div>
                                        <Switch defaultChecked={true}/>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="timeout">Inactivity Timeout</Label>
                                        <Select defaultValue="30">
                                            <SelectTrigger id="timeout">
                                                <SelectValue placeholder="Select timeout period"/>
                                            </SelectTrigger>
                                            <SelectContent>
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
                                        <Switch defaultChecked={true}/>
                                    </div>
                                </div>

                                <Separator/>

                                {/* Section Device Management (conservée) */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Device Management</h3>

                                    <div className="rounded-md border p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium">Current Device</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Chrome on Windows • IP: 192.168.1.1
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Last active: Just now
                                                </p>
                                            </div>
                                            <Badge>Current</Badge>
                                        </div>
                                    </div>

                                    <div className="rounded-md border p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium">iPhone 13</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Safari on iOS • IP: 192.168.1.2
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Last active: 2 hours ago
                                                </p>
                                            </div>
                                            <Button variant="outline" size="sm">Revoke</Button>
                                        </div>
                                    </div>

                                    <div className="rounded-md border p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium">MacBook Pro</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Safari on macOS • IP: 192.168.1.3
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Last active: Yesterday
                                                </p>
                                            </div>
                                            <Button variant="outline" size="sm">Revoke</Button>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setLogoutAllDevicesOpen(true)} // Garder ce bouton
                                        disabled={isAuthLoading}
                                    >
                                        {t('settings.logoutOtherDevices')}
                                    </Button>
                                </div>

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
        </DashboardLayout>
    );
};

export default Settings;