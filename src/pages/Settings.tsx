// src/pages/Settings.tsx

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {usePreferences} from '@/contexts/preferences-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Switch} from '@/components/ui/switch';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {useToast} from '@/hooks/use-toast';
import ChangePasswordDialog from '@/components/dialogs/ChangePasswordDialog';
import ConfirmLogoutDialog from '@/components/dialogs/ConfirmLogoutDialog';
import type {Theme} from '@/components/providers/theme-provider';
import {useTheme} from '@/components/providers/theme-provider';
import {useTranslation} from 'react-i18next';
import {useAuth} from '@/contexts/auth-context';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {
    Activity,
    BarChart3,
    Bell,
    BellRing,
    Brain,
    CreditCard,
    Globe,
    Laptop,
    Loader2,
    Mail,
    Monitor,
    Newspaper,
    Palette,
    Shield,
    ShieldCheck,
    Smartphone,
    Tag,
    Target,
    Timer,
    TrendingUp,
    User,
    Settings as SettingsIcon,
    KeyRound,
    Lock,
} from 'lucide-react';
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

import TagsSection from "@/components/settings/TagsSection";
import NotificationPreferences from "@/components/notifications/NotificationPreferences";
import PublicProfileSettings from "@/components/settings/PublicProfileSettings";
import UsageDashboard from "@/components/subscription/UsageDashboard";
import AiMessagePackPicker from "@/components/ai/AiMessagePackPicker";
import AiProviderSettings from "@/components/settings/AiProviderSettings";
import MentorInstanceSettings from "@/components/settings/MentorInstanceSettings";
import MyMentorSettings from "@/components/settings/MyMentorSettings";
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import { useMyMentorInstance } from '@/hooks/useMentor';
import { Users as UsersIcon, GraduationCap } from 'lucide-react';

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
        return <Monitor className="h-5 w-5 mr-2 text-muted-foreground"/>;
    }
    return <Monitor className="h-5 w-5 mr-2 text-muted-foreground"/>;
};

// Helper pour formater la date de manière lisible
const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
        return format(new Date(dateString), "PPpp");
    } catch {
        return dateString;
    }
}

