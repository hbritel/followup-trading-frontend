import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, BadgeX, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  useVerificationCandidates,
  useVerifyMentor,
  useUnverifyMentor,
} from '@/hooks/useAdminMentor';

const AdminMentorVerificationQueue: React.FC = () => {
  const { t } = useTranslation();
  const { data: candidates = [], isLoading } = useVerificationCandidates();
  const verifyMentor = useVerifyMentor();
  const unverifyMentor = useUnverifyMentor();

  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  const handleRevoke = () => {
    if (!revokeTarget || !revokeReason.trim()) return;
    unverifyMentor.mutate(
      { instanceId: revokeTarget, reason: revokeReason.trim() },
      {
        onSuccess: () => {
          setRevokeTarget(null);
          setRevokeReason('');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <h3 className="text-sm font-semibold">
          {t('admin.mentors.verificationQueue.title', 'Verification candidates')}
        </h3>
        {candidates.length > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {candidates.length}
          </Badge>
        )}
      </div>

      {candidates.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border/50 rounded-xl">
          {t('admin.mentors.verificationQueue.empty', 'No candidates pending verification.')}
        </p>
      ) : (
        <div className="space-y-2">
          {candidates.map((candidate) => (
            <div
              key={candidate.instanceId}
              className="rounded-xl border border-border/50 p-4 flex items-start gap-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{candidate.brandName}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  ID: {candidate.instanceId}
                </p>
                {candidate.reasonsMet.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {candidate.reasonsMet.map((reason) => (
                      <span
                        key={reason}
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setRevokeTarget(candidate.instanceId)}
                >
                  <BadgeX className="w-3.5 h-3.5" />
                  {t('admin.mentors.verificationQueue.revoke', 'Revoke')}
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => verifyMentor.mutate(candidate.instanceId)}
                  disabled={verifyMentor.isPending}
                >
                  {verifyMentor.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <BadgeCheck className="w-3.5 h-3.5" />
                  )}
                  {t('admin.mentors.verificationQueue.approve', 'Approve')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRevokeTarget(null);
            setRevokeReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('admin.mentors.verificationQueue.revokeTitle', 'Revoke verification')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'admin.mentors.verificationQueue.revokeDesc',
                'Provide a reason for revoking this mentor\'s verified status. They will be notified.'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="revoke-reason">
              {t('admin.mentors.verificationQueue.reasonLabel', 'Reason')} *
            </Label>
            <Textarea
              id="revoke-reason"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder={t(
                'admin.mentors.verificationQueue.reasonPlaceholder',
                'Explain why verification is being revoked…'
              )}
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setRevokeTarget(null);
                setRevokeReason('');
              }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={!revokeReason.trim() || unverifyMentor.isPending}
              className="gap-2"
            >
              {unverifyMentor.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {t('admin.mentors.verificationQueue.confirmRevoke', 'Revoke verification')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMentorVerificationQueue;
