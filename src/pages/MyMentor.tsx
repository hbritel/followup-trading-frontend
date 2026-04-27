import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Check,
  CalendarClock,
  ChevronDown,
  ExternalLink,
  Eye,
  Globe,
  HelpCircle,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Megaphone,
  Pin,
  Receipt,
  Settings2,
  ShieldCheck,
  Sparkles,
  StickyNote,
  Tag,
  Ticket,
  TrendingUp,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'sonner';
import {
  useMyMentorHub,
  useUpdateSharing,
  useLeaveInstance,
  useJoinInstance,
  usePublicMentorProfile,
  useDirectoryTags,
  useMyRemovalNotice,
  useAcknowledgeRemovalNotice,
} from '@/hooks/useMentor';
import {
  useBookMyMentorSession,
  useBuyMyMentorTicket,
  useMyBookings,
  useMyMentorOfferings,
  useMyMentorWebinars,
  useMyWebinarTickets,
} from '@/hooks/useMentorRevenue';
import { useMyTestimonial } from '@/hooks/useMentor';
import MentorPaywallCard from '@/components/mentor/monetization/MentorPaywallCard';
import StudentSubscriptionPanel, {
  PastDueBanner,
} from '@/components/mentor/monetization/StudentSubscriptionPanel';
import StudentTestimonialCard from '@/components/mentor/testimonials/StudentTestimonialCard';
import StudentSessionsList from '@/components/mentor/sessions/StudentSessionsList';
import StudentWebinarTicketsList from '@/components/mentor/webinars/StudentWebinarTicketsList';
import SessionBookingCalendar from '@/components/mentor/sessions/SessionBookingCalendar';
import WebinarCard from '@/components/mentor/webinars/WebinarCard';
import VerifiedStatsPanel from '@/components/mentor/trust/VerifiedStatsPanel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type {
  MentorAnnouncementDto,
  MentorInstanceDto,
  MentorStudentNoteDto,
  SessionOfferingDto,
} from '@/types/dto';

const CURRENCY_SYMBOL: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };

const formatPrice = (cents: number, currency: string, freeLabel: string): string => {
  if (cents === 0) return freeLabel;
  const sym = CURRENCY_SYMBOL[currency] ?? currency;
  return `${sym}${(cents / 100).toFixed(2)}`;
};

/* ── Tabs ──────────────────────────────────────────── */
const TAB_KEYS = ['overview', 'sessions', 'subscription', 'privacy'] as const;
type TabKey = (typeof TAB_KEYS)[number];
const TAB_STORAGE_KEY = 'myMentor.activeTab';

/* ── Helpers ───────────────────────────────────────── */
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

/* ── KPI primitives ────────────────────────────────── */
interface KpiCardProps {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ReactNode;
  tone?: 'primary' | 'emerald' | 'amber' | 'muted';
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, hint, icon, tone = 'primary' }) => {
  const toneClasses = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    muted: 'bg-muted text-muted-foreground',
  }[tone];

  return (
    <div className="rounded-xl border border-border/40 bg-background/60 px-3 py-2.5 flex items-center gap-3">
      <span
        className={[
          'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          toneClasses,
        ].join(' ')}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-base font-bold tabular-nums leading-tight mt-0.5">
          {value}
          {hint && (
            <span className="ml-1 text-[11px] font-medium text-muted-foreground">
              {hint}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

/* ── Announcement read-only card ───────────────────── */
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
      {item.title && <h3 className="text-base font-semibold mt-2">{item.title}</h3>}
      <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed">{item.body}</p>
    </article>
  );
};

/* ── Shared note read-only card ────────────────────── */
const SharedNoteCard: React.FC<{ note: MentorStudentNoteDto }> = ({ note }) => (
  <article className="glass-card rounded-2xl p-5 border border-border/50 space-y-2">
    <p className="text-xs text-muted-foreground">{formatRelative(note.createdAt)}</p>
    <p className="text-sm whitespace-pre-wrap leading-relaxed">{note.body}</p>
  </article>
);

/* ── Loading skeleton ──────────────────────────────── */
const HubSkeleton: React.FC = () => (
  <div className="space-y-6" aria-busy="true" aria-live="polite">
    <Skeleton className="h-9 w-48" />
    <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
      <Skeleton className="h-14 w-14 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
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
            'Join a mentor space with an invite code from your coach.',
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
          <Button type="submit" disabled={!code.trim() || joinMutation.isPending}>
            {joinMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('mentor.myMentor.empty.joinButton', 'Join')}
          </Button>
        </div>
      </form>
    </div>
  );
};

