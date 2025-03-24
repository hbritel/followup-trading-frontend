
import React from 'react';
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

const DashboardSidebar = () => {
  const isMobile = useIsMobile();
  
  return (
    <Sidebar
      defaultCollapsed={isMobile}
      className="border-r"
    >
      <SidebarHeader className="flex justify-center items-center py-6">
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">DN</div>
          <span className="text-xs font-semibold">DashNest Trader</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2">
                  <a href="/">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2 text-primary font-medium">
                  <a href="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2">
                  <a href="/trades">
                    <Shuffle className="h-4 w-4" />
                    <span>Trades</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2">
                  <a href="/calendar">
                    <Calendar className="h-4 w-4" />
                    <span>Calendar</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Analysis</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2">
                  <a href="/performance">
                    <TrendingUp className="h-4 w-4" />
                    <span>Performance</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2">
                  <a href="/statistics">
                    <BarChart4 className="h-4 w-4" />
                    <span>Statistics</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2">
                  <a href="/reports">
                    <PieChart className="h-4 w-4" />
                    <span>Reports</span>
                    <Badge className="ml-auto text-xs" variant="secondary">New</Badge>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2">
                  <a href="/accounts">
                    <CreditCard className="h-4 w-4" />
                    <span>Accounts</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2">
                  <a href="/watchlists">
                    <ListChecks className="h-4 w-4" />
                    <span>Watchlists</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="gap-2">
                  <a href="/activity">
                    <Activity className="h-4 w-4" />
                    <span>Activity</span>
                  </a>
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
            <AvatarFallback className="bg-primary/10 text-primary">JD</AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-center overflow-hidden">
            <p className="text-sm font-medium leading-none truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">john.doe@example.com</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
