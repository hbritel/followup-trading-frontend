import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ShieldAlert } from 'lucide-react';

interface FeatureGateProps {
  featureKey: string;
  children: React.ReactNode;
}

/**
 * Wraps a page component and blocks rendering if the feature flag is disabled.
 * Shows a dialog and navigates back to the dashboard.
 */
export function FeatureGate({ featureKey, children }: FeatureGateProps) {
  const { isEnabled, isLoading } = useFeatureFlags();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);

  const enabled = isEnabled(featureKey);

  useEffect(() => {
    if (!isLoading && !enabled) {
      setShowDialog(true);
    }
  }, [isLoading, enabled]);

  if (isLoading) {
    return <>{children}</>;
  }

  if (!enabled) {
    return (
      <AlertDialog open={showDialog} onOpenChange={() => { setShowDialog(false); navigate('/dashboard'); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <ShieldAlert className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>{t('featureGate.unavailable', 'Feature Unavailable')}</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              {t('featureGate.disabledMessage', 'This feature is currently disabled by the administrator. Please contact support if you need access.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => { setShowDialog(false); navigate('/dashboard'); }}>
              {t('featureGate.backToDashboard', 'Back to Dashboard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return <>{children}</>;
}