const Settings = () => {
    const {t} = useTranslation();
    const {toast} = useToast();
    const {theme, setTheme} = useTheme();

    // --- États NON-MFA ---
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [logoutAllDevicesOpen, setLogoutAllDevicesOpen] = useState(false);

    // --- États MFA ---
    const {user, isLoading: isAuthLoading, confirmMfaSetup, disableMfa} = useAuth();
    const { hasPlan } = useFeatureFlags();
    const { data: myMentorInstance } = useMyMentorInstance();
    const isTeamPlan = hasPlan('TEAM');
    const isInMentorInstance = !!myMentorInstance;
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isLoadingSetup, setIsLoadingSetup] = useState(false);
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showDisableConfirm, setShowDisableConfirm] = useState(false);
    const [isDisabling, setIsDisabling] = useState(false);
    const [mfaStatus, setMfaStatus] = useState<'loading' | 'disabled' | 'setup_qr' | 'setup_verify' | 'enabled'>('loading');

    const {preferences, isLoadingPrefs, setPreference, savePreferences} = usePreferences();

    // --- États pour Device Management ---
    const [sessions, setSessions] = useState<SessionDto[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [errorSessions, setErrorSessions] = useState<string | null>(null);

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
            } finally {
                setIsLoadingSessions(false);
            }
        };

        if (user) {
            fetchSessions();
        } else {
            setSessions([]);
        }
    }, [user]);

    const [revokeSessionId, setRevokeSessionId] = useState<string | null>(null);

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

    const handlePreferenceChange = <K extends keyof UserPreferencesDto>(
        key: K,
        value: UserPreferencesDto[K] | string
    ) => {
        let finalValue: UserPreferencesDto[K] | null;

        if (key === 'inactivityTimeoutMinutes') {
            const numValue = parseInt(value as string, 10);
            const timeoutValue = (!isNaN(numValue) && numValue > 0) ? numValue : null;
            finalValue = timeoutValue as UserPreferencesDto[K];
        } else if (key === 'theme') {
            const validTheme = ['light', 'dark', 'system'].includes(value as string) ? value as Theme : 'system';
            setTheme(validTheme);
            finalValue = validTheme as UserPreferencesDto[K];
        } else {
            if (typeof value === 'boolean' && (key === 'showChartVolume' || key === 'showExtendedHours')) {
                finalValue = value as UserPreferencesDto[K];
            } else if (typeof value === 'string') {
                finalValue = value as UserPreferencesDto[K];
            } else {
                console.warn(`Unhandled type for key ${String(key)} in handlePreferenceChange`);
                return;
            }
        }

        console.log(`Updating preference ${String(key)} to`, finalValue);
        setPreference(key, finalValue);
    };

    const handleGenericPreferenceChange = useCallback(<K extends keyof UserPreferencesDto>(
        key: K,
        value: UserPreferencesDto[K]
    ) => {
        setPreference(key, value);
    }, [setPreference]);

    // --- Fonctions MFA ---
    useEffect(() => {
        console.log(`useEffect[user, isAuthLoading] fired. isAuthLoading: ${isAuthLoading}, user?.mfaEnabled: ${user?.mfaEnabled}, current mfaStatus: ${mfaStatus}`);
        if (isAuthLoading) {
            setMfaStatus('loading');
        } else if (user && mfaStatus !== 'setup_qr' && mfaStatus !== 'setup_verify') {
            setMfaStatus(user.mfaEnabled ? 'enabled' : 'disabled');
            if (user.mfaEnabled) {
                setQrCodeUrl('');
                setSecret('');
                setVerificationCode('');
            }
        } else if (!user && !isAuthLoading) {
            setMfaStatus('disabled');
        }
    }, [user, isAuthLoading]);

    const handleStartSetup = useCallback(async () => {
        if (mfaStatus !== 'disabled' || !user) return;
        setIsLoadingSetup(true);
        setQrCodeUrl('');
        setSecret('');
        try {
            const response = await authService.initMfaSetup(user.id);
            setQrCodeUrl(response.qrCodeUri);
            setSecret(response.secret);
            setMfaStatus('setup_qr');
        } catch (error) {
            console.error("Error in handleStartSetup:", error);
            const errorMessage = authService.getErrorMessage(error);
            toast({title: t('error.error'), description: errorMessage, variant: 'destructive'});
            setMfaStatus('disabled');
        } finally {
            setIsLoadingSetup(false);
        }
    }, [mfaStatus, toast, t, user]);

    const handleCancelSetup = useCallback(() => {
        setMfaStatus('disabled');
        setQrCodeUrl('');
        setSecret('');
        setVerificationCode('');
    }, []);

    const handleVerifySetupCode = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!user || mfaStatus !== 'setup_verify') return;

        setIsVerifying(true);
        try {
            await confirmMfaSetup(user.id, verificationCode);
            setMfaStatus('enabled');
            toast({title: t('success.success'), description: t('auth.mfaSetupVerified')});
            setVerificationCode('');
        } catch (error) {
            console.error("Error in handleVerifySetupCode:", error);
            const errorMessage = authService.getErrorMessage(error);
            toast({title: t('auth.verificationFailedTitle'), description: errorMessage, variant: 'destructive'});
        } finally {
            setIsVerifying(false);
        }
    }, [user, verificationCode, mfaStatus, toast, t, confirmMfaSetup]);

    const handleConfirmDisable = useCallback(async () => {
        if (mfaStatus !== 'enabled' || !passwordConfirm || !user) return;

        setIsDisabling(true);
        try {
            await disableMfa(passwordConfirm);
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
    }, [passwordConfirm, mfaStatus, toast, t, user, disableMfa]);

    const handleSaveChanges = async (section: string) => {
        try {
            await savePreferences();
            toast({
                title: `${section} settings saved`,
                description: "Your changes have been saved successfully.",
            });
        } catch (error) {
            const errorMessage = authService.getErrorMessage(error);
            toast({title: "Error Saving Settings", description: errorMessage, variant: "destructive"});
        }
    };

    // --- Memoisation pour le rendu MFA ---
    const mfaSectionContent = useMemo(() => {
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
                    <div className="space-y-4 rounded-xl border border-border/50 p-4 bg-muted/30">
                        <h4 className="font-medium">{t('auth.twoFactorAuthSetup')} - Step 1/2</h4>
                        <p className="text-sm text-muted-foreground">{t('auth.scanInstruction')}</p>
                        <div
                            className="flex justify-center items-center p-4 bg-white rounded-lg border max-w-xs mx-auto min-h-[212px]">
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
                    <form onSubmit={handleVerifySetupCode} className="space-y-4 rounded-xl border border-border/50 p-4 bg-muted/30">
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
            case 'disabled':
            default:
                return null;
        }
    }, [mfaStatus, isLoadingSetup, qrCodeUrl, secret, verificationCode, isVerifying, t, handleCancelSetup, handleVerifySetupCode]);

    return (
        <DashboardLayout pageTitle={t('settings.title')}>
            <div className="space-y-6">
                <Tabs defaultValue="general" className="space-y-6">
                    <TabsList className="inline-flex h-auto flex-wrap gap-1 bg-muted/50 p-1 rounded-xl">
                        <TabsTrigger value="general" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2">
                            <SettingsIcon className="h-4 w-4" />
                            {t('settings.general')}
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2">
                            <Bell className="h-4 w-4" />
                            {t('settings.notifications')}
                        </TabsTrigger>
                        <TabsTrigger value="security" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2">
                            <Shield className="h-4 w-4" />
                            {t('settings.security')}
                        </TabsTrigger>
                        <TabsTrigger value="tags" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2">
                            <Tag className="h-4 w-4" />
                            {t("settings.tags", "Tags")}
                        </TabsTrigger>
                        <TabsTrigger value="public-profile" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2">
                            <User className="h-4 w-4" />
                            {t("gamification.publicProfile", "Public Profile")}
                        </TabsTrigger>
                        <TabsTrigger value="billing" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2">
                            <CreditCard className="h-4 w-4" />
                            {t("subscription.manageBilling", "Billing")}
                        </TabsTrigger>
                        <TabsTrigger value="ai-provider" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2">
                            <Brain className="h-4 w-4" />
                            {t("settings.aiProvider", "AI Provider")}
                        </TabsTrigger>
                        {isTeamPlan && (
                            <TabsTrigger value="mentor" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2">
                                <UsersIcon className="h-4 w-4" />
                                {t("settings.mentor", "Mentor")}
                            </TabsTrigger>
                        )}
                        {isInMentorInstance && (
                            <TabsTrigger value="my-mentor" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2">
                                <GraduationCap className="h-4 w-4" />
                                {t("settings.myMentor", "My Mentor")}
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* ========== GENERAL TAB ========== */}
                    <TabsContent value="general" className="space-y-6">
                        {isLoadingPrefs && (
                            <div className="flex justify-center items-center py-16">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        )}

                        {!isLoadingPrefs && preferences && (
                            <>
                                {/* Time & Region */}
                                <div className="glass-card rounded-2xl p-6 space-y-5">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <Globe className="h-4.5 w-4.5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold">{t('settings.timeRegion', 'Time & Region')}</h3>
                                            <p className="text-sm text-muted-foreground">{t('settings.timeRegionDesc', 'Configure timezone, date format, and currency for your trading data')}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="timezone">{t('settings.timezone', 'Timezone')}</Label>
                                            <Select
                                                value={preferences?.timezone || 'America/New_York'}
                                                onValueChange={(value) => handleGenericPreferenceChange('timezone', value)}
                                                disabled={isLoadingPrefs}
                                            >
                                                <SelectTrigger id="timezone">
                                                    <SelectValue placeholder="Select timezone"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                                                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                                                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                                                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                                                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                                                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                                                    <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                                                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                                                    <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                                                    <SelectItem value="Asia/Kolkata">Kolkata (IST)</SelectItem>
                                                    <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
                                                    <SelectItem value="Pacific/Auckland">Auckland (NZST)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="date-format">{t('settings.dateFormat', 'Date Format')}</Label>
                                            <Select
                                                value={preferences?.dateFormat || 'MM/dd/yyyy'}
                                                onValueChange={(value) => handleGenericPreferenceChange('dateFormat', value)}
                                                disabled={isLoadingPrefs}
                                            >
                                                <SelectTrigger id="date-format">
                                                    <SelectValue placeholder="Select date format"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                                                    <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                                                    <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="currency">{t('settings.currency', 'Currency')}</Label>
                                            <Select
                                                value={preferences?.defaultCurrency || 'USD'}
                                                onValueChange={(value) => handleGenericPreferenceChange('defaultCurrency', value)}
                                                disabled={isLoadingPrefs}
                                            >
                                                <SelectTrigger id="currency">
                                                    <SelectValue placeholder="Select currency"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="USD">USD ($)</SelectItem>
                                                    <SelectItem value="EUR">EUR (&euro;)</SelectItem>
                                                    <SelectItem value="GBP">GBP (&pound;)</SelectItem>
                                                    <SelectItem value="JPY">JPY (&yen;)</SelectItem>
                                                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                                                    <SelectItem value="CHF">CHF</SelectItem>
                                                    <SelectItem value="AUD">AUD (A$)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="number-format">{t('settings.numberFormat', 'Number Format')}</Label>
                                            <Select
                                                value={preferences?.numberFormat || '1,234.56'}
                                                onValueChange={(value) => handleGenericPreferenceChange('numberFormat', value)}
                                                disabled={isLoadingPrefs}
                                            >
                                                <SelectTrigger id="number-format">
                                                    <SelectValue placeholder="Select number format"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1,234.56">1,234.56</SelectItem>
                                                    <SelectItem value="1.234,56">1.234,56</SelectItem>
                                                    <SelectItem value="1 234,56">1 234,56</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Default View Settings */}
                                <div className="glass-card rounded-2xl p-6 space-y-5">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                            <Palette className="h-4.5 w-4.5 text-blue-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold">{t('settings.defaultViews', 'Default Views')}</h3>
                                            <p className="text-sm text-muted-foreground">{t('settings.defaultViewsDesc', 'Set default time period and display options across the dashboard')}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="default-period">{t('settings.defaultTimePeriod', 'Default Time Period')}</Label>
                                        <Select
                                            value={preferences?.defaultDateRange || '1m'}
                                            onValueChange={(value) => handleGenericPreferenceChange('defaultDateRange', value)}
                                            disabled={isLoadingPrefs}
                                        >
                                            <SelectTrigger id="default-period" className="sm:max-w-xs">
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

                                {/* Save button */}
                                <div className="flex justify-end">
                                    <Button onClick={() => handleSaveChanges('General')} disabled={isLoadingPrefs}>
                                        {isLoadingPrefs ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                        {t('common.saveChanges')}
                                    </Button>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    {/* ========== NOTIFICATIONS TAB ========== */}
                    <TabsContent value="notifications" className="space-y-6">
                        {isLoadingPrefs && (
                            <div className="flex justify-center items-center py-16">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        )}

                        {!isLoadingPrefs && preferences && (
                            <>
                                {/* Notification Channels */}
                                <div className="glass-card rounded-2xl p-6 space-y-5">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <BellRing className="h-4.5 w-4.5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold">{t('settings.notificationChannels', 'Notification Channels')}</h3>
                                            <p className="text-sm text-muted-foreground">{t('settings.notificationChannelsDesc', 'Choose how you want to receive notifications')}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Bell className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{t('settings.showNotificationBadge', 'Show Notification Badge')}</p>
                                                    <p className="text-xs text-muted-foreground">{t('settings.showNotificationBadgeDesc', 'Display unread count on the notification bell icon')}</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={preferences?.showNotificationBadge !== false}
                                                onCheckedChange={(checked) => handleGenericPreferenceChange('showNotificationBadge', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{t('settings.emailNotifications', 'Email Notifications')}</p>
                                                    <p className="text-xs text-muted-foreground">{t('settings.emailNotificationsDesc', 'Receive updates and alerts via email')}</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={preferences?.emailNotificationsEnabled ?? true}
                                                onCheckedChange={(checked) => handleGenericPreferenceChange('emailNotificationsEnabled', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Smartphone className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{t('settings.mobilePush', 'Mobile Push Notifications')}</p>
                                                    <p className="text-xs text-muted-foreground">{t('settings.mobilePushDesc', 'Get push notifications on your mobile device')}</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={preferences?.mobilePushNotificationsEnabled ?? false}
                                                onCheckedChange={(checked) => handleGenericPreferenceChange('mobilePushNotificationsEnabled', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Monitor className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{t('settings.browserPush', 'Browser Push Notifications')}</p>
                                                    <p className="text-xs text-muted-foreground">{t('settings.browserPushDesc', 'Show desktop notifications in your browser')}</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={preferences?.browserPushNotificationsEnabled ?? false}
                                                onCheckedChange={(checked) => handleGenericPreferenceChange('browserPushNotificationsEnabled', checked)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Notification Categories */}
                                <div className="glass-card rounded-2xl p-6 space-y-5">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                            <Bell className="h-4.5 w-4.5 text-amber-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold">{t('settings.notificationCategories', 'Notification Categories')}</h3>
                                            <p className="text-sm text-muted-foreground">{t('settings.notificationCategoriesDesc', 'Enable or disable specific types of notifications')}</p>
                                        </div>
                                    </div>

                                    {/* Trading */}
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 mb-2">{t('settings.trading', 'Trading')}</p>
                                        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{t('settings.priceAlerts', 'Price Alerts')}</p>
                                                    <p className="text-xs text-muted-foreground">{t('settings.priceAlertsDesc', 'Get notified when prices hit your target levels')}</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={preferences?.priceAlertsEnabled ?? true}
                                                onCheckedChange={(checked) => handleGenericPreferenceChange('priceAlertsEnabled', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Target className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{t('settings.tradeConfirmations', 'Trade Confirmations')}</p>
                                                    <p className="text-xs text-muted-foreground">{t('settings.tradeConfirmationsDesc', 'Confirm when trades are imported or executed')}</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={preferences?.tradeConfirmationsEnabled ?? true}
                                                onCheckedChange={(checked) => handleGenericPreferenceChange('tradeConfirmationsEnabled', checked)}
                                            />
                                        </div>
                                    </div>

                                    {/* Market */}
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 mb-2">{t('settings.market', 'Market')}</p>
                                        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Newspaper className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{t('settings.newsAlerts', 'News Alerts')}</p>
                                                    <p className="text-xs text-muted-foreground">{t('settings.newsAlertsDesc', 'Breaking news and market updates')}</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={preferences?.newsAlertsEnabled ?? false}
                                                onCheckedChange={(checked) => handleGenericPreferenceChange('newsAlertsEnabled', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{t('settings.earningsAnnouncements', 'Earnings Announcements')}</p>
                                                    <p className="text-xs text-muted-foreground">{t('settings.earningsAnnouncementsDesc', 'Alerts for earnings reports and economic events')}</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={preferences?.earningsAnnouncementsEnabled ?? false}
                                                onCheckedChange={(checked) => handleGenericPreferenceChange('earningsAnnouncementsEnabled', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Activity className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{t('settings.accountActivity', 'Account Activity')}</p>
                                                    <p className="text-xs text-muted-foreground">{t('settings.accountActivityDesc', 'Login alerts, security events, and account changes')}</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={preferences?.accountActivityNotificationsEnabled ?? true}
                                                onCheckedChange={(checked) => handleGenericPreferenceChange('accountActivityNotificationsEnabled', checked)}
                                            />
                                        </div>
                                    </div>

                                    {/* AI Coaching */}
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 mb-2">{t('settings.aiCoaching', 'AI Coaching')}</p>
                                        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Brain className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{t('settings.briefingReminder', 'Morning Briefing Reminder')}</p>
                                                    <p className="text-xs text-muted-foreground">{t('settings.briefingReminderDesc', 'Get a reminder to check your AI briefing each morning')}</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={preferences?.briefingReminderEnabled ?? false}
                                                onCheckedChange={(checked) => handleGenericPreferenceChange('briefingReminderEnabled', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Brain className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{t('settings.debriefReminder', 'Evening Debrief Reminder')}</p>
                                                    <p className="text-xs text-muted-foreground">{t('settings.debriefReminderDesc', 'Get a reminder to review your trading session')}</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={preferences?.debriefReminderEnabled ?? false}
                                                onCheckedChange={(checked) => handleGenericPreferenceChange('debriefReminderEnabled', checked)}
                                            />
                                        </div>
                                    </div>
                                </div>

                            </>
                        )}

                        {/* Per-event granular preferences */}
                        <NotificationPreferences />

                        {/* Save button — after all notification sections */}
                        <div className="flex justify-end">
                            <Button onClick={() => handleSaveChanges('Notification')} disabled={isLoadingPrefs}>
                                {isLoadingPrefs && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('common.saveChanges')}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* ========== SECURITY TAB ========== */}
                    <TabsContent value="security" className="space-y-6">
                        {/* Authentication */}
                        <div className="glass-card rounded-2xl p-6 space-y-5">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <KeyRound className="h-4.5 w-4.5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold">{t('settings.authentication')}</h3>
                                    <p className="text-sm text-muted-foreground">{t('settings.authenticationDesc', 'Manage your email and password credentials')}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">{t('common.emailAddress')}</Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        value={user?.email || ''}
                                        readOnly
                                        className="bg-muted/50 cursor-default focus-visible:ring-0 pr-10"
                                    />
                                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                </div>
                            </div>

                            <Button variant="outline" onClick={() => setChangePasswordOpen(true)} disabled={isAuthLoading}>
                                {t('settings.changePassword')}
                            </Button>
                        </div>

                        {/* Two-Factor Authentication */}
                        <div className="glass-card rounded-2xl p-6 space-y-5">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold">{t('settings.twoFactorAuth')}</h3>
                                    <p className="text-sm text-muted-foreground">{t('settings.twoFactorAuthDesc')}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                                <div className="space-y-0.5">
                                    <span className="text-sm font-medium">
                                        {mfaStatus === 'enabled' ? t('settings.mfaEnabled', 'Enabled') : t('settings.mfaDisabled', 'Disabled')}
                                    </span>
                                    <p className="text-xs text-muted-foreground">
                                        {mfaStatus === 'enabled'
                                            ? t('settings.mfaEnabledHint', 'Your account is protected with two-factor authentication')
                                            : t('settings.mfaDisabledHint', 'Enable to add an extra layer of security')}
                                    </p>
                                </div>
                                {mfaStatus === 'loading' ? (
                                    <Loader2 className="h-5 w-5 animate-spin"/>
                                ) : (
                                    <Switch
                                        id="two-factor-auth-switch"
                                        checked={mfaStatus === 'enabled' || mfaStatus === 'setup_qr' || mfaStatus === 'setup_verify'}
                                        onCheckedChange={(checked) => {
                                            if (checked && mfaStatus === 'disabled') {
                                                handleStartSetup();
                                            } else if (!checked && mfaStatus === 'enabled') {
                                                setShowDisableConfirm(true);
                                            } else if (!checked && (mfaStatus === 'setup_qr' || mfaStatus === 'setup_verify')) {
                                                handleCancelSetup();
                                            }
                                        }}
                                        disabled={isAuthLoading || isLoadingSetup || isDisabling}
                                        aria-label={t('settings.twoFactorAuth')}
                                    />
                                )}
                            </div>

                            {/* MFA setup flow */}
                            {mfaSectionContent && (
                                <div className="mt-2">
                                    {mfaSectionContent}
                                </div>
                            )}
                        </div>

                        {/* Session Security */}
                        <div className="glass-card rounded-2xl p-6 space-y-5">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <Timer className="h-4.5 w-4.5 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold">{t('settings.sessionSecurity', 'Session Security')}</h3>
                                    <p className="text-sm text-muted-foreground">{t('settings.sessionSecurityDesc', 'Control auto-logout and session timeout behavior')}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                                <div className="space-y-0.5">
                                    <span className="text-sm font-medium">{t('settings.autoLogout', 'Auto Logout')}</span>
                                    <p className="text-xs text-muted-foreground">
                                        {preferences?.inactivityTimeoutMinutes && preferences.inactivityTimeoutMinutes > 0
                                            ? `${t('settings.enabledTimeout', 'Enabled')} (${preferences.inactivityTimeoutMinutes} ${t('settings.minutes', 'minutes')})`
                                            : t('settings.disabled', 'Disabled')}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="timeout">{t('settings.inactivityTimeout', 'Inactivity Timeout')}</Label>
                                <Select
                                    value={preferences?.inactivityTimeoutMinutes?.toString() ?? '0'}
                                    onValueChange={(value) => handlePreferenceChange('inactivityTimeoutMinutes', value)}
                                    disabled={isLoadingPrefs}
                                >
                                    <SelectTrigger id="timeout" className="sm:max-w-xs">
                                        <SelectValue placeholder="Select timeout period"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">{t('settings.disabled', 'Disabled')}</SelectItem>
                                        <SelectItem value="5">5 {t('settings.minutes', 'minutes')}</SelectItem>
                                        <SelectItem value="15">15 {t('settings.minutes', 'minutes')}</SelectItem>
                                        <SelectItem value="30">30 {t('settings.minutes', 'minutes')}</SelectItem>
                                        <SelectItem value="60">1 {t('settings.hour', 'hour')}</SelectItem>
                                        <SelectItem value="120">2 {t('settings.hours', 'hours')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button onClick={() => handleSaveChanges('Session')} disabled={isLoadingPrefs} size="sm">
                                    {isLoadingPrefs ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                    {t('settings.saveSessionSettings', 'Save Session Settings')}
                                </Button>
                            </div>
                        </div>

                        {/* Trusted Devices */}
                        <div className="glass-card rounded-2xl p-6">
                            <TrustedDevicesManager/>
                        </div>
                    </TabsContent>

                    {/* ========== TAGS TAB ========== */}
                    <TabsContent value="tags" className="space-y-6">
                        <TagsSection />
                    </TabsContent>

                    {/* ========== PUBLIC PROFILE TAB ========== */}
                    <TabsContent value="public-profile" className="space-y-6">
                        <div className="glass-card rounded-2xl p-6 space-y-5">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                    <User className="h-4.5 w-4.5 text-violet-500" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold">{t("gamification.publicProfile", "Public Profile")}</h3>
                                    <p className="text-sm text-muted-foreground">{t("gamification.publicProfileDesc", "Share your trading stats and achievements with the community")}</p>
                                </div>
                            </div>
                            <PublicProfileSettings />
                        </div>
                    </TabsContent>

                    {/* ========== BILLING TAB ========== */}
                    <TabsContent value="billing" className="space-y-6">
                        <UsageDashboard />
                        <AiMessagePackPicker
                            heading="AI coach message packs"
                            subheading="One-off top-ups for extra coach messages — credited immediately after checkout."
                        />
                    </TabsContent>

                    {/* ========== AI PROVIDER TAB ========== */}
                    <TabsContent value="ai-provider" className="space-y-6">
                        <AiProviderSettings />
                    </TabsContent>

                    {/* ========== MENTOR TAB (TEAM plan) ========== */}
                    {isTeamPlan && (
                        <TabsContent value="mentor" className="space-y-6">
                            <MentorInstanceSettings />
                        </TabsContent>
                    )}

                    {/* ========== MY MENTOR TAB (student) ========== */}
                    {isInMentorInstance && (
                        <TabsContent value="my-mentor" className="space-y-6">
                            <MyMentorSettings />
                        </TabsContent>
                    )}
                </Tabs>
            </div>

            <ChangePasswordDialog
                open={changePasswordOpen}
                onOpenChange={setChangePasswordOpen}
            />

            <ConfirmLogoutDialog
                open={logoutAllDevicesOpen}
                onOpenChange={setLogoutAllDevicesOpen}
            />

            {/* Disable MFA confirmation dialog */}
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
                            placeholder={t('settings.enterPasswordPlaceholder')}
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

            {/* Session revocation confirmation */}
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
