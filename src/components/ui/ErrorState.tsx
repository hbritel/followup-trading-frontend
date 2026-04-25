import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ChevronDown, ChevronUp, Loader2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  title?: string;
  description?: string;
  error?: unknown;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

const formatErrorDetail = (error: unknown): string => {
  if (!error) return '';
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object') {
    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return String(error);
    }
  }
  return String(error);
};

/**
 * ErrorState — reusable inline error block for query/mutation failures.
 *
 * - Always non-destructive (no banner colors that hijack the page).
 * - Always exposes a Retry button when `onRetry` is provided.
 * - Wraps the underlying error message in a collapsible <details> so users
 *   never see raw stack traces unless they ask for them.
 */
const ErrorState: React.FC<Props> = ({
  title,
  description,
  error,
  onRetry,
  isRetrying,
  className,
}) => {
  const { t } = useTranslation();
  const [showDetail, setShowDetail] = useState(false);
  const detail = formatErrorDetail(error);

  return (
    <div
      role="alert"
      className={[
        'rounded-xl border border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/15 p-4',
        'text-amber-900 dark:text-amber-200',
        className ?? '',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <span
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300"
          aria-hidden="true"
        >
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm font-semibold leading-tight">
            {title ?? t('common.errorState.title', 'Something went wrong')}
          </p>
          <p className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/80">
            {description ??
              t(
                'common.errorState.description',
                'We could not load this section. Your data is safe — try again, or copy the detail below if you need to escalate.',
              )}
          </p>
          {onRetry && (
            <div className="pt-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5 border-amber-500/40 text-amber-800 hover:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/40"
                onClick={onRetry}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCw className="w-3.5 h-3.5" />
                )}
                {t('common.retry', 'Retry')}
              </Button>
            </div>
          )}
          {detail && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDetail((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700/90 dark:text-amber-300/80 hover:underline"
              >
                {showDetail ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                {showDetail
                  ? t('common.errorState.hideDetail', 'Hide details')
                  : t('common.errorState.showDetail', 'Show details')}
              </button>
              {showDetail && (
                <pre className="mt-1.5 overflow-auto rounded-md bg-amber-500/10 p-2 text-[11px] leading-snug text-amber-800/90 dark:text-amber-200/80 max-h-40">
                  {detail}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
