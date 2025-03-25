
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
  BookOpen,
  Lightbulb,
  BarChart2,
  Play,
  Layers
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

interface SidebarProps {
  collapseState?: "expanded" | "collapsed";
}

const DashboardSidebar = ({ collapseState }: SidebarProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const location = useLocation();
  const { user } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // Generate avatar initials from user name
  const getInitials = () => {
    if (!user?.name) return 'JD';
    return user.name.split(' ').map(name => name[0]).join('');
  };
  
  return (
    <Sidebar
      data-state={collapseState || (isMobile ? "collapsed" : "expanded")}
      className="border-r transition-all duration-300"
    >
      <SidebarHeader className="flex justify-center items-center py-6">
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">FT</div>
          <span className="text-xs font-semibold transition-opacity duration-200 data-[state=collapsed]:opacity-0 data-[state=collapsed]:h-0 data-[state=collapsed]:overflow-hidden">Followup Trading</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.main')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/')} tooltip="Home">
                  <Link to="/">
                    <Home className="h-4 w-4" />
                    <span>{t('navbar.home')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/dashboard')} tooltip="Dashboard">
                  <Link to="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>{t('navbar.dashboard')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/trades')} tooltip="Trades">
                  <Link to="/trades">
                    <Shuffle className="h-4 w-4" />
                    <span>{t('navbar.trades')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/calendar')} tooltip="Calendar">
                  <Link to="/calendar">
                    <Calendar className="h-4 w-4" />
                    <span>{t('navbar.calendar')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/journal')} tooltip="Journal">
                  <Link to="/journal">
                    <BookOpen className="h-4 w-4" />
                    <span>{t('navbar.journal')}</span>
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
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/performance')} tooltip="Performance">
                  <Link to="/performance">
                    <TrendingUp className="h-4 w-4" />
                    <span>{t('navbar.performance')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/statistics')} tooltip="Statistics">
                  <Link to="/statistics">
                    <BarChart4 className="h-4 w-4" />
                    <span>{t('navbar.statistics')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/insights')} tooltip="Insights">
                  <Link to="/insights">
                    <Lightbulb className="h-4 w-4" />
                    <span>{t('navbar.insights')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/reports')} tooltip="Reports">
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
          <SidebarGroupLabel>{t('sidebar.trading')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/playbook')} tooltip="Playbook">
                  <Link to="/playbook">
                    <Layers className="h-4 w-4" />
                    <span>{t('navbar.playbook')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/backtesting')} tooltip="Backtesting">
                  <Link to="/backtesting">
                    <BarChart2 className="h-4 w-4" />
                    <span>{t('navbar.backtesting')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/trade-replay')} tooltip="Trade Replay">
                  <Link to="/trade-replay">
                    <Play className="h-4 w-4" />
                    <span>{t('navbar.tradeReplay')}</span>
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
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/accounts')} tooltip="Accounts">
                  <Link to="/accounts">
                    <CreditCard className="h-4 w-4" />
                    <span>{t('navbar.accounts')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/watchlists')} tooltip="Watchlists">
                  <Link to="/watchlists">
                    <ListChecks className="h-4 w-4" />
                    <span>{t('navbar.watchlists')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2" isActive={isActive('/activity')} tooltip="Activity">
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
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-center overflow-hidden transition-opacity duration-200 data-[state=collapsed]:opacity-0 data-[state=collapsed]:w-0 data-[state=collapsed]:h-0">
            <p className="text-sm font-medium leading-none truncate">{user?.name || 'John Doe'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || 'john.doe@example.com'}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
