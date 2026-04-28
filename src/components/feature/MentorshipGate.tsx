import React from 'react';
import { Navigate } from 'react-router-dom';
import { useFeatureConfig, useMentorshipEnabled } from '@/hooks/useFeatureConfig';

interface MentorshipGateProps {
  children: React.ReactNode;
  /** Where to redirect when the master switch is OFF. Defaults to `/dashboard`. */
  redirectTo?: string;
}

/**
 * Route wrapper that hides the entire mentor surface when the runtime master
 * switch `app.features.mentorship.enabled` is OFF.
 *
 * Renders `null` while the config is still loading to avoid flicker, then
 * either renders children (flag ON) or redirects (flag OFF). Pair with
 * `useMentorshipEnabled()` for inline conditional rendering elsewhere.
 */
const MentorshipGate: React.FC<MentorshipGateProps> = ({
  children,
  redirectTo = '/dashboard',
}) => {
  const { isLoading } = useFeatureConfig();
  const enabled = useMentorshipEnabled();

  if (isLoading) return null;
  if (!enabled) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
};

export default MentorshipGate;
