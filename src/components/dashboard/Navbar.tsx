
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Calendar as CalendarIcon, 
  Filter, 
  Menu, 
  PlusCircle, 
  Search, 
  Settings, 
  User 
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";

const Navbar = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-sm animate-slide-down">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SidebarTrigger>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">DashNest Trader</span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-1">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search trades, symbols..."
              className="w-full rounded-full pl-8 bg-accent/50 border-0 focus-visible:ring-primary"
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="ml-2 h-9 gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Date Range</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="sm" className="ml-2 h-9 gap-1">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
          
          <Button variant="default" size="sm" className="ml-2 h-9 gap-1">
            <PlusCircle className="h-4 w-4" />
            <span>New Trade</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Mobile search and actions */}
      <div className="md:hidden flex items-center gap-2 px-4 pb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search trades, symbols..."
            className="w-full rounded-full pl-8 bg-accent/50 border-0 focus-visible:ring-primary"
          />
        </div>
        <Button variant="default" size="sm" className="h-9">
          <PlusCircle className="h-4 w-4 mr-1" />
          <span>New</span>
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
