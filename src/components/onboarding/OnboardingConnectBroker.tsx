import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Upload, Link, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrokerOption {
  id: string;
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
  href: string;
  highlighted?: boolean;
}

interface OnboardingConnectBrokerProps {
  onNext: (choice: string) => void;
  onSkip: () => void;
}

const OnboardingConnectBroker: React.FC<OnboardingConnectBrokerProps> = ({ onNext, onSkip }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const options: BrokerOption[] = [
    {
      id: 'import-csv',
      icon: <Upload className="w-6 h-6" />,
      titleKey: 'onboarding.importCsv',
      descKey: 'onboarding.importCsvDesc',
      href: '/trades',
      highlighted: true,
    },
    {
      id: 'connect-api',
      icon: <Link className="w-6 h-6" />,
      titleKey: 'onboarding.connectApi',
      descKey: 'onboarding.connectApiDesc',
      href: '/settings?tab=profile',
    },
    {
      id: 'add-manually',
      icon: <PenLine className="w-6 h-6" />,
      titleKey: 'onboarding.addManually',
      descKey: 'onboarding.addManuallyDesc',
      href: '/trades',
    },
  ];

  const handleSelect = (option: BrokerOption) => {
    onNext(option.id);
    navigate(option.href);
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-gradient">
          {t('onboarding.connectBroker')}
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          {t('onboarding.connectBrokerDesc')}
        </p>
      </div>

      {/* Options */}
      <div className="grid gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option)}
            className={cn(
              'glass-card rounded-2xl p-4 sm:p-5 flex items-start gap-4 text-left',
              'transition-all duration-200 cursor-pointer w-full',
              'hover:border-primary/30 hover:shadow-[0_0_20px_hsl(var(--primary)/0.12)]',
              option.highlighted &&
                'border border-primary/20 shadow-[0_0_15px_hsl(var(--primary)/0.08)]'
            )}
          >
            <div
              className={cn(
                'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center',
                option.highlighted
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted/50 text-muted-foreground'
              )}
            >
              {option.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm sm:text-base text-foreground">
                  {t(option.titleKey)}
                </span>
                {option.highlighted && (
                  <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">
                    Popular
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
                {t(option.descKey)}
              </p>
            </div>
          </button>
        ))}
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

export default OnboardingConnectBroker;
