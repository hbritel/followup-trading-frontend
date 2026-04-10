import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { useAuth } from '@/contexts/auth-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowUp, RefreshCw } from 'lucide-react';

interface PlanChangedNotification {
  previousPlan: string;
  newPlan: string;
  downgrade: boolean;  // Jackson strips "is" prefix from boolean fields
  message: string;
  changesApplied: string[];
  requiresRelogin: boolean;
}

export default function PlanChangeListener() {
  const { subscribe } = useWebSocket();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notification, setNotification] = useState<PlanChangedNotification | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribe(
      `/topic/plan-changed/${user.id}`,
      (message) => {
        try {
          const data = JSON.parse(message.body) as PlanChangedNotification;
          // Handle both "isDowngrade" and "downgrade" (Lombok/Jackson serialization)
          if ('isDowngrade' in data && !('downgrade' in data)) {
            (data as any).downgrade = (data as any).isDowngrade;
          }
          setNotification(data);

          // Invalidate all subscription-related caches immediately
          queryClient.invalidateQueries({ queryKey: ['subscription'] });
          queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
        } catch (e) {
          console.error('[PlanChangeListener] Failed to parse plan change notification:', e);
        }
      }
    );

    return unsubscribe;
  }, [user?.id, subscribe, queryClient]);

  if (!notification) return null;

  const isDowngrade = notification.downgrade;

  const handleReload = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setNotification(null);
  };

  return (
    <Dialog
      open={!!notification}
      onOpenChange={isDowngrade ? undefined : handleDismiss}
    >
      <DialogContent
        className={isDowngrade ? '[&>button]:hidden' : ''}
        onInteractOutside={isDowngrade ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={isDowngrade ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {isDowngrade ? (
              <div className="rounded-full bg-amber-500/10 p-2">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              </div>
            ) : (
              <div className="rounded-full bg-green-500/10 p-2">
                <ArrowUp className="h-6 w-6 text-green-400" />
              </div>
            )}
            <DialogTitle className="text-lg">
              {isDowngrade ? 'Plan Downgraded' : 'Plan Upgraded!'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {notification.previousPlan} → {notification.newPlan}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm">{notification.message}</p>

          {notification.changesApplied.length > 0 && (
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Changes applied:
              </p>
              <ul className="space-y-1">
                {notification.changesApplied.map((change, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          {isDowngrade ? (
            <Button onClick={handleReload} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Page
            </Button>
          ) : (
            <Button onClick={handleDismiss} variant="outline" className="w-full">
              Got it!
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
