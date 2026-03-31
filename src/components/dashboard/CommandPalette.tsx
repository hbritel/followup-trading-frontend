
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Command } from 'cmdk';
import {
  Activity as ActivityIcon,
  AlertTriangle as AlertTriangleIcon,
  BarChart2 as BarChart2Icon,
  BellRing as BellRingIcon,
  BookOpen as BookOpenIcon,
  BookText as BookTextIcon,
  Calendar as CalendarIcon,
  CircleDollarSign as CircleDollarSignIcon,
  FileText as FileTextIcon,
  LineChart as LineChartIcon,
  List as ListIcon,
  Loader2 as Loader2Icon,
  PieChart as PieChartIcon,
  Plus as PlusIcon,
  RefreshCcw as RefreshCcwIcon,
  Rewind as RewindIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  Wallet as WalletIcon,
  Zap as ZapIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommandItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
}

interface CommandGroup {
  heading: string;
  items: CommandItem[];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);

  // Close and navigate
  const go = useCallback(
    (href: string) => {
      onOpenChange(false);
      navigate(href);
    },
    [navigate, onOpenChange],
  );

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  const groups: CommandGroup[] = [
    {
      heading: t('commandPalette.navigation', 'Navigation'),
      items: [
        {
          id: 'nav-dashboard',
          label: t('sidebar.dashboard', 'Dashboard'),
          icon: ActivityIcon,
          shortcut: 'D',
          action: () => go('/dashboard'),
        },
        {
          id: 'nav-trades',
          label: t('sidebar.trades', 'Trades'),
          icon: LineChartIcon,
          action: () => go('/trades'),
        },
        {
          id: 'nav-journal',
          label: t('sidebar.dailyJournal', 'Daily Journal'),
          icon: BookTextIcon,
          action: () => go('/daily-journal'),
        },
        {
          id: 'nav-calendar',
          label: t('sidebar.calendar', 'Calendar'),
          icon: CalendarIcon,
          action: () => go('/calendar'),
        },
        {
          id: 'nav-playbook',
          label: t('sidebar.playbook', 'Playbook'),
          icon: BookOpenIcon,
          action: () => go('/playbook'),
        },
        {
          id: 'nav-insights',
          label: t('sidebar.insights', 'Insights'),
          icon: LineChartIcon,
          action: () => go('/insights'),
        },
        {
          id: 'nav-performance',
          label: t('sidebar.performance', 'Performance'),
          icon: BarChart2Icon,
          action: () => go('/performance'),
        },
        {
          id: 'nav-statistics',
          label: t('sidebar.statistics', 'Statistics'),
          icon: PieChartIcon,
          action: () => go('/statistics'),
        },
        {
          id: 'nav-risk',
          label: t('sidebar.riskMetrics', 'Risk Metrics'),
          icon: AlertTriangleIcon,
          action: () => go('/risk-metrics'),
        },
        {
          id: 'nav-watchlists',
          label: t('sidebar.watchlists', 'Watchlists'),
          icon: ListIcon,
          action: () => go('/watchlists'),
        },
        {
          id: 'nav-alerts',
          label: t('sidebar.alerts', 'Alerts'),
          icon: BellRingIcon,
          action: () => go('/alerts'),
        },
        {
          id: 'nav-backtesting',
          label: t('sidebar.backtesting', 'Backtesting'),
          icon: RefreshCcwIcon,
          action: () => go('/backtesting'),
        },
        {
          id: 'nav-replay',
          label: t('sidebar.tradeReplay', 'Trade Replay'),
          icon: RewindIcon,
          action: () => go('/trade-replay'),
        },
        {
          id: 'nav-reports',
          label: t('sidebar.reports', 'Reports'),
          icon: FileTextIcon,
          action: () => go('/reports'),
        },
        {
          id: 'nav-accounts',
          label: t('sidebar.accounts', 'Accounts'),
          icon: WalletIcon,
          action: () => go('/accounts'),
        },
        {
          id: 'nav-account-mgmt',
          label: t('sidebar.accountManagement', 'Account Management'),
          icon: CircleDollarSignIcon,
          action: () => go('/account-management'),
        },
        {
          id: 'nav-admin',
          label: t('sidebar.administration', 'Administration'),
          icon: ShieldIcon,
          action: () => go('/administration'),
        },
        {
          id: 'nav-settings',
          label: t('common.settings', 'Settings'),
          icon: SettingsIcon,
          shortcut: ',',
          action: () => go('/settings'),
        },
      ],
    },
    {
      heading: t('commandPalette.quickActions', 'Quick Actions'),
      items: [
        {
          id: 'action-add-trade',
          label: t('commandPalette.addTrade', 'Add Trade'),
          icon: PlusIcon,
          shortcut: 'N',
          action: () => go('/trades?new=1'),
        },
        {
          id: 'action-sync',
          label: isSyncing
            ? t('commandPalette.syncing', 'Syncing...')
            : t('commandPalette.syncAccounts', 'Sync Accounts'),
          icon: isSyncing ? Loader2Icon : ZapIcon,
          action: () => {
            if (isSyncing) return;
            setIsSyncing(true);
            onOpenChange(false);
            // Trigger sync — navigates to accounts page; the page handles the sync
            navigate('/accounts?sync=1');
            setTimeout(() => setIsSyncing(false), 3000);
          },
        },
        {
          id: 'action-report',
          label: t('commandPalette.generateReport', 'Generate Report'),
          icon: FileTextIcon,
          action: () => go('/reports?generate=1'),
        },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={[
          // Remove default padding and rounded from DialogContent so we control it
          '!p-0 !gap-0 !border-0',
          'fixed left-1/2 top-[20%] -translate-x-1/2 -translate-y-0',
          'w-full max-w-xl',
          // Glass styling
          'glass-panel',
          'bg-black/80 backdrop-blur-2xl',
          'rounded-2xl',
          'border border-white/10',
          'shadow-2xl shadow-black/60',
          'overflow-hidden',
          // Animation override
          '!translate-y-0 data-[state=open]:!slide-in-from-top-[48%]',
        ].join(' ')}
        // Hide default close button by overriding via CSS trick — keep accessible
        aria-label={t('commandPalette.title', 'Command Palette')}
      >
        <Command
          className="bg-transparent text-white"
          loop
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
            <SearchIcon className="flex-shrink-0 w-4 h-4 text-muted-foreground" />
            <Command.Input
              placeholder={t('commandPalette.placeholder', 'Type a command or search...')}
              className={[
                'flex-1 bg-transparent outline-none',
                'text-sm text-white placeholder:text-muted-foreground/60',
                'caret-primary',
              ].join(' ')}
              autoFocus
            />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Results list */}
          <Command.List className="max-h-[360px] overflow-y-auto overflow-x-hidden py-2">
            <Command.Empty className="py-10 text-center text-sm text-muted-foreground/60">
              {t('commandPalette.noResults', 'No results found.')}
            </Command.Empty>

            {groups.map((group) => (
              <Command.Group
                key={group.heading}
                heading={group.heading}
                className={[
                  // Group heading
                  '[&_[cmdk-group-heading]]:label-caps',
                  '[&_[cmdk-group-heading]]:text-[10px]',
                  '[&_[cmdk-group-heading]]:text-muted-foreground/50',
                  '[&_[cmdk-group-heading]]:px-4',
                  '[&_[cmdk-group-heading]]:py-2',
                  '[&_[cmdk-group-heading]]:tracking-wider',
                ].join(' ')}
              >
                {group.items.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={`${item.id} ${item.label}`}
                    onSelect={item.action}
                    className={[
                      'group flex items-center gap-3 px-4 py-2.5 mx-1 rounded-xl',
                      'text-sm text-white/80 cursor-pointer',
                      'transition-colors duration-150',
                      'data-[selected=true]:bg-primary/15 data-[selected=true]:text-white',
                      'data-[selected=true]:shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]',
                    ].join(' ')}
                  >
                    {/* Icon */}
                    <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 group-data-[selected=true]:bg-primary/20 transition-colors duration-150">
                      <item.icon
                        className={[
                          'w-3.5 h-3.5 text-muted-foreground',
                          'group-data-[selected=true]:text-primary',
                          item.id === 'action-sync' && isSyncing ? 'animate-spin' : '',
                        ].join(' ')}
                      />
                    </span>

                    {/* Label */}
                    <span className="flex-1 truncate">{item.label}</span>

                    {/* Keyboard shortcut badge */}
                    {item.shortcut && (
                      <kbd className="ml-auto hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] text-muted-foreground group-data-[selected=true]:border-primary/30 group-data-[selected=true]:text-primary transition-colors duration-150">
                        {item.shortcut}
                      </kbd>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>

          {/* Footer hint */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
              <kbd className="inline-flex h-4 items-center rounded border border-white/10 bg-white/5 px-1 font-mono text-[9px]">↑↓</kbd>
              <span>navigate</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
              <kbd className="inline-flex h-4 items-center rounded border border-white/10 bg-white/5 px-1 font-mono text-[9px]">↵</kbd>
              <span>select</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
              <kbd className="inline-flex h-4 items-center rounded border border-white/10 bg-white/5 px-1 font-mono text-[9px]">ESC</kbd>
              <span>close</span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
