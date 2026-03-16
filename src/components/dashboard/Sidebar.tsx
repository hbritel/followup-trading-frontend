
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity as ActivityIcon,
  Award as AwardIcon,
  BarChart2 as BarChart2Icon,
  BookOpen as BookOpenIcon,
  BookText as BookTextIcon,
  Calendar as CalendarIcon,
  CircleDollarSign as CircleDollarSignIcon,
  Clock as ClockIcon,
  FileText as FileTextIcon,
  Globe as GlobeIcon,
  LineChart as LineChartIcon,
  List as ListIcon,
  PieChart as PieChartIcon,
  RefreshCcw as RefreshCcwIcon,
  Rewind as RewindIcon,
  Rss as RssIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  ShoppingBag as ShoppingBagIcon,
  Trophy as TrophyIcon,
  Users as UsersIcon,
  Wallet as WalletIcon,
  BellRing as BellRingIcon,
  AlertTriangle as AlertTriangleIcon,
  Calculator as CalculatorIcon,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/components/ui/sidebar';

const DashboardSidebar = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { open, openMobile } = useSidebar();
  const location = useLocation();

  const sidebarVisible = isMobile ? openMobile : open;

  const sidebarGroups = [
    {
      label: t('sidebar.general'),
      items: [
        { href: '/dashboard', label: t('sidebar.dashboard'), icon: ActivityIcon },
        { href: '/trades', label: t('sidebar.trades'), icon: LineChartIcon },
        { href: '/daily-journal', label: t('sidebar.dailyJournal'), icon: BookTextIcon },
        { href: '/calendar', label: t('sidebar.calendar'), icon: CalendarIcon },
        { href: '/activity', label: t('sidebar.activity'), icon: ClockIcon },
      ],
    },
    {
      label: t('sidebar.analysis'),
      items: [
        { href: '/playbook', label: t('sidebar.playbook'), icon: BookOpenIcon },
        { href: '/insights', label: t('sidebar.insights'), icon: LineChartIcon },
        { href: '/performance', label: t('sidebar.performance'), icon: BarChart2Icon },
        { href: '/statistics', label: t('sidebar.statistics'), icon: PieChartIcon },
        { href: '/risk-metrics', label: t('sidebar.riskMetrics', 'Risk Metrics'), icon: AlertTriangleIcon },
        { href: '/watchlists', label: t('sidebar.watchlists'), icon: ListIcon },
        { href: '/alerts', label: t('sidebar.alerts'), icon: BellRingIcon },
        { href: '/backtesting', label: t('sidebar.backtesting'), icon: RefreshCcwIcon },
        { href: '/trade-replay', label: t('sidebar.tradeReplay'), icon: RewindIcon },
        { href: '/reports', label: t('sidebar.reports'), icon: FileTextIcon },
        { href: '/tax-reporting', label: t('sidebar.taxReporting', 'Tax Reporting'), icon: CalculatorIcon },
        { href: '/badges', label: t('sidebar.achievements', 'Achievements'), icon: TrophyIcon },
        { href: '/leaderboard', label: t('sidebar.leaderboard', 'Leaderboard'), icon: AwardIcon },
      ],
    },
    {
      label: t('sidebar.social'),
      items: [
        { href: '/social/feed', label: t('sidebar.socialFeed'), icon: RssIcon },
        { href: '/social/marketplace', label: t('sidebar.marketplace'), icon: ShoppingBagIcon },
        { href: '/social/traders', label: t('sidebar.traders'), icon: GlobeIcon },
      ],
    },
    {
      label: t('sidebar.account'),
      items: [
        { href: '/accounts', label: t('sidebar.accounts'), icon: WalletIcon },
        { href: '/account-management', label: t('sidebar.accountManagement'), icon: CircleDollarSignIcon },
        { href: '/administration', label: t('sidebar.administration'), icon: ShieldIcon },
      ],
    },
  ];

  if (!sidebarVisible) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={200}>
      {/* Outer wrapper: fixed 64px wide by default, expands to 240px on hover */}
      <div
        className={[
          'group/sidebar hidden md:flex flex-col h-full py-4 pl-4 flex-shrink-0',
          'w-16 hover:w-60',
          'transition-[width] duration-300',
          '[transition-timing-function:cubic-bezier(0.16,1,0.3,1)]',
        ].join(' ')}
        style={{ willChange: 'width' }}
      >
        {/* Inner glass panel fills the full height */}
        <div className="glass-panel h-full rounded-2xl flex flex-col border border-white/5 bg-black/20 overflow-hidden">

          {/* Logo */}
          <div className="flex items-center justify-center group-hover/sidebar:justify-start h-16 px-0 group-hover/sidebar:px-3 flex-shrink-0 overflow-hidden transition-all duration-300">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 min-w-0"
            >
              {/* "FT" badge — always visible, fixed width so it doesn't shrink */}
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-500/50 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all duration-300 hover:shadow-violet-500/40">
                FT
              </div>
              {/* "FollowUp" text — hidden by default, revealed on group hover */}
              <span
                className={[
                  'text-lg font-bold whitespace-nowrap',
                  'bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70',
                  // Fade-in/out on group hover
                  'opacity-0 group-hover/sidebar:opacity-100',
                  'translate-x-2 group-hover/sidebar:translate-x-0',
                  'transition-[opacity,transform] duration-300',
                  '[transition-timing-function:cubic-bezier(0.16,1,0.3,1)]',
                ].join(' ')}
              >
                FollowUp
              </span>
            </Link>
          </div>

          {/* Divider */}
          <div className="mx-3 border-b border-white/5 flex-shrink-0" />

          {/* Nav groups — scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            <nav className="grid gap-y-6 px-1 group-hover/sidebar:px-2 transition-all duration-300">
              {sidebarGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {/* Section label: invisible when collapsed, visible when expanded */}
                  <div
                    className={[
                      'label-caps text-[10px] text-muted-foreground/60 mb-1 px-2 whitespace-nowrap overflow-hidden',
                      'opacity-0 group-hover/sidebar:opacity-100',
                      'transition-opacity duration-200',
                    ].join(' ')}
                  >
                    {group.label}
                  </div>

                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                to={item.href}
                                aria-current={isActive ? 'page' : undefined}
                                className={[
                                  'relative flex items-center justify-center group-hover/sidebar:justify-start gap-x-3 rounded-xl px-0 group-hover/sidebar:px-2.5 py-2.5',
                                  'text-sm font-medium transition-all duration-200',
                                  'overflow-hidden whitespace-nowrap',
                                  // Active: violet glow + left border indicator
                                  isActive
                                    ? [
                                        'bg-violet-500/10 text-violet-400',
                                        'shadow-[0_0_12px_rgba(139,92,246,0.15)]',
                                        'border border-violet-500/20',
                                        // Left border indicator via pseudo-like absolute element
                                      ].join(' ')
                                    : 'text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent',
                                ].join(' ')}
                              >
                                {/* Active left-border indicator */}
                                {isActive && (
                                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                                )}

                                {/* Icon — fixed size, always visible */}
                                <item.icon
                                  className={[
                                    'flex-shrink-0 transition-colors duration-200',
                                    'w-5 h-5',
                                    isActive ? 'text-violet-400' : 'group-hover/link:text-white',
                                  ].join(' ')}
                                />

                                {/* Label — fades in on group hover */}
                                <span
                                  className={[
                                    'text-sm overflow-hidden whitespace-nowrap',
                                    'opacity-0 group-hover/sidebar:opacity-100',
                                    'translate-x-1 group-hover/sidebar:translate-x-0',
                                    'transition-[opacity,transform] duration-300 delay-75',
                                    '[transition-timing-function:cubic-bezier(0.16,1,0.3,1)]',
                                  ].join(' ')}
                                >
                                  {item.label}
                                </span>
                              </Link>
                            </TooltipTrigger>
                            {/* Tooltip only shown when sidebar is NOT expanded (collapsed state) */}
                            <TooltipContent
                              side="right"
                              className="group-hover/sidebar:hidden pointer-events-none"
                            >
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          {/* Divider */}
          <div className="mx-3 border-t border-white/5 flex-shrink-0" />

          {/* Bottom: Settings */}
          <div className="flex-shrink-0 px-1 group-hover/sidebar:px-2 py-3 transition-all duration-300">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/settings"
                  aria-current={location.pathname === '/settings' ? 'page' : undefined}
                  className={[
                    'relative flex items-center justify-center group-hover/sidebar:justify-start gap-x-3 rounded-xl px-0 group-hover/sidebar:px-2.5 py-2.5',
                    'text-sm font-medium transition-all duration-200 overflow-hidden whitespace-nowrap',
                    location.pathname === '/settings'
                      ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent',
                  ].join(' ')}
                >
                  {location.pathname === '/settings' && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                  )}
                  <SettingsIcon className="flex-shrink-0 w-5 h-5" />
                  <span
                    className={[
                      'text-sm overflow-hidden whitespace-nowrap',
                      'opacity-0 group-hover/sidebar:opacity-100',
                      'translate-x-1 group-hover/sidebar:translate-x-0',
                      'transition-[opacity,transform] duration-300 delay-75',
                      '[transition-timing-function:cubic-bezier(0.16,1,0.3,1)]',
                    ].join(' ')}
                  >
                    {t('common.settings', 'Settings')}
                  </span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="group-hover/sidebar:hidden pointer-events-none">
                {t('common.settings', 'Settings')}
              </TooltipContent>
            </Tooltip>
          </div>

        </div>
      </div>
    </TooltipProvider>
  );
};

export default DashboardSidebar;
