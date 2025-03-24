
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/auth-context';
import AuthLayout from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const MFA = () => {
  const { t } = useTranslation();
  const { verifyMfaCode } = useAuth();
  const { toast } = useToast();
  
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const isValid = await verifyMfaCode(verificationCode);
      if (!isValid) {
        toast({
          title: 'Invalid code',
          description: 'The verification code you entered is invalid. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      toast({
        title: 'Verification failed',
        description: 'An error occurred during verification. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthLayout
      title={t('auth.mfaTitle')}
      subtitle={t('auth.mfaSubtitle')}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-4">
            {t('auth.enterCode')}
          </p>
          
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
        
        <Button type="submit" className="w-full" disabled={isLoading || verificationCode.length !== 6}>
          {isLoading ? 'Verifying...' : t('common.verify')}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default MFA;
