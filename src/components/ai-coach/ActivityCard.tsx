import React from 'react';
import { useTranslation } from 'react-i18next';
import ScoreHistory from './ScoreHistory';
import BehavioralAlertsList from './BehavioralAlertsList';
import { Activity } from 'lucide-react';

interface ActivityCardProps {
  accountId?: string;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ accountId }) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('ai.activity', 'Activité')}
        </h3>
      </div>
      <div className="space-y-3">
        <ScoreHistory />
        <div className="border-t border-border/20" />
        <BehavioralAlertsList accountId={accountId} enableRealtime={false} />
      </div>
    </div>
  );
};

export default ActivityCard;
