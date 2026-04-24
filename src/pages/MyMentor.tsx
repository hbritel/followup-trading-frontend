import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Megaphone,
  Pin,
  LogOut,
  Loader2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
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
  useUpdateSharing,
  useLeaveInstance,
  useJoinInstance,
} from '@/hooks/useMentor';
import MentorPaywallCard from '@/components/mentor/monetization/MentorPaywallCard';
import StudentSubscriptionPanel, { PastDueBanner } from '@/components/mentor/monetization/StudentSubscriptionPanel';
import StudentTestimonialCard from '@/components/mentor/testimonials/StudentTestimonialCard';
import type { MentorAnnouncementDto } from '@/types/dto';

/* ── Announcement read-only card ───────────────────── */
const formatRelative = (iso: string): string => {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString();
};

const AnnouncementReadCard: React.FC<{ item: MentorAnnouncementDto }> = ({ item }) => {
  const { t } = useTranslation();
  return (
    <article
      className={[
        'glass-card rounded-2xl p-5 border border-border/50',
        item.pinned ? 'border-primary/40' : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {item.pinned && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-full">
            <Pin className="w-3 h-3" aria-hidden="true" />
            {t('mentor.announcements.pinned', 'Pinned')}
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          {formatRelative(item.createdAt)}
        </span>
      </div>
      {item.title && (
        <h3 className="text-base font-semibold mt-2">{item.title}</h3>
      )}
      <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed">
        {item.body}
      </p>
    </article>
  );
};

/* ── Loading skeleton ──────────────────────────────── */
const HubSkeleton: React.FC = () => (
  <div className="space-y-6" aria-busy="true" aria-live="polite">
    <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
      <Skeleton className="h-14 w-14 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
    </div>
    <Skeleton className="h-4 w-32" />
    <div className="space-y-3">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  </div>
);

/* ── Empty state: not enrolled ─────────────────────── */
const NotEnrolledState: React.FC = () => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const joinMutation = useJoinInstance();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    joinMutation.mutate(trimmed);
  };

  return (
    <div className="glass-card rounded-2xl p-8 max-w-xl mx-auto flex flex-col items-center text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Sparkles className="w-7 h-7 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">
          {t('mentor.myMentor.empty.title', 'Your trading mentor goes here')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {t(
            'mentor.myMentor.empty.desc',
            'Join a mentor space with an invite code from your coach.'
          )}
        </p>
      </div>
      <form onSubmit={handleJoin} className="w-full max-w-sm space-y-2">
        <Label htmlFor="invite-code" className="text-left block">
          {t('mentor.myMentor.empty.inputLabel', 'Invite code')}
        </Label>
        <div className="flex gap-2">
          <Input
            id="invite-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="XXXX-XXXX"
            className="flex-1"
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={!code.trim() || joinMutation.isPending}
          >
            {joinMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t('mentor.myMentor.empty.joinButton', 'Join')}
          </Button>
        </div>
      </form>
    </div>
  );
};

/* ── Main page ─────────────────────────────────────── */
const MyMentor: React.FC = () => {
  const { t } = useTranslation();
  const { data: hub, isLoading } = useMyMentorHub();
  const updateSharingMutation = useUpdateSharing();
  const leaveMutation = useLeaveInstance();

  // Local sharing toggles — synced from hub once loaded
  const [shareMetrics, setShareMetrics] = useState(false);
  const [shareTrades, setShareTrades] = useState(false);
  const [sharePsychology, setSharePsychology] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  useEffect(() => {
    if (hub) {
      setShareMetrics(hub.shareMetrics);
      setShareTrades(hub.shareTrades);
      setSharePsychology(hub.sharePsychology);
    }
  }, [hub]);

  const sharingDirty =
    hub != null &&
    (shareMetrics !== hub.shareMetrics ||
      shareTrades !== hub.shareTrades ||
      sharePsychology !== hub.sharePsychology);

  const handleUpdateSharing = () => {
    updateSharingMutation.mutate({
      shareMetrics,
      shareTrades,
      sharePsychology,
    });
  };

  const handleLeave = () => {
    leaveMutation.mutate(undefined, {
      onSuccess: () => setLeaveOpen(false),
    });
  };

  const pageTitle = t('mentor.myMentor.title', 'My Mentor');

  if (isLoading) {
    return (
      <DashboardLayout pageTitle={pageTitle}>
        <HubSkeleton />
      </DashboardLayout>
    );
  }

  if (!hub) {
    return (
      <DashboardLayout pageTitle={pageTitle}>
        <NotEnrolledState />
      </DashboardLayout>
    );
  }

  const { instance, announcements } = hub;
  const accentColor = instance.primaryColor || undefined;
  const sub = hub.subscription ?? null;
  const isPaywalled = !!hub.subscriptionRequired && sub == null;
  const isPastDue = sub?.status === 'PAST_DUE';
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <DashboardLayout pageTitle={pageTitle}>
      <div className="space-y-6">
        {/* Hero */}
        <header
          className="glass-card rounded-2xl p-5 sm:p-6 border border-border/50 relative overflow-hidden"
          style={
            accentColor ? { boxShadow: `inset 3px 0 0 0 ${accentColor}` } : undefined
          }
        >
          <div className="flex items-start gap-4">
            {instance.logoUrl ? (
              <img
                src={instance.logoUrl}
                alt=""
                className="h-14 w-14 rounded-xl object-cover border border-border/50 shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div
                className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-semibold text-xl shrink-0"
                style={{ backgroundColor: instance.primaryColor || 'hsl(var(--primary))' }}
                aria-hidden="true"
              >
                {(instance.brandName ?? '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('mentor.myMentor.title', 'My Mentor')}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5 truncate">
                {instance.brandName}
              </h1>
              {instance.description && (
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                  {instance.description}
                </p>
              )}
              {instance.publicHeadline && (
                <p className="text-sm font-medium mt-2 max-w-2xl">
                  {instance.publicHeadline}
                </p>
              )}
              {instance.publicProfileEnabled && instance.slug && (
                <Link
                  to={`/m/${instance.slug}`}
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-primary hover:underline"
                >
                  {t('mentor.myMentor.viewPublicProfile', 'View public profile')}
                </Link>
              )}
            </div>
          </div>
          {(instance.publicBio || instance.publicCredentials || instance.publicYearsTrading != null) && (
            <div className="mt-5 pt-5 border-t border-border/40 space-y-3">
              {instance.publicBio && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {instance.publicBio}
                </p>
              )}
              {instance.publicCredentials && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    {t('mentor.publicPage.credentialsTitle', 'Credentials')}
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {instance.publicCredentials}
                  </p>
                </div>
              )}
              {instance.publicYearsTrading != null && (
                <p className="text-xs text-muted-foreground">
                  {t('mentor.publicPage.yearsValue', '{{n}} yrs', { n: instance.publicYearsTrading })}
                </p>
              )}
            </div>
          )}
        </header>

        {isPastDue && <PastDueBanner />}

        {isPaywalled ? (
          <MentorPaywallCard instance={instance} />
        ) : (
        <>
        {/* Announcements feed */}
        <section aria-labelledby="my-announcements-heading" className="space-y-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" aria-hidden="true" />
            <h2 id="my-announcements-heading" className="text-base font-semibold">
              {t('mentor.announcements.title', 'Announcements')}
            </h2>
            {sortedAnnouncements.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({sortedAnnouncements.length})
              </span>
            )}
          </div>

          {sortedAnnouncements.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 flex flex-col items-center text-center gap-3 border border-border/50">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground max-w-sm">
                {t(
                  'mentor.announcements.emptyDesc',
                  'No announcements yet. Check back later.'
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedAnnouncements.map((item) => (
                <AnnouncementReadCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {/* Sharing controls */}
        <section
          aria-labelledby="sharing-heading"
          className="glass-card rounded-2xl p-5 border border-border/50 space-y-4"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" aria-hidden="true" />
            <h2 id="sharing-heading" className="text-base font-semibold">
              {t('mentor.myMentor.sharing.title', 'Your mentor can see:')}
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/30 px-4 py-3 border border-border/30">
              <Label htmlFor="share-metrics" className="cursor-pointer">
                {t('mentor.myMentor.sharing.metrics', 'Performance metrics')}
              </Label>
              <Switch
                id="share-metrics"
                checked={shareMetrics}
                onCheckedChange={setShareMetrics}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/30 px-4 py-3 border border-border/30">
              <Label htmlFor="share-trades" className="cursor-pointer">
                {t('mentor.myMentor.sharing.trades', 'Trade history')}
              </Label>
              <Switch
                id="share-trades"
                checked={shareTrades}
                onCheckedChange={setShareTrades}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/30 px-4 py-3 border border-border/30">
              <Label htmlFor="share-psychology" className="cursor-pointer">
                {t('mentor.myMentor.sharing.psychology', 'Psychology journal')}
              </Label>
              <Switch
                id="share-psychology"
                checked={sharePsychology}
                onCheckedChange={setSharePsychology}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleUpdateSharing}
              disabled={!sharingDirty || updateSharingMutation.isPending}
            >
              {updateSharingMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('mentor.myMentor.sharing.update', 'Update')}
            </Button>
          </div>
        </section>

        {/* Footer: member since + leave */}
        <footer className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted-foreground">
            {t('mentor.myMentor.memberSince', 'Member since')}{' '}
            {new Date(hub.joinedAt).toLocaleDateString()}
          </p>
          <Button
            variant="outline"
            className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => setLeaveOpen(true)}
          >
            <LogOut className="w-4 h-4" />
            {t('mentor.myMentor.leave.button', 'Leave mentor space')}
          </Button>
        </footer>

        <StudentTestimonialCard />

        {sub && (
          <StudentSubscriptionPanel
            status={sub.status}
            currentPeriodEnd={sub.currentPeriodEnd}
          />
        )}
        </>
        )}

        {/* Leave confirmation */}
        <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('mentor.myMentor.leave.confirmTitle', 'Leave mentor space?')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  'mentor.myMentor.leave.confirmDesc',
                  'You will lose access to announcements and your mentor will no longer see your shared data. You can rejoin later with a new invite code.'
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t('common.cancel', 'Cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLeave}
                disabled={leaveMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {leaveMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('mentor.myMentor.leave.button', 'Leave')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default MyMentor;
