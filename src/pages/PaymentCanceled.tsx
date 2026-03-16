import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const PaymentCanceled: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="ambient-blob ambient-blob-secondary w-80 h-80 top-20 left-1/4 opacity-30" />
      </div>

      <div className="relative z-10 glass-card rounded-2xl p-12 max-w-md w-full mx-4 text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t('subscription.paymentCanceled')}</h1>
          <p className="text-muted-foreground">{t('subscription.paymentCanceledDesc')}</p>
        </div>

        <Button asChild>
          <Link to="/pricing">{t('subscription.choosePlan')}</Link>
        </Button>
      </div>
    </div>
  );
};

export default PaymentCanceled;
