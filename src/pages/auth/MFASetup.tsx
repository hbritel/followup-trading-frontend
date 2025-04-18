// src/pages/auth/MFASetup.tsx (ou déplacez-le dans /pages/Settings/ si plus approprié)

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/auth-context'; // Utiliser le contexte
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Pour les messages
import { Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { authService } from '@/services/auth.service'; // Pour les erreurs et les services MFA
import { Switch } from '@/components/ui/switch'; // Pourrait être une alternative pour Activer/Désactiver
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Pour confirmer la désactivation

const MFASetup = () => {
  const { t } = useTranslation();
  // Utiliser les fonctions et états du contexte
  const { user, isLoading: isAuthLoading, disableMfa } = useAuth();
  const { toast } = useToast();

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState(''); // Pour afficher la clé secrète textuelle
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false); // Chargement spécifique à la vérification
  const [isLoadingSetup, setIsLoadingSetup] = useState(false); // Chargement spécifique au setup initial
  const [passwordConfirm, setPasswordConfirm] = useState(''); // Pour la désactivation
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false); // Chargement spécifique à la désactivation

  // État pour gérer l'étape actuelle : 'disabled', 'setup_qr', 'setup_verify', 'enabled'
  const [mfaStatus, setMfaStatus] = useState<'loading' | 'disabled' | 'setup_qr' | 'setup_verify' | 'enabled'>('loading');

  // Déterminer l'état initial basé sur l'utilisateur du contexte
  useEffect(() => {
    if (isAuthLoading) {
      setMfaStatus('loading');
    } else if (user?.mfaEnabled) {
      setMfaStatus('enabled');
    } else if (user) { // Utilisateur chargé mais MFA non activé
      setMfaStatus('disabled');
    } else {
      // Gérer le cas où l'utilisateur n'est pas chargé (ne devrait pas arriver sur une page protégée)
      setMfaStatus('loading'); // ou 'error' ?
    }
  }, [user, isAuthLoading]);


  // Fonction pour lancer le setup MFA
  const handleStartSetup = async () => {
    setIsLoadingSetup(true);
    setQrCodeUrl(''); // Réinitialiser
    setSecret('');
    // try {
    //   const response = await enableMfa(); // Appel de la fonction du contexte
    //   setQrCodeUrl(response.qrCodeUri);
    //   setSecret(response.secret);
    //   setMfaStatus('setup_qr'); // Passer à l'étape d'affichage du QR code
    // } catch (error) {
    //   const errorMessage = authService.getErrorMessage(error);
    //   toast({ title: t('error.error'), description: errorMessage, variant: 'destructive' });
    //   setMfaStatus('disabled'); // Revenir à l'état désactivé si erreur
    // } finally {
    //   setIsLoadingSetup(false);
    // }
  };

  // Fonction pour vérifier le code pendant le setup
  // Note: Le backend actuel semble activer MFA dès l'appel à /mfa/setup.
  // La vérification ici sert à confirmer que l'utilisateur a bien configuré son app.
  // L'API /mfa/totp/verify est utilisée ici, mais elle renverra probablement les tokens,
  // ce qui n'est pas idéal dans ce flux de configuration.
  // Idéalement, il faudrait un endpoint spécifique pour *confirmer* le setup MFA sans renvoyer de tokens.
  // Solution temporaire: on appelle verifyTotpCode mais on ignore la réponse (sauf l'erreur).
  const handleVerifySetupCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsVerifying(true);
    try {
      // Appel à l'API de vérification TOTP existante
      await authService.verifyTotpCode({ userId: user.id, code: verificationCode });

      // Si l'appel réussit (aucune erreur levée), on considère le setup comme confirmé.
      toast({ title: t('success.success'), description: t('auth.mfaSetupVerified') }); // Traduire
      setMfaStatus('enabled'); // Passer à l'état activé
      setVerificationCode(''); // Réinitialiser le champ

    } catch (error) {
      const errorMessage = authService.getErrorMessage(error);
      toast({ title: t('auth.verificationFailedTitle'), description: errorMessage, variant: 'destructive' });
      // Rester à l'étape de vérification pour une nouvelle tentative
    } finally {
      setIsVerifying(false);
    }
  };


  // Fonction pour confirmer et désactiver MFA
  const handleConfirmDisable = async () => {
    if (!passwordConfirm) {
      toast({ title: t('error.error'), description: t('auth.passwordRequired'), variant: 'destructive' }); // Traduire
      return;
    }
    setIsDisabling(true);
    try {
      await disableMfa(passwordConfirm); // Appel de la fonction du contexte
      toast({ title: t('success.success'), description: t('auth.mfaDisabledSuccess') }); // Traduire
      setMfaStatus('disabled'); // Revenir à l'état désactivé
      setShowDisableConfirm(false); // Fermer le dialogue
      setPasswordConfirm(''); // Réinitialiser le mot de passe
    } catch (error) {
      const errorMessage = authService.getErrorMessage(error);
      toast({ title: t('auth.mfaDisableFailed'), description: errorMessage, variant: 'destructive' }); // Traduire
      // Rester dans le dialogue pour une nouvelle tentative si mot de passe incorrect, etc.
    } finally {
      setIsDisabling(false);
    }
  };


  // Rendu conditionnel basé sur mfaStatus
  const renderContent = () => {
    switch (mfaStatus) {
      case 'loading':
        return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>;

      case 'enabled':
        return (
            <div className="space-y-4">
              <Alert variant="success"> {/* Utilisez une variante de succès si disponible */}
                <ShieldCheck className="h-5 w-5" />
                <AlertTitle>{t('auth.mfaEnabledTitle')}</AlertTitle>
                <AlertDescription>
                  {t('auth.mfaEnabledDesc')}
                </AlertDescription>
              </Alert>
              <Dialog open={showDisableConfirm} onOpenChange={setShowDisableConfirm}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={isAuthLoading}>
                    {t('auth.disableMFA')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('auth.confirmDisableMfaTitle')}</DialogTitle>
                    <DialogDescription>
                      {t('auth.confirmDisableMfaDesc')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 py-4">
                    <Label htmlFor="passwordConfirm">{t('common.currentPassword')}</Label>
                    <Input
                        id="passwordConfirm"
                        type="password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="Enter your password"
                        required
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDisableConfirm(false)}>{t('common.cancel')}</Button>
                    <Button variant="destructive" onClick={handleConfirmDisable} disabled={isDisabling}>
                      {isDisabling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {t('auth.disableMFA')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
        );

      case 'disabled':
        return (
            <div className="space-y-4 text-center">
              <Alert variant="warning"> {/* Utilisez une variante d'avertissement si disponible */}
                <ShieldOff className="h-5 w-5"/>
                <AlertTitle>{t('auth.mfaDisabledTitle')}</AlertTitle>
                <AlertDescription>
                  {t('auth.mfaDisabledDesc')}
                </AlertDescription>
              </Alert>
              <Button onClick={handleStartSetup} disabled={isLoadingSetup || isAuthLoading} className="w-full">
                {isLoadingSetup ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                {t('auth.enableMFA')}
              </Button>
            </div>
        );

      case 'setup_qr':
        return (
            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">{t('auth.scanInstruction')}</p>
              <div className="flex justify-center p-4 bg-white rounded-md border">
                {qrCodeUrl ? (
                    <img
                        src={qrCodeUrl}
                        alt="MFA QR Code"
                        className="max-w-full h-auto"
                        width={200}
                        height={200}
                    />
                ) : <Loader2 className="h-10 w-10 animate-spin"/> }
              </div>
              <details className="text-xs text-muted-foreground text-center cursor-pointer">
                <summary>{t('auth.cantScan')}</summary>
                <p className="mt-2 select-all font-mono bg-muted p-2 rounded break-all">{secret || 'Loading secret...'}</p>
              </details>
              <Button onClick={() => setMfaStatus('setup_verify')} className="w-full">{t('common.next')}</Button>
              <Button variant="outline" onClick={() => setMfaStatus('disabled')} className="w-full">{t('common.cancel')}</Button>
            </div>
        );

      case 'setup_verify':
        return (
            <form onSubmit={handleVerifySetupCode} className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">{t('auth.enterCodeToVerify')}</p>
              <div className="space-y-2">
                <Label htmlFor="verificationCodeSetup">{t('common.verificationCode')}</Label>
                <Input
                    id="verificationCodeSetup"
                    type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-lg tracking-widest"
                    required autoComplete="one-time-code"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isVerifying || verificationCode.length !== 6}>
                {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('common.verifyAndEnable')}
              </Button>
              <Button variant="outline" onClick={() => setMfaStatus('setup_qr')} className="w-full">{t('common.back')}</Button>
            </form>
        );

      default:
        return null;
    }
  };

  return (
      // Ce composant est peut-être mieux placé dans les paramètres utilisateur
      // qu'en tant que page autonome '/auth/mfa-setup'
      // Intégrons-le dans une Card pour l'instant
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.setupMFATitle')}</CardTitle>
          <CardDescription>{t('auth.setupMFADesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
        {/* <CardFooter>
         Peut-être ajouter un bouton Save global si d'autres paramètres sont sur la même page
      </CardFooter> */}
      </Card>
  );
};

export default MFASetup;