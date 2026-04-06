import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, X, CheckCircle2 } from 'lucide-react';
import { useEvaluationAlerts, useDismissAlert } from '@/hooks/usePropFirm';
import { cn } from '@/lib/utils';
import type { EvaluationStatus, EvaluationAlert } from '@/types/propfirm';

// ---------------------------------------------------------------------------
// Alert appearance helpers
// ---------------------------------------------------------------------------

type AlertSeverity = 'critical' | 'warning' | 'info';

const getAlertSeverity = (alertType: string): AlertSeverity => {
  const type = alertType.toUpperCase();
  if (
    type.includes('PHASE_FAILED') ||
    type.includes('DAILY_LOSS_90') ||
    type.includes('DRAWDOWN_90') ||
    type.endsWith('_100')
  ) {
    return 'critical';
  }
  if (type.includes('_75') || type.includes('75')) {
    return 'warning';
  }
  return 'info';
};

interface AlertIconProps {
  severity: AlertSeverity;
}

const AlertIcon: React.FC<AlertIconProps> = ({ severity }) => {
  if (severity === 'critical') {
    return <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />;
  }
  if (severity === 'warning') {
    return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />;
  }
  return <Info className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />;
};

// ---------------------------------------------------------------------------
// Relative time helper (no dependency on date-fns)
// ---------------------------------------------------------------------------

const timeAgo = (isoString: string): string => {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// ---------------------------------------------------------------------------
// Individual alert row
// ---------------------------------------------------------------------------

interface AlertRowProps {
  alert: EvaluationAlert;
  evaluationId: string;
}

const AlertRow: React.FC<AlertRowProps> = ({ alert, evaluationId }) => {
  const dismiss = useDismissAlert();
  const severity = getAlertSeverity(alert.alertType);

  const rowBg: Record<AlertSeverity, string> = {
    critical: 'bg-red-500/5 border-red-500/15',
    warning: 'bg-amber-500/5 border-amber-500/15',
    info: 'bg-blue-500/5 border-blue-500/15',
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border px-3 py-2.5',
        rowBg[severity],
      )}
    >
      <AlertIcon severity={severity} />

      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">{alert.message}</p>
        {(alert.currentValue != null || alert.thresholdValue != null) && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {alert.currentValue != null && (
              <span>
                Current: <span className="font-mono">{alert.currentValue}</span>
              </span>
            )}
            {alert.currentValue != null && alert.thresholdValue != null && (
              <span className="mx-1">&middot;</span>
            )}
            {alert.thresholdValue != null && (
              <span>
                Limit: <span className="font-mono">{alert.thresholdValue}</span>
              </span>
            )}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-muted-foreground">{timeAgo(alert.createdAt)}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          disabled={dismiss.isPending}
          aria-label="Dismiss alert"
          onClick={() => dismiss.mutate({ evaluationId, alertId: alert.id })}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// AlertsPanel
// ---------------------------------------------------------------------------

interface AlertsPanelProps {
  evaluationId: string;
  status: EvaluationStatus;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ evaluationId, status }) => {
  const { data: alerts = [], isLoading } = useEvaluationAlerts(evaluationId);

  // Only render for active evaluations
  if (status !== 'ACTIVE') return null;

  const activeAlerts = alerts.filter((a) => !a.dismissed);
  const hasAlerts = activeAlerts.length > 0;

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-semibold">Active Alerts</CardTitle>
          {hasAlerts && (
            <Badge
              className="h-5 min-w-[20px] rounded-full px-1.5 text-[10px] font-bold bg-red-500/15 text-red-400 border-red-500/20"
            >
              {activeAlerts.length}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-12 rounded-xl bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        ) : hasAlerts ? (
          <div className="space-y-2">
            {activeAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} evaluationId={evaluationId} />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
            No active alerts — all rules are within limits.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertsPanel;
