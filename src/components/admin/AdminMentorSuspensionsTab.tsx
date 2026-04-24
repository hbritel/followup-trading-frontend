import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldOff, Loader2, AlertTriangle, ShieldCheck, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
  useActiveSuspensions,
  useSuspendMentor,
  useLiftSuspension,
  useRescreenSanctions,
} from '@/hooks/useAdminMentor';
import type { AdminSuspensionDto } from '@/types/dto';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(
    document.documentElement.lang || navigator.language || 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  ).format(new Date(iso));
}

// ── Suspend dialog ────────────────────────────────────────────────────────────

interface SuspendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SuspendDialog({ open, onOpenChange }: SuspendDialogProps) {
  const { t } = useTranslation();
  const suspend = useSuspendMentor();
  const [instanceId, setInstanceId] = useState('');
  const [reason, setReason] = useState('');

  const canSubmit = instanceId.trim().length > 0 && reason.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    suspend.mutate(
      { instanceId: instanceId.trim(), reason: reason.trim() },
      {
        onSuccess: () => {
          onOpenChange(false);
          setInstanceId('');
          setReason('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('admin.suspensions.suspendTitle', 'Suspend mentor')}</DialogTitle>
          <DialogDescription>
            {t(
              'admin.suspensions.suspendDescription',
              'The mentor will be prevented from accepting new students. Existing sessions continue.'
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="suspend-id">
              {t('admin.suspensions.instanceIdLabel', 'Mentor instance ID')}
            </Label>
            <Input
              id="suspend-id"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              placeholder="uuid"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="suspend-reason">
              {t('admin.suspensions.reasonLabel', 'Reason')} *
            </Label>
            <Textarea
              id="suspend-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
              placeholder={t(
                'admin.suspensions.reasonPlaceholder',
                'Policy violation, sanctions hit, etc.'
              )}
              required
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="destructive"
              disabled={!canSubmit || suspend.isPending}
              className="gap-1.5"
            >
              {suspend.isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              )}
              {t('admin.suspensions.suspendAction', 'Suspend')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Lift confirmation dialog ──────────────────────────────────────────────────

interface LiftDialogProps {
  suspension: AdminSuspensionDto | null;
  onClose: () => void;
}

function LiftDialog({ suspension, onClose }: LiftDialogProps) {
  const { t } = useTranslation();
  const lift = useLiftSuspension();

  if (!suspension) return null;

  return (
    <AlertDialog
      open={!!suspension}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('admin.suspensions.liftTitle', 'Lift suspension?')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              'admin.suspensions.liftDescription',
              'This mentor will be able to accept new students again.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              lift.mutate(suspension.mentorInstanceId, { onSuccess: onClose })
            }
            disabled={lift.isPending}
          >
            {lift.isPending && (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            )}
            {t('admin.suspensions.liftAction', 'Lift suspension')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Suspension row ────────────────────────────────────────────────────────────

interface SuspensionRowProps {
  suspension: AdminSuspensionDto;
  onLift: (s: AdminSuspensionDto) => void;
}

function SuspensionRow({ suspension, onLift }: SuspensionRowProps) {
  const { t } = useTranslation();
  const rescreen = useRescreenSanctions();

  const isActive = !suspension.liftedAt;

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <span className="font-mono text-xs text-muted-foreground">
          {suspension.mentorInstanceId.slice(0, 8)}…
        </span>
      </td>
      <td className="px-4 py-3 text-sm max-w-[220px]">
        <span className="truncate block">{suspension.reason}</span>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {fmtDate(suspension.suspendedAt)}
      </td>
      <td className="px-4 py-3">
        <Badge
          variant={isActive ? 'destructive' : 'secondary'}
          className={cn('text-[10px]', !isActive && 'opacity-70')}
        >
          {isActive
            ? t('admin.suspensions.statusActive', 'Active')
            : t('admin.suspensions.statusLifted', 'Lifted')}
        </Badge>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {fmtDate(suspension.liftedAt)}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => rescreen.mutate(suspension.mentorInstanceId)}
            disabled={rescreen.isPending}
          >
            {rescreen.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            ) : (
              <ScanLine className="h-3 w-3" aria-hidden="true" />
            )}
            {t('admin.sanctions.rescreen', 'Re-screen')}
          </Button>
          {isActive && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-500"
              onClick={() => onLift(suspension)}
            >
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              {t('admin.suspensions.liftAction', 'Lift')}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const AdminMentorSuspensionsTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: suspensions, isLoading, isError } = useActiveSuspensions();
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [liftTarget, setLiftTarget] = useState<AdminSuspensionDto | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldOff className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-sm font-semibold">
            {t('admin.suspensions.title', 'Suspended mentors')}
          </h3>
        </div>
        <Button
          size="sm"
          variant="destructive"
          className="h-8 text-xs gap-1.5"
          onClick={() => setSuspendDialogOpen(true)}
        >
          <ShieldOff className="h-3.5 w-3.5" aria-hidden="true" />
          {t('admin.suspensions.suspendNew', 'Suspend mentor')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">
          {t('common.errorLoadingData', 'Error loading data')}
        </p>
      ) : !suspensions || suspensions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground border border-dashed border-border/50 rounded-xl">
          <AlertTriangle className="w-8 h-8 opacity-30" aria-hidden="true" />
          <p className="text-sm">
            {t('admin.suspensions.empty', 'No suspensions on record.')}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b bg-muted/50">
                {[
                  t('admin.suspensions.colInstanceId', 'Instance ID'),
                  t('admin.suspensions.colReason', 'Reason'),
                  t('admin.suspensions.colSuspendedAt', 'Suspended at'),
                  t('admin.suspensions.colStatus', 'Status'),
                  t('admin.suspensions.colLiftedAt', 'Lifted at'),
                  t('admin.actions', 'Actions'),
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider last:text-right"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suspensions.map((s) => (
                <SuspensionRow
                  key={s.id}
                  suspension={s}
                  onLift={setLiftTarget}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SuspendDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen} />
      <LiftDialog suspension={liftTarget} onClose={() => setLiftTarget(null)} />
    </div>
  );
};

export default AdminMentorSuspensionsTab;
