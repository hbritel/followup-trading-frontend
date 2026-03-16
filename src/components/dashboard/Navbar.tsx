
import React, { useState } from 'react';
import {
  Bell,
  Settings,
  User,
  MessageSquare,
  Sun,
  Moon,
  LogOut,
  Search as SearchIcon,
  Sparkles,
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
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useTheme } from '@/components/providers/theme-provider';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from 'react-i18next';
import ChatPanel from '@/components/ai/ChatPanel';

interface NavbarProps {
  onOpenCommandPalette?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onOpenCommandPalette }) => {
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [chatOpen, setChatOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <nav className="flex h-14 items-center border-b px-4 md:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-8 w-8" />

          {/* Cmd+K trigger button */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            aria-label={t('commandPalette.open', 'Open command palette')}
            className={[
              'glass-card hidden md:flex items-center gap-2',
              'h-8 rounded-lg px-3',
              'text-sm text-muted-foreground/70',
              'border border-white/10',
              'hover:border-white/20 hover:text-muted-foreground',
              'transition-colors duration-150',
              'cursor-pointer',
            ].join(' ')}
          >
            <SearchIcon className="w-3.5 h-3.5" />
            <span className="text-xs">{t('commandPalette.searchPlaceholder', 'Search...')}</span>
            <kbd className="ml-1 inline-flex h-5 items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] text-muted-foreground/60">
              {navigator.platform.toUpperCase().includes('MAC') ? '⌘K' : 'Ctrl+K'}
            </kbd>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* AI Trading Coach trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setChatOpen(true)}
            aria-label={t('ai.title', 'AI Trading Coach')}
            title={t('ai.title', 'AI Trading Coach')}
            className="relative text-amber-400 hover:text-amber-300 hover:shadow-[0_0_8px_rgba(251,191,36,0.3)]"
          >
            <Sparkles className="h-5 w-5" />
          </Button>

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

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
};

export default Navbar;
