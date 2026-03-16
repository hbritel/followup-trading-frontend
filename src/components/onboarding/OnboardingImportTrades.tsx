import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileUp, CheckCircle2 } from 'lucide-react';
import { useTrades } from '@/hooks/useTrades';

interface OnboardingImportTradesProps {
  onNext: () => void;
  onSkip: () => void;
  brokerChoice?: string;
}

const OnboardingImportTrades: React.FC<OnboardingImportTradesProps> = ({
  onNext,
  onSkip,
  brokerChoice,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: tradesData } = useTrades({ page: 0, size: 1 });

  const hasTrades =
    tradesData != null &&
    (Array.isArray(tradesData)
      ? tradesData.length > 0
      : (tradesData as { totalElements?: number }).totalElements != null &&
        (tradesData as { totalElements: number }).totalElements > 0);

  const handleGoToTrades = () => {
    onNext();
    navigate('/trades');
  };

  if (hasTrades) {
    return (
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Trades already imported!</h2>
          <p className="text-muted-foreground text-sm">
            We found existing trades in your account. You're ready to go.
          </p>
        </div>
        <Button onClick={onNext} size="lg" className="w-full max-w-xs">
          {t('common.continue')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-gradient">
          {t('onboarding.importTrades')}
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          {t('onboarding.importTradesDesc')}
        </p>
      </div>

      {/* Import card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-5 border border-dashed border-primary/20">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <FileUp className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>
        <div className="text-center space-y-1.5">
          <p className="font-semibold text-foreground">{t('onboarding.importCsv')}</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            {t('onboarding.importCsvDesc')}
          </p>
        </div>
        <Button onClick={handleGoToTrades} className="w-full max-w-xs">
          {t('common.import')} Trades
        </Button>
      </div>

      {/* Supported brokers hint */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Supports MT5, IBKR, cTrader, TD Ameritrade, and more
        </p>
      </div>

      {/* Skip */}
      <div className="text-center">
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
        >
          {t('onboarding.skip')}
        </button>
      </div>
    </div>
  );
};

export default OnboardingImportTrades;
