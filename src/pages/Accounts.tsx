
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSubscription } from '@/hooks/useSubscription';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  PlusCircle,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Settings2,
  Trash2,
  Clock,
  CalendarDays,
  Activity,
  Wallet,
  Eye,
  Plug,
  Inbox,
  CheckCircle2,
  MoreHorizontal,
  Link as LinkIcon,
  Shield,
  Lock,
  Gauge,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { brokerService, type ConnectBrokerRequest, type BrokerConnectionResponse } from '@/services/broker.service';
import { useAllowedSyncFrequencies } from '@/hooks/useBrokers';
import { invalidateDashboardData } from '@/lib/invalidate-dashboard';
import { AccountsListSkeleton, SummaryCardSkeleton } from '@/components/skeletons';
import PageError from '@/components/ui/page-error';
import UsageLimitIndicator from '@/components/subscription/UsageLimitIndicator';

// --- Helpers ---
const formatBrokerName = (brokerType: string): string => {
  const map: Record<string, string> = {
    INTERACTIVE_BROKERS: 'Interactive Brokers',
    MT5: 'MetaTrader 5',
    OANDA: 'Oanda',
    ALPACA: 'Alpaca',
  };
  return map[brokerType] || brokerType;
};

const getAccountTitle = (account: { displayName?: string | null; brokerDisplayName?: string; accountIdentifier?: string; brokerType?: string }): string => {
  if (account.displayName) return account.displayName;
  const broker = account.brokerDisplayName || formatBrokerName(account.brokerType || '');
  const acctId = account.accountIdentifier && account.accountIdentifier !== 'default' ? account.accountIdentifier : null;
  return acctId ? `${broker} - ${acctId}` : broker;
};

const getBrokerLabel = (account: { brokerDisplayName?: string; brokerType?: string }): string =>
  account.brokerDisplayName || formatBrokerName(account.brokerType || '');

const STATUS_I18N_MAP: Record<string, string> = {
  'CONNECTED': 'accounts.statusConnected',
  'ACTIVE': 'accounts.statusActive',
  'PENDING': 'accounts.statusPending',
  'DISCONNECTED': 'accounts.statusDisconnected',
  'ERROR': 'accounts.statusError',
};

const getStatusLabel = (status: string | undefined, t: (key: string) => string, enabled = true): string => {
  if (!enabled) return t('accounts.statusPaused');
  const key = STATUS_I18N_MAP[status ?? ''];
  return key ? t(key) : (status?.toLowerCase() || t('accounts.unknown'));
};

const getStatusConfigForAccount = (account: { status?: string; enabled?: boolean }) => {
  if (!account.enabled) {
    return { variant: 'outline' as const, dotClass: 'bg-amber-500', colorClass: 'text-amber-500' };
  }
  return getStatusConfig(account.status);
};

const getStatusConfig = (status: string | undefined) => {
  switch (status) {
    case 'CONNECTED':
    case 'ACTIVE':
      return { variant: 'default' as const, dotClass: 'bg-emerald-500', colorClass: 'text-emerald-500' };
    case 'PENDING':
      return { variant: 'outline' as const, dotClass: 'bg-amber-500', colorClass: 'text-amber-500' };
    case 'DISCONNECTED':
      return { variant: 'secondary' as const, dotClass: 'bg-muted-foreground', colorClass: 'text-muted-foreground' };
    case 'ERROR':
      return { variant: 'destructive' as const, dotClass: 'bg-destructive', colorClass: 'text-destructive' };
    default:
      return { variant: 'secondary' as const, dotClass: 'bg-muted-foreground', colorClass: 'text-muted-foreground' };
  }
};

// Deterministic color for broker initials
const BROKER_COLORS = [
  'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
  'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  'bg-pink-500/15 text-pink-600 dark:text-pink-400',
];

