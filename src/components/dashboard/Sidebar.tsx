
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import {
  Activity as ActivityIcon,
  Award as AwardIcon,
  BarChart2 as BarChart2Icon,
  BookOpen as BookOpenIcon,
  BookText as BookTextIcon,
  Brain as BrainIcon,
  Calendar as CalendarIcon,
  ChevronDown as ChevronDownIcon,
  Code as CodeIcon,
  FileText as FileTextIcon,
  Layers as LayersIcon,
  LineChart as LineChartIcon,
  List as ListIcon,
  Lock as LockIcon,
  Newspaper as NewspaperIcon,
  PieChart as PieChartIcon,
  RefreshCcw as RefreshCcwIcon,
  Rewind as RewindIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  Trophy as TrophyIcon,
  Wallet as WalletIcon,
  BellRing as BellRingIcon,
  AlertTriangle as AlertTriangleIcon,
  Calculator as CalculatorIcon,
  Target as TargetIcon,
  Users as UsersIcon,
  ShoppingBag as ShoppingBagIcon,
  UsersRound as UsersRoundIcon,
  Building as BuildingIcon,
  GraduationCap as GraduationCapIcon,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/components/ui/sidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/auth-context';
import { useMyMentorInstance } from '@/hooks/useMentor';

const COLLAPSED_KEY = 'sidebar-collapsed-sections';

function getInitialCollapsed(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

/** Shared sidebar navigation content used by both desktop and mobile layouts */
const SidebarContent: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { isEnabled, hasPlan } = useFeatureFlags();
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') ?? false;
  const { data: myMentorInstance } = useMyMentorInstance();
  const hasMyMentor = !!myMentorInstance;
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>(getInitialCollapsed);

  const toggleSection = (index: number) => {
    setCollapsed(prev => {
      const next = { ...prev, [index]: !prev[index] };
      localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
      return next;
    });
  };

  const sidebarGroups = [
    {
      label: t('sidebar.general'),
      items: [
        { href: '/dashboard', label: t('sidebar.dashboard'), icon: ActivityIcon },
        { href: '/trades', label: t('sidebar.trades'), icon: LineChartIcon },
        { href: '/daily-journal', label: t('sidebar.dailyJournal'), icon: BookTextIcon },
        { href: '/calendar', label: t('sidebar.calendar'), icon: CalendarIcon },
      ],
    },
    {
      label: t('sidebar.analysis'),
      items: [
        { href: '/playbook', label: t('sidebar.playbook'), icon: BookOpenIcon },
        { href: '/insights', label: t('sidebar.insights'), icon: LineChartIcon, requiredPlan: 'STARTER' as const },
        { href: '/ai-coach', label: t('sidebar.aiCoach', 'AI Coach'), icon: BrainIcon, featureKey: 'ai_chat', requiredPlan: 'STARTER' as const },
        { href: '/performance', label: t('sidebar.performance'), icon: BarChart2Icon },
        { href: '/statistics', label: t('sidebar.statistics'), icon: PieChartIcon },
        { href: '/risk-metrics', label: t('sidebar.riskMetrics', 'Risk Metrics'), icon: AlertTriangleIcon, requiredPlan: 'PRO' as const },
        { href: '/options', label: t('sidebar.options', 'Options'), icon: LayersIcon, requiredPlan: 'PRO' as const },
        { href: '/watchlists', label: t('sidebar.watchlists'), icon: ListIcon },
        { href: '/alerts', label: t('sidebar.alerts'), icon: BellRingIcon, featureKey: 'alerts', requiredPlan: 'STARTER' as const },
        { href: '/backtesting', label: t('sidebar.backtesting'), icon: RefreshCcwIcon, featureKey: 'backtesting', requiredPlan: 'PRO' as const },
        { href: '/trade-replay', label: t('sidebar.tradeReplay'), icon: RewindIcon, featureKey: 'trade_replay', requiredPlan: 'PRO' as const },
        { href: '/reports', label: t('sidebar.reports'), icon: FileTextIcon, featureKey: 'reports', requiredPlan: 'STARTER' as const },
        { href: '/tax-reporting', label: t('sidebar.taxReporting', 'Tax Reporting'), icon: CalculatorIcon, requiredPlan: 'PRO' as const },
      ],
    },
    {
      label: t('sidebar.propFirm', 'Prop Firm'),
      items: [
        { href: '/prop-firm', label: t('sidebar.propFirmTracker', 'Evaluations'), icon: TargetIcon, featureKey: 'prop_firm', requiredPlan: 'PRO' as const },
        { href: '/propfirm-admin', label: t('sidebar.propFirmAdmin', 'Prop Firm Admin'), icon: BuildingIcon, requiredPlan: 'ELITE' as const },
      ],
    },
    {
      label: t('sidebar.mentor', 'Mentor'),
      items: [
        { href: '/mentor', label: t('sidebar.mentorDashboard', 'Mentor Dashboard'), icon: UsersIcon, requiredPlan: 'TEAM' as const },
      ],
    },
    {
      label: t('sidebar.social'),
      items: [
        { href: '/badges', label: t('sidebar.achievements', 'Achievements'), icon: TrophyIcon },
        { href: '/leaderboard', label: t('sidebar.leaderboard', 'Leaderboard'), icon: AwardIcon },
        { href: '/social/feed', label: t('sidebar.marketFeed', 'Market Feed'), icon: NewspaperIcon, featureKey: 'market_feed', requiredPlan: 'STARTER' as const },
        { href: '/marketplace', label: t('sidebar.marketplace', 'Marketplace'), icon: ShoppingBagIcon },
        ...(hasMyMentor
          ? [{ href: '/my-mentor', label: t('sidebar.myMentor', 'My Mentor'), icon: GraduationCapIcon }]
          : []),
        { href: '/study-groups', label: t('sidebar.studyGroups', 'Study Groups'), icon: UsersRoundIcon, requiredPlan: 'ELITE' as const },
      ],
    },
    {
      label: t('sidebar.account'),
      items: [
        { href: '/accounts', label: t('sidebar.accounts'), icon: WalletIcon },
        { href: '/developer', label: t('sidebar.developer', 'Developer API'), icon: CodeIcon, requiredPlan: 'ELITE' as const },
        ...(isAdmin ? [{ href: '/administration', label: t('sidebar.administration'), icon: ShieldIcon }] : []),
      ],
    },
  ];

  return (
    <div className="glass-panel h-full rounded-2xl flex flex-col border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 overflow-hidden">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 overflow-hidden justify-start px-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 min-w-0"
          onClick={onNavigate}
        >
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/50 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/40">
            FT
          </div>
          <span className="text-lg font-bold whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-white/70">
            FollowUp
          </span>
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-3 border-b border-slate-200 dark:border-white/5 flex-shrink-0" />

      {/* Nav groups — scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10">
        <nav className="grid gap-y-0 px-2">
          {sidebarGroups.filter(g => g.items.length > 0).map((group, groupIndex) => {
            const isCollapsed = !!collapsed[groupIndex];
            return (
              <div key={group.label}>
                {/* Divider between sections */}
                {groupIndex > 0 && (
                  <div className="mx-1 my-2 border-t border-slate-200 dark:border-white/5" />
                )}

                {/* Section header — clickable to collapse */}
                <button
                  type="button"
                  onClick={() => toggleSection(groupIndex)}
                  className="flex items-center justify-between w-full label-caps text-[10px] text-muted-foreground/60 mb-1 px-2 py-1.5 hover:text-muted-foreground transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <div className="flex items-center gap-1.5">
                    <ChevronDownIcon
                      className={[
                        'w-3 h-3 flex-shrink-0 transition-transform duration-200',
                        isCollapsed ? '-rotate-90' : '',
                      ].join(' ')}
                    />
                    <span className="whitespace-nowrap overflow-hidden">{group.label}</span>
                  </div>
                  {isCollapsed && (
                    <span className="text-[10px] font-medium text-primary/60">{group.items.length}</span>
                  )}
                </button>

                {!isCollapsed && (
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.href;
                      const hasRequiredPlan = 'requiredPlan' in item && !!item.requiredPlan;
                      // Plan check: user must have the required plan
                      const planLocked = hasRequiredPlan
                        ? !hasPlan(item.requiredPlan as string)
                        : false;
                      // Feature flag disabled (admin kill-switch) — only for items without plan gate
                      const featureDisabled = !hasRequiredPlan && 'featureKey' in item && item.featureKey
                        ? !isEnabled(item.featureKey as string)
                        : false;
                      const dimmed = featureDisabled || planLocked;
                      return (
                        <li key={item.href}>
                          <Link
                            to={item.href}
                            onClick={onNavigate}
                            aria-current={isActive ? 'page' : undefined}
                            className={[
                              'relative flex items-center gap-x-1.5 rounded-xl py-2.5 min-w-0 w-full',
                              'justify-start pl-2 pr-1',
                              'text-sm font-medium transition-all duration-200',
                              dimmed
                                ? 'opacity-60 text-muted-foreground border border-transparent'
                                : isActive
                                  ? [
                                      'bg-primary/10 text-primary',
                                      'shadow-[0_0_12px_hsl(var(--primary)/0.15)]',
                                      'border border-primary/20',
                                    ].join(' ')
                                  : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent',
                            ].join(' ')}
                          >
                            {isActive && !dimmed && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                            )}

                            <item.icon
                              className={[
                                'flex-shrink-0 transition-colors duration-200',
                                'w-5 h-5',
                                dimmed ? 'text-muted-foreground/50' : isActive ? 'text-primary' : '',
                              ].join(' ')}
                            />

                            <span className="text-sm truncate min-w-0 flex-1">
                              {item.label}
                            </span>

                            {featureDisabled && (
                              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-muted-foreground/40" title={t('featureGate.unavailable', 'Feature disabled')} />
                            )}
                            {planLocked && hasRequiredPlan && (
                              <span
                                title={`${t('featureGate.requiresPlan', 'Requires')} ${(item.requiredPlan as string).charAt(0) + (item.requiredPlan as string).slice(1).toLowerCase()}+`}
                                aria-label={`${(item.requiredPlan as string).charAt(0) + (item.requiredPlan as string).slice(1).toLowerCase()}+ plan`}
                                className={[
                                  'flex-shrink-0 whitespace-nowrap text-[9px] font-semibold px-1 py-0.5 rounded-md border leading-none tracking-tight',
                                  item.requiredPlan === 'STARTER' ? 'text-blue-400 bg-blue-500/10 border-blue-500/25' :
                                  item.requiredPlan === 'PRO' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' :
                                  item.requiredPlan === 'ELITE' ? 'text-amber-400 bg-amber-500/10 border-amber-500/25' :
                                  item.requiredPlan === 'TEAM' ? 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/25' :
                                  'text-primary bg-primary/10 border-primary/25',
                                ].join(' ')}
                              >
                                {(item.requiredPlan as string).charAt(0) + (item.requiredPlan as string).slice(1).toLowerCase()}+
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-slate-200 dark:border-white/5 flex-shrink-0" />

      {/* Bottom: Settings */}
      <div className="flex-shrink-0 py-3 px-2">
        <Link
          to="/settings"
          onClick={onNavigate}
          aria-current={location.pathname === '/settings' ? 'page' : undefined}
          className={[
            'relative flex items-center gap-x-3 rounded-xl py-2.5',
            'justify-start px-2.5',
            'text-sm font-medium transition-all duration-200 overflow-hidden whitespace-nowrap',
            location.pathname === '/settings'
              ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_hsl(var(--primary)/0.15)]'
              : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border border-transparent',
          ].join(' ')}
        >
          {location.pathname === '/settings' && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
          )}
          <SettingsIcon className="flex-shrink-0 w-5 h-5" />
          <span className="text-sm overflow-hidden whitespace-nowrap">
            {t('common.settings', 'Settings')}
          </span>
        </Link>
      </div>
    </div>
  );
};

const DashboardSidebar = () => {
  const isMobile = useIsMobile();
  const { open, openMobile, setOpenMobile } = useSidebar();

  const closeMobile = React.useCallback(() => setOpenMobile(false), [setOpenMobile]);

  // Mobile: Sheet-based drawer overlay
  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side="left"
          className="w-72 p-0 pt-4 px-2 pb-4 bg-background border-r-0"
        >
          <SidebarContent onNavigate={closeMobile} />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: collapsible sidebar — hidden when toggled off
  if (!open) {
    return null;
  }

  return (
    <div className="hidden md:flex flex-col h-full py-4 px-2 flex-shrink-0 w-[17rem]">
      <SidebarContent />
    </div>
  );
};

export default DashboardSidebar;
