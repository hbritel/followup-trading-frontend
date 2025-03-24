import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/auth-context';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const MFASetup = () => {
  const { t } = useTranslation();
  const { user, enableMfa, verifyMfaCode, disableMfa } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (user?.mfaEnabled) {
      // If MFA is already enabled, show disable option
      setStep(3);
    } else {
      // Otherwise start setup process
      fetchQrCode();
    }
  }, [user]);
  
  const fetchQrCode = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { qrCodeUrl: url } = await enableMfa();
      setQrCodeUrl(url);
      setStep(1);
    } catch (error) {
      console.error('Error fetching QR code:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate QR code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      const isValid = await verifyMfaCode(verificationCode);
      if (isValid) {
        setStep(3);
        toast({
          title: 'Success',
          description: 'Two-factor authentication has been enabled.',
        });
      } else {
        toast({
          title: 'Invalid code',
          description: 'The verification code you entered is invalid. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDisable = async () => {
    setIsLoading(true);
    try {
      await disableMfa();
      toast({
        title: 'Success',
        description: 'Two-factor authentication has been disabled.',
      });
      setStep(1);
      fetchQrCode();
    } catch (error) {
      console.error('Error disabling MFA:', error);
      toast({
        title: 'Error',
        description: 'Failed to disable two-factor authentication. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.setupMFA')}</CardTitle>
          <CardDescription>
            {step === 3 
              ? t('auth.mfaEnabled')
              : t('auth.scanQRCode')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {qrCodeUrl && (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="border border-border rounded-md"
                    width={200}
                    height={200}
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {t('auth.scanQRCode')}
              </p>
              <Button 
                onClick={() => setStep(2)} 
                className="w-full"
                disabled={isLoading}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
          
          {step === 2 && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode">{t('common.verificationCode')}</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => {
                    // Only allow digits
                    const value = e.target.value.replace(/\D/g, '');
                    setVerificationCode(value);
                  }}
                  className="text-center text-lg tracking-widest"
                  required
                  autoComplete="one-time-code"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || verificationCode.length !== 6}
              >
                {isLoading ? 'Verifying...' : t('common.verify')}
              </Button>
            </form>
          )}
          
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-primary/10 text-primary rounded-md p-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Two-factor authentication is enabled on your account.</span>
              </div>
              
              <Button 
                variant="destructive" 
                onClick={handleDisable}
                className="w-full"
                disabled={isLoading}
              >
                {t('auth.disableMFA')}
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {step !== 3 && (
            <Button
              variant="ghost"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1 || isLoading}
            >
              {t('common.back')}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default MFASetup;
