// src/pages/auth/MFA.tsx

import React, {useEffect, useState} from 'react';
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
    const userIdFromLogin = locationState?.userId; // ID utilisateur (si renvoyé par le backend)
    const userIdentifier = locationState?.identifier; // email/username (utile si userId manque)

    // Vérification initiale
    useEffect(() => {
        if (!mfaTokenIdFromLogin || !userIdFromLogin) { // Vérifier mfaTokenId et identifier
            console.error("MFA page loaded without required mfaTokenId or identifier in location state.");
            toast({
                title: "Error",
                description: "Missing information to verify MFA. Please log in again.",
                variant: "destructive",
            });
            navigate('/auth/login');
        }
        // Désactiver l'onglet email si userIdentifier (email) n'est pas disponible
        if (!userIdentifier?.includes('@') && selectedTab === 'email') {
            setSelectedTab('totp'); // Revenir à TOTP si l'identifiant n'est pas un email
        }
    }, [navigate, toast, mfaTokenIdFromLogin, userIdFromLogin, userIdentifier, selectedTab]);

    // Handler pour la soumission du code de vérification
    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // userId est maintenant disponible via userIdFromLogin
        if (!userIdFromLogin) {
            toast({title: "Error", description: "User ID is missing.", variant: "destructive"});
            return; // Ne devrait pas arriver grâce au useEffect
        }

        let currentMfaTokenId: string | null = null;
        let mfaType: 'TOTP' | 'EMAIL' | null = null;

        if (selectedTab === 'totp') {
            // Pour TOTP, l'API verifyTotpCode attend userId.
            // La fonction context verifyMfaCode attend aussi mfaTokenId même pour TOTP,
            // passons celui reçu du login (même s'il n'est pas utilisé par l'API TOTP elle-même).
            currentMfaTokenId = mfaTokenIdFromLogin || '';
            mfaType = 'TOTP';
        } else { // email
            if (!otpTokenId) {
                toast({
                    title: "Error",
                    description: "Email OTP was not sent or ID is missing.",
                    variant: "destructive"
                });
                return;
            }
            // Pour Email, l'API verifyEmailOtp attend otpTokenId (stocké localement après envoi).
            currentMfaTokenId = otpTokenId;
            mfaType = 'EMAIL';
        }

        if (!mfaType || !currentMfaTokenId) {
            toast({
                title: "Error",
                description: "Missing required information for verification.",
                variant: "destructive"
            });
            return;
        }

        try {
            // Appel à la fonction du contexte avec userId directement disponible
            const isValid = await verifyMfaCode(verificationCode, currentMfaTokenId, userIdFromLogin, mfaType);
            if (!isValid) {
                toast({
                    title: t('auth.invalidCodeTitle'),
                    description: t('auth.invalidCodeDesc'),
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error('MFA verification component error:', error);
            const errorMessage = authService.getErrorMessage(error);
            toast({title: t('auth.verificationFailedTitle'), description: errorMessage, variant: 'destructive'});
        }
    };


    // Handler pour envoyer l'OTP par email
    const handleSendEmailOtp = async () => {
        // userId est maintenant disponible
        if (!userIdFromLogin || !userIdentifier) {
            toast({title: "Error", description: "Missing user information to send email OTP.", variant: "destructive"});
            return;
        }
        const emailToSendTo = userIdentifier; // Toujours l'hypothèse que c'est l'email

        setIsSendingEmail(true);
        setEmailOtpSent(false);
        setOtpTokenId(null);

        try {
            const response = await authService.sendEmailOtp({userId: userIdFromLogin, email: emailToSendTo});
            setOtpTokenId(response.otpTokenId);
            setEmailOtpSent(true);
            toast({title: "Email Sent", description: `An OTP code has been sent to ${emailToSendTo}.`});
        } catch (error) {
            const errorMessage = authService.getErrorMessage(error);
            toast({title: "Failed to Send Email", description: errorMessage, variant: "destructive"});
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
                        <TabsTrigger value="totp">Authenticator App</TabsTrigger>
                        <TabsTrigger value="email" disabled={!userIdentifier?.includes('@')}>Email OTP</TabsTrigger>
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
                                    <Button onClick={handleSendEmailOtp} disabled={isSendingEmail} className="w-full">
                                        {isSendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                        {isSendingEmail ? 'Sending...' : 'Send Email OTP'}
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
                                    <Button type="submit" className="w-full" disabled={isLoading || verificationCode.length !== 6}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        {isLoading ? t('common.verifying') : t('common.verify')}
                                    </Button>
                                    {/* Bouton Renvoyer */}
                                    <Button variant="link" type="button" onClick={handleSendEmailOtp} disabled={isSendingEmail} className="w-full text-sm">
                                        {isSendingEmail ? 'Sending...' : 'Resend Email OTP'}
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