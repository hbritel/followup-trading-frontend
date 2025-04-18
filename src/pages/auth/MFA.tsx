// src/pages/auth/MFA.tsx

import React, {useCallback, useEffect, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom'; // Importer useLocation/useNavigate
import {useTranslation} from 'react-i18next';
import {useAuth} from '@/contexts/auth-context'; // Assurez-vous que le chemin est correct
import AuthLayout from '@/components/layout/AuthLayout';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {useToast} from '@/hooks/use-toast';
import {authService} from '@/services/auth.service'; // Pour getErrorMessage et sendEmailOtp
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"; // Pour choisir TOTP/Email
import {Loader2} from 'lucide-react'; // Pour indicateur de chargement
import {userService} from '@/services/user.service';

// Type pour location.state (ce que AuthContext a envoyé)
interface MfaLocationState {
    identifier?: string; // email ou username utilisé pour le login
    mfaTokenId?: string; // Reçu du backend lors du login
    userId?: string;     // Reçu du backend lors du login (hypothèse)
}

const MFA = () => {
    const {t} = useTranslation();
    const {verifyMfaCode, isLoading} = useAuth(); // Utiliser la fonction et isLoading du contexte
    const location = useLocation();
    const navigate = useNavigate();
    const {toast} = useToast();

    const [verificationCode, setVerificationCode] = useState('');
    const [selectedTab, setSelectedTab] = useState<'totp' | 'email'>('totp'); // Onglet actif
    const [emailOtpSent, setEmailOtpSent] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [otpTokenId, setOtpTokenId] = useState<string | null>(null); // Pour stocker l'ID de l'OTP email

    // Récupérer les données passées par AuthContext via navigate
    const locationState = location.state as MfaLocationState | null;
    const mfaTokenIdFromLogin = locationState?.mfaTokenId; // ID temporaire de session MFA du login
    //const userIdFromLogin = locationState?.userId; // ID utilisateur (si renvoyé par le backend)
    const userIdentifier = locationState?.identifier; // email/username (utile si userId manque)

    // État pour stocker le userId récupéré
    const [retrievedUserId, setRetrievedUserId] = useState<string | null>(null);
    const [isFetchingUserId, setIsFetchingUserId] = useState(false);

    // Fonction pour récupérer et stocker userId si nécessaire
    const ensureUserIdIsAvailable = useCallback(async (): Promise<string | null> => {
        if (retrievedUserId) return retrievedUserId; // Déjà récupéré
        if (!userIdentifier) {
            toast({ title: "Error", description: "User identifier is missing.", variant: "destructive" });
            return null;
        }

        setIsFetchingUserId(true);
        try {
            const userId = await userService.findUserIdByIdentifier(userIdentifier);
            if (userId) {
                setRetrievedUserId(userId);
                return userId;
            } else {
                toast({ title: "Error", description: "Could not retrieve user information.", variant: "destructive" });
                return null;
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch user data.", variant: "destructive" });
            return null;
        } finally {
            setIsFetchingUserId(false);
        }
    }, [retrievedUserId, userIdentifier, toast]); // Ajouter les dépendances

    // Vérification initiale
    useEffect(() => {
        if (!mfaTokenIdFromLogin || !userIdentifier) { // Vérifier mfaTokenId et identifier
            console.error("MFA page loaded without required mfaTokenId or identifier in location state.");
            toast({
                title: "Error",
                description: "Missing information to verify MFA. Please log in again.",
                variant: "destructive",
            });
            navigate('/auth/login');
        }
    }, [navigate, toast, mfaTokenIdFromLogin, userIdentifier]);

    // Handler pour la soumission du code de vérification
    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let currentMfaTokenId: string | null = null;
        let currentUserId: string | null = null;
        let mfaType: 'TOTP' | 'EMAIL' | null = null;

        if (selectedTab === 'totp') {
            currentUserId = retrievedUserId ?? await ensureUserIdIsAvailable(); // Récupérer si pas déjà fait
            if (!currentUserId) return; // Arrêter si userId non trouvé
            currentMfaTokenId = mfaTokenIdFromLogin || '';
            mfaType = 'TOTP';
        } else { // email
            if (!otpTokenId) {
                toast({ title: "Error", description: "Email OTP was not sent or ID is missing.", variant: "destructive" });
                return;
            }
            // Récupérer userId aussi pour l'appel context (même si l'API email n'en a pas besoin)
            currentUserId = retrievedUserId ?? await ensureUserIdIsAvailable();
            if (!currentUserId) return;
            currentMfaTokenId = otpTokenId;
            mfaType = 'EMAIL';
        }

        if (!mfaType || !currentMfaTokenId || !currentUserId) {
            toast({ title: "Error", description: "Missing required information for verification.", variant: "destructive" });
            return;
        }

        try {
            const isValid = await verifyMfaCode(verificationCode, currentMfaTokenId, currentUserId, mfaType);
            if (!isValid) {
                toast({ title: t('auth.invalidCodeTitle'), description: t('auth.invalidCodeDesc'), variant: 'destructive' });
            } // Navigation gérée par le contexte si succès
        } catch (error) {
            console.error('MFA verification component error:', error);
            const errorMessage = authService.getErrorMessage(error);
            toast({ title: t('auth.verificationFailedTitle'), description: errorMessage, variant: 'destructive' });
        }
    };


    // Handler pour envoyer l'OTP par email
    const handleSendEmailOtp = async () => {
        const userId = retrievedUserId ?? await ensureUserIdIsAvailable(); // Récupérer userId
        if (!userId || !userIdentifier) {
            toast({ title: "Error", description: "Missing user information to send email OTP.", variant: "destructive" });
            return;
        }
        // userIdentifier est supposé être l'email
        const emailToSendTo = userIdentifier;

        setIsSendingEmail(true);
        setEmailOtpSent(false);
        setOtpTokenId(null);

        try {
            const response = await authService.sendEmailOtp({ userId: userId, email: emailToSendTo });
            setOtpTokenId(response.otpTokenId);
            setEmailOtpSent(true);
            toast({ title: "Email Sent", description: `An OTP code has been sent to ${emailToSendTo}.` });
        } catch (error) {
            const errorMessage = authService.getErrorMessage(error);
            toast({ title: "Failed to Send Email", description: errorMessage, variant: "destructive" });
        } finally {
            setIsSendingEmail(false);
        }
    };


    return (
        <AuthLayout
            title={t('auth.mfaTitle')}
            subtitle={t('auth.mfaSubtitle')}
        >
            {/* Vérifier si les données nécessaires sont présentes */}
            {!mfaTokenIdFromLogin && !userIdentifier ? (
                <div className="text-center text-destructive">
                    Error: Missing MFA context. Please try logging in again.
                    <Button onClick={() => navigate('/auth/login')} className="mt-4">Go to Login</Button>
                </div>
            ) : (
                <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'totp' | 'email')}
                      className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="totp" disabled={isFetchingUserId}>Authenticator App</TabsTrigger>
                        <TabsTrigger value="email" disabled={isFetchingUserId}>Email OTP</TabsTrigger>
                    </TabsList>

                    {/* --- Onglet TOTP --- */}
                    <TabsContent value="totp">
                        <form onSubmit={handleVerifySubmit} className="space-y-6 mt-4">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground mb-4">
                                    {t('auth.enterTotpCode')} {/* Traduire */}
                                </p>
                                <Input
                                    id="verificationCodeTotp"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    placeholder="123456"
                                    value={verificationCode}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        setVerificationCode(value);
                                    }}
                                    className="text-center text-lg tracking-widest"
                                    required
                                    autoComplete="one-time-code"
                                />
                            </div>
                            <Button type="submit" className="w-full"
                                    disabled={isLoading || verificationCode.length !== 6}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                {isLoading ? t('common.verifying') : t('common.verify')}
                            </Button>
                        </form>
                    </TabsContent>

                    {/* --- Onglet Email OTP --- */}
                    <TabsContent value="email">
                        <div className="space-y-6 mt-4">
                            {!emailOtpSent ? (
                                <div className="text-center space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Click the button below to send a one-time password to your registered email
                                        address ({userIdentifier || 'your email'}).
                                    </p>
                                    <Button
                                        onClick={handleSendEmailOtp}
                                        disabled={isSendingEmail || isFetchingUserId}
                                        className="w-full"
                                    >
                                        {(isSendingEmail || isFetchingUserId) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        {(isSendingEmail || isFetchingUserId) ? 'Loading...' : 'Send Email OTP'}
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleVerifySubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {t('auth.enterEmailOtpCode')} {/* Traduire */}
                                        </p>
                                        <Input
                                            id="verificationCodeEmail"
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={6}
                                            placeholder="123456"
                                            value={verificationCode}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '');
                                                setVerificationCode(value);
                                            }}
                                            className="text-center text-lg tracking-widest"
                                            required
                                            autoComplete="one-time-code"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full"
                                            disabled={isLoading || verificationCode.length !== 6}>
                                        {(isLoading || isFetchingUserId) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        {(isLoading || isFetchingUserId) ? t('common.verifying') : t('common.verify')}
                                    </Button>
                                    {/* Option pour renvoyer l'email */}
                                    <Button
                                        variant="link"
                                        type="button"
                                        onClick={handleSendEmailOtp}
                                        disabled={isSendingEmail || isFetchingUserId}
                                        className="w-full text-sm"
                                    >
                                        {(isSendingEmail || isFetchingUserId) ? 'Loading...' : 'Resend Email OTP'}
                                    </Button>
                                </form>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </AuthLayout>
    );
};

export default MFA;