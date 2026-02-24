
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, CreditCard, RefreshCw, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { brokerService, type ConnectBrokerRequest } from '@/services/broker.service';
import { AccountsListSkeleton, SummaryCardSkeleton } from '@/components/skeletons';

// --- Fallback mock data (used when API is unavailable) ---
const fallbackAccounts = [
  {
    id: '1',
    brokerType: 'INTERACTIVE_BROKERS',
    displayName: 'Trading Account (Main)',
    status: 'ACTIVE',
    syncFrequency: 'DAILY',
    enabled: true,
    lastSyncTime: '2023-06-15T10:30:00Z',
    createdAt: '2023-01-05T00:00:00Z',
    updatedAt: '2023-06-15T10:30:00Z',
  },
  {
    id: '2',
    brokerType: 'MT5',
    displayName: 'Forex Trading',
    status: 'ACTIVE',
    syncFrequency: 'HOURLY',
    enabled: true,
    lastSyncTime: '2023-06-15T09:00:00Z',
    createdAt: '2023-02-10T00:00:00Z',
    updatedAt: '2023-06-15T09:00:00Z',
  },
];

// --- Helper ---
const formatBrokerName = (brokerType: string): string => {
  const map: Record<string, string> = {
    INTERACTIVE_BROKERS: 'Interactive Brokers',
    MT5: 'MetaTrader 5',
    OANDA: 'Oanda',
    ALPACA: 'Alpaca',
  };
  return map[brokerType] || brokerType;
};

const getStatusVariant = (status: string | undefined): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'CONNECTED': return 'default';
    case 'PENDING': return 'outline';
    case 'DISCONNECTED': return 'secondary';
    case 'ERROR': return 'destructive';
    default: return 'secondary';
  }
};

