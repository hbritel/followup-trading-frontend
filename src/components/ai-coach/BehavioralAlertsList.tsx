import React from 'react';
import { BellRing, CheckCircle, Info } from 'lucide-react';
import { useBehavioralAlerts } from '@/hooks/useBehavioralAlerts';
import { useAccountLabel } from '@/hooks/useAccountLabel';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import BehavioralAlertCard from './BehavioralAlertCard';

interface BehavioralAlertsListProps {
  accountId?: string;
}

const BehavioralAlertsList: React.FC<BehavioralAlertsListProps> = ({ accountId }) => {
  const { data: alerts, isLoading, isError } = useBehavioralAlerts(accountId);
  const getAccountLabel = useAccountLabel();

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <BellRing className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold">Behavioral Alerts</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors" />
          </TooltipTrigger>
          <TooltipContent side="left" align="start" className="max-w-[250px] text-xs">
            Automatic alerts triggered after each sync. Detects: revenge trading, overtrading, position size escalation, tilt state, off-hours trading, losing symbols, and daily loss limit approaches.
          </TooltipContent>
        </Tooltip>
        {alerts && alerts.length > 0 && (
          <span className="ml-auto text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
            {alerts.length}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Failed to load alerts.
        </p>
      )}

      {!isLoading && !isError && alerts && alerts.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <CheckCircle className="h-8 w-8 text-green-500/60" />
          <p className="text-sm text-muted-foreground">
            No active alerts. Trading patterns look good.
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
