import React from 'react';
import ScoreHistory from './ScoreHistory';
import BehavioralAlertsList from './BehavioralAlertsList';

interface ActivityCardProps {
  accountId?: string;
}

/**
 * Body content for the "Activity" rail widget. Outer chrome (border, header,
 * background) is provided by the parent (LightWidget on the cockpit) so this
 * component stays a single source of truth for the inner layout and never
 * duplicates titles or surfaces.
 */
const ActivityCard: React.FC<ActivityCardProps> = ({ accountId }) => (
  <div className="space-y-3">
    <ScoreHistory />
    <div className="border-t border-border/20" />
    <BehavioralAlertsList accountId={accountId} enableRealtime={false} />
  </div>
);

export default ActivityCard;
