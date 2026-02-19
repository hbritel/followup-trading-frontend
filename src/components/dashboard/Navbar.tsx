
import React from 'react';
import { 
  Bell, 
  Settings, 
  User,
  MessageSquare,
  Menu,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useTheme } from "@/components/providers/theme-provider";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from 'react-i18next';

const Navbar: React.FC = () => {
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="flex h-14 items-center border-b px-4 md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="h-8 w-8" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t('navbar.toggleTheme', 'Toggle theme')}>
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <LanguageSwitcher />
        <Button variant="ghost" size="icon" aria-label={t('navbar.notifications', 'Notifications')}>
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label={t('navbar.messages', 'Messages')}>
          <MessageSquare className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t('navbar.userMenu', 'User menu')}>
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('navbar.myAccount', 'My Account')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              {t('common.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              {t('common.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <div className="flex items-center w-full">
                <LogOut className="h-4 w-4 mr-2" />
                {t('common.logout')}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
