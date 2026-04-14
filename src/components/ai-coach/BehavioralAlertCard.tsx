import React from 'react';
import { AlertCircle, AlertTriangle, Info, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BehavioralAlertResponseDto } from '@/types/dto';
import { useDismissAlert } from '@/hooks/useBehavioralAlerts';
import { cn } from '@/lib/utils';

interface BehavioralAlertCardProps {
  alert: BehavioralAlertResponseDto;
  accountLabel?: string;
}

const SeverityIcon: React.FC<{ severity: BehavioralAlertResponseDto['severity'] }> = ({ severity }) => {
  switch (severity) {
    case 'CRITICAL':
      return <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
    case 'WARNING':
      return <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />;
    case 'INFO':
    default:
      return <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />;
  }
};

const severityBg = {
  CRITICAL: 'border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-950/20',
  WARNING: 'border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/20',
  INFO: 'border-blue-200 bg-blue-50 dark:border-blue-800/40 dark:bg-blue-950/20',
};

const BehavioralAlertCard: React.FC<BehavioralAlertCardProps> = ({ alert, accountLabel }) => {
  const { mutate: dismiss, isPending } = useDismissAlert();

  return (
    <div
      className={cn(
        'rounded-xl border p-3 space-y-1.5',
        severityBg[alert.severity] ?? severityBg.INFO
      )}
    >
      <div className="flex items-start gap-2">
        <SeverityIcon severity={alert.severity} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold leading-tight">{alert.title}</p>
            {accountLabel && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 font-medium text-muted-foreground border-border/60"
              >
                {accountLabel}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => dismiss(alert.id)}
          disabled={isPending}
          aria-label="Dismiss alert"
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <X className="h-3 w-3" />
          )}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground/60 pl-6">Behavioral observation only.</p>
    </div>
  );
};

export default BehavioralAlertCard;
