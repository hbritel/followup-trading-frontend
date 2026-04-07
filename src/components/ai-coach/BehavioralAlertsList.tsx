import React from 'react';
import { BellRing, CheckCircle, Loader2 } from 'lucide-react';
import { useBehavioralAlerts } from '@/hooks/useBehavioralAlerts';
import { Skeleton } from '@/components/ui/skeleton';
import BehavioralAlertCard from './BehavioralAlertCard';

const BehavioralAlertsList: React.FC = () => {
  const { data: alerts, isLoading, isError } = useBehavioralAlerts();

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <BellRing className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold">Behavioral Alerts</h3>
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
            <BehavioralAlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BehavioralAlertsList;