/* ── Removal notice banner (shown after a mentor evicts the student) ── */
const RemovalNoticeBanner: React.FC = () => {
  const { t } = useTranslation();
  const { data: notice } = useMyRemovalNotice();
  const ackMutation = useAcknowledgeRemovalNotice();

  if (!notice) return null;

  return (
    <section
      role="alert"
      aria-live="polite"
      className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 sm:p-6 space-y-4"
    >
      <div className="flex items-start gap-3">
        {notice.mentorLogoUrl ? (
          <img
            src={notice.mentorLogoUrl}
            alt=""
            className="h-12 w-12 rounded-xl object-cover border border-border/50 shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="h-12 w-12 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5 text-destructive" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
            {t('mentor.myMentor.removalNotice.eyebrow', 'Mentorship ended')}
          </p>
          <h2 className="text-lg font-semibold mt-0.5">
            {notice.mentorBrandName
              ? t('mentor.myMentor.removalNotice.titleNamed', '{{brand}} ended your mentorship', {
                  brand: notice.mentorBrandName,
                })
              : t('mentor.myMentor.removalNotice.title', 'Your mentor ended your mentorship')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('mentor.myMentor.removalNotice.removedAt', 'Removed on {{date}}', {
              date: new Date(notice.removedAt).toLocaleDateString(),
            })}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-background/70 border border-border/40 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          {t('mentor.myMentor.removalNotice.reasonLabel', 'Message from your mentor')}
        </p>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{notice.reason}</p>
      </div>

      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          onClick={() => ackMutation.mutate(notice.enrollmentId)}
          disabled={ackMutation.isPending}
          className="gap-1.5"
        >
          {ackMutation.isPending && (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          )}
          {t('mentor.myMentor.removalNotice.acknowledge', 'I understand — dismiss')}
        </Button>
      </div>
    </section>
  );
};

/* ── Hero: mentor identity + membership card ───────── */
interface MentorHeroProps {
  instance: MentorInstanceDto;
  joinedAt: string;
  subscriptionStatus?: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE' | null;
}

const MentorHero: React.FC<MentorHeroProps> = ({ instance, joinedAt, subscriptionStatus }) => {
  const { t } = useTranslation();
  const accentColor = instance.primaryColor || undefined;

  const statusBadge = (() => {
    if (!subscriptionStatus) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          <Check className="w-3 h-3" aria-hidden="true" />
          {t('mentor.myMentor.hero.statusFree', 'Member')}
        </span>
      );
    }
    if (subscriptionStatus === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          <Check className="w-3 h-3" aria-hidden="true" />
          {t('mentor.paywall.statusActive', 'Active')}
        </span>
      );
    }
    if (subscriptionStatus === 'PAST_DUE') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
          {t('mentor.paywall.statusPastDue', 'Past due')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted border border-border/40 px-2 py-0.5 rounded-full">
        {subscriptionStatus === 'CANCELED'
          ? t('mentor.paywall.statusCanceled', 'Canceling')
          : t('mentor.paywall.statusIncomplete', 'Incomplete')}
      </span>
    );
  })();

  return (
    <section
      className="glass-card rounded-2xl p-5 sm:p-6 border border-border/50 relative overflow-hidden transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none"
      style={accentColor ? { boxShadow: `inset 3px 0 0 0 ${accentColor}` } : undefined}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-6">
        {/* Left: brand identity */}
        <div className="flex items-start gap-4 min-w-0">
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
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('mentor.myMentor.hero.eyebrow', 'Your mentor space')}
            </p>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5 truncate">
              {instance.brandName}
            </h2>
            {instance.publicHeadline && (
              <p className="text-sm font-medium mt-1.5 max-w-2xl line-clamp-2">
                {instance.publicHeadline}
              </p>
            )}
            {!instance.publicHeadline && instance.description && (
              <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl line-clamp-2">
                {instance.description}
              </p>
            )}
            {instance.publicProfileEnabled && instance.slug && (
              <Link
                to={`/m/${instance.slug}`}
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
                {t('mentor.myMentor.viewPublicProfile', 'View public profile')}
              </Link>
            )}
          </div>
        </div>

        {/* Right: membership card */}
        <div className="rounded-xl border border-border/40 bg-background/60 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('mentor.myMentor.hero.membership', 'Membership')}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {statusBadge}
              <span className="text-xs text-muted-foreground">
                {t('mentor.myMentor.hero.joinedOn', 'Joined {{date}}', {
                  date: new Date(joinedAt).toLocaleDateString(),
                })}
              </span>
            </div>
          </div>
          {instance.publicYearsTrading != null && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              {t('mentor.publicPage.yearsValue', '{{n}} yrs', {
                n: instance.publicYearsTrading,
              })}
              <span className="opacity-50">·</span>
              {t('mentor.myMentor.hero.experience', 'Trading experience')}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/* ── Student KPI ribbon ────────────────────────────── */
interface StudentKpiRibbonProps {
  pinnedAnnouncements: number;
  totalAnnouncements: number;
  upcomingSessions: number;
  paidTickets: number;
  sharedCount: number;
}

const StudentKpiRibbon: React.FC<StudentKpiRibbonProps> = ({
  pinnedAnnouncements,
  totalAnnouncements,
  upcomingSessions,
  paidTickets,
  sharedCount,
}) => {
  const { t } = useTranslation();
  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label={t('mentor.myMentor.kpi.announcements', 'Announcements')}
        value={totalAnnouncements}
        hint={
          pinnedAnnouncements > 0
            ? t('mentor.myMentor.kpi.pinnedHint', '· {{n}} pinned', { n: pinnedAnnouncements })
            : undefined
        }
        icon={<Megaphone className="w-4 h-4" />}
        tone={pinnedAnnouncements > 0 ? 'primary' : 'muted'}
      />
      <KpiCard
        label={t('mentor.myMentor.kpi.upcomingSessions', 'Upcoming sessions')}
        value={upcomingSessions}
        icon={<CalendarClock className="w-4 h-4" />}
        tone={upcomingSessions > 0 ? 'emerald' : 'muted'}
      />
      <KpiCard
        label={t('mentor.myMentor.kpi.webinarTickets', 'Webinar tickets')}
        value={paidTickets}
        icon={<Ticket className="w-4 h-4" />}
        tone={paidTickets > 0 ? 'primary' : 'muted'}
      />
      <KpiCard
        label={t('mentor.myMentor.kpi.privacy', 'Sharing')}
        value={`${sharedCount}/3`}
        icon={<ShieldCheck className="w-4 h-4" />}
        tone={sharedCount > 0 ? 'emerald' : 'muted'}
      />
    </div>
  );
};

