import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueries } from '@tanstack/react-query';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Activity,
  Loader2,
  Copy,
  Check,
  Share2,
  Search,
  Settings2,
  MailPlus,
  Pencil,
  Trash2,
  ExternalLink,
  ChevronDown,
  Globe,
  Eye,
  Compass,
  HelpCircle,
  Minimize2,
  LayoutDashboard,
  CalendarClock,
  BarChart3,
  ShieldCheck,
  Video,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StudentList from '@/components/mentor/StudentList';
import StudentDetailModal from '@/components/mentor/StudentDetailModal';
import AnnouncementsSection from '@/components/mentor/AnnouncementsSection';
import AtRiskDialog from '@/components/mentor/AtRiskDialog';
import CohortsSection from '@/components/mentor/CohortsSection';
import CohortFilterChips from '@/components/mentor/CohortFilterChips';
import ActivityFeed from '@/components/mentor/ActivityFeed';
import MonetizationSection from '@/components/mentor/monetization/MonetizationSection';
import PublicProfileSection from '@/components/mentor/publicprofile/PublicProfileSection';
import MentorSetupChecklist from '@/components/mentor/publicprofile/MentorSetupChecklist';
import TestimonialsSection from '@/components/mentor/testimonials/TestimonialsSection';
import SessionOfferingEditor from '@/components/mentor/sessions/SessionOfferingEditor';
import SessionsKpiRibbon from '@/components/mentor/sessions/SessionsKpiRibbon';
import InsightsKpiRibbon from '@/components/mentor/insights/InsightsKpiRibbon';
import MentorSessionsList from '@/components/mentor/sessions/MentorSessionsList';
import WebinarEditor from '@/components/mentor/webinars/WebinarEditor';
import WebinarAttendeesList from '@/components/mentor/webinars/WebinarAttendeesList';
import FunnelReportPanel from '@/components/mentor/analytics/FunnelReportPanel';
import MentorTagsPicker from '@/components/mentor/settings/MentorTagsPicker';
import MentorLanguagesPicker from '@/components/mentor/settings/MentorLanguagesPicker';
import PublicStatsToggle from '@/components/mentor/settings/PublicStatsToggle';
import CancellationPolicySelector from '@/components/mentor/settings/CancellationPolicySelector';
import MentorJurisdictionPicker from '@/components/mentor/settings/MentorJurisdictionPicker';
import MentorFaqEditor from '@/components/mentor/faq/MentorFaqEditor';
import MentorCohortOverridesPanel from '@/components/mentor/cohorts/MentorCohortOverridesPanel';
import MentorLeadsInbox from '@/components/mentor/contact/MentorLeadsInbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useMentorInstance,
  useMentorStudents,
  useRemoveStudent,
  useCreateInstance,
  useUpdateInstance,
  useDeleteInstance,
  useMentorMetricsSummary,
  useMentorCohorts,
} from '@/hooks/useMentor';
import { mentorService } from '@/services/mentor.service';
import type {
  CreateInstanceRequestDto,
  MentorInstanceDto,
  MentorCohortDto,
} from '@/types/dto';
import { toast } from 'sonner';

/* ─────────────────── KPI Card ─────────────────── */
interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
  hint?: string;
  onClick?: () => void;
  ariaExpanded?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  icon,
  colorClass,
  hint,
  onClick,
  ariaExpanded,
}) => {
  const interactive = !!onClick;
  const className =
    'glass-card rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:transform-none text-left' +
    (interactive
      ? ' cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60'
      : '');

  const content = (
    <>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
          {label}
        </p>
        <p className="text-2xl font-bold tracking-tight mt-1 tabular-nums">{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground/70 mt-1">{hint}</p>}
      </div>
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={className}
        aria-expanded={ariaExpanded}
      >
        {content}
      </button>
    );
  }
  return <div className={className}>{content}</div>;
};

/* ───────────────── Instance Form ───────────────── */
interface InstanceFormFieldsProps {
  brandName: string;
  setBrandName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  logoUrl: string;
  setLogoUrl: (v: string) => void;
  primaryColor: string;
  setPrimaryColor: (v: string) => void;
}

