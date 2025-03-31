
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Settings,
  Calendar,
  BookOpen,
  Activity,
  FileBarChart,
  BarChart2,
  PieChart,
  Users,
  CreditCard,
  RotateCw,
  LayoutDashboard,
  ListTodo,
  Clock,
  Shield,
  BellRing
} from "lucide-react";
import { Link } from 'react-router-dom';

const DashboardSidebar = () => {
  const { t } = useTranslation();
  const sidebar = useSidebar();

  const mainNavItems = [
    { label: t('navigation.dashboard'), icon: LayoutDashboard, path: '/dashboard' },
    { label: t('navigation.trades'), icon: FileBarChart, path: '/trades' },
    { label: t('navigation.dailyJournal'), icon: BookOpen, path: '/daily-journal' },
    { label: t('navigation.calendar'), icon: Calendar, path: '/calendar' },
    { label: t('navigation.activity'), icon: Activity, path: '/activity' },
    { label: t('navigation.playbook'), icon: ListTodo, path: '/playbook' },
    { label: t('navigation.insights'), icon: BarChart2, path: '/insights' },
    { label: t('navigation.performance'), icon: LineChart, path: '/performance' },
    { label: t('navigation.statistics'), icon: PieChart, path: '/statistics' },
    { label: t('navigation.watchlists'), icon: Clock, path: '/watchlists' },
    { label: t('navigation.accounts'), icon: CreditCard, path: '/accounts' },
    { label: t('navigation.accountManagement'), icon: Users, path: '/account-management' },
    { label: t('navigation.riskAnalysis'), icon: Shield, path: '/risk-analysis' },
    { label: t('navigation.alerts'), icon: BellRing, path: '/alerts' },
  ];

  const secondaryNavItems = [
    { label: t('navigation.reports'), icon: RotateCw, path: '/reports' },
    { label: t('navigation.backtesting'), icon: BarChart2, path: '/backtesting' },
    { label: t('navigation.tradeReplay'), icon: Activity, path: '/trade-replay' },
    { label: t('navigation.administration'), icon: Shield, path: '/administration' },
    { label: t('navigation.settings'), icon: Settings, path: '/settings' },
  ];

  return (
    <div>
      <Sheet open={sidebar.open} onOpenChange={sidebar.setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <LayoutDashboard className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:w-60 dark:bg-zinc-900 bg-white">
          <SheetHeader className="text-left">
            <SheetTitle>Followup Trading</SheetTitle>
            <SheetDescription>
              {t('navigation.mobileDashboard')}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="my-2">
            <div className="py-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="justify-start px-2 w-full font-normal text-sm">
                    <Avatar className="mr-2 h-8 w-8">
                      <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
                      <AvatarFallback>SC</AvatarFallback>
                    </Avatar>
                    <span>shadcn</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40" align="start">
                  <DropdownMenuItem>
                    <Link to="/profile" className="w-full block">{t('navigation.profile')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/account" className="w-full block">{t('navigation.account')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    {t('navigation.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Separator />
            {mainNavItems.map((item) => (
              <div key={item.label} className="py-2">
                <Link to={item.path}>
                  <Button variant="ghost" className="justify-start px-2 w-full font-normal text-sm">
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              </div>
            ))}
            <Separator />
            {secondaryNavItems.map((item) => (
              <div key={item.label} className="py-2">
                <Link to={item.path}>
                  <Button variant="ghost" className="justify-start px-2 w-full font-normal text-sm">
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              </div>
            ))}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <aside className="hidden md:flex md:flex-col">
        <div className="border-r flex flex-col dark:border-zinc-800 border-zinc-200 w-60">
          <ScrollArea className="flex-1">
            <div className="py-4">
              <Link to="/profile">
                <Button variant="ghost" className="justify-start px-2 w-full font-normal text-sm">
                  <Avatar className="mr-2 h-8 w-8">
                    <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
                    <AvatarFallback>SC</AvatarFallback>
                  </Avatar>
                  <span>shadcn</span>
                </Button>
              </Link>
            </div>
            <Separator />
            {mainNavItems.map((item) => (
              <div key={item.label} className="py-2">
                <Link to={item.path}>
                  <Button variant="ghost" className="justify-start px-2 w-full font-normal text-sm">
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              </div>
            ))}
            <Separator />
            {secondaryNavItems.map((item) => (
              <div key={item.label} className="py-2">
                <Link to={item.path}>
                  <Button variant="ghost" className="justify-start px-2 w-full font-normal text-sm">
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              </div>
            ))}
          </ScrollArea>
        </div>
      </aside>
    </div>
  );
};

export default DashboardSidebar;
