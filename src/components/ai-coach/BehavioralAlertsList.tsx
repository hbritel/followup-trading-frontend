import React from 'react';
import { BellRing, CheckCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBehavioralAlerts } from '@/hooks/useBehavioralAlerts';
import { useAccountLabel } from '@/hooks/useAccountLabel';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import BehavioralAlertCard from './BehavioralAlertCard';

interface BehavioralAlertsListProps {
  accountId?: string;
  /** If false, disables WebSocket real-time updates (default: true) */
  enableRealtime?: boolean;
}

const BehavioralAlertsList: React.FC<BehavioralAlertsListProps> = ({ accountId, enableRealtime = true }) => {
  const { t } = useTranslation();
  const { data: alerts, isLoading, isError } = useBehavioralAlerts(accountId, enableRealtime);
  const getAccountLabel = useAccountLabel();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BellRing className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('ai.behavioralAlertsTitle', 'Behavioral Alerts')}
        </h3>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors" />
          </TooltipTrigger>
          <TooltipContent side="bottom" align="center" sideOffset={4} avoidCollisions className="max-w-[280px] text-xs leading-relaxed z-50">
            {t('ai.behavioralAlertsInfo')}
          </TooltipContent>
        </Tooltip>
        {alerts && alerts.length > 0 && (
          <span className="ml-auto text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium tabular-nums">
            {alerts.length}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      )}

      {isError && (
        <p className="text-xs text-muted-foreground text-center py-3">
          {t('ai.alertsLoadFailed')}
        </p>
      )}

      {!isLoading && !isError && alerts && alerts.length === 0 && (
        <div className="flex items-center gap-2 py-3 justify-center">
          <CheckCircle className="h-4 w-4 text-green-500/60" />
          <p className="text-xs text-muted-foreground">
            {t('ai.noActiveAlerts')}
          </p>
        </div>
      )}

      {!isLoading && !isError && alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <BehavioralAlertCard
              key={alert.id}
              alert={alert}
              accountLabel={getAccountLabel(alert.connectionId)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BehavioralAlertsList;
