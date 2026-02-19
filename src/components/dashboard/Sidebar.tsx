
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity as ActivityIcon,
  BarChart2 as BarChart2Icon,
  BookOpen as BookOpenIcon,
  BookText as BookTextIcon,
  Calendar as CalendarIcon,
  CircleDollarSign as CircleDollarSignIcon,
  Clock as ClockIcon,
  FileText as FileTextIcon,
  LineChart as LineChartIcon,
  List as ListIcon,
  PieChart as PieChartIcon,
  RefreshCcw as RefreshCcwIcon,
  Rewind as RewindIcon,
  Shield as ShieldIcon,
  Wallet as WalletIcon,
  BellRing as BellRingIcon,
  AlertTriangle as AlertTriangleIcon,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";

const DashboardSidebar = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { open, openMobile } = useSidebar();
  const location = useLocation();
  
  // Determine which state to use based on device type
  const sidebarVisible = isMobile ? openMobile : open;
  
  const sidebarGroups = [
    {
      label: t('sidebar.general'),
      items: [
        { href: "/dashboard", label: t('sidebar.dashboard'), icon: ActivityIcon },
        { href: "/trades", label: t('sidebar.trades'), icon: LineChartIcon },
        { href: "/daily-journal", label: t('sidebar.dailyJournal'), icon: BookTextIcon },
        { href: "/calendar", label: t('sidebar.calendar'), icon: CalendarIcon },
        { href: "/activity", label: t('sidebar.activity'), icon: ClockIcon },
      ],
    },
    {
      label: t('sidebar.analysis'),
      items: [
        { href: "/playbook", label: t('sidebar.playbook'), icon: BookOpenIcon },
        { href: "/insights", label: t('sidebar.insights'), icon: LineChartIcon },
        { href: "/performance", label: t('sidebar.performance'), icon: BarChart2Icon },
        { href: "/statistics", label: t('sidebar.statistics'), icon: PieChartIcon },
        { href: "/risk-metrics", label: t('sidebar.riskMetrics', 'Métriques de Risque'), icon: AlertTriangleIcon },
        { href: "/watchlists", label: t('sidebar.watchlists'), icon: ListIcon },
        { href: "/alerts", label: t('sidebar.alerts'), icon: BellRingIcon },
        { href: "/backtesting", label: t('sidebar.backtesting'), icon: RefreshCcwIcon },
        { href: "/trade-replay", label: t('sidebar.tradeReplay'), icon: RewindIcon },
        { href: "/reports", label: t('sidebar.reports'), icon: FileTextIcon },
      ],
    },
    {
      label: t('sidebar.account'),
      items: [
        { href: "/accounts", label: t('sidebar.accounts'), icon: WalletIcon },
        { href: "/account-management", label: t('sidebar.accountManagement'), icon: CircleDollarSignIcon },
        { href: "/administration", label: t('sidebar.administration'), icon: ShieldIcon },
      ],
    },
  ];
  
  if (!sidebarVisible) {
    return null;
  }
  
  return (
    <div className="hidden md:block h-full py-4 pl-4">
      <div className="glass-panel h-full w-[var(--sidebar-width)] rounded-2xl flex flex-col gap-y-5 border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-black/20">
        <div className="px-6 py-6">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/50 text-xl font-bold text-white shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300">
              FT
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-white/70">
              Followup
            </span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-4">
          <nav className="grid gap-y-8">
            {sidebarGroups.map((group, index) => (
              <div key={index}>
                <div className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
                  {group.label}
                </div>
                <ul className="space-y-1">
                {group.items.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            to={item.href}
                            aria-current={isActive ? 'page' : undefined}
                            className={`group flex w-full items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                              isActive 
                                ? 'bg-primary/10 text-primary shadow-sm dark:shadow-[0_0_15px_rgba(var(--primary),0.15)] border border-primary/20' 
                                : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 hover:text-foreground dark:hover:text-white'
                            }`}
                          >
                            <item.icon className={`h-4 w-4 shrink-0 transition-colors duration-300 ${isActive ? 'text-primary' : 'group-hover:text-foreground dark:group-hover:text-white'}`} />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;
