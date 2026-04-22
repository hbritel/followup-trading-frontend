import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UpgradePrompt from '@/components/subscription/UpgradePrompt';

interface FeatureGateProps {
  featureKey?: string;
  requiredPlan?: 'STARTER' | 'PRO' | 'ELITE' | 'TEAM';
  children: React.ReactNode;
}

const PLAN_HIERARCHY: Record<string, number> = {
  FREE: 0,
  STARTER: 1,
  PRO: 2,
  ELITE: 3,
  TEAM: 4,
};

function hasSufficientPlan(userPlan: string, requiredPlan: string): boolean {
  return (PLAN_HIERARCHY[userPlan] ?? 0) >= (PLAN_HIERARCHY[requiredPlan] ?? 0);
}

/**
 * Wraps a page component and gates access based on subscription plan.
 *
 * Access logic:
 * 1. If requiredPlan is specified, the user MUST have that plan or higher.
 *    Feature flags do NOT bypass plan requirements.
 * 2. Feature flags are for admin kill-switches only (globally disable a feature
 *    for maintenance/bugs). Not used for per-user access control.
 * 3. For commercial gestures (granting a user access above their plan),
 *    use the admin "Change Plan" action instead.
 */
export function FeatureGate({ featureKey, requiredPlan, children }: FeatureGateProps) {
  const { isLoading, currentPlan } = useFeatureFlags();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const planSufficient = !requiredPlan || hasSufficientPlan(currentPlan, requiredPlan);

  if (isLoading) {
    return <>{children}</>;
  }

  // Plan gate — user must have the required plan
  if (!planSufficient) {
    return (
      <div className="relative min-h-[60vh]">
        {/* Blurred page content rendered behind */}
        <div
          className="pointer-events-none select-none"
          style={{ filter: 'blur(14px)', opacity: 0.3 }}
          aria-hidden="true"
        >
          {children}
        </div>

        {/* Overlay with upgrade prompt */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
          <UpgradePrompt
            feature={featureKey ? t(`featureGate.features.${featureKey}`, featureKey) : ''}
            requiredPlan={requiredPlan}
            currentPlan={currentPlan}
            className="max-w-md w-full shadow-2xl"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mt-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.goBack', 'Go back')}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