const Accounts = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [linkAccountOpen, setLinkAccountOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [viewAccountOpen, setViewAccountOpen] = useState(false);
  const [editAccountOpen, setEditAccountOpen] = useState(false);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // --- Form state for linking ---
  const [newBrokerType, setNewBrokerType] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  // --- Form state for editing ---
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editSyncFrequency, setEditSyncFrequency] = useState('');
  const [editEnabled, setEditEnabled] = useState(true);

  // --- Queries ---
  const {
    data: accounts = fallbackAccounts,
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

  const { data: credentialSchema, isLoading: schemaLoading } = useQuery({
    queryKey: ['credential-schema', newBrokerType],
    queryFn: () => brokerService.getCredentialSchema(newBrokerType),
    enabled: !!newBrokerType,
    retry: 1,
  });

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
      // Auto-trigger sync
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
      queryClient.invalidateQueries({ queryKey: ['broker-connections'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast({
        title: t('accounts.syncComplete'),
        description: t('accounts.syncCompleteDescription', { count: _data.tradesImported ?? 0 }),
      });
    },
    onError: (err: Error & { isRateLimited?: boolean; isServiceUnavailable?: boolean; retryAfterSeconds?: number }, variables) => {
      setSyncingIds(prev => { const n = new Set(prev); n.delete(variables.connectionId); return n; });
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
      setViewAccountOpen(false);
      toast({ title: t('accounts.accountDisconnected'), description: t('accounts.accountDisconnectedDescription') });
    },
    onError: () => {
      toast({ title: t('accounts.disconnectFailed'), description: t('accounts.disconnectFailedDescription'), variant: 'destructive' });
    },
  });

  const editMutation = useMutation({
    mutationFn: (req: { connectionId: string; syncFrequency?: string; enabled?: boolean; displayName?: string }) =>
      brokerService.updateSettings(req.connectionId, {
        syncFrequency: req.syncFrequency,
        enabled: req.enabled,
        displayName: req.displayName
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-connections'] });
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

  // --- Handlers ---
  const resetLinkForm = () => {
    setNewBrokerType('');
    setNewDisplayName('');
    setCredentials({});
  };

  const handleLinkAccount = () => {
    if (!newBrokerType) {
      toast({ title: t('accounts.selectBroker'), description: t('accounts.selectBrokerDescription'), variant: 'destructive' });
      return;
    }

    // Check required fields
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
      protocol: credentialSchema?.protocol,
      credentials: JSON.stringify(credentials),
      displayName: newDisplayName || undefined,
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
      });
    }
  };

  const handleSync = (accountId: string) => {
    const idempotencyKey = crypto.randomUUID();
    setSyncingIds(prev => new Set(prev).add(accountId));
    syncMutation.mutate({ connectionId: accountId, idempotencyKey });
  };

  const handleSyncAll = () => {
    accounts.forEach(account => {
      if ((account.status === 'CONNECTED' || account.status === 'PENDING') && account.enabled) {
        handleSync(account.id);
      }
    });
  };

  const selectedAccountData = accounts.find(a => a.id === selectedAccount);
  const activeCount = accounts.filter(a => a.status === 'CONNECTED' || a.status === 'PENDING').length;

  return (
    <DashboardLayout pageTitle={t('pages.accounts')}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('accounts.tradingAccounts')}</h1>
            <p className="text-muted-foreground">{t('accounts.tradingAccountsDescription')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSyncAll} disabled={syncMutation.isPending}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {t('accounts.syncAll')}
            </Button>
            <Button onClick={() => setLinkAccountOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t('accounts.linkAccount')}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              <SummaryCardSkeleton />
              <SummaryCardSkeleton />
              <SummaryCardSkeleton />
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('accounts.connectedAccounts')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{accounts.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>{t('accounts.activeCount', { count: activeCount })}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('accounts.brokerTypes')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(accounts.map(a => a.brokerType)).size}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>{t('accounts.uniqueBrokersConnected')}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('accounts.lastSync')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {accounts.some(a => a.lastSyncTime)
                      ? new Date(
                          Math.max(...accounts.filter(a => a.lastSyncTime).map(a => new Date(a.lastSyncTime!).getTime()))
                        ).toLocaleTimeString()
                      : t('accounts.never')}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('accounts.mostRecentSync')}
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
                <AlertTriangle className="h-5 w-5" />
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
            ) : (
              <>
                {accounts.map((account) => {
                  const isSyncing = syncingIds.has(account.id);
                  return (
                    <div
                      key={account.id}
                      className="mb-4 last:mb-0 border rounded-lg overflow-hidden"
                    >
                      <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between border-b">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-primary" />
                            <h3 className="font-medium">{account.displayName || formatBrokerName(account.brokerType)}</h3>
                            <Badge variant={getStatusVariant(account.status)}>
                              {account.status?.toLowerCase() || t('accounts.unknown')}
                            </Badge>
                            {!account.enabled && (
                              <Badge variant="secondary">{t('accounts.disabled')}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{formatBrokerName(account.brokerType)}</p>
                        </div>
                        <div className="mt-2 md:mt-0 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSync(account.id)}
                            disabled={isSyncing || !account.enabled || (account.status !== 'CONNECTED' && account.status !== 'PENDING')}
                          >
                            {isSyncing ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            {isSyncing ? t('accounts.syncing') : t('accounts.sync')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewAccount(account.id)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {t('common.view')}
                          </Button>
                        </div>
                      </div>
                      <div className="bg-muted/40 p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">{t('accounts.syncFrequency')}</div>
                            <div className="font-medium">{account.syncFrequency}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">{t('accounts.lastSynced')}</div>
                            <div className="font-medium">
                              {account.lastSyncTime
                                ? new Date(account.lastSyncTime).toLocaleString()
                                : t('accounts.never')}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">{t('accounts.connectedSince')}</div>
                            <div className="font-medium">
                              {new Date(account.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">{t('common.status')}</div>
                            <div className="font-medium capitalize">{account.status?.toLowerCase() || t('accounts.unknown')}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setLinkAccountOpen(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              {t('accounts.connectNewAccount')}
            </Button>
          </CardContent>
        </Card>
      </div>

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
              <Select value={newBrokerType} onValueChange={setNewBrokerType}>
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

      {/* View Account Dialog */}
      {selectedAccountData && (
        <Dialog open={viewAccountOpen} onOpenChange={setViewAccountOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{t('accounts.accountDetails')}</DialogTitle>
              <DialogDescription>
                {t('accounts.accountDetailsDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="p-4 border rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h3 className="font-medium text-lg">
                    {selectedAccountData.displayName || formatBrokerName(selectedAccountData.brokerType)}
                  </h3>
                  <Badge variant={getStatusVariant(selectedAccountData.status)}>
                    {selectedAccountData.status?.toLowerCase() || t('accounts.unknown')}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {t('accounts.broker')}: {formatBrokerName(selectedAccountData.brokerType)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-md">
                  <div className="text-sm text-muted-foreground">{t('accounts.syncFrequency')}</div>
                  <div className="text-xl font-bold">{selectedAccountData.syncFrequency}</div>
                </div>

                <div className="p-4 border rounded-md">
                  <div className="text-sm text-muted-foreground">{t('accounts.lastSynced')}</div>
                  <div className="text-xl font-bold">
                    {selectedAccountData.lastSyncTime
                      ? new Date(selectedAccountData.lastSyncTime).toLocaleString()
                      : t('accounts.never')}
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-md">
                <h4 className="font-medium mb-2">{t('accounts.accountActions')}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(selectedAccountData.id)}
                    disabled={syncingIds.has(selectedAccountData.id)}
                  >
                    {syncingIds.has(selectedAccountData.id) ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {t('accounts.syncNow')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenEdit}
                  >
                    {t('accounts.editSettings')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => disconnectMutation.mutate(selectedAccountData.id)}
                    disabled={disconnectMutation.isPending}
                  >
                    {disconnectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {t('accounts.disconnect')}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewAccountOpen(false)}>
                {t('accounts.close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Account Dialog */}
      {selectedAccountData && (
        <Dialog open={editAccountOpen} onOpenChange={setEditAccountOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('accounts.editAccountSettings')}</DialogTitle>
              <DialogDescription>
                {t('accounts.editAccountSettingsDescription', { broker: formatBrokerName(selectedAccountData.brokerType) })}
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
                <Label htmlFor="edit-sync-frequency">{t('accounts.syncFrequency')}</Label>
                <Select value={editSyncFrequency} onValueChange={setEditSyncFrequency}>
                  <SelectTrigger id="edit-sync-frequency">
                    <SelectValue placeholder={t('accounts.selectSyncFrequency')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOURLY">{t('accounts.hourly')}</SelectItem>
                    <SelectItem value="DAILY">{t('accounts.daily')}</SelectItem>
                    <SelectItem value="WEEKLY">{t('accounts.weekly')}</SelectItem>
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
    </DashboardLayout>
  );
};

export default Accounts;
