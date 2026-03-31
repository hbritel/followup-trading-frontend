
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { brokerService, type ConnectBrokerRequest, type BrokerConnectionResponse } from '@/services/broker.service';
import { invalidateDashboardData } from '@/lib/invalidate-dashboard';
import { AccountsListSkeleton, SummaryCardSkeleton } from '@/components/skeletons';

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
    return { variant: 'outline' as const, dotClass: 'bg-amber-500' };
  }
  return getStatusConfig(account.status);
};

const getStatusConfig = (status: string | undefined) => {
  switch (status) {
    case 'CONNECTED':
    case 'ACTIVE':
      return { variant: 'default' as const, dotClass: 'bg-emerald-500' };
    case 'PENDING':
      return { variant: 'outline' as const, dotClass: 'bg-amber-500' };
    case 'DISCONNECTED':
      return { variant: 'secondary' as const, dotClass: 'bg-muted-foreground' };
    case 'ERROR':
      return { variant: 'destructive' as const, dotClass: 'bg-destructive' };
    default:
      return { variant: 'secondary' as const, dotClass: 'bg-muted-foreground' };
  }
};

// ---------------------------------------------------------------------------
// Account Detail Sheet — replaces the old Dialog for a richer detail view
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate">{getAccountTitle(account)}</SheetTitle>
              <SheetDescription className="truncate">{getBrokerLabel(account)}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Status + Type badges */}
        <div className="flex items-center gap-2 pb-4">
          <Badge variant={statusConfig.variant} className="gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotClass}`} />
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
        </div>

        <Separator />

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3" />
              {t('accounts.syncFrequency')}
            </div>
            <p className="text-sm font-medium">{getSyncFrequencyLabel(account.syncFrequency)}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {t('accounts.lastSynced')}
            </div>
            <p className="text-sm font-medium">
              {account.lastSyncTime
                ? new Date(account.lastSyncTime).toLocaleString()
                : t('accounts.never')}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              {t('accounts.connectedSince')}
            </div>
            <p className="text-sm font-medium">
              {new Date(account.createdAt).toLocaleDateString()}
            </p>
          </div>

          {account.accountIdentifier && account.accountIdentifier !== 'default' && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Plug className="h-3 w-3" />
                {t('accounts.accountId')}
              </div>
              <p className="text-sm font-medium font-mono">{account.accountIdentifier}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('accounts.accountActions')}
          </p>

          {!isManual && (
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={onSync}
              disabled={isSyncing || !account.enabled || (account.status !== 'CONNECTED' && account.status !== 'ACTIVE' && account.status !== 'PENDING')}
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
            className="w-full justify-start gap-2"
            onClick={onEdit}
          >
            <Settings2 className="h-4 w-4" />
            {t('accounts.editSettings')}
          </Button>

          <Separator />

          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDisconnect}
            disabled={isDisconnecting}
          >
            {isDisconnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {t('accounts.disconnect')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const Accounts = () => {
  const { t } = useTranslation();

  const getSyncFrequencyLabel = (freq: string) => {
    const key = {
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

  // --- Queries ---
  const {
    data: accounts = [],
    isLoading,
    isError,
    error,
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
  const supportedProtocols = selectedBroker?.supportedProtocols ?? [];
  const hasMultipleProtocols = supportedProtocols.length > 1;
  const effectiveProtocol = selectedProtocol || selectedBroker?.defaultProtocol;

  const { data: credentialSchema, isLoading: schemaLoading } = useQuery({
    queryKey: ['credential-schema', newBrokerType, effectiveProtocol],
    queryFn: () => brokerService.getCredentialSchema(newBrokerType, effectiveProtocol),
    enabled: !!newBrokerType && !!effectiveProtocol,
    retry: 1,
  });

  const realAccounts = accounts.filter(a => a.accountType !== 'DEMO');
  const demoAccounts = accounts.filter(a => a.accountType === 'DEMO');

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
      if (data && data.id) {
        setSyncingIds(prev => new Set(prev).add(data.id));
        syncMutation.mutate({ connectionId: data.id, idempotencyKey: crypto.randomUUID() });
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
      // Suppress individual error toasts during batch sync
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
    // Register all IDs as batch so individual toasts are suppressed
    batchSyncIdsRef.current = new Set(syncable.map(a => a.id));
    const totalCount = syncable.length;
    let settled = 0;
    let successCount = 0;

    syncable.forEach(account => {
      const idempotencyKey = crypto.randomUUID();
      setSyncingIds(prev => new Set(prev).add(account.id));
      brokerService.syncConnection(account.id, idempotencyKey)
        .then((data) => {
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

    return (
      <div
        key={account.id}
        className="group relative rounded-lg border bg-card transition-colors hover:border-primary/20"
      >
        <div className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium truncate leading-tight">{getAccountTitle(account)}</h3>
                <p className="text-sm text-muted-foreground truncate">{getBrokerLabel(account)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant={statusConfig.variant} className="gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotClass}`} />
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
            </div>
          </div>

          {/* Metadata row */}
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              {getSyncFrequencyLabel(account.syncFrequency)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {account.lastSyncTime
                ? new Date(account.lastSyncTime).toLocaleString()
                : t('accounts.never')}
            </span>
          </div>

          {/* Action row */}
          <div className="mt-3 flex items-center gap-2 pt-3 border-t">
            {!isManualProtocol && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => handleSync(account.id)}
                disabled={isSyncing || !account.enabled || (account.status !== 'CONNECTED' && account.status !== 'ACTIVE' && account.status !== 'PENDING')}
              >
                {isSyncing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                {isSyncing ? t('accounts.syncing') : t('accounts.sync')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => handleViewAccount(account.id)}
            >
              <Eye className="h-3.5 w-3.5" />
              {t('common.view')}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // --- Empty state ---
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
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
          <PlusCircle className="h-4 w-4 mr-2" />
          {t('accounts.linkAccount')}
        </Button>
      </div>
    </div>
  );

  return (
    <DashboardLayout pageTitle={t('pages.accounts')}>
      <PageTransition className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('accounts.tradingAccounts')}</h1>
            <p className="text-muted-foreground">{t('accounts.tradingAccountsDescription')}</p>
          </div>
          <div className="flex gap-2">
            {accounts.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleSyncAll} disabled={syncMutation.isPending}>
                <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                {t('accounts.syncAll')}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setManualAccountOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t('accounts.createManualAccount')}
            </Button>
            <Button size="sm" onClick={() => setLinkAccountOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t('accounts.linkAccount')}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isLoading ? (
            <>
              <SummaryCardSkeleton />
              <SummaryCardSkeleton />
              <SummaryCardSkeleton />
            </>
          ) : (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold tabular-nums">{accounts.length}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('accounts.realCount', { count: realAccounts.length })} / {t('accounts.demoCount', { count: demoAccounts.length })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                      <Activity className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold tabular-nums">
                        {new Set(accounts.map(a => a.brokerCode || a.brokerType)).size}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('accounts.uniqueBrokersConnected')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                      <Clock className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold tabular-nums">
                        {accounts.some(a => a.lastSyncTime)
                          ? new Date(
                              Math.max(...accounts.filter(a => a.lastSyncTime).map(a => new Date(a.lastSyncTime!).getTime()))
                            ).toLocaleTimeString()
                          : t('accounts.never')}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('accounts.mostRecentSync')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Error State */}
        {isError && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>{t('accounts.failedToLoadAccounts', { error: (error as Error)?.message || t('accounts.unknownError') })}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accounts List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{t('accounts.linkedAccounts')}</CardTitle>
            <CardDescription>{t('accounts.linkedAccountsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <AccountsListSkeleton count={3} />
            ) : accounts.length === 0 ? (
              renderEmptyState()
            ) : (
              <div className="space-y-6">
                {/* Real Accounts Section */}
                {realAccounts.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('accounts.realAccounts')}</h4>
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-500">{realAccounts.length}</Badge>
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
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('accounts.demoAccounts')}</h4>
                      <Badge variant="outline" className="border-amber-500/30 text-amber-500">{demoAccounts.length}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {demoAccounts.map(renderAccountCard)}
                    </div>
                  </div>
                )}

                {/* Add account CTA */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLinkAccountOpen(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  {t('accounts.connectNewAccount')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </PageTransition>

      {/* Link Account Dialog */}
      <Dialog open={linkAccountOpen} onOpenChange={setLinkAccountOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('accounts.linkTradingAccount')}</DialogTitle>
            <DialogDescription>
              {t('accounts.linkTradingAccountDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="broker">{t('accounts.selectBrokerLabel')}</Label>
              <Select value={newBrokerType} onValueChange={(value) => {
                setNewBrokerType(value);
                setSelectedProtocol('');
                setCredentials({});
              }}>
                <SelectTrigger id="broker">
                  <SelectValue placeholder={t('accounts.selectBrokerPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {brokersLoading ? (
                    <SelectItem value="loading" disabled>{t('accounts.loadingBrokers')}</SelectItem>
                  ) : (
                    availableBrokers?.map(broker => (
                      <SelectItem key={broker.code} value={broker.code}>
                        {broker.displayName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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
              <Label htmlFor="account-name">{t('accounts.displayName')}</Label>
              <Input
                id="account-name"
                placeholder={t('accounts.displayNamePlaceholder')}
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
              />
            </div>

            {newBrokerType && schemaLoading && (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {newBrokerType && !schemaLoading && credentialSchema && (
              credentialSchema.fields.map((field) => (
                <div key={field.name} className="space-y-2">
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
                    <p className="text-xs text-muted-foreground">{field.helpText}</p>
                  )}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setLinkAccountOpen(false); resetLinkForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleLinkAccount} disabled={connectMutation.isPending}>
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('accounts.linking')}
                </>
              ) : t('accounts.linkAccount')}
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
            <div className="grid gap-4 py-4">
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
              <div className="space-y-2">
                <Label htmlFor="edit-sync-frequency">{t('accounts.syncFrequency')}</Label>
                <Select value={editSyncFrequency} onValueChange={setEditSyncFrequency}>
                  <SelectTrigger id="edit-sync-frequency">
                    <SelectValue placeholder={t('accounts.selectSyncFrequency')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EVERY_5_MINUTES">{t('accounts.every5Minutes')}</SelectItem>
                    <SelectItem value="EVERY_15_MINUTES">{t('accounts.every15Minutes')}</SelectItem>
                    <SelectItem value="EVERY_30_MINUTES">{t('accounts.every30Minutes')}</SelectItem>
                    <SelectItem value="HOURLY">{t('accounts.hourly')}</SelectItem>
                    <SelectItem value="DAILY">{t('accounts.daily')}</SelectItem>
                    <SelectItem value="WEEKLY">{t('accounts.weekly')}</SelectItem>
                    <SelectItem value="MONTHLY">{t('accounts.monthly')}</SelectItem>
                    <SelectItem value="MANUAL">{t('accounts.manual')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between space-y-2 pt-2">
                <div className="flex flex-col space-y-0.5">
                  <Label htmlFor="edit-enabled">{t('accounts.connectionEnabled')}</Label>
                  <p className="text-[0.8rem] text-muted-foreground">
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
