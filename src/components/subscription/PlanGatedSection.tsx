import React from 'react';
import { Link } from 'react-router-dom';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import PlanBadge from './PlanBadge';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface PlanGatedSectionProps {
  requiredPlan: 'STARTER' | 'PRO' | 'ELITE';
  feature: string;
  children: React.ReactNode;
  className?: string;
  /** If true, show blurred preview of children. If false, hide children entirely. */
  showBlurredPreview?: boolean;
}

/**
 * Wraps a section within a page. If the user's plan is insufficient:
 * - Shows the content blurred with a compact upgrade overlay
 * - Or hides it entirely (based on showBlurredPreview prop)
 */
const PlanGatedSection: React.FC<PlanGatedSectionProps> = ({
  requiredPlan,
  feature,
  children,
  className,
  showBlurredPreview = true,
}) => {
  const { hasPlan } = useFeatureFlags();
  const { t } = useTranslation();

  if (hasPlan(requiredPlan)) {
    return <>{children}</>;
  }

  if (!showBlurredPreview) {
    return (
      <div className={cn('glass-card rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3', className)}>
        <PlanBadge plan={requiredPlan} size="md" />
        <p className="text-sm text-muted-foreground max-w-xs">
          {t('subscription.upgradeToAccess', 'Upgrade your plan to access this feature.')}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-xl overflow-hidden', className)}>
      {/* Blurred content */}
      <div
        className="pointer-events-none select-none"
        style={{ filter: 'blur(14px)', opacity: 0.3 }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[2px] rounded-xl">
        <PlanBadge plan={requiredPlan} size="md" className="mb-2" />
        <p className="text-sm text-muted-foreground mb-3">
          {feature}
        </p>
        <Link
          to="/pricing"
          className="text-xs font-medium text-primary hover:underline"
        >
          {t('subscription.viewPlans', 'View plans')}
        </Link>
      </div>
    </div>
  );
};

export default PlanGatedSection;
