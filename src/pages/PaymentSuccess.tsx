import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useInvalidateSubscription } from '@/hooks/useSubscription';

const PaymentSuccess: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const invalidate = useInvalidateSubscription();

  useEffect(() => {
    // Invalidate cached subscription so the app reflects the new plan immediately
    invalidate();

    const timer = setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="ambient-blob ambient-blob-primary w-96 h-96 top-20 left-1/4 opacity-50" />
        <div className="ambient-blob ambient-blob-gold w-64 h-64 bottom-20 right-1/4 opacity-30" />
      </div>

      <div className="relative z-10 glass-card rounded-2xl p-12 max-w-md w-full mx-4 text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center animate-pulse">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            <span className="text-gradient-primary">{t('subscription.paymentSuccess')}</span>
          </h1>
          <p className="text-muted-foreground">{t('subscription.paymentSuccessDesc')}</p>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
