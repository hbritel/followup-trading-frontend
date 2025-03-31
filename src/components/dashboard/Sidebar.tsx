
import React from 'react';
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
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";

const DashboardSidebar = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { open, openMobile } = useSidebar();
  
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
        { href: "/watchlists", label: t('sidebar.watchlists'), icon: ListIcon },
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
    <div className="border-r bg-secondary/10 h-full w-[var(--sidebar-width)] md:block">
      <div className="flex flex-col gap-y-5 h-full">
        <div className="px-6 py-4">
          Followup Trading
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="grid gap-y-8 px-6">
            {sidebarGroups.map((group, index) => (
              <div key={index}>
                <div className="text-sm font-semibold leading-6 text-muted-foreground">
                  {group.label}
                </div>
                <ul className="mt-2 space-y-1">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        className="group flex w-full items-center gap-x-3 rounded-md p-2 text-sm font-semibold hover:bg-accent hover:text-accent-foreground"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </a>
                    </li>
                  ))}
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