const getBrokerColor = (brokerCode: string) => {
  let hash = 0;
  for (let i = 0; i < brokerCode.length; i++) {
    hash = brokerCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BROKER_COLORS[Math.abs(hash) % BROKER_COLORS.length];
};

const getBrokerInitials = (account: { brokerDisplayName?: string; brokerCode?: string; brokerType?: string }) => {
  const name = account.brokerDisplayName || account.brokerCode || account.brokerType || '??';
  const parts = name.split(/[\s_-]+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// Time-ago helper
const timeAgo = (iso: string, t: (key: string, opts?: Record<string, unknown>) => string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('accounts.justNow');
  if (mins < 60) return t('accounts.minutesAgo', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('accounts.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  return t('accounts.daysAgo', { count: days });
};

// ---------------------------------------------------------------------------
// Account Detail Sheet
// ---------------------------------------------------------------------------
function AccountDetailSheet({
  account,
  open,
  onOpenChange,
  onSync,
  onEdit,
  onDisconnect,
  isSyncing,
  isDisconnecting,
  getSyncFrequencyLabel,
}: {
  account: BrokerConnectionResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSync: () => void;
  onEdit: () => void;
  onDisconnect: () => void;
  isSyncing: boolean;
  isDisconnecting: boolean;
  getSyncFrequencyLabel: (freq: string) => string;
}) {
  const { t } = useTranslation();
  const statusConfig = getStatusConfigForAccount(account);
  const isManual = account.protocol === 'MANUAL';
  const brokerColor = getBrokerColor(account.brokerCode || account.brokerType || '');
  const isConnected = account.status === 'CONNECTED' || account.status === 'ACTIVE';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto">
        {/* Visual header with broker branding */}
        <div className="relative -mx-6 -mt-6 px-6 pt-6 pb-5 mb-4 bg-gradient-to-b from-muted/50 to-transparent">
          <SheetHeader className="pb-0">
            <div className="flex items-center gap-4">
              <div className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl font-bold text-lg',
                brokerColor,
              )}>
                {getBrokerInitials(account)}
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="truncate text-lg">{getAccountTitle(account)}</SheetTitle>
                <SheetDescription className="truncate">{getBrokerLabel(account)}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Status + Type badges */}
          <div className="flex items-center gap-2 mt-3">
            <Badge variant={statusConfig.variant} className="gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', statusConfig.dotClass)} />
              {getStatusLabel(account.status, t, account.enabled)}
            </Badge>
            <Badge
              variant="outline"
              className={account.accountType === 'DEMO'
                ? 'border-amber-500/30 text-amber-500'
                : 'border-emerald-500/30 text-emerald-500'}
            >
              {account.accountType === 'DEMO' ? t('accounts.demo') : t('accounts.real')}
            </Badge>
            {account.protocol && account.protocol !== 'MANUAL' && (
              <Badge variant="outline" className="text-muted-foreground">
                {account.protocol.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
        </div>

        {/* Connection Details */}
        <div className="space-y-1 mb-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t('accounts.connectionDetails')}
          </h4>
          <div className="rounded-lg border bg-muted/30 divide-y">
            <DetailRow
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              label={t('accounts.syncFrequency')}
              value={getSyncFrequencyLabel(account.syncFrequency)}
            />
            <DetailRow
              icon={<Clock className="h-3.5 w-3.5" />}
              label={t('accounts.lastSynced')}
              value={account.lastSyncTime
                ? new Date(account.lastSyncTime).toLocaleString()
                : t('accounts.never')}
            />
            <DetailRow
              icon={<CalendarDays className="h-3.5 w-3.5" />}
              label={t('accounts.connectedSince')}
              value={new Date(account.createdAt).toLocaleDateString()}
            />
            {account.accountIdentifier && account.accountIdentifier !== 'default' && (
              <DetailRow
                icon={<Plug className="h-3.5 w-3.5" />}
                label={t('accounts.accountId')}
                value={account.accountIdentifier}
                mono
              />
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-1 mb-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t('accounts.accountActions')}
          </h4>
          <div className="space-y-2">
            {!isManual && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2.5 h-10"
                onClick={onSync}
                disabled={isSyncing || !account.enabled || !isConnected}
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isSyncing ? t('accounts.syncing') : t('accounts.syncNow')}
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full justify-start gap-2.5 h-10"
              onClick={onEdit}
            >
              <Settings2 className="h-4 w-4" />
              {t('accounts.editSettings')}
            </Button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-destructive/70 uppercase tracking-wide">
            {t('accounts.dangerZone')}
          </h4>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-xs text-muted-foreground mb-2.5">
              {t('accounts.disconnectWarning')}
            </p>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={onDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              {t('accounts.disconnect')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Detail row helper for the sheet
function DetailRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-3.5 py-2.5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <span className={cn('text-sm font-medium', mono && 'font-mono text-xs')}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const Accounts = () => {
  const { t } = useTranslation();

  const getSyncFrequencyLabel = (freq: string) => {
    const key = {
      'REALTIME': 'accounts.realtime',
      'EVERY_5_MINUTES': 'accounts.every5Minutes',
      'EVERY_15_MINUTES': 'accounts.every15Minutes',
      'EVERY_30_MINUTES': 'accounts.every30Minutes',
      'HOURLY': 'accounts.hourly',
      'DAILY': 'accounts.daily',
      'WEEKLY': 'accounts.weekly',
      'MONTHLY': 'accounts.monthly',
      'MANUAL': 'accounts.manual',
    }[freq];
    return key ? t(key) : freq;
  };

  const queryClient = useQueryClient();
  const [linkAccountOpen, setLinkAccountOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [viewAccountOpen, setViewAccountOpen] = useState(false);
  const [editAccountOpen, setEditAccountOpen] = useState(false);
  const [confirmDisconnectOpen, setConfirmDisconnectOpen] = useState(false);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const batchSyncIdsRef = useRef<Set<string>>(new Set());
  const { toast } = useToast();

  // --- Manual account dialog state ---
  const [manualAccountOpen, setManualAccountOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualAccountType, setManualAccountType] = useState<string>('REAL');
  const [inlineError, setInlineError] = useState<string | null>(null);

  // --- Form state for linking ---
  const [newBrokerType, setNewBrokerType] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newAccountType, setNewAccountType] = useState<string>('REAL');
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  // --- Form state for editing ---
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editSyncFrequency, setEditSyncFrequency] = useState('');
  const [editEnabled, setEditEnabled] = useState(true);
  const [editAccountType, setEditAccountType] = useState<string>('REAL');

  // --- Allowed sync frequencies from the user's subscription plan ---
  const { data: allowedFrequencies } = useAllowedSyncFrequencies();

  // --- Queries ---
  const {
    data: accounts = [],
    isLoading,
    isError,
    error,
    refetch: refetchAccounts,
  } = useQuery({
    queryKey: ['broker-connections'],
    queryFn: brokerService.getConnections,
    retry: 2,
  });

  const { data: availableBrokers, isLoading: brokersLoading } = useQuery({
    queryKey: ['available-brokers'],
    queryFn: brokerService.getBrokers
  });

  const selectedBroker = availableBrokers?.find(b => b.code === newBrokerType);
  // Filter out deprecated MT5_BRIDGE protocol
  const supportedProtocols = (selectedBroker?.supportedProtocols ?? []).filter(p => p.protocol !== 'MT5_BRIDGE');
  const hasMultipleProtocols = supportedProtocols.length > 1;
  // Auto-select single protocol when available
  const effectiveProtocol = selectedProtocol || (supportedProtocols.length === 1 ? supportedProtocols[0].protocol : selectedBroker?.defaultProtocol);

  const { data: credentialSchema, isLoading: schemaLoading } = useQuery({
    queryKey: ['credential-schema', newBrokerType, effectiveProtocol],
    queryFn: () => brokerService.getCredentialSchema(newBrokerType, effectiveProtocol),
    enabled: !!newBrokerType && !!effectiveProtocol,
    retry: 1,
  });

  const realAccounts = accounts.filter(a => a.accountType !== 'DEMO');
  const demoAccounts = accounts.filter(a => a.accountType === 'DEMO');

  // Plan-based connection limits
  const { data: subscription } = useSubscription();
  const connectionsMax = subscription?.usage?.connectionsMax ?? 1;
  const isUnlimitedConnections = connectionsMax >= 2147483647;
  const isOverConnectionLimit = !isUnlimitedConnections && accounts.length > connectionsMax;
  const isAtConnectionLimit = !isUnlimitedConnections && accounts.length >= connectionsMax;

  // Computed stats
  const activeCount = accounts.filter(a => a.enabled && (a.status === 'CONNECTED' || a.status === 'ACTIVE')).length;
  const errorCount = accounts.filter(a => a.status === 'ERROR').length;

  // --- Mutations ---
  const connectMutation = useMutation({
    mutationFn: (req: ConnectBrokerRequest) => brokerService.connectBroker(req),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['broker-connections'] });
      setLinkAccountOpen(false);
      resetLinkForm();
      toast({
        title: t('accounts.accountLinked'),
        description: t('accounts.accountLinkedDescription'),
      });
      // Backend auto-triggers the first sync via BrokerConnectionService.triggerFirstSync().
      // Mark the connection as syncing so the row shows a spinner — the WS SYNC_STARTED /
      // SYNC_COMPLETE messages drive the rest of the UX. No HTTP sync call here.
      if (data && data.id) {
        setSyncingIds(prev => new Set(prev).add(data.id));
      }
    },
    onError: (err: Error & { isRateLimited?: boolean; isServiceUnavailable?: boolean }) => {
      if (err.isRateLimited) {
        toast({ title: t('accounts.tooManyRequests'), description: err.message, variant: 'destructive' });
      } else if (err.isServiceUnavailable) {
        toast({ title: t('accounts.serviceUnavailable'), description: err.message, variant: 'destructive' });
      } else {
        toast({ title: t('accounts.connectionFailed'), description: t('accounts.connectionFailedDescription'), variant: 'destructive' });
      }
      setInlineError(err.message || t('accounts.connectionFailedDescription'));
    },
  });

  const syncMutation = useMutation({
    mutationFn: ({ connectionId, idempotencyKey }: { connectionId: string; idempotencyKey: string }) =>
      brokerService.syncConnection(connectionId, idempotencyKey),
    onSuccess: (_data, variables) => {
      setSyncingIds(prev => { const n = new Set(prev); n.delete(variables.connectionId); return n; });
      const isBatch = batchSyncIdsRef.current.delete(variables.connectionId);
      queryClient.invalidateQueries({ queryKey: ['broker-connections'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      invalidateDashboardData(queryClient);
      if (!isBatch) {
        toast({
          title: t('accounts.syncComplete'),
          description: t('accounts.syncCompleteDescription', { count: _data.tradesImported ?? 0 }),
        });
      }
    },
    onError: (err: Error & { isRateLimited?: boolean; isServiceUnavailable?: boolean; retryAfterSeconds?: number }, variables) => {
      setSyncingIds(prev => { const n = new Set(prev); n.delete(variables.connectionId); return n; });
      const isBatch = batchSyncIdsRef.current.delete(variables.connectionId);
      if (isBatch) return;
      if (err.isRateLimited) {
        toast({
          title: t('accounts.syncRateLimited'),
          description: t('accounts.syncRateLimitedDescription', { seconds: err.retryAfterSeconds ?? 60 }),
          variant: 'destructive',
        });
      } else if (err.isServiceUnavailable) {
        toast({
          title: t('accounts.brokerUnavailable'),
          description: t('accounts.brokerUnavailableDescription'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('accounts.syncFailed'),
          description: err.message || t('accounts.syncFailedDescription'),
          variant: 'destructive',
        });
      }
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (connectionId: string) => brokerService.disconnectBroker(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-connections'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      invalidateDashboardData(queryClient);
      setViewAccountOpen(false);
      setConfirmDisconnectOpen(false);
      toast({ title: t('accounts.accountDisconnected'), description: t('accounts.accountDisconnectedDescription') });
    },
    onError: () => {
      setConfirmDisconnectOpen(false);
      toast({ title: t('accounts.disconnectFailed'), description: t('accounts.disconnectFailedDescription'), variant: 'destructive' });
    },
  });

  const editMutation = useMutation({
    mutationFn: (req: { connectionId: string; syncFrequency?: string; enabled?: boolean; displayName?: string; accountType?: string }) =>
      brokerService.updateSettings(req.connectionId, {
        syncFrequency: req.syncFrequency,
        enabled: req.enabled,
        displayName: req.displayName,
        accountType: req.accountType
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-connections'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setEditAccountOpen(false);
      setViewAccountOpen(false);
      toast({
        title: t('accounts.accountUpdated'),
        description: t('accounts.accountUpdatedDescription'),
      });
    },
    onError: (err: Error) => {
      toast({ title: t('accounts.updateFailed'), description: err.message || t('accounts.updateFailedDescription'), variant: 'destructive' });
    },
  });

  const createManualMutation = useMutation({
    mutationFn: () => brokerService.createManualAccount({
      displayName: manualName,
      accountType: manualAccountType,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-connections'] });
      setManualAccountOpen(false);
      setManualName('');
      setManualAccountType('REAL');
      toast({
        title: t('accounts.manualAccountCreated'),
        description: t('accounts.manualAccountCreatedDescription'),
      });
    },
    onError: (err: Error) => {
      toast({
        title: t('common.error'),
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  // --- Handlers ---
  const resetLinkForm = () => {
    setNewBrokerType('');
    setSelectedProtocol('');
    setNewDisplayName('');
    setNewAccountType('REAL');
    setCredentials({});
  };

  const handleLinkAccount = () => {
    if (!newBrokerType) {
      toast({ title: t('accounts.selectBroker'), description: t('accounts.selectBrokerDescription'), variant: 'destructive' });
      return;
    }

    if (credentialSchema?.fields) {
      const missingFields = credentialSchema.fields
        .filter(f => f.required && !credentials[f.name])
        .map(f => f.label);

      if (missingFields.length > 0) {
        toast({
          title: t('accounts.missingInformation'),
          description: t('accounts.missingInformationDescription', { fields: missingFields.join(', ') }),
          variant: 'destructive'
        });
        return;
      }
    }

    connectMutation.mutate({
      brokerCode: newBrokerType,
      protocol: effectiveProtocol,
      credentials: JSON.stringify(credentials),
      displayName: newDisplayName || undefined,
      accountType: newAccountType,
    });
  };

  const handleViewAccount = (accountId: string) => {
    setSelectedAccount(accountId);
    setViewAccountOpen(true);
  };

  const handleOpenEdit = () => {
    if (selectedAccountData) {
      setEditDisplayName(selectedAccountData.displayName || '');
      setEditSyncFrequency(selectedAccountData.syncFrequency || 'HOURLY');
      setEditEnabled(selectedAccountData.enabled);
      setEditAccountType(selectedAccountData.accountType || 'REAL');
      setEditAccountOpen(true);
    }
  };

  const handleSaveEdit = () => {
    if (selectedAccountData) {
      editMutation.mutate({
        connectionId: selectedAccountData.id,
        displayName: editDisplayName || undefined,
        syncFrequency: editSyncFrequency,
        enabled: editEnabled,
        accountType: editAccountType,
      });
    }
  };

  const handleSync = (accountId: string) => {
    const idempotencyKey = crypto.randomUUID();
    setSyncingIds(prev => new Set(prev).add(accountId));
    syncMutation.mutate({ connectionId: accountId, idempotencyKey });
  };

  const handleSyncAll = () => {
    const syncable = accounts.filter(a =>
      (a.status === 'CONNECTED' || a.status === 'ACTIVE' || a.status === 'PENDING') && a.enabled
    );
    if (syncable.length === 0) return;
    batchSyncIdsRef.current = new Set(syncable.map(a => a.id));
    const totalCount = syncable.length;
    let settled = 0;
    let successCount = 0;

    syncable.forEach(account => {
      const idempotencyKey = crypto.randomUUID();
      setSyncingIds(prev => new Set(prev).add(account.id));
      brokerService.syncConnection(account.id, idempotencyKey)
        .then(() => {
          successCount++;
          setSyncingIds(prev => { const n = new Set(prev); n.delete(account.id); return n; });
          batchSyncIdsRef.current.delete(account.id);
          queryClient.invalidateQueries({ queryKey: ['broker-connections'] });
          queryClient.invalidateQueries({ queryKey: ['trades'] });
          invalidateDashboardData(queryClient);
        })
        .catch(() => {
          setSyncingIds(prev => { const n = new Set(prev); n.delete(account.id); return n; });
          batchSyncIdsRef.current.delete(account.id);
        })
        .finally(() => {
          settled++;
          if (settled === totalCount) {
            const failedCount = totalCount - successCount;
            if (failedCount === 0) {
              toast({ title: t('accounts.syncAllComplete'), description: t('accounts.syncAllCompleteDescription', { count: totalCount }) });
            } else {
              toast({ title: t('accounts.syncAllPartial'), description: t('accounts.syncAllPartialDescription', { success: successCount, failed: failedCount }) });
            }
          }
        });
    });
  };

  const selectedAccountData = accounts.find(a => a.id === selectedAccount);

  // --- Render account card (redesigned) ---
  const renderAccountCard = (account: BrokerConnectionResponse) => {
    const isSyncing = syncingIds.has(account.id);
    const isManualProtocol = account.protocol === 'MANUAL';
    const statusConfig = getStatusConfigForAccount(account);
    const brokerColor = getBrokerColor(account.brokerCode || account.brokerType || '');
    const isConnected = account.status === 'CONNECTED' || account.status === 'ACTIVE';
    const isSyncable = isConnected || account.status === 'PENDING';
    const canSync = !isManualProtocol && account.enabled && isSyncable;

    return (
      <div
        key={account.id}
        className={cn(
          'group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-200',
          account.suspendedByPlan
            ? 'opacity-60 cursor-default'
            : 'hover:shadow-md hover:border-primary/30 cursor-pointer',
        )}
        onClick={() => { if (!account.suspendedByPlan) handleViewAccount(account.id); }}
        role="button"
        tabIndex={0}
        aria-label={`${getAccountTitle(account)} - ${account.suspendedByPlan ? t('accounts.suspended', 'Suspended') : getStatusLabel(account.status, t, account.enabled)}`}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !account.suspendedByPlan) { e.preventDefault(); handleViewAccount(account.id); } }}
      >
        {/* Suspended-by-plan overlay */}
        {account.suspendedByPlan && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2 text-center px-4">
              <Lock className="h-5 w-5 text-amber-400" />
              <p className="text-sm font-medium text-amber-400">{t('accounts.accountSuspended', 'Account suspended')}</p>
              <p className="text-xs text-muted-foreground">{t('accounts.upgradeToReactivate', 'Upgrade your plan to reactivate')}</p>
              <Link to="/pricing" onClick={(e) => e.stopPropagation()}>
                <button className="mt-1 inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                  {t('subscription.viewPlans', 'View plans')}
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Status accent line */}
        <div className={cn(
          'absolute top-0 left-0 right-0 h-0.5 rounded-t-xl transition-all',
          isConnected && account.enabled && 'bg-emerald-500',
          account.status === 'ERROR' && 'bg-destructive',
          account.status === 'PENDING' && 'bg-amber-500',
          !account.enabled && 'bg-amber-500/50',
          account.status === 'DISCONNECTED' && 'bg-muted-foreground/30',
        )} />

        <div className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-semibold text-sm',
                brokerColor,
              )}>
                {getBrokerInitials(account)}
              </div>
              <div className="min-w-0">
                <h3 className="font-medium truncate leading-tight">{getAccountTitle(account)}</h3>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{getBrokerLabel(account)}</p>
              </div>
            </div>

            {/* Context menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">{t('common.actions')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => handleViewAccount(account.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {t('common.view')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSelectedAccount(account.id); handleOpenEdit(); }}>
                  <Settings2 className="h-4 w-4 mr-2" />
                  {t('accounts.editSettings')}
                </DropdownMenuItem>
                {canSync && (
                  <DropdownMenuItem onClick={() => handleSync(account.id)} disabled={isSyncing}>
                    <RefreshCw className={cn('h-4 w-4 mr-2', isSyncing && 'animate-spin')} />
                    {t('accounts.syncNow')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => { setSelectedAccount(account.id); setConfirmDisconnectOpen(true); }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('accounts.disconnect')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Status + Type badges */}
          <div className="flex items-center gap-1.5 mt-3">
            <Badge variant={statusConfig.variant} className="gap-1 text-[11px] px-2 py-0.5">
              <span className={cn('h-1.5 w-1.5 rounded-full', statusConfig.dotClass)} />
              {getStatusLabel(account.status, t, account.enabled)}
            </Badge>
            <Badge
              variant="outline"
              className={cn('text-[11px] px-2 py-0.5',
                account.accountType === 'DEMO'
                  ? 'border-amber-500/30 text-amber-500'
                  : 'border-emerald-500/30 text-emerald-500',
              )}
            >
              {account.accountType === 'DEMO' ? t('accounts.demo') : t('accounts.real')}
            </Badge>
          </div>

          {/* Metadata row */}
          <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground pt-3 border-t">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1" aria-label={t('accounts.syncFrequency')}>
                    <RefreshCw className="h-3 w-3" />
                    {getSyncFrequencyLabel(account.syncFrequency)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t('accounts.syncFrequency')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1" aria-label={t('accounts.lastSynced')}>
                    <Clock className="h-3 w-3" />
                    {account.lastSyncTime
                      ? timeAgo(account.lastSyncTime, t)
                      : t('accounts.never')}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {t('accounts.lastSynced')}: {account.lastSyncTime ? new Date(account.lastSyncTime).toLocaleString() : t('accounts.never')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isSyncing && (
              <span className="flex items-center gap-1 text-primary">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t('accounts.syncing')}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- Empty state ---
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
        <Inbox className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-1">{t('accounts.noAccounts')}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {t('accounts.noAccountsDescription')}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setManualAccountOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          {t('accounts.createManualAccount')}
        </Button>
        <Button onClick={() => setLinkAccountOpen(true)}>
          <LinkIcon className="h-4 w-4 mr-2" />
          {t('accounts.linkAccount')}
        </Button>
      </div>
    </div>
  );

  return (
    <DashboardLayout pageTitle={t('pages.accounts')}>
      <PageTransition className="space-y-6">
        {/* Over-limit warning */}
        {isOverConnectionLimit && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-amber-300">
                {t('accounts.overLimitTitle', 'Too many broker connections for your plan')}
              </p>
              <p className="text-amber-400/70 text-xs mt-0.5">
                {t('accounts.overLimitDescription', 'Your {{plan}} plan allows {{max}} connection(s). Please disconnect {{excess}} account(s) or upgrade your plan.', {
                  plan: subscription?.plan ?? 'FREE',
                  max: connectionsMax,
                  excess: accounts.length - connectionsMax,
                })}
              </p>
            </div>
            <a href="/pricing" className="text-xs font-medium text-amber-400 hover:underline shrink-0">
              {t('subscription.upgrade', 'Upgrade')}
            </a>
          </div>
        )}

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('accounts.tradingAccounts')}</h1>
            <p className="text-sm text-muted-foreground">{t('accounts.tradingAccountsDescription')}</p>
          </div>
          <div className="flex items-center gap-2">
            {accounts.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleSyncAll} disabled={syncMutation.isPending}>
                <RefreshCw className={cn('h-4 w-4 mr-2', syncMutation.isPending && 'animate-spin')} />
                {t('accounts.syncAll')}
              </Button>
            )}
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* span wrapper lets the tooltip show even when the button is disabled */}
                    <span className="inline-flex">
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" disabled={isAtConnectionLimit}>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          {t('accounts.addAccount')}
                        </Button>
                      </DropdownMenuTrigger>
                    </span>
                  </TooltipTrigger>
                  {isAtConnectionLimit && (
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-xs">
                        {t('accounts.atLimitTooltip', {
                          plan: subscription?.plan ?? 'FREE',
                          max: connectionsMax,
                          defaultValue: 'Plan {{plan}} limit reached ({{max}} account(s)). Upgrade to add more.',
                        })}
                      </p>
                      <Link to="/pricing" className="mt-1 block text-xs font-medium text-primary hover:underline">
                        {t('subscription.upgrade', 'Upgrade')}
                      </Link>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLinkAccountOpen(true)}>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  {t('accounts.linkBrokerAccount')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setManualAccountOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  {t('accounts.createManualAccount')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {isLoading ? (
            <>
              <SummaryCardSkeleton />
              <SummaryCardSkeleton />
              <SummaryCardSkeleton />
              <SummaryCardSkeleton />
              <SummaryCardSkeleton />
            </>
          ) : (
            <>
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Wallet className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{t('accounts.totalAccounts')}</p>
                      <p className="text-xl font-bold tabular-nums">{accounts.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{t('accounts.activeAccounts')}</p>
                      <p className="text-xl font-bold tabular-nums">{activeCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                      <Activity className="h-4 w-4 text-violet-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{t('accounts.uniqueBrokersConnected')}</p>
                      <p className="text-xl font-bold tabular-nums">
                        {new Set(accounts.map(a => a.brokerCode || a.brokerType)).size}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={cn('shadow-sm', errorCount > 0 && 'border-destructive/30')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      errorCount > 0 ? 'bg-destructive/10' : 'bg-muted',
                    )}>
                      {errorCount > 0 ? (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      ) : (
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {errorCount > 0 ? t('accounts.errors') : t('accounts.allHealthy')}
                      </p>
                      <p className={cn('text-xl font-bold tabular-nums', errorCount > 0 && 'text-destructive')}>
                        {errorCount > 0 ? errorCount : <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plan-based broker-accounts usage card */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                      <Gauge className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">
                        {t('accounts.brokerAccountsLabel', 'Broker accounts')}
                      </p>
                      <UsageLimitIndicator
                        used={accounts.length}
                        max={connectionsMax}
                        showBar
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Error State - account list load failure */}
        {isError && (
          <PageError
            title={t('accounts.failedToLoadAccounts', 'Failed to load accounts')}
            message={(error as Error)?.message || 'Could not connect to the server. Check your connection and try again.'}
            onRetry={refetchAccounts}
          />
        )}

        {/* Inline mutation error */}
        {inlineError && !isError && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-destructive">{inlineError}</span>
            </div>
            <button
              type="button"
              onClick={() => setInlineError(null)}
              className="text-destructive/70 hover:text-destructive text-xs underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Accounts List */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('accounts.linkedAccounts')}</CardTitle>
            <CardDescription>{t('accounts.linkedAccountsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <AccountsListSkeleton count={3} />
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertTriangle className="h-10 w-10 text-destructive/50 mb-3" />
                <p className="font-medium text-sm text-destructive">Failed to load accounts. Check your connection.</p>
                <button
                  type="button"
                  onClick={() => refetchAccounts()}
                  className="mt-3 text-xs text-primary underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            ) : accounts.length === 0 ? (
              renderEmptyState()
            ) : (
              <div className="space-y-6">
                {/* Real Accounts Section */}
                {realAccounts.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('accounts.realAccounts')}</h4>
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 text-[10px] px-1.5 py-0">{realAccounts.length}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {realAccounts.map(renderAccountCard)}
                    </div>
                  </div>
                )}

                {/* Demo Accounts Section */}
                {demoAccounts.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('accounts.demoAccounts')}</h4>
                      <Badge variant="outline" className="border-amber-500/30 text-amber-500 text-[10px] px-1.5 py-0">{demoAccounts.length}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {demoAccounts.map(renderAccountCard)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </PageTransition>

      {/* Link Account Dialog */}
      <Dialog open={linkAccountOpen} onOpenChange={setLinkAccountOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{t('accounts.linkTradingAccount')}</DialogTitle>
            <DialogDescription>
              {t('accounts.linkTradingAccountDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Broker selector — visual cards when available, dropdown otherwise */}
            <div className="space-y-2">
              <Label>{t('accounts.selectBrokerLabel')}</Label>
              {brokersLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : availableBrokers && availableBrokers.length <= 12 ? (
                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {availableBrokers.map(broker => {
                    const isSelected = newBrokerType === broker.code;
                    const brokerColorCls = getBrokerColor(broker.code);
                    return (
                      <button
                        key={broker.code}
                        type="button"
                        onClick={() => {
                          setNewBrokerType(broker.code);
                          setSelectedProtocol('');
                          setCredentials({});
                        }}
                        className={cn(
                          'flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all text-sm',
                          isSelected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                            : 'border-border hover:border-primary/30 hover:bg-muted/50',
                        )}
                      >
                        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-semibold text-xs', brokerColorCls)}>
                          {broker.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-xs leading-snug break-words">{broker.displayName}</p>
                          {broker.propFirm && (
                            <span className="text-[10px] text-amber-500">Prop Firm</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Select value={newBrokerType} onValueChange={(value) => {
                  setNewBrokerType(value);
                  setSelectedProtocol('');
                  setCredentials({});
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('accounts.selectBrokerPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBrokers?.map(broker => (
                      <SelectItem key={broker.code} value={broker.code}>
                        {broker.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {newBrokerType && hasMultipleProtocols && (
              <div className="space-y-2">
                <Label htmlFor="protocol">{t('accounts.connectionProtocol')}</Label>
                <Select
                  value={selectedProtocol || selectedBroker?.defaultProtocol || ''}
                  onValueChange={(value) => {
                    setSelectedProtocol(value);
                    setCredentials({});
                  }}
                >
                  <SelectTrigger id="protocol">
                    <SelectValue placeholder={t('accounts.selectProtocolPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedProtocols.map(p => (
                      <SelectItem key={p.protocol} value={p.protocol}>
                        {p.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newBrokerType && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="account-type">{t('accounts.accountType')}</Label>
                    <Select value={newAccountType} onValueChange={setNewAccountType}>
                      <SelectTrigger id="account-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REAL">{t('accounts.realAccount')}</SelectItem>
                        <SelectItem value="DEMO">{t('accounts.demoAccount')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-name">
                      {t('accounts.displayName')}
                      <span className="text-muted-foreground text-xs ml-1">({t('settings.optional', 'optional')})</span>
                    </Label>
                    <Input
                      id="account-name"
                      placeholder={t('accounts.displayNamePlaceholder')}
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                    />
                  </div>
                </div>

                {schemaLoading && (
                  <div className="space-y-3">
                    <div className="h-10 rounded-lg bg-muted animate-pulse" />
                    <div className="h-10 rounded-lg bg-muted animate-pulse" />
                  </div>
                )}

                {!schemaLoading && credentialSchema && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {t('accounts.credentials')}
                      </p>
                      {credentialSchema.fields.map((field) => (
                        <div key={field.name} className="space-y-1.5">
                          <Label htmlFor={field.name}>
                            {field.label} {field.required && <span className="text-destructive">*</span>}
                          </Label>
                          <Input
                            id={field.name}
                            type={field.type === 'password' ? 'password' : 'text'}
                            placeholder={field.placeholder || ''}
                            value={credentials[field.name] || ''}
                            onChange={(e) => setCredentials(prev => ({ ...prev, [field.name]: e.target.value }))}
                          />
                          {field.helpText && (
                            <p className="text-[11px] text-muted-foreground">{field.helpText}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground">
                      <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <p>{t('settings.apiCredentialsSecurity', 'Credentials are encrypted with AES-256-GCM. We never store plaintext passwords.')}</p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setLinkAccountOpen(false); resetLinkForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleLinkAccount} disabled={connectMutation.isPending || !newBrokerType}>
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('accounts.linking')}
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  {t('accounts.linkAccount')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Account Sheet (slide-in panel) */}
      {selectedAccountData && (
        <AccountDetailSheet
          account={selectedAccountData}
          open={viewAccountOpen}
          onOpenChange={setViewAccountOpen}
          onSync={() => handleSync(selectedAccountData.id)}
          onEdit={handleOpenEdit}
          onDisconnect={() => setConfirmDisconnectOpen(true)}
          isSyncing={syncingIds.has(selectedAccountData.id)}
          isDisconnecting={disconnectMutation.isPending}
          getSyncFrequencyLabel={getSyncFrequencyLabel}
        />
      )}

      {/* Disconnect Confirmation */}
      <AlertDialog open={confirmDisconnectOpen} onOpenChange={setConfirmDisconnectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('accounts.confirmDisconnect')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('accounts.confirmDisconnectDescription', {
                account: selectedAccountData ? getAccountTitle(selectedAccountData) : '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (selectedAccountData) {
                  disconnectMutation.mutate(selectedAccountData.id);
                }
              }}
            >
              {disconnectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('accounts.disconnect')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Account Dialog */}
      {selectedAccountData && (
        <Dialog open={editAccountOpen} onOpenChange={setEditAccountOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('accounts.editAccountSettings')}</DialogTitle>
              <DialogDescription>
                {t('accounts.editAccountSettingsDescription', { broker: getBrokerLabel(selectedAccountData) })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              {/* General settings group */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t('accounts.generalSettings')}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="edit-account-name">{t('accounts.displayName')}</Label>
                  <Input
                    id="edit-account-name"
                    placeholder={t('accounts.displayNamePlaceholder')}
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-account-type">{t('accounts.accountType')}</Label>
                  <Select value={editAccountType} onValueChange={setEditAccountType}>
                    <SelectTrigger id="edit-account-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REAL">{t('accounts.realAccount')}</SelectItem>
                      <SelectItem value="DEMO">{t('accounts.demoAccount')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Sync settings group */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t('accounts.syncSettings')}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="edit-sync-frequency">{t('accounts.syncFrequency')}</Label>
                  <Select value={editSyncFrequency} onValueChange={setEditSyncFrequency}>
                    <SelectTrigger id="edit-sync-frequency">
                      <SelectValue placeholder={t('accounts.selectSyncFrequency')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(allowedFrequencies ?? [editSyncFrequency].filter(Boolean)).map((freq) => (
                        <SelectItem key={freq} value={freq}>
                          {getSyncFrequencyLabel(freq)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Connection toggle — visually distinct */}
                <div className={cn(
                  'flex items-center justify-between rounded-lg border p-3',
                  !editEnabled && 'border-amber-500/30 bg-amber-500/5',
                )}>
                  <div className="flex flex-col space-y-0.5">
                    <Label htmlFor="edit-enabled" className="text-sm font-medium">
                      {t('accounts.connectionEnabled')}
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      {t('accounts.connectionEnabledDescription')}
                    </p>
                  </div>
                  <Switch
                    id="edit-enabled"
                    checked={editEnabled}
                    onCheckedChange={setEditEnabled}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditAccountOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSaveEdit} disabled={editMutation.isPending}>
                {editMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('accounts.saving')}
                  </>
                ) : t('common.saveChanges')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Manual Account Dialog */}
      <Dialog open={manualAccountOpen} onOpenChange={setManualAccountOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('accounts.createManualAccount')}</DialogTitle>
            <DialogDescription>{t('accounts.createManualAccountDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="manual-name">{t('accounts.manualAccountName')}</Label>
              <Input
                id="manual-name"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder={t('accounts.manualAccountNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('accounts.accountType')}</Label>
              <Select value={manualAccountType} onValueChange={setManualAccountType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="REAL">{t('accounts.real')}</SelectItem>
                  <SelectItem value="DEMO">{t('accounts.demo')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualAccountOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => createManualMutation.mutate()}
              disabled={!manualName.trim() || createManualMutation.isPending}
            >
              {createManualMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Accounts;
