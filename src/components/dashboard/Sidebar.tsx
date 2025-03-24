
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  BarChart4,
  Calendar,
  CreditCard,
  Home,
  LayoutDashboard,
  ListChecks,
  PieChart,
  Settings,
  Shuffle,
  TrendingUp,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/auth-context';

const DashboardSidebar = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const location = useLocation();
  const { user } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <Sidebar
      className="border-r"
      collapsible={isMobile ? "offcanvas" : "icon"}
    >
      <SidebarHeader className="flex justify-center items-center py-6">
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">DN</div>
          <span className="text-xs font-semibold">DashNest Trader</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.main')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/')}>
                  <Link to="/">
                    <Home className="h-4 w-4" />
                    <span>{t('navbar.home')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/dashboard')}>
                  <Link to="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>{t('navbar.dashboard')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/trades')}>
                  <Link to="/trades">
                    <Shuffle className="h-4 w-4" />
                    <span>{t('navbar.trades')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/calendar')}>
                  <Link to="/calendar">
                    <Calendar className="h-4 w-4" />
                    <span>{t('navbar.calendar')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.analysis')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/performance')}>
                  <Link to="/performance">
                    <TrendingUp className="h-4 w-4" />
                    <span>{t('navbar.performance')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/statistics')}>
                  <Link to="/statistics">
                    <BarChart4 className="h-4 w-4" />
                    <span>{t('navbar.statistics')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/reports')}>
                  <Link to="/reports">
                    <PieChart className="h-4 w-4" />
                    <span>{t('navbar.reports')}</span>
                    <Badge className="ml-auto text-xs" variant="secondary">New</Badge>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.management')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/accounts')}>
                  <Link to="/accounts">
                    <CreditCard className="h-4 w-4" />
                    <span>{t('navbar.accounts')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/watchlists')}>
                  <Link to="/watchlists">
                    <ListChecks className="h-4 w-4" />
                    <span>{t('navbar.watchlists')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/activity')}>
                  <Link to="/activity">
                    <Activity className="h-4 w-4" />
                    <span>{t('navbar.activity')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className={cn(
          "flex items-center gap-2 px-2 py-4",
          !isMobile && "flex-col text-center"
        )}>
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.name?.split(' ').map(name => name[0]).join('') || 'JD'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-center overflow-hidden">
            <p className="text-sm font-medium leading-none truncate">{user?.name || 'John Doe'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || 'john.doe@example.com'}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