const InstanceFormFields: React.FC<InstanceFormFieldsProps> = ({
  brandName,
  setBrandName,
  description,
  setDescription,
  logoUrl,
  setLogoUrl,
  primaryColor,
  setPrimaryColor,
}) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mentor-brand">{t('mentor.brandName', 'Brand Name')}</Label>
        <Input
          id="mentor-brand"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder="Trading Academy"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mentor-desc">{t('mentor.description', 'Description')}</Label>
        <Textarea
          id="mentor-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Learn trading with guided mentorship..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mentor-logo">{t('mentor.logoUrl', 'Logo URL')}</Label>
          <Input
            id="mentor-logo"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mentor-color">{t('mentor.primaryColor', 'Primary Color')}</Label>
          <div className="flex gap-2">
            <Input
              id="mentor-color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#6366f1"
              className="flex-1"
            />
            <div
              className="w-10 h-10 rounded-lg border border-border/50 flex-shrink-0"
              style={{ backgroundColor: primaryColor }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ───────────────── Invite Hero ───────────────── */
const InviteHero: React.FC<{ instance: MentorInstanceDto }> = ({ instance }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/join/${instance.inviteCode}`;

  const copy = async (text: string, successKey: string, fallback: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(t(successKey, fallback));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('common.copyFailed', 'Copy failed'));
    }
  };

  const capacityPct = instance.maxStudents
    ? Math.min(100, Math.round((instance.currentStudents / instance.maxStudents) * 100))
    : 0;
  const atCapacity = capacityPct >= 100;
  const nearCapacity = capacityPct >= 90 && !atCapacity;
  const warnCapacity = capacityPct >= 75 && !nearCapacity && !atCapacity;

  const accentColor = instance.primaryColor || undefined;

  return (
    <div
      className="glass-card rounded-2xl p-5 sm:p-6 border border-border/50 relative overflow-hidden transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none"
      style={
        accentColor
          ? { boxShadow: `inset 3px 0 0 0 ${accentColor}` }
          : undefined
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-6">
        {/* Left: brand + capacity */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            {instance.logoUrl ? (
              <img
                src={instance.logoUrl}
                alt=""
                className="h-12 w-12 rounded-xl object-cover border border-border/50"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-semibold text-lg"
                style={{ backgroundColor: instance.primaryColor || 'hsl(var(--primary))' }}
                aria-hidden="true"
              >
                {(instance.brandName ?? '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                {t('mentor.brandName', 'Brand Name')}
              </p>
              <p className="text-lg font-semibold truncate">{instance.brandName}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t('mentor.studentsUsed', '{{count}}/{{max}} students', {
                  count: instance.currentStudents,
                  max: instance.maxStudents,
                })}
              </span>
              <div className="flex items-center gap-2">
                {instance.maxStudents > 0 && (
                  atCapacity ? (
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-destructive/15 text-destructive border-destructive/40">
                      {t('mentor.slotsFull', 'Full · upgrade to grow')}
                    </span>
                  ) : (
                    <span
                      className={[
                        'text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-full border',
                        nearCapacity
                          ? 'text-amber-700 bg-amber-500/15 border-amber-500/40 dark:text-amber-300'
                          : warnCapacity
                            ? 'text-amber-600 bg-amber-500/10 border-amber-500/25 dark:text-amber-400'
                            : 'text-emerald-700 bg-emerald-500/10 border-emerald-500/25 dark:text-emerald-400',
                      ].join(' ')}
                    >
                      {t('mentor.slotsLeft', '{{n}} slots left', {
                        n: Math.max(0, instance.maxStudents - instance.currentStudents),
                      })}
                    </span>
                  )
                )}
                <span
                  className={[
                    'text-xs font-medium tabular-nums',
                    atCapacity
                      ? 'text-destructive'
                      : nearCapacity
                        ? 'text-amber-500 dark:text-amber-400'
                        : warnCapacity
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground/70',
                  ].join(' ')}
                >
                  {capacityPct}%
                </span>
              </div>
            </div>
            <Progress
              value={capacityPct}
              className={[
                'h-2 transition-colors duration-200',
                atCapacity
                  ? '[&>div]:bg-destructive'
                  : nearCapacity
                    ? '[&>div]:bg-amber-500'
                    : '',
              ].join(' ')}
              aria-label={t('mentor.studentsUsed', '{{count}}/{{max}} students', {
                count: instance.currentStudents,
                max: instance.maxStudents,
              })}
            />
            {atCapacity && (
              <p className="text-xs text-destructive mt-1">
                {t('mentor.capacityReached', 'Max students reached. Upgrade or remove members.')}
              </p>
            )}
          </div>
        </div>

        {/* Right: invite link */}
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <MailPlus className="w-4 h-4 text-primary" aria-hidden="true" />
              {t('mentor.inviteLink', 'Invite Link')}
            </p>
            <div className="flex items-stretch gap-2">
              <div className="flex-1 rounded-lg bg-muted/40 border border-border/40 px-3 py-2 font-mono text-xs break-all min-w-0">
                {link}
              </div>
              <Button
                type="button"
                onClick={() =>
                  copy(link, 'mentor.linkCopied', 'Link copied')
                }
                className={[
                  'shrink-0 gap-1.5 transition-colors duration-200',
                  copied ? 'bg-emerald-500 hover:bg-emerald-500 text-white' : '',
                ].join(' ')}
                aria-label={t('mentor.copyLink', 'Copy link')}
              >
                {copied ? (
                  <Check className="w-4 h-4 motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-200" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {copied
                    ? t('mentor.copied', 'Copied')
                    : t('mentor.copyLink', 'Copy link')}
                </span>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Share2 className="w-4 h-4" />
                  {t('mentor.share', 'Share')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onSelect={() => copy(link, 'mentor.linkCopied', 'Link copied')}
                >
                  {t('mentor.copyLink', 'Copy link')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    copy(instance.inviteCode, 'mentor.codeCopied', 'Code copied')
                  }
                >
                  {t('mentor.copyCode', 'Copy code only')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    copy(
                      t(
                        'mentor.shareSnippet',
                        'Join {{brand}} on FollowUp Trading: {{link}}',
                        { brand: instance.brandName, link }
                      ),
                      'mentor.snippetCopied',
                      'Invite snippet copied'
                    )
                  }
                >
                  {t('mentor.copySnippet', 'Copy invite snippet')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-xs text-muted-foreground font-mono">
              {instance.inviteCode}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ───────────────── Edit Modal ───────────────── */
interface EditInstanceModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  instance: MentorInstanceDto;
}

const EditInstanceModal: React.FC<EditInstanceModalProps> = ({
  open,
  onOpenChange,
  instance,
}) => {
  const { t } = useTranslation();
  const updateMutation = useUpdateInstance();

  const [brandName, setBrandName] = useState(instance.brandName ?? '');
  const [description, setDescription] = useState(instance.description ?? '');
  const [logoUrl, setLogoUrl] = useState(instance.logoUrl ?? '');
  const [primaryColor, setPrimaryColor] = useState(instance.primaryColor ?? '#6366f1');

  useEffect(() => {
    if (open) {
      setBrandName(instance.brandName ?? '');
      setDescription(instance.description ?? '');
      setLogoUrl(instance.logoUrl ?? '');
      setPrimaryColor(instance.primaryColor ?? '#6366f1');
    }
  }, [open, instance]);

  const handleSave = () => {
    const payload: Partial<CreateInstanceRequestDto> = {
      brandName,
      description: description || undefined,
      logoUrl: logoUrl || undefined,
      primaryColor,
    };
    updateMutation.mutate(payload, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('mentor.editInstance', 'Edit mentor space')}</DialogTitle>
          <DialogDescription>
            {t('mentor.editInstanceDesc', 'Manage your mentor program')}
          </DialogDescription>
        </DialogHeader>

        <InstanceFormFields
          brandName={brandName}
          setBrandName={setBrandName}
          description={description}
          setDescription={setDescription}
          logoUrl={logoUrl}
          setLogoUrl={setLogoUrl}
          primaryColor={primaryColor}
          setPrimaryColor={setPrimaryColor}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || !brandName.trim()}
          >
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t('common.save', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ───────────────── Onboarding Card ───────────────── */
const OnboardingCard: React.FC = () => {
  const { t } = useTranslation();
  const createMutation = useCreateInstance();

  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateInstanceRequestDto = {
      brandName,
      description: description || undefined,
      logoUrl: logoUrl || undefined,
      primaryColor,
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="glass-card rounded-2xl p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            {t('mentor.createSpace', 'Create your mentor space')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t(
              'mentor.createInstanceDesc',
              'Set up a mentor program for your students'
            )}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <InstanceFormFields
          brandName={brandName}
          setBrandName={setBrandName}
          description={description}
          setDescription={setDescription}
          logoUrl={logoUrl}
          setLogoUrl={setLogoUrl}
          primaryColor={primaryColor}
          setPrimaryColor={setPrimaryColor}
        />
        <Button
          type="submit"
          disabled={createMutation.isPending || !brandName.trim()}
        >
          {createMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {t('mentor.createSpace', 'Create your mentor space')}
        </Button>
      </form>
    </div>
  );
};

/* ───────────── Cohort membership hook ───────────── */
/**
 * Fetches cohort-membership for each student in parallel via useQueries.
 * Returns a map: studentUserId → cohortIds[].
 *
 * Shares query keys with `useStudentCohorts`, so React Query de-duplicates
 * requests when the detail modal is also open.
 */
const useStudentCohortMap = (
  studentUserIds: string[],
  enabled: boolean
): Map<string, string[]> => {
  const results = useQueries({
    queries: studentUserIds.map((id) => ({
      queryKey: ['mentor', 'student-cohorts', id],
      queryFn: () => mentorService.getStudentCohorts(id),
      enabled,
      staleTime: 60 * 1000,
    })),
  });

  return useMemo(() => {
    const map = new Map<string, string[]>();
    studentUserIds.forEach((id, idx) => {
      const r = results[idx];
      const cohorts = (r?.data ?? []) as MentorCohortDto[];
      map.set(id, cohorts.map((c) => c.id));
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentUserIds.join('|'), results.map((r) => r.dataUpdatedAt).join('|')]);
};

/* ───────────────── Main Page ───────────────── */
const Mentor: React.FC = () => {
  const { t } = useTranslation();
  const { data: instance, isLoading: instanceLoading } = useMentorInstance();
  const { data: students, isLoading: studentsLoading } = useMentorStudents();
  const { data: cohorts } = useMentorCohorts();
  const removeMutation = useRemoveStudent();

  const deleteMutation = useDeleteInstance();

  const [selectedStudent, setSelectedStudent] = useState<string | undefined>(undefined);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [atRiskOpen, setAtRiskOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'joined' | 'sharing'>('joined');

  // Maturity-based progressive disclosure. Power users can override via the
  // header "Show all sections" toggle (persisted to localStorage).
  const [forceFullView, setForceFullView] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mentor.forceFullView') === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      if (forceFullView) localStorage.setItem('mentor.forceFullView', '1');
      else localStorage.removeItem('mentor.forceFullView');
    } catch {
      /* noop */
    }
  }, [forceFullView]);

  // Tab state. MUST be declared before any early returns or React will throw
  // "Rendered more hooks than during the previous render" when instance flips
  // from undefined → loaded. Stage gating happens later via `effectiveTab`.
  const TAB_KEYS = ['overview', 'profile', 'sessions', 'insights', 'compliance'] as const;
  type TabKey = typeof TAB_KEYS[number];
  const readInitialTab = (): TabKey => {
    if (typeof window === 'undefined') return 'overview';
    const hash = window.location.hash.replace(/^#/, '').split('?')[0];
    return (TAB_KEYS as readonly string[]).includes(hash) ? (hash as TabKey) : 'overview';
  };
  const [activeTab, setActiveTab] = useState<TabKey>(() => readInitialTab());
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '').split('?')[0];
      if ((TAB_KEYS as readonly string[]).includes(hash)) {
        setActiveTab(hash as TabKey);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cohort filter is now Overview-global. Hydrate from URL `?cohort=id1,id2`
  // on mount so deep links / page reloads preserve the active filter, and
  // sync back to the URL whenever it changes via replaceState.
  const [selectedCohorts, setSelectedCohorts] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    const raw = new URLSearchParams(window.location.search).get('cohort');
    if (!raw) return new Set();
    return new Set(raw.split(',').filter(Boolean));
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (selectedCohorts.size === 0) {
      params.delete('cohort');
    } else {
      params.set('cohort', Array.from(selectedCohorts).join(','));
    }
    const search = params.toString();
    const newUrl = `${window.location.pathname}${search ? '?' + search : ''}${window.location.hash}`;
    window.history.replaceState(null, '', newUrl);
  }, [selectedCohorts]);

  // KPI strip honors the Overview-global cohort filter when exactly one
  // cohort is selected. Multi-select degrades to "all students" — backend
  // stat endpoint takes a single cohort id. Must come after selectedCohorts
  // state declaration above.
  const summaryCohortId =
    selectedCohorts.size === 1 ? Array.from(selectedCohorts)[0] : undefined;
  const { data: summary } = useMentorMetricsSummary(summaryCohortId);

  const handleSelectStudent = (userId: string) => {
    setSelectedStudent(userId);
    setDetailOpen(true);
  };

  const handleRemoveStudent = (userId: string) => {
    removeMutation.mutate(userId);
  };

  const studentList = useMemo(() => students ?? [], [students]);
  const cohortList = useMemo(() => cohorts ?? [], [cohorts]);

  // Only fetch per-student cohort membership when a filter is active OR
  // chips are shown — which is whenever at least one cohort exists.
  const needsMembership = cohortList.length > 0;
  const studentIds = useMemo(
    () => studentList.map((s) => s.studentUserId),
    [studentList]
  );
  const studentCohortMap = useStudentCohortMap(studentIds, needsMembership);

  const visibleStudentIds = useMemo(() => {
    if (selectedCohorts.size === 0) return undefined;
    const set = new Set<string>();
    for (const s of studentList) {
      const memberOf = studentCohortMap.get(s.studentUserId) ?? [];
      if (memberOf.some((id) => selectedCohorts.has(id))) {
        set.add(s.studentUserId);
      }
    }
    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCohorts, studentList, studentCohortMap]);

  const toggleCohort = (cohortId: string) => {
    setSelectedCohorts((prev) => {
      const next = new Set(prev);
      if (next.has(cohortId)) next.delete(cohortId);
      else next.add(cohortId);
      return next;
    });
  };

  const pageTitle = instance?.brandName || t('mentor.title', 'Mentor Hub');

  if (instanceLoading || studentsLoading) {
    return (
      <DashboardLayout pageTitle={t('mentor.title', 'Mentor Hub')}>
        <div className="space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
          <div className="h-6 w-48 rounded-lg bg-muted/50" />
          <div className="glass-card rounded-2xl p-6 h-40 bg-muted/20" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 h-28 bg-muted/20" />
            ))}
          </div>
          <div className="glass-card rounded-2xl p-5 h-64 bg-muted/20" />
        </div>
      </DashboardLayout>
    );
  }

  // First-time onboarding
  if (!instance) {
    return (
      <DashboardLayout pageTitle={t('mentor.title', 'Mentor Hub')}>
        <OnboardingCard />
      </DashboardLayout>
    );
  }

  const avgWinRateValue =
    summary?.avgWinRate != null ? `${(summary.avgWinRate * 100).toFixed(1)}%` : '—';

  const publicLink = `${window.location.origin}/join/${instance.inviteCode}`;
  const publicProfileUrl =
    instance.publicProfileEnabled && instance.slug
      ? `${window.location.origin}/m/${instance.slug}`
      : null;

  const handleCopyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      toast.success(t('mentor.linkCopied', 'Link copied'));
    } catch {
      toast.error(t('common.copyFailed', 'Copy failed'));
    }
  };

  const handleCopyPublicProfile = async () => {
    if (!publicProfileUrl) return;
    try {
      await navigator.clipboard.writeText(publicProfileUrl);
      toast.success(t('mentor.publicProfileCopied', 'Public profile link copied'));
    } catch {
      toast.error(t('common.copyFailed', 'Copy failed'));
    }
  };

  const scrollToPublicProfileSection = () => {
    const el = document.getElementById('public-profile-heading');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        setDeleteOpen(false);
      },
    });
  };

  const atRiskStudents = summary?.atRiskStudents ?? [];

  // Stages: SETUP (no students) → GROWING (1-9) → ESTABLISHED (10+).
  // forceFullView upgrades to ESTABLISHED for power users.
  const studentCount = instance.currentStudents;
  const stage: 'SETUP' | 'GROWING' | 'ESTABLISHED' = forceFullView
    ? 'ESTABLISHED'
    : studentCount === 0
      ? 'SETUP'
      : studentCount < 10
        ? 'GROWING'
        : 'ESTABLISHED';
  const showGrowingPlus = stage !== 'SETUP';
  const showEstablished = stage === 'ESTABLISHED';

  // Tab structure replaces the long single-scroll page. Visibility is
  // stage-driven: SETUP shows overview + profile only, GROWING adds
  // sessions + insights, ESTABLISHED unlocks compliance.
  const tabVisibility: Record<TabKey, boolean> = {
    overview: true,
    profile: true,
    sessions: showGrowingPlus,
    insights: showGrowingPlus,
    compliance: showEstablished,
  };
  // Effective tab is a derived value, NOT a separate state — keeps the page
  // clear of conditional hooks. If the persisted activeTab is no longer
  // allowed (stage retracted), fall back to overview without re-rendering.
  const effectiveTab: TabKey = tabVisibility[activeTab] ? activeTab : 'overview';

  const handleTabChange = (next: string) => {
    if (!(TAB_KEYS as readonly string[]).includes(next)) return;
    setActiveTab(next as TabKey);
    const newHash = next === 'overview' ? '' : `#${next}`;
    if (typeof window !== 'undefined') {
      // Use replaceState so deep-linking works without polluting browser history.
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}${newHash}`,
      );
    }
  };

  return (
    <DashboardLayout pageTitle={pageTitle}>
      <div className="space-y-6">
        {/* Page header: H1 title + description + Manage dropdown */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
              {pageTitle}
            </h1>
            {instance.description ? (
              <p className="text-muted-foreground mt-1 max-w-2xl">
                {instance.description}
              </p>
            ) : (
              <p className="text-muted-foreground mt-1 text-sm italic">
                {t(
                  'mentor.noDescription',
                  'No description yet. Click Manage → Edit to add one.'
                )}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1.5 shrink-0">
                <Settings2 className="w-4 h-4" />
                {t('mentor.manageSpace', 'Manage space')}
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onSelect={() => setEditOpen(true)} className="gap-2">
                <Pencil className="w-4 h-4" />
                {t('mentor.editDetails', 'Edit details')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={handleCopyPublicLink}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                {t('mentor.copyInviteLink', 'Copy invite link')}
              </DropdownMenuItem>
              {publicProfileUrl ? (
                <DropdownMenuItem
                  onSelect={() => window.open(publicProfileUrl, '_blank', 'noopener')}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {t('mentor.viewPublicProfile', 'View public profile')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={scrollToPublicProfileSection}
                  className="gap-2"
                >
                  <Globe className="w-4 h-4" />
                  {t('mentor.setUpPublicProfile', 'Set up public profile')}
                </DropdownMenuItem>
              )}
              {/* Compact-view toggle only surfaces when forceFullView is on
                  so a power user can roll back. SETUP/GROWING users get
                  "Show all" via the stage banner button instead — keeps the
                  dropdown at ≤4 items in the common case. */}
              {forceFullView && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setForceFullView(false);
                    }}
                    className="gap-2"
                  >
                    <Minimize2 className="w-4 h-4" />
                    {t('mentor.viewMode.compact', 'Compact view')}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setDeleteOpen(true)}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                {t('mentor.deleteSpace', 'Delete space')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Stage banner — explains why some sections are hidden */}
        {!forceFullView && stage !== 'ESTABLISHED' && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 mt-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="font-semibold text-primary">
                {stage === 'SETUP'
                  ? t('mentor.stage.setupBadge', 'Setup mode')
                  : t('mentor.stage.growingBadge', 'Growing mode')}
              </span>
              <span className="opacity-50">·</span>
              <span className="min-w-0">
                {stage === 'SETUP'
                  ? t(
                      'mentor.stage.setupHint',
                      'Sessions, cohorts, activity, analytics and trust panels unlock once your first student joins.'
                    )
                  : t(
                      'mentor.stage.growingHint',
                      'Webinars, funnel analytics and trust panels unlock at 10 students. Show them all now if you need them sooner.'
                    )}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                    aria-label={t('mentor.stage.whyLabel', 'Why is this hidden?')}
                  >
                    <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    {t('mentor.stage.why', 'Why?')}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 text-xs leading-relaxed space-y-2" align="start">
                  <p className="font-semibold text-foreground">
                    {t('mentor.stage.whyTitle', 'Why we stage your dashboard')}
                  </p>
                  <p className="text-muted-foreground">
                    {t(
                      'mentor.stage.whyBody',
                      'A new mentor space has 14+ panels. Showing them all at once made first-time mentors freeze. We hide advanced sections until they would actually carry data — sessions when you have students to book, analytics when you have traffic, trust panels once you are ready for compliance.'
                    )}
                  </p>
                  <p className="text-muted-foreground">
                    {t(
                      'mentor.stage.whyEscape',
                      'Click "Show all" any time — your choice persists across reloads.'
                    )}
                  </p>
                </PopoverContent>
              </Popover>
            </div>
            <button
              type="button"
              onClick={() => setForceFullView(true)}
              className="text-xs font-medium text-primary hover:underline shrink-0"
            >
              {t('mentor.viewMode.showAll', 'Show all')}
            </button>
          </div>
        )}

        {/* Invite hero — always above tabs (top-of-page identity + capacity + invite link) */}
        <InviteHero instance={instance} />

        {/* Tabbed dashboard — replaces the previous 14-section vertical scroll.
            Sticky wrapper sits inside the DashboardLayout scroll container
            (`<div className="flex-1 p-4 md:p-6 overflow-auto">`). The negative
            margins + matching horizontal padding stretch the sticky bar across
            the full width of that container, so the backdrop-blur covers the
            scroll edges instead of leaving a gutter on each side. Negative
            top offsets pull the bar above the container's padding-top so it
            actually clings to the very top edge when scrolling. */}
        <Tabs value={effectiveTab} onValueChange={handleTabChange} className="space-y-4">
          <div className="sticky -top-4 md:-top-6 z-30 -mx-4 md:-mx-6 px-4 md:px-6 pt-3 pb-2 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-b border-border/40">
            <TabsList className="h-auto bg-transparent p-0 flex flex-wrap gap-1 justify-start w-full">
              <TabsTrigger value="overview" className="gap-1.5">
                <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />
                {t('mentor.tabs.overview', 'Overview')}
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-1.5">
                <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                {t('mentor.tabs.profile', 'Public profile')}
              </TabsTrigger>
              {tabVisibility.sessions && (
                <TabsTrigger value="sessions" className="gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('mentor.tabs.sessions', 'Sessions & webinars')}
                </TabsTrigger>
              )}
              {tabVisibility.insights && (
                <TabsTrigger value="insights" className="gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('mentor.tabs.insights', 'Insights')}
                </TabsTrigger>
              )}
              {tabVisibility.compliance && (
                <TabsTrigger value="compliance" className="gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('mentor.tabs.compliance', 'Compliance')}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* ── OVERVIEW ─────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-6 mt-2">
            {/* Cohort filter — Overview-global (applies to KPIs, students,
                activity). Sits at the very top so it reads as a page-wide
                control, not a section-local filter. */}
            {cohortList.length > 0 && (
              <div
                className={[
                  'flex items-center justify-between gap-3 flex-wrap rounded-xl border px-3 py-2',
                  selectedCohorts.size > 0
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border/40 bg-muted/15',
                ].join(' ')}
              >
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('mentor.cohorts.overviewFilterLabel', 'Cohort filter')}
                  </span>
                  <CohortFilterChips
                    cohorts={cohortList}
                    selected={selectedCohorts}
                    onToggle={toggleCohort}
                    onClear={() => setSelectedCohorts(new Set())}
                    totalStudents={studentList.length}
                  />
                </div>
                {selectedCohorts.size > 0 && (
                  <span className="text-[11px] text-primary font-medium shrink-0">
                    {t('mentor.cohorts.activeFilterHint', 'Filtering students + activity')}
                  </span>
                )}
              </div>
            )}

            {/* Setup checklist — guides first-time mentors to first paying student */}
            <MentorSetupChecklist
              instance={instance}
              onStepClick={(anchor) => {
                const el = document.getElementById(anchor);
                if (el) {
                  // Switch tab if the anchor lives elsewhere.
                  if (anchor === 'public-profile-heading') handleTabChange('profile');
                  setTimeout(() => {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('ring-2', 'ring-primary/60', 'ring-offset-2', 'rounded-xl');
                    setTimeout(() => {
                      el.classList.remove('ring-2', 'ring-primary/60', 'ring-offset-2', 'rounded-xl');
                    }, 1600);
                  }, 60);
                }
              }}
              onShareClick={handleCopyPublicLink}
            />

            {/* KPI strip — only if summary endpoint returned data */}
            {summary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  label={t('mentor.kpis.totalStudents', 'Total Students')}
                  value={`${summary.totalStudents}/${summary.maxStudents}`}
                  icon={<Users className="w-5 h-5 text-blue-500" />}
                  colorClass="bg-blue-500/10"
                />
                <KpiCard
                  label={t('mentor.kpis.activeToday', 'Active Today')}
                  value={summary.activeToday}
                  icon={<Activity className="w-5 h-5 text-violet-500" />}
                  colorClass="bg-violet-500/10"
                />
                <KpiCard
                  label={t('mentor.kpis.avgWinRate', 'Avg Win Rate')}
                  value={avgWinRateValue}
                  icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
                  colorClass="bg-emerald-500/10"
                  hint={
                    summary.sharingMetrics > 0
                      ? t('mentor.fromSharing', 'from {{n}} sharing', {
                          n: summary.sharingMetrics,
                        })
                      : undefined
                  }
                />
                <KpiCard
                  label={t('mentor.kpis.atRisk', 'At Risk')}
                  value={summary.atRiskCount}
                  icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
                  colorClass="bg-amber-500/10"
                  hint={t('mentor.atRiskDesc', 'Tilt above threshold')}
                  onClick={() => setAtRiskOpen(true)}
                  ariaExpanded={atRiskOpen}
                />
              </div>
            )}

            {/* Announcements */}
            <AnnouncementsSection />

            {/* Cohorts — only when there are students to organize */}
            {showGrowingPlus && <CohortsSection />}

            {/* Students section */}
            <div className="glass-card rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">
                {t('mentor.students', 'Students')}
              </h2>
              <span className="text-xs text-muted-foreground">
                ({studentList.length})
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('mentor.searchStudents', 'Search students')}
                  aria-label={t('mentor.searchStudents', 'Search students')}
                  className="pl-8 h-9 w-48"
                />
              </div>
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as 'joined' | 'sharing')}
              >
                <SelectTrigger
                  className="h-9 w-36"
                  aria-label={t('mentor.sortBy', 'Sort by')}
                >
                  <SelectValue placeholder={t('mentor.sortBy', 'Sort by')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="joined">
                    {t('mentor.sortJoined', 'Joined date')}
                  </SelectItem>
                  <SelectItem value="sharing">
                    {t('mentor.sortSharing', 'Sharing level')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {studentList.length === 0 ? (
            <EmptyStudentsState instance={instance} />
          ) : (
            <StudentList
              students={studentList}
              onSelectStudent={handleSelectStudent}
              onRemoveStudent={handleRemoveStudent}
              searchQuery={searchQuery}
              sortBy={sortBy}
              visibleStudentIds={visibleStudentIds}
              showCohortChips={cohortList.length > 0}
            />
          )}
        </div>

            {/* Activity feed — only with students. Honours the Overview-
                global cohort filter when active. */}
            {showGrowingPlus && (
              <ActivityFeed
                onSelectStudent={handleSelectStudent}
                visibleStudentIds={visibleStudentIds}
              />
            )}
          </TabsContent>

          {/* ── PROFILE ──────────────────────────────────────────────── */}
          <TabsContent value="profile" className="space-y-6 mt-2">
            <PublicProfileSection instance={instance} />

            {/* Discoverability — fuses Tags + Languages into a single card.
                Both drive the directory filter; presenting them side-by-side
                makes it obvious they're a pair, halves the vertical space. */}
            <section
              aria-labelledby="discoverability-heading"
              className="glass-card rounded-2xl p-5 space-y-6"
            >
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary" aria-hidden="true" />
                <h2 id="discoverability-heading" className="text-base font-semibold">
                  {t('mentor.discoverability.title', 'Discoverability')}
                </h2>
                <span className="text-xs text-muted-foreground">
                  · {t('mentor.discoverability.hint', 'Drives directory matches')}
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MentorTagsPicker />
                <MentorLanguagesPicker />
              </div>
            </section>

            <MonetizationSection />
          </TabsContent>

          {/* ── SESSIONS & WEBINARS ──────────────────────────────────── */}
          {tabVisibility.sessions && (
            <TabsContent value="sessions" className="space-y-6 mt-2">
              {/* KPI ribbon — at-a-glance state of monetised activity. */}
              <SessionsKpiRibbon showWebinars={showEstablished} />

              {/* Sessions: offerings (left) + bookings (right) on lg+, stack
                  on mobile. Removes the redundant outer h2 since the tab nav
                  already says "Sessions & webinars". */}
              <section
                aria-label={t('mentor.sessions.sectionTitle', '1-on-1 Sessions')}
                className="glass-card rounded-2xl p-5 sm:p-6 border border-border/50"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SessionOfferingEditor />
                  <MentorSessionsList />
                </div>
              </section>

              {showEstablished ? (
                <section
                  aria-label={t('mentor.webinars.sectionTitle', 'Webinars')}
                  className="glass-card rounded-2xl p-5 sm:p-6 border border-border/50"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <WebinarEditor />
                    <WebinarAttendeesList />
                  </div>
                </section>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/50 p-6 text-center space-y-3">
                  <div className="flex flex-col items-center gap-2">
                    <Video className="w-6 h-6 text-muted-foreground/60" aria-hidden="true" />
                    <p className="text-sm font-medium">
                      {t('mentor.tabs.webinarsLockedTitle', 'Webinars unlock at 10 students')}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-md">
                      {t(
                        'mentor.tabs.webinarsLockedDesc',
                        'You need an audience before broadcasting. Use Show all to override the gate.'
                      )}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setForceFullView(true)}
                    className="gap-1.5"
                  >
                    {t('mentor.viewMode.showAll', 'Show all sections')}
                  </Button>
                </div>
              )}
            </TabsContent>
          )}

          {/* ── INSIGHTS (testimonials + analytics + leads) ──────────── */}
          {tabVisibility.insights && (
            <TabsContent value="insights" className="space-y-6 mt-2">
              <InsightsKpiRibbon
                showFunnel={showEstablished}
                showLeads={showEstablished}
              />

              {showEstablished ? (
                <>
                  {/* Testimonials (left) + Funnel chart (right) on lg+. The
                      chart needs more horizontal room than the testimonial
                      cards, so it gets a wider 3/5 share of the row. */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-2">
                      <TestimonialsSection />
                    </div>
                    <section
                      aria-labelledby="analytics-section-heading"
                      className="lg:col-span-3 glass-card rounded-2xl p-5 sm:p-6 border border-border/50 space-y-6"
                    >
                      <h2 id="analytics-section-heading" className="text-base font-semibold">
                        {t('mentor.analytics.title', 'Funnel analytics')}
                      </h2>
                      <FunnelReportPanel />
                    </section>
                  </div>

                  <section
                    aria-labelledby="leads-inbox-heading"
                    className="glass-card rounded-2xl p-5 sm:p-6 border border-border/50"
                  >
                    <MentorLeadsInbox />
                  </section>
                </>
              ) : (
                <>
                  <TestimonialsSection />
                  <div className="rounded-2xl border border-dashed border-border/50 p-6 text-center space-y-3">
                    <div className="flex flex-col items-center gap-2">
                      <BarChart3 className="w-6 h-6 text-muted-foreground/60" aria-hidden="true" />
                      <p className="text-sm font-medium">
                        {t('mentor.tabs.insightsLockedTitle', 'Funnel analytics + leads unlock at 10 students')}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-md">
                        {t(
                          'mentor.tabs.insightsLockedDesc',
                          'Charts need traffic to be meaningful. Use Show all to override the gate.'
                        )}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setForceFullView(true)}
                      className="gap-1.5"
                    >
                      {t('mentor.viewMode.showAll', 'Show all sections')}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          )}

          {/* ── COMPLIANCE (trust & policies) ────────────────────────── */}
          {tabVisibility.compliance && (
            <TabsContent value="compliance" className="space-y-6 mt-2">
              <section
                aria-labelledby="trust-policies-heading"
                className="glass-card rounded-2xl p-5 sm:p-6 border border-border/50 space-y-8"
              >
                <h2 id="trust-policies-heading" className="text-base font-semibold">
                  {t('mentor.settings.trustPolicies.title', 'Trust & policies')}
                </h2>
                <PublicStatsToggle />
                <div className="border-t border-border/40" />
                <CancellationPolicySelector />
                <div className="border-t border-border/40" />
                <MentorJurisdictionPicker />
                <div className="border-t border-border/40" />
                <MentorFaqEditor />
              </section>

              {/* C4 + C5: per-cohort overrides for cancellation policy and pricing.
                  Renders only the cohorts that exist; falls back to instance defaults
                  when no row is set. */}
              <section
                aria-labelledby="cohort-overrides-section"
                className="glass-card rounded-2xl p-5 sm:p-6 border border-border/50"
              >
                <MentorCohortOverridesPanel />
              </section>
            </TabsContent>
          )}
        </Tabs>

        {/* Detail modal */}
        <StudentDetailModal
          studentUserId={selectedStudent}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />

        {/* At-risk drill-down */}
        <AtRiskDialog
          open={atRiskOpen}
          onOpenChange={setAtRiskOpen}
          students={atRiskStudents}
          onSelectStudent={handleSelectStudent}
        />

        {/* Edit instance modal */}
        <EditInstanceModal
          open={editOpen}
          onOpenChange={setEditOpen}
          instance={instance}
        />

        {/* Delete confirmation dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('mentor.deleteConfirmTitle', 'Delete mentor space?')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  'mentor.deleteConfirmDesc',
                  'This will archive your mentor space. All students will lose access immediately. You can create a new space later, but invite codes will be different.'
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t('common.cancel', 'Cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('mentor.deleteSpace', 'Delete space')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

/* ───────────── Empty Students ───────────── */
const EmptyStudentsState: React.FC<{ instance: MentorInstanceDto }> = ({ instance }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/join/${instance.inviteCode}`;
  const publicProfileReady =
    !!instance.publicProfileEnabled && !!instance.slug;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success(t('mentor.linkCopied', 'Link copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('common.copyFailed', 'Copy failed'));
    }
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  type TipStep = {
    key: string;
    title: string;
    desc: string;
    cta: string;
    onClick: () => void;
    done: boolean;
    icon: React.ReactNode;
  };

  const steps: TipStep[] = [
    {
      key: 'profile',
      title: t('mentor.emptyStudents.step1Title', 'Make yourself discoverable'),
      desc: t(
        'mentor.emptyStudents.step1Desc',
        'Enable your public profile so traders can find you.'
      ),
      cta: publicProfileReady
        ? t('mentor.emptyStudents.step1Done', 'Profile is live')
        : t('mentor.emptyStudents.step1Cta', 'Set up profile'),
      onClick: () => scrollTo('public-profile-heading'),
      done: publicProfileReady,
      icon: <Globe className="w-4 h-4" />,
    },
    {
      key: 'pitch',
      title: t('mentor.emptyStudents.step2Title', 'Add your pitch'),
      desc: t(
        'mentor.emptyStudents.step2Desc',
        'A strong headline + bio is what converts visitors into students.'
      ),
      cta:
        instance.publicHeadline || instance.publicBio
          ? t('mentor.emptyStudents.step2Done', 'Pitch set')
          : t('mentor.emptyStudents.step2Cta', 'Write your pitch'),
      onClick: () => scrollTo('public-profile-heading'),
      done: !!(instance.publicHeadline || instance.publicBio),
      icon: <Pencil className="w-4 h-4" />,
    },
    {
      key: 'share',
      title: t('mentor.emptyStudents.step3Title', 'Share your invite link'),
      desc: t(
        'mentor.emptyStudents.step3Desc',
        'Post it on X, Discord, YouTube — wherever your audience lives.'
      ),
      cta: copied
        ? t('mentor.copied', 'Copied')
        : t('mentor.copyLink', 'Copy link'),
      onClick: handleCopy,
      done: false,
      icon: <Share2 className="w-4 h-4" />,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <div className="py-6 space-y-5">
      <div className="flex flex-col items-center text-center gap-2.5 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-base font-semibold">
          {t('mentor.emptyStudentsTitle', 'No students yet')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t(
            'mentor.emptyStudents.leadIn',
            'Your first student is three steps away. Ship them today.'
          )}
        </p>
        <p className="text-xs font-medium text-primary tabular-nums">
          {t('mentor.emptyStudents.progress', '{{done}} of {{total}} complete', {
            done: completedCount,
            total: steps.length,
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
        {steps.map((step, idx) => (
          <div
            key={step.key}
            className={[
              'rounded-xl border p-4 flex flex-col gap-3 transition-all duration-200',
              step.done
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-border/50 bg-muted/10 hover:border-primary/40',
            ].join(' ')}
          >
            <div className="flex items-center gap-2">
              <div
                className={[
                  'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                  step.done
                    ? 'bg-emerald-500 text-white'
                    : 'bg-primary/10 text-primary',
                ].join(' ')}
              >
                {step.done ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  step.icon
                )}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('mentor.emptyStudents.stepLabel', 'Step {{n}}', { n: idx + 1 })}
              </span>
            </div>
            <div className="space-y-1 flex-1">
              <p className="text-sm font-semibold leading-snug">{step.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </div>
            <Button
              variant={step.done ? 'outline' : 'default'}
              size="sm"
              className="w-full gap-1.5"
              onClick={step.onClick}
              disabled={step.done && step.key !== 'share'}
            >
              {step.key === 'share' &&
                (copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                ))}
              {step.cta}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Mentor;
