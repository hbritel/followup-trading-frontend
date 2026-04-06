
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Command } from 'cmdk';
import {
  Activity as ActivityIcon,
  AlertTriangle as AlertTriangleIcon,
  BarChart2 as BarChart2Icon,
  Bell as BellIcon,
  BellRing as BellRingIcon,
  BookOpen as BookOpenIcon,
  BookText as BookTextIcon,
  Calendar as CalendarIcon,
  CircleDollarSign as CircleDollarSignIcon,
  FileText as FileTextIcon,
  LineChart as LineChartIcon,
  List as ListIcon,
  Loader2 as Loader2Icon,
  Lock as LockIcon,
  PieChart as PieChartIcon,
  Plus as PlusIcon,
  RefreshCcw as RefreshCcwIcon,
  Rewind as RewindIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  Tag as TagIcon,
  Wallet as WalletIcon,
  Zap as ZapIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import { tradeService } from '@/services/trade.service';
import { strategyService } from '@/services/strategy.service';
import { tagService } from '@/services/tag.service';
import { alertService } from '@/services/alert.service';
import { watchlistService } from '@/services/watchlist.service';
import type { StrategyResponseDto, TagResponseDto, AlertResponseDto, WatchlistResponseDto } from '@/types/dto';
import type { Trade } from '@/components/trades/TradesTableWrapper';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  href: string;
  requiredPlan?: string;
  adminOnly?: boolean;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPnl = (pnl: number | null | undefined): string => {
  if (pnl == null) return '';
  const sign = pnl >= 0 ? '+' : '';
  return `${sign}$${pnl.toFixed(2)}`;
};

const matchesSearch = (term: string, ...fields: (string | null | undefined)[]): boolean => {
  const lower = term.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(lower));
};

// ─── Plan badge ───────────────────────────────────────────────────────────────

const PlanBadge: React.FC<{ plan: string }> = ({ plan }) => (
  <span className="ml-auto flex-shrink-0 inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] text-amber-400">
    {plan}+
  </span>
);

// ─── Item rendering ───────────────────────────────────────────────────────────

interface ResultItemProps {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  secondary?: string;
  shortcut?: string;
  locked?: boolean;
  spinning?: boolean;
  onSelect: () => void;
  requiredPlan?: string;
}

const ResultItem: React.FC<ResultItemProps> = ({
  id,
  icon: Icon,
  label,
  secondary,
  shortcut,
  locked = false,
  spinning = false,
  onSelect,
  requiredPlan,
}) => (
  <Command.Item
    key={id}
    value={`${id} ${label} ${secondary ?? ''}`}
    onSelect={onSelect}
    disabled={locked}
    className={[
      'group flex items-center gap-3 px-4 py-2.5 mx-1 rounded-xl',
      'text-sm cursor-pointer',
      'transition-colors duration-150',
      locked
        ? 'text-white/30 cursor-not-allowed'
        : 'text-white/80 data-[selected=true]:bg-primary/15 data-[selected=true]:text-white data-[selected=true]:shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]',
    ].join(' ')}
  >
    {/* Icon */}
    <span
      className={[
        'flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-150',
        locked
          ? 'bg-white/3'
          : 'bg-white/5 group-data-[selected=true]:bg-primary/20',
      ].join(' ')}
    >
      {locked ? (
        <LockIcon className="w-3.5 h-3.5 text-white/20" />
      ) : (
        <Icon
          className={[
            'w-3.5 h-3.5',
            spinning ? 'animate-spin text-primary' : 'text-muted-foreground group-data-[selected=true]:text-primary',
          ].join(' ')}
        />
      )}
    </span>

    {/* Label + secondary */}
    <span className="flex-1 min-w-0">
      <span className={['block truncate', locked ? 'text-white/30' : ''].join(' ')}>{label}</span>
      {secondary && (
        <span className={['block truncate text-xs mt-0.5', locked ? 'text-white/20' : 'text-muted-foreground/60'].join(' ')}>
          {secondary}
        </span>
      )}
    </span>

    {/* Keyboard shortcut or plan badge */}
    {requiredPlan && locked && <PlanBadge plan={requiredPlan} />}
    {shortcut && !locked && (
      <kbd className="ml-auto hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] text-muted-foreground group-data-[selected=true]:border-primary/30 group-data-[selected=true]:text-primary transition-colors duration-150">
        {shortcut}
      </kbd>
    )}
  </Command.Item>
);