/* ── Sharing toggles group ─────────────────────────── */
interface SharingTogglesProps {
  shareMetrics: boolean;
  shareTrades: boolean;
  sharePsychology: boolean;
  onMetricsChange: (v: boolean) => void;
  onTradesChange: (v: boolean) => void;
  onPsychologyChange: (v: boolean) => void;
}

const SharingTogglesGroup: React.FC<SharingTogglesProps> = ({
  shareMetrics,
  shareTrades,
  sharePsychology,
  onMetricsChange,
  onTradesChange,
  onPsychologyChange,
}) => {
  const { t } = useTranslation();
  const items: Array<{
    id: 'share-metrics' | 'share-trades' | 'share-psychology';
    label: string;
    desc: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }> = [
    {
      id: 'share-metrics',
      label: t('mentor.myMentor.sharing.metrics', 'Performance metrics'),
      desc: t(
        'mentor.myMentor.sharing.metricsDesc',
        'Win rate, P&L, drawdown — aggregate stats only.',
      ),
      checked: shareMetrics,
      onChange: onMetricsChange,
    },
    {
      id: 'share-trades',
      label: t('mentor.myMentor.sharing.trades', 'Trade history'),
      desc: t(
        'mentor.myMentor.sharing.tradesDesc',
        'Symbol, entry/exit, size — individual trade records.',
      ),
      checked: shareTrades,
      onChange: onTradesChange,
    },
    {
      id: 'share-psychology',
      label: t('mentor.myMentor.sharing.psychology', 'Psychology journal'),
      desc: t(
        'mentor.myMentor.sharing.psychologyDesc',
        'Tilt score, journal entries, emotional flags.',
      ),
      checked: sharePsychology,
      onChange: onPsychologyChange,
    },
  ];

  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div
          key={it.id}
          className="flex items-start justify-between gap-4 rounded-xl bg-muted/30 px-4 py-3 border border-border/30"
        >
          <div className="min-w-0">
            <Label htmlFor={it.id} className="cursor-pointer text-sm">
              {it.label}
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">{it.desc}</p>
          </div>
          <Switch
            id={it.id}
            checked={it.checked}
            onCheckedChange={it.onChange}
            className="mt-0.5 shrink-0"
          />
        </div>
      ))}
    </div>
  );
};

/* ── Collapsible section wrapper ───────────────────── */
interface CollapsibleSectionProps {
  storageKey: string;
  defaultOpen?: boolean;
  icon: React.ReactNode;
  title: React.ReactNode;
  count?: number;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  storageKey,
  defaultOpen = true,
  icon,
  title,
  count,
  description,
  className,
  children,
}) => {
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultOpen;
    const stored = window.localStorage.getItem(`myMentor.section.${storageKey}`);
    if (stored === 'open') return true;
    if (stored === 'closed') return false;
    return defaultOpen;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      `myMentor.section.${storageKey}`,
      open ? 'open' : 'closed',
    );
  }, [storageKey, open]);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={[
        'glass-card rounded-2xl border border-border/50 overflow-hidden',
        className ?? '',
      ].join(' ')}
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between gap-3 px-5 sm:px-6 py-4 text-left hover:bg-muted/30 transition-colors motion-reduce:transition-none"
          aria-expanded={open}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-primary shrink-0" aria-hidden="true">
              {icon}
            </span>
            <h2 className="text-base font-semibold truncate">{title}</h2>
            {typeof count === 'number' && (
              <span className="text-xs text-muted-foreground tabular-nums">
                ({count})
              </span>
            )}
          </div>
          <ChevronDown
            className={[
              'w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none',
              open ? 'rotate-180' : '',
            ].join(' ')}
            aria-hidden="true"
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-3">
        {description && (
          <p className="text-xs text-muted-foreground -mt-1">{description}</p>
        )}
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

