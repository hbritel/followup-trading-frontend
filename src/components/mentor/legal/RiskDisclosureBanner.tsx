import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const SESSION_KEY = 'mentor_risk_banner_dismissed';

interface RiskDisclosureBannerProps {
  isCfdContext?: boolean;
  className?: string;
}

const RiskDisclosureBanner: React.FC<RiskDisclosureBannerProps> = ({
  isCfdContext = false,
  className,
}) => {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(() =>
    sessionStorage.getItem(SESSION_KEY) === '1'
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setDismissed(true);
  };

  return (
    <aside
      role="note"
      aria-label={t('mentor.legal.riskBanner.text')}
      className={cn(
        'relative flex items-start gap-3 rounded-xl border-l-4 px-4 py-3 text-sm',
        'border-l-amber-400 bg-amber-50 text-amber-900',
        'dark:border-l-amber-500 dark:bg-amber-950/20 dark:text-amber-200',
        className
      )}
    >
      <AlertTriangle
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400"
        aria-hidden="true"
      />
      <p className="flex-1 leading-relaxed">
        {isCfdContext
          ? t(
              'mentor.legal.riskBanner.cfdText',
              'CFDs are complex instruments with a high risk of losing money rapidly due to leverage. Trading involves substantial risk of loss. Past performance is not indicative of future results. Nothing on this page is investment advice, a solicitation, or a recommendation.'
            )
          : t(
              'mentor.legal.riskBanner.text',
              'Trading involves substantial risk of loss. Past performance is not indicative of future results. Nothing on this page is investment advice, a solicitation, or a recommendation.'
            )}
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t('mentor.legal.riskBanner.dismiss', 'Dismiss')}
        className={cn(
          'ml-1 shrink-0 rounded p-0.5 transition-colors',
          'text-amber-600 hover:bg-amber-100 hover:text-amber-800',
          'dark:text-amber-400 dark:hover:bg-amber-900/40 dark:hover:text-amber-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'
        )}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </aside>
  );
};

export default RiskDisclosureBanner;