// ─── Component ────────────────────────────────────────────────────────────────

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPlan, currentPlan } = useFeatureFlags();
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const isAdmin = user?.roles?.includes('ROLE_ADMIN') ?? false;
  const canAccessWatchlists = hasPlan('STARTER');
  const canAccessAlerts = hasPlan('STARTER');

  // ── Data queries (lazy — only fetch when palette is open) ────────────────

  const { data: trades = [] } = useQuery<Trade[]>({
    queryKey: ['command-palette-trades'],
    queryFn: () => tradeService.getAllTrades(),
    enabled: open,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: strategies = [] } = useQuery<StrategyResponseDto[]>({
    queryKey: ['command-palette-strategies'],
    queryFn: () => strategyService.getStrategies(),
    enabled: open,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: tags = [] } = useQuery<TagResponseDto[]>({
    queryKey: ['command-palette-tags'],
    queryFn: () => tagService.getTags(),
    enabled: open,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: watchlists = [] } = useQuery<WatchlistResponseDto[]>({
    queryKey: ['command-palette-watchlists'],
    queryFn: () => watchlistService.getWatchlists(),
    enabled: open && canAccessWatchlists,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: alerts = [] } = useQuery<AlertResponseDto[]>({
    queryKey: ['command-palette-alerts'],
    queryFn: () => alertService.getAlerts(),
    enabled: open && canAccessAlerts,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // ── Close and navigate ───────────────────────────────────────────────────

  const go = useCallback(
    (href: string) => {
      onOpenChange(false);
      setSearch('');
      navigate(href);
    },
    [navigate, onOpenChange],
  );

  // ── Reset search when palette closes ────────────────────────────────────

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  // ── Keyboard shortcut: Cmd+K / Ctrl+K ───────────────────────────────────

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

  // ── Navigation items ─────────────────────────────────────────────────────

  const allNavItems: NavItem[] = [
    { id: 'nav-dashboard', label: t('sidebar.dashboard', 'Dashboard'), icon: ActivityIcon, shortcut: 'D', href: '/dashboard' },
    { id: 'nav-trades', label: t('sidebar.trades', 'Trades'), icon: LineChartIcon, href: '/trades' },
    { id: 'nav-journal', label: t('sidebar.dailyJournal', 'Daily Journal'), icon: BookTextIcon, href: '/daily-journal' },
    { id: 'nav-calendar', label: t('sidebar.calendar', 'Calendar'), icon: CalendarIcon, href: '/calendar' },
    { id: 'nav-playbook', label: t('sidebar.playbook', 'Playbook'), icon: BookOpenIcon, href: '/playbook' },
    { id: 'nav-insights', label: t('sidebar.insights', 'Insights'), icon: LineChartIcon, href: '/insights' },
    { id: 'nav-performance', label: t('sidebar.performance', 'Performance'), icon: BarChart2Icon, href: '/performance' },
    { id: 'nav-statistics', label: t('sidebar.statistics', 'Statistics'), icon: PieChartIcon, href: '/statistics' },
    { id: 'nav-risk', label: t('sidebar.riskMetrics', 'Risk Metrics'), icon: AlertTriangleIcon, href: '/risk-metrics' },
    { id: 'nav-watchlists', label: t('sidebar.watchlists', 'Watchlists'), icon: ListIcon, href: '/watchlists', requiredPlan: 'STARTER' },
    { id: 'nav-alerts', label: t('sidebar.alerts', 'Alerts'), icon: BellRingIcon, href: '/alerts', requiredPlan: 'STARTER' },
    { id: 'nav-backtesting', label: t('sidebar.backtesting', 'Backtesting'), icon: RefreshCcwIcon, href: '/backtesting', requiredPlan: 'PRO' },
    { id: 'nav-replay', label: t('sidebar.tradeReplay', 'Trade Replay'), icon: RewindIcon, href: '/trade-replay', requiredPlan: 'PRO' },
    { id: 'nav-reports', label: t('sidebar.reports', 'Reports'), icon: FileTextIcon, href: '/reports' },
    { id: 'nav-accounts', label: t('sidebar.accounts', 'Accounts'), icon: WalletIcon, href: '/accounts' },
    { id: 'nav-account-mgmt', label: t('sidebar.accountManagement', 'Account Management'), icon: CircleDollarSignIcon, href: '/account-management' },
    { id: 'nav-admin', label: t('sidebar.administration', 'Administration'), icon: ShieldIcon, href: '/administration', adminOnly: true },
    { id: 'nav-settings', label: t('common.settings', 'Settings'), icon: SettingsIcon, shortcut: ',', href: '/settings' },
  ];

  // Filter admin item for non-admins; show all others (locked if plan-gated)
  const visibleNavItems = allNavItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  // ── Filtered results (client-side) ──────────────────────────────────────

  const term = search.trim();
  const hasSearch = term.length > 0;

  const filteredNav = useMemo(
    () =>
      visibleNavItems.filter((item) =>
        matchesSearch(term, item.label),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [term, isAdmin, currentPlan],
  );

  const filteredTrades = useMemo(
    () =>
      hasSearch
        ? trades
            .filter((t) => matchesSearch(term, t.symbol))
            .slice(0, 5)
        : [],
    [trades, term, hasSearch],
  );

  const filteredStrategies = useMemo(
    () =>
      hasSearch
        ? strategies
            .filter((s) => matchesSearch(term, s.name, s.description))
            .slice(0, 5)
        : [],
    [strategies, term, hasSearch],
  );

  const filteredTags = useMemo(
    () =>
      hasSearch
        ? tags
            .filter((tag) => matchesSearch(term, tag.name))
            .slice(0, 5)
        : [],
    [tags, term, hasSearch],
  );

  const filteredWatchlists = useMemo(
    () =>
      hasSearch
        ? watchlists
            .filter((w) => matchesSearch(term, w.name, w.description))
            .slice(0, 5)
        : [],
    [watchlists, term, hasSearch],
  );

  const filteredAlerts = useMemo(
    () =>
      hasSearch
        ? alerts
            .filter((a) => matchesSearch(term, a.name, a.symbol))
            .slice(0, 5)
        : [],
    [alerts, term, hasSearch],
  );

  // ── Quick actions (always visible when not searching) ────────────────────

  const quickActions = [
    {
      id: 'action-add-trade',
      label: t('commandPalette.addTrade', 'Add Trade'),
      icon: PlusIcon,
      shortcut: 'N',
      onSelect: () => go('/trades?new=1'),
    },
    {
      id: 'action-sync',
      label: isSyncing
        ? t('commandPalette.syncing', 'Syncing...')
        : t('commandPalette.syncAccounts', 'Sync Accounts'),
      icon: isSyncing ? Loader2Icon : ZapIcon,
      spinning: isSyncing,
      onSelect: () => {
        if (isSyncing) return;
        setIsSyncing(true);
        onOpenChange(false);
        navigate('/accounts?sync=1');
        setTimeout(() => setIsSyncing(false), 3000);
      },
    },
    {
      id: 'action-report',
      label: t('commandPalette.generateReport', 'Generate Report'),
      icon: FileTextIcon,
      onSelect: () => go('/reports?generate=1'),
    },
  ];

  // ── Group heading style ──────────────────────────────────────────────────

  const groupHeadingClass = [
    '[&_[cmdk-group-heading]]:label-caps',
    '[&_[cmdk-group-heading]]:text-[10px]',
    '[&_[cmdk-group-heading]]:text-muted-foreground/50',
    '[&_[cmdk-group-heading]]:px-4',
    '[&_[cmdk-group-heading]]:py-2',
    '[&_[cmdk-group-heading]]:tracking-wider',
  ].join(' ');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={[
          '!p-0 !gap-0 !border-0',
          'fixed left-1/2 top-[20%] -translate-x-1/2 -translate-y-0',
          'w-full max-w-xl',
          'glass-panel',
          'bg-black/80 backdrop-blur-2xl',
          'rounded-2xl',
          'border border-white/10',
          'shadow-2xl shadow-black/60',
          'overflow-hidden',
          '!translate-y-0 data-[state=open]:!slide-in-from-top-[48%]',
        ].join(' ')}
        aria-label={t('commandPalette.title', 'Command Palette')}
      >
        <Command
          className="bg-transparent text-white"
          loop
          shouldFilter={false}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
            <SearchIcon className="flex-shrink-0 w-4 h-4 text-muted-foreground" />
            <Command.Input
              placeholder={t('commandPalette.placeholder', 'Type a command or search...')}
              value={search}
              onValueChange={setSearch}
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
          <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden py-2">
            <Command.Empty className="py-10 text-center text-sm text-muted-foreground/60">
              {t('commandPalette.noResults', 'No results found.')}
            </Command.Empty>

            {/* ── When not searching: Navigation + Quick Actions ── */}
            {!hasSearch && (
              <>
                <Command.Group
                  heading={t('commandPalette.navigation', 'Navigation')}
                  className={groupHeadingClass}
                >
                  {visibleNavItems.map((item) => {
                    const locked = item.requiredPlan ? !hasPlan(item.requiredPlan) : false;
                    return (
                      <ResultItem
                        key={item.id}
                        id={item.id}
                        icon={item.icon}
                        label={item.label}
                        shortcut={item.shortcut}
                        locked={locked}
                        requiredPlan={locked ? item.requiredPlan : undefined}
                        onSelect={() => locked ? go('/pricing') : go(item.href)}
                      />
                    );
                  })}
                </Command.Group>

                <Command.Group
                  heading={t('commandPalette.quickActions', 'Quick Actions')}
                  className={groupHeadingClass}
                >
                  {quickActions.map((action) => (
                    <ResultItem
                      key={action.id}
                      id={action.id}
                      icon={action.icon}
                      label={action.label}
                      shortcut={action.shortcut}
                      spinning={action.spinning}
                      onSelect={action.onSelect}
                    />
                  ))}
                </Command.Group>
              </>
            )}

            {/* ── When searching: dynamic result groups ── */}
            {hasSearch && (
              <>
                {/* Navigation results */}
                {filteredNav.length > 0 && (
                  <Command.Group
                    heading={t('commandPalette.navigation', 'Navigation')}
                    className={groupHeadingClass}
                  >
                    {filteredNav.map((item) => {
                      const locked = item.requiredPlan ? !hasPlan(item.requiredPlan) : false;
                      return (
                        <ResultItem
                          key={item.id}
                          id={item.id}
                          icon={item.icon}
                          label={item.label}
                          shortcut={item.shortcut}
                          locked={locked}
                          requiredPlan={locked ? item.requiredPlan : undefined}
                          onSelect={() => locked ? go('/pricing') : go(item.href)}
                        />
                      );
                    })}
                  </Command.Group>
                )}

                {/* Trades results */}
                {filteredTrades.length > 0 && (
                  <Command.Group
                    heading={t('commandPalette.trades', 'Trades')}
                    className={groupHeadingClass}
                  >
                    {filteredTrades.map((trade) => (
                      <ResultItem
                        key={`trade-${trade.id}`}
                        id={`trade-${trade.id}`}
                        icon={LineChartIcon}
                        label={trade.symbol}
                        secondary={[
                          trade.direction?.toUpperCase(),
                          trade.profit != null ? formatPnl(trade.profit) : null,
                          trade.entryDate ? new Date(trade.entryDate).toLocaleDateString() : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                        onSelect={() => go(`/trades?search=${encodeURIComponent(trade.symbol)}`)}
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Strategies results */}
                {filteredStrategies.length > 0 && (
                  <Command.Group
                    heading={t('commandPalette.strategies', 'Strategies')}
                    className={groupHeadingClass}
                  >
                    {filteredStrategies.map((strategy) => (
                      <ResultItem
                        key={`strategy-${strategy.id}`}
                        id={`strategy-${strategy.id}`}
                        icon={BookOpenIcon}
                        label={strategy.name}
                        secondary={strategy.description ?? undefined}
                        onSelect={() => go('/playbook')}
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Tags results */}
                {filteredTags.length > 0 && (
                  <Command.Group
                    heading={t('commandPalette.tags', 'Tags')}
                    className={groupHeadingClass}
                  >
                    {filteredTags.map((tag) => (
                      <ResultItem
                        key={`tag-${tag.id}`}
                        id={`tag-${tag.id}`}
                        icon={TagIcon}
                        label={tag.name}
                        secondary={tag.color}
                        onSelect={() => go(`/trades?tag=${encodeURIComponent(tag.name)}`)}
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Watchlists results */}
                {canAccessWatchlists && filteredWatchlists.length > 0 && (
                  <Command.Group
                    heading={t('commandPalette.watchlists', 'Watchlists')}
                    className={groupHeadingClass}
                  >
                    {filteredWatchlists.map((wl) => (
                      <ResultItem
                        key={`wl-${wl.id}`}
                        id={`wl-${wl.id}`}
                        icon={ListIcon}
                        label={wl.name}
                        secondary={`${wl.items.length} symbol${wl.items.length !== 1 ? 's' : ''}`}
                        onSelect={() => go('/watchlists')}
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Watchlists locked teaser */}
                {!canAccessWatchlists && (
                  <Command.Group
                    heading="Watchlists (Starter+)"
                    className={groupHeadingClass}
                  >
                    <ResultItem
                      id="wl-locked"
                      icon={ListIcon}
                      label={t('commandPalette.watchlistsLocked', 'Watchlists — upgrade to search')}
                      locked
                      requiredPlan="STARTER"
                      onSelect={() => go('/pricing')}
                    />
                  </Command.Group>
                )}

                {/* Alerts results */}
                {canAccessAlerts && filteredAlerts.length > 0 && (
                  <Command.Group
                    heading={t('commandPalette.alerts', 'Alerts')}
                    className={groupHeadingClass}
                  >
                    {filteredAlerts.map((alert) => (
                      <ResultItem
                        key={`alert-${alert.id}`}
                        id={`alert-${alert.id}`}
                        icon={BellIcon}
                        label={alert.name}
                        secondary={[
                          alert.symbol,
                          alert.condition,
                          alert.threshold != null ? String(alert.threshold) : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                        onSelect={() => go('/alerts')}
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Alerts locked teaser */}
                {!canAccessAlerts && (
                  <Command.Group
                    heading="Alerts (Starter+)"
                    className={groupHeadingClass}
                  >
                    <ResultItem
                      id="alert-locked"
                      icon={BellIcon}
                      label={t('commandPalette.alertsLocked', 'Alerts — upgrade to search')}
                      locked
                      requiredPlan="STARTER"
                      onSelect={() => go('/pricing')}
                    />
                  </Command.Group>
                )}
              </>
            )}
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