/* ── Main page ─────────────────────────────────────── */
const MyMentor: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { data: hub, isLoading } = useMyMentorHub();
  const updateSharingMutation = useUpdateSharing();
  const leaveMutation = useLeaveInstance();

  // KPI inputs (depend on hooks at top level — fine because the page is the
  // single owner of the My Mentor surface and these are tiny lists).
  const { data: bookings = [] } = useMyBookings();
  const { data: tickets = [] } = useMyWebinarTickets();
  const { data: offerings = [] } = useMyMentorOfferings();
  const { data: webinars = [] } = useMyMentorWebinars();

  // Warm cache for sub-component queries so collapsibles + tabs don't
  // trigger their own cold fetches when the user scrolls to them.
  useMyTestimonial();

  const bookSession = useBookMyMentorSession();
  const buyTicket = useBuyMyMentorTicket();
  const [bookingOffering, setBookingOffering] = useState<SessionOfferingDto | null>(null);

  // Public profile is fetched only when the mentor exposes one. Surfaces
  // tags / languages / verified stats / FAQ inside the Overview so the
  // student doesn't have to click out to the public page.
  const slug = hub?.instance?.slug ?? null;
  const publicProfileEnabled = !!hub?.instance?.publicProfileEnabled;
  const { data: publicProfile } = usePublicMentorProfile(
    publicProfileEnabled && slug ? slug : undefined,
  );
  const { data: directoryTags = [] } = useDirectoryTags();

  const resolveTagLabel = (tagSlug: string): string => {
    const tag = directoryTags.find((g) => g.slug === tagSlug);
    if (!tag) return tagSlug;
    const lang = i18n.language.split('-')[0];
    if (lang === 'fr' && tag.labelFr) return tag.labelFr;
    if (lang === 'es' && tag.labelEs) return tag.labelEs;
    return tag.labelEn;
  };

  const resolveLanguageName = (code: string): string => {
    try {
      const lang = i18n.language.split('-')[0];
      const dn = new Intl.DisplayNames([lang, 'en'], { type: 'language' });
      return dn.of(code) ?? code;
    } catch {
      return code;
    }
  };

  // Local sharing toggles — synced from hub once loaded
  const [shareMetrics, setShareMetrics] = useState(false);
  const [shareTrades, setShareTrades] = useState(false);
  const [sharePsychology, setSharePsychology] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBookSession = (scheduledAt: string) => {
    if (!bookingOffering) return;
    bookSession.mutate(
      { offeringId: bookingOffering.id, scheduledAt },
      {
        onSuccess: (data) => {
          if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
          } else {
            setBookingOffering(null);
            toast.success(
              t('mentor.myMentor.catalog.bookingPending', 'Booking created — payment pending.'),
            );
          }
        },
      },
    );
  };

  const handleBuyTicket = (webinarId: string) => {
    buyTicket.mutate(webinarId, {
      onSuccess: (data) => {
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          toast.success(
            t('mentor.myMentor.catalog.ticketPending', 'Ticket reserved — payment pending.'),
          );
        }
      },
    });
  };

  const activeOfferings = offerings.filter((o) => o.active);
  const upcomingWebinars = webinars.filter(
    (w) => w.status === 'PUBLISHED' && new Date(w.startsAt).getTime() > Date.now(),
  );

  // Tab persistence: hash > localStorage > overview default
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window === 'undefined') return 'overview';
    const hash = window.location.hash.replace('#', '');
    if ((TAB_KEYS as readonly string[]).includes(hash)) return hash as TabKey;
    const stored = window.localStorage.getItem(TAB_STORAGE_KEY);
    if (stored && (TAB_KEYS as readonly string[]).includes(stored)) {
      return stored as TabKey;
    }
    return 'overview';
  });

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

  // Auto-save sharing toggles with a 600ms debounce so users never lose a toggle change.
  useEffect(() => {
    if (!hub || !sharingDirty) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      updateSharingMutation.mutate(
        { shareMetrics, shareTrades, sharePsychology },
        {
          onSuccess: () => {
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 1800);
          },
        },
      );
    }, 600);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [shareMetrics, shareTrades, sharePsychology, hub, sharingDirty, updateSharingMutation]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TAB_STORAGE_KEY, activeTab);
    }
  }, [activeTab]);

  const handleTabChange = (next: string) => {
    if (!(TAB_KEYS as readonly string[]).includes(next)) return;
    setActiveTab(next as TabKey);
    const newHash = next === 'overview' ? '' : `#${next}`;
    if (typeof window !== 'undefined') {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}${newHash}`,
      );
    }
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
        <div className="space-y-6 max-w-2xl mx-auto">
          <RemovalNoticeBanner />
          <NotEnrolledState />
        </div>
      </DashboardLayout>
    );
  }

  const { instance, announcements, sharedNotes } = hub;
  const sub = hub.subscription ?? null;
  const isPaywalled = !!hub.subscriptionRequired && sub == null;
  const isPastDue = sub?.status === 'PAST_DUE';
  const showSubscriptionTab = !!hub.subscriptionRequired || sub != null;

  // Effective tab: respect visibility (subscription tab can be hidden)
  const tabVisibility: Record<TabKey, boolean> = {
    overview: true,
    sessions: true,
    subscription: showSubscriptionTab,
    privacy: true,
  };
  const effectiveTab: TabKey = tabVisibility[activeTab] ? activeTab : 'overview';

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // KPI computations
  const pinnedCount = sortedAnnouncements.filter((a) => a.pinned).length;
  const now = Date.now();
  const upcomingSessionsCount = bookings.filter(
    (b) => b.status === 'CONFIRMED' && new Date(b.scheduledAt).getTime() > now,
  ).length;
  const paidTicketsCount = tickets.filter((tk) => tk.status === 'PAID').length;
  const sharedCount = [shareMetrics, shareTrades, sharePsychology].filter(Boolean).length;

  const hasMentorBio = !!(
    instance.publicBio ||
    instance.publicCredentials ||
    instance.publicYearsTrading != null
  );

  return (
    <DashboardLayout pageTitle={pageTitle}>
      <div className="space-y-6">
        {/* Page header — H1 + description + Action menu */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
              {pageTitle}
            </h1>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
              {t(
                'mentor.myMentor.subtitle',
                'Announcements, sessions and privacy — everything from your mentor in one place.',
              )}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1.5 shrink-0">
                <Settings2 className="w-4 h-4" />
                {t('mentor.myMentor.actions.menu', 'Membership')}
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {instance.publicProfileEnabled && instance.slug && (
                <DropdownMenuItem asChild className="gap-2">
                  <Link to={`/m/${instance.slug}`}>
                    <Eye className="w-4 h-4" />
                    {t('mentor.myMentor.viewPublicProfile', 'View public profile')}
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={() => handleTabChange('privacy')}
                className="gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                {t('mentor.myMentor.actions.managePrivacy', 'Manage privacy')}
              </DropdownMenuItem>
              {showSubscriptionTab && (
                <DropdownMenuItem
                  onSelect={() => handleTabChange('subscription')}
                  className="gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  {t('mentor.myMentor.actions.viewSubscription', 'View subscription')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setLeaveOpen(true)}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4" />
                {t('mentor.myMentor.leave.button', 'Leave mentor space')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Hero */}
        <MentorHero
          instance={instance}
          joinedAt={hub.joinedAt}
          subscriptionStatus={sub?.status ?? null}
        />

        {isPastDue && <PastDueBanner />}

        {/* Sticky tabs — same pattern as mentor dashboard */}
        <Tabs value={effectiveTab} onValueChange={handleTabChange} className="space-y-4">
          <div className="sticky -top-4 md:-top-6 z-30 -mx-4 md:-mx-6 px-4 md:px-6 pt-3 pb-2 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-b border-border/40">
            <TabsList className="h-auto bg-transparent p-0 flex flex-wrap gap-1 justify-start w-full">
              <TabsTrigger value="overview" className="gap-1.5">
                <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />
                {t('mentor.myMentor.tabs.overview', 'Overview')}
              </TabsTrigger>
              <TabsTrigger value="sessions" className="gap-1.5">
                <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />
                {t('mentor.myMentor.tabs.sessions', 'Sessions & webinars')}
              </TabsTrigger>
              {showSubscriptionTab && (
                <TabsTrigger value="subscription" className="gap-1.5">
                  <Receipt className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('mentor.myMentor.tabs.subscription', 'Subscription')}
                </TabsTrigger>
              )}
              <TabsTrigger value="privacy" className="gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                {t('mentor.myMentor.tabs.privacy', 'Privacy')}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── OVERVIEW ─────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-6 mt-2">
            <StudentKpiRibbon
              pinnedAnnouncements={pinnedCount}
              totalAnnouncements={sortedAnnouncements.length}
              upcomingSessions={upcomingSessionsCount}
              paidTickets={paidTicketsCount}
              sharedCount={sharedCount}
            />

            {/* About your mentor — bio/credentials/years */}
            {hasMentorBio && (
              <CollapsibleSection
                storageKey="overview.about"
                defaultOpen={false}
                icon={<Sparkles className="w-4 h-4" />}
                title={t('mentor.myMentor.about.title', 'About your mentor')}
              >
                {instance.publicBio && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {instance.publicBio}
                  </p>
                )}
                {instance.publicCredentials && (
                  <div>
                    <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      {t('mentor.publicPage.credentialsTitle', 'Credentials')}
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {instance.publicCredentials}
                    </p>
                  </div>
                )}
              </CollapsibleSection>
            )}

            {/* Mentor identity — Tags + Languages (from public profile) */}
            {publicProfile &&
              ((publicProfile.tagSlugs?.length ?? 0) > 0 ||
                (publicProfile.languageCodes?.length ?? 0) > 0) && (
                <CollapsibleSection
                  storageKey="overview.identity"
                  defaultOpen={false}
                  icon={<Tag className="w-4 h-4" />}
                  title={t('mentor.myMentor.identity.title', 'Niche & languages')}
                >
                  {(publicProfile.tagSlugs?.length ?? 0) > 0 && (
                    <div>
                      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 inline-flex items-center gap-1.5">
                        <Tag className="w-3 h-3" aria-hidden="true" />
                        {t('mentor.myMentor.taxonomyTitle', 'Niche')}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {(publicProfile.tagSlugs ?? []).map((s) => (
                          <span
                            key={s}
                            className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted/70 text-muted-foreground border border-border/40"
                          >
                            {resolveTagLabel(s)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(publicProfile.languageCodes?.length ?? 0) > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 inline-flex items-center gap-1.5">
                        <Globe className="w-3 h-3" aria-hidden="true" />
                        {t('mentor.myMentor.languagesTitle', 'Languages')}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {(publicProfile.languageCodes ?? []).map((c) => (
                          <span
                            key={c}
                            className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                          >
                            {resolveLanguageName(c)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CollapsibleSection>
              )}

            {/* Verified trading stats (only when the mentor exposes them) */}
            {publicProfile?.showStatsPublicly && publicProfile.stats && (
              <CollapsibleSection
                storageKey="overview.verifiedStats"
                defaultOpen={false}
                icon={<TrendingUp className="w-4 h-4" />}
                title={t(
                  'mentor.myMentor.verifiedStats.title',
                  'Verified trading stats',
                )}
                description={t(
                  'mentor.myMentor.verifiedStats.subtitle',
                  'Independently verified — same numbers your mentor publishes on their public profile.',
                )}
              >
                <VerifiedStatsPanel stats={publicProfile.stats} />
              </CollapsibleSection>
            )}

            {/* Mentor FAQ */}
            {publicProfile && (publicProfile.faq?.length ?? 0) > 0 && (
              <CollapsibleSection
                storageKey="overview.faq"
                defaultOpen={false}
                icon={<HelpCircle className="w-4 h-4" />}
                title={t('mentor.myMentor.faq.title', 'FAQ from your mentor')}
              >
                <Accordion type="single" collapsible className="w-full">
                  {[...(publicProfile.faq ?? [])]
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((item) => (
                      <AccordionItem key={item.id} value={item.id}>
                        <AccordionTrigger className="text-sm text-left font-medium leading-snug hover:no-underline">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
              </CollapsibleSection>
            )}

            {isPaywalled ? (
              <>
                {/* Teaser: 2 most-recent announcements with gradient fade */}
                {sortedAnnouncements.length > 0 && (
                  <section
                    aria-labelledby="paywall-teaser-heading"
                    aria-describedby="paywall-teaser-desc"
                    className="relative space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-primary" aria-hidden="true" />
                      <h2 id="paywall-teaser-heading" className="text-base font-semibold">
                        {t('mentor.announcements.title', 'Announcements')}
                      </h2>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" aria-hidden="true" />
                        {t('mentor.myMentor.paywall.previewBadge', 'Preview')}
                      </span>
                    </div>
                    <p id="paywall-teaser-desc" className="sr-only">
                      {t(
                        'mentor.myMentor.paywall.teaserAria',
                        'Preview of recent announcements. Subscribe to unlock the full feed.',
                      )}
                    </p>
                    <div
                      className="relative space-y-3 max-h-[22rem] overflow-hidden"
                      aria-hidden="true"
                    >
                      {sortedAnnouncements.slice(0, 2).map((item) => (
                        <AnnouncementReadCard key={item.id} item={item} />
                      ))}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/90 to-transparent" />
                    </div>
                  </section>
                )}
                <MentorPaywallCard instance={instance} />
              </>
            ) : (
              <>
                <CollapsibleSection
                  storageKey="overview.announcements"
                  defaultOpen
                  icon={<Megaphone className="w-4 h-4" />}
                  title={t('mentor.announcements.title', 'Announcements')}
                  count={sortedAnnouncements.length}
                >
                  {sortedAnnouncements.length === 0 ? (
                    <div className="rounded-xl bg-muted/30 border border-border/30 p-6 flex flex-col items-center text-center gap-2">
                      <Megaphone className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                      <p className="text-sm text-muted-foreground max-w-sm">
                        {t(
                          'mentor.announcements.emptyDesc',
                          'No announcements yet. Check back later.',
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
                </CollapsibleSection>

                {sharedNotes && sharedNotes.length > 0 && (
                  <CollapsibleSection
                    storageKey="overview.sharedNotes"
                    defaultOpen
                    icon={<StickyNote className="w-4 h-4" />}
                    title={t('mentor.myMentor.sharedNotes.title', 'Notes from your mentor')}
                    count={sharedNotes.length}
                  >
                    <div className="space-y-3">
                      {[...sharedNotes]
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime(),
                        )
                        .map((note) => (
                          <SharedNoteCard key={note.id} note={note} />
                        ))}
                    </div>
                  </CollapsibleSection>
                )}
              </>
            )}
          </TabsContent>

          {/* ── SESSIONS & WEBINARS ──────────────────────────────────── */}
          <TabsContent value="sessions" className="space-y-6 mt-2">
            {/* Bookable session offerings published by the mentor */}
            {activeOfferings.length > 0 && (
              <CollapsibleSection
                storageKey="sessions.catalog.sessions"
                defaultOpen
                icon={<CalendarClock className="w-4 h-4" />}
                title={t(
                  'mentor.myMentor.catalog.sessionsHeading',
                  'Available 1-on-1 sessions',
                )}
                count={activeOfferings.length}
                description={t(
                  'mentor.myMentor.catalog.sessionsSubtitle',
                  'Book a 1-on-1 session directly with your mentor.',
                )}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeOfferings.map((offering) => (
                    <article
                      key={offering.id}
                      className="rounded-xl border border-border/50 bg-background/60 p-4 space-y-3 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-medium text-sm leading-snug">
                          {offering.title}
                        </h3>
                        <span className="text-sm font-semibold tabular-nums shrink-0">
                          {formatPrice(
                            offering.priceCents,
                            offering.currency,
                            t('mentor.webinars.free', 'Free'),
                          )}
                        </span>
                      </div>
                      {offering.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {offering.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {offering.durationMinutes}
                        {t('mentor.sessions.min', ' min')}
                      </p>
                      <Button
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => setBookingOffering(offering)}
                      >
                        <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />
                        {t('mentor.sessions.bookButton', 'Book session')}
                      </Button>
                    </article>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Bookable webinars published by the mentor */}
            {upcomingWebinars.length > 0 && (
              <CollapsibleSection
                storageKey="sessions.catalog.webinars"
                defaultOpen
                icon={<Ticket className="w-4 h-4" />}
                title={t(
                  'mentor.myMentor.catalog.webinarsHeading',
                  'Upcoming webinars',
                )}
                count={upcomingWebinars.length}
                description={t(
                  'mentor.myMentor.catalog.webinarsSubtitle',
                  'Group sessions and live workshops from your mentor.',
                )}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {upcomingWebinars.map((webinar) => (
                    <WebinarCard
                      key={webinar.id}
                      webinar={webinar}
                      onBuy={handleBuyTicket}
                      isBuyPending={buyTicket.isPending}
                    />
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Active bookings (pending payment / confirmed) */}
            <CollapsibleSection
              storageKey="sessions.bookings.active"
              defaultOpen
              icon={<CalendarClock className="w-4 h-4" />}
              title={t('mentor.myMentor.sessions.activeHeading', 'My upcoming sessions')}
              description={t(
                'mentor.myMentor.sessions.activeSubtitle',
                'Sessions waiting for payment or confirmed and upcoming.',
              )}
            >
              <StudentSessionsList mode="active" bare />
            </CollapsibleSection>

            {/* Past / cancelled bookings */}
            <CollapsibleSection
              storageKey="sessions.bookings.past"
              defaultOpen={false}
              icon={<CalendarClock className="w-4 h-4" />}
              title={t('mentor.myMentor.sessions.pastHeading', 'Past & cancelled sessions')}
              description={t(
                'mentor.myMentor.sessions.pastSubtitle',
                'Auto-hidden 30 days after the session date. Remove individual rows manually if you prefer.',
              )}
            >
              <StudentSessionsList mode="past" showHide bare />
            </CollapsibleSection>

            {/* Active tickets */}
            <CollapsibleSection
              storageKey="sessions.tickets.active"
              defaultOpen
              icon={<Ticket className="w-4 h-4" />}
              title={t('mentor.myMentor.tickets.activeHeading', 'My active webinar tickets')}
              description={t(
                'mentor.myMentor.tickets.activeSubtitle',
                'Tickets pending payment or paid for upcoming webinars.',
              )}
            >
              <StudentWebinarTicketsList mode="active" bare />
            </CollapsibleSection>

            {/* Past / cancelled tickets */}
            <CollapsibleSection
              storageKey="sessions.tickets.past"
              defaultOpen={false}
              icon={<Ticket className="w-4 h-4" />}
              title={t('mentor.myMentor.tickets.pastHeading', 'Refunded & cancelled tickets')}
              description={t(
                'mentor.myMentor.tickets.pastSubtitle',
                'Auto-hidden 30 days after creation. Remove individual rows manually if you prefer.',
              )}
            >
              <StudentWebinarTicketsList mode="past" showHide bare />
            </CollapsibleSection>
          </TabsContent>

          {/* ── SUBSCRIPTION ─────────────────────────────────────────── */}
          {showSubscriptionTab && (
            <TabsContent value="subscription" className="space-y-6 mt-2">
              {sub ? (
                <StudentSubscriptionPanel
                  status={sub.status}
                  currentPeriodEnd={sub.currentPeriodEnd}
                />
              ) : isPaywalled ? (
                <MentorPaywallCard instance={instance} />
              ) : null}
              <StudentTestimonialCard />
            </TabsContent>
          )}

          {/* ── PRIVACY ──────────────────────────────────────────────── */}
          <TabsContent value="privacy" className="space-y-6 mt-2">
            <section
              aria-labelledby="sharing-heading"
              className="glass-card rounded-2xl p-5 sm:p-6 border border-border/50 space-y-4"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" aria-hidden="true" />
                <h2 id="sharing-heading" className="text-base font-semibold">
                  {t('mentor.myMentor.sharing.title', 'Your mentor can see:')}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {t(
                  'mentor.myMentor.sharing.subtitle',
                  'Toggle which categories your mentor receives. Changes save automatically.',
                )}
              </p>

              <SharingTogglesGroup
                shareMetrics={shareMetrics}
                shareTrades={shareTrades}
                sharePsychology={sharePsychology}
                onMetricsChange={setShareMetrics}
                onTradesChange={setShareTrades}
                onPsychologyChange={setSharePsychology}
              />

              <div
                className="flex justify-end items-center gap-2 text-xs font-medium min-h-[1.25rem]"
                aria-live="polite"
              >
                {updateSharingMutation.isPending ? (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {t('mentor.myMentor.sharing.saving', 'Saving…')}
                  </span>
                ) : justSaved ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
                    <Check className="w-3.5 h-3.5" />
                    {t('mentor.myMentor.sharing.saved', 'Saved')}
                  </span>
                ) : (
                  <span className="text-muted-foreground/60">
                    {t('mentor.myMentor.sharing.autosaveHint', 'Changes save automatically')}
                  </span>
                )}
              </div>
            </section>

            <section className="glass-card rounded-2xl p-5 border border-border/50 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('mentor.myMentor.memberSince', 'Member since')}
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {new Date(hub.joinedAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-md">
                  {t(
                    'mentor.myMentor.leave.helper',
                    'You can leave any time — your mentor will stop seeing your shared data immediately.',
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5 shrink-0"
                onClick={() => setLeaveOpen(true)}
              >
                <LogOut className="w-4 h-4" />
                {t('mentor.myMentor.leave.button', 'Leave mentor space')}
              </Button>
            </section>
          </TabsContent>
        </Tabs>

        {/* Session booking dialog (mirrors the public profile flow) */}
        <Dialog
          open={bookingOffering !== null}
          onOpenChange={(open) => {
            if (!open) setBookingOffering(null);
          }}
        >
          <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-3">
              <DialogTitle>
                {t('mentor.sessions.calendar.title', 'Pick a time')}
              </DialogTitle>
            </DialogHeader>
            {bookingOffering && (
              <>
                <div
                  className="mx-6 mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2"
                  role="region"
                  aria-label={t('mentor.sessions.summary.aria', 'Session summary')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-primary/80">
                        {t('mentor.sessions.summary.label', 'Booking')}
                      </p>
                      <p className="font-semibold text-sm leading-snug mt-0.5">
                        {bookingOffering.title}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold tabular-nums">
                        {formatPrice(
                          bookingOffering.priceCents,
                          bookingOffering.currency,
                          t('mentor.webinars.free', 'Free'),
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {bookingOffering.durationMinutes}
                        {t('mentor.sessions.min', ' min')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
                  <SessionBookingCalendar
                    offering={bookingOffering}
                    onConfirm={handleBookSession}
                    isPending={bookSession.isPending}
                  />
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

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
                  'You will lose access to announcements and your mentor will no longer see your shared data. You can rejoin later with a new invite code.',
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
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
