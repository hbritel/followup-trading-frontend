import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import {
  useMyMentorHub,
  useJoinInstance,
  useUpdateSharing,
  useLeaveInstance,
} from '@/hooks/useMentor';

const MyMentorSettings: React.FC = () => {
  const { t } = useTranslation();
  const { data: hub, isLoading } = useMyMentorHub();
  const myInstance = hub?.instance ?? null;
  const joinMutation = useJoinInstance();
  const updateSharingMutation = useUpdateSharing();
  const leaveMutation = useLeaveInstance();

  const [inviteInput, setInviteInput] = useState('');
  const [leaveOpen, setLeaveOpen] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;
    joinMutation.mutate(inviteInput.trim());
    setInviteInput('');
  };

  const handleToggle = (
    field: 'shareMetrics' | 'shareTrades' | 'sharePsychology',
    value: boolean
  ) => {
    updateSharingMutation.mutate({ [field]: value });
  };

  const handleLeave = () => {
    leaveMutation.mutate(undefined, {
      onSuccess: () => setLeaveOpen(false),
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  /* ── Not in an instance — show join form ────────────────── */
  if (!myInstance) {
    return (
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center">
            <GraduationCap className="h-4.5 w-4.5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold">
              {t('mentor.noInstance', "You're not part of a mentor program")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('mentor.enterCode', 'Enter an invite code to join one')}
            </p>
          </div>
        </div>
        <form onSubmit={handleJoin} className="flex gap-2">
          <Input
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            placeholder="abc123"
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={joinMutation.isPending || !inviteInput.trim()}
          >
            {joinMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t('mentor.joinInstance', 'Join')}
          </Button>
        </form>
      </div>
    );
  }

  /* ── In an instance — show info + sharing toggles ───────── */
  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-3 mb-1">
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: `${myInstance.primaryColor}15`,
          }}
        >
          <GraduationCap
            className="h-4.5 w-4.5"
            style={{ color: myInstance.primaryColor }}
          />
        </div>
        <div>
          <h3 className="text-base font-semibold">{myInstance.brandName}</h3>
          {myInstance.description && (
            <p className="text-sm text-muted-foreground">
              {myInstance.description}
            </p>
          )}
        </div>
      </div>

      {/* Sharing toggles */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">
          {t('mentor.sharingPreferences', 'Sharing Preferences')}
        </p>

        {([
          { key: 'shareMetrics' as const, label: t('mentor.shareMetrics', 'Share performance metrics') },
          { key: 'shareTrades' as const, label: t('mentor.shareTrades', 'Share trade history') },
          { key: 'sharePsychology' as const, label: t('mentor.sharePsychology', 'Share psychology data') },
        ]).map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <Label htmlFor={`sharing-${key}`} className="text-sm cursor-pointer">
              {label}
            </Label>
            <Switch
              id={`sharing-${key}`}
              checked={hub ? (hub[key] ?? false) : false}
              onCheckedChange={(checked) => handleToggle(key, checked)}
              disabled={updateSharingMutation.isPending}
            />
          </div>
        ))}
      </div>

      {/* Leave button */}
      <div className="pt-2 border-t border-border/50">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setLeaveOpen(true)}
          className="gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          {t('mentor.leaveInstance', 'Leave Instance')}
        </Button>
      </div>

      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('mentor.leaveInstance', 'Leave Instance')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'mentor.leaveConfirm',
                'Are you sure you want to leave this mentor program? You will need a new invite code to rejoin.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeave}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {leaveMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('mentor.leaveInstance', 'Leave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyMentorSettings;
