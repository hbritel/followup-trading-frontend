
import { useState } from 'react';
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
import { PlusCircle, ArrowUpRight, ArrowDownRight, CreditCard, RefreshCw, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { brokerService, type BrokerConnectionResponse, type ConnectBrokerRequest } from '@/services/broker.service';

// --- Fallback mock data (used when API is unavailable) ---
const fallbackAccounts = [
  {
    id: '1',
    brokerType: 'INTERACTIVE_BROKERS',
    displayName: 'Trading Account (Main)',
    connectionStatus: 'ACTIVE',
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
    connectionStatus: 'ACTIVE',
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

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'ACTIVE': return 'default';
    case 'DISCONNECTED': return 'destructive';
    case 'ERROR': return 'destructive';
    default: return 'secondary';
  }
};

const Accounts = () => {
  const queryClient = useQueryClient();
  const [linkAccountOpen, setLinkAccountOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [viewAccountOpen, setViewAccountOpen] = useState(false);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // --- Form state for linking ---
  const [newBrokerType, setNewBrokerType] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiSecret, setNewApiSecret] = useState('');

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

  // --- Mutations ---
  const connectMutation = useMutation({
    mutationFn: (req: ConnectBrokerRequest) => brokerService.connectBroker(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-connections'] });
      setLinkAccountOpen(false);
      resetLinkForm();
      toast({
        title: 'Account linked',
        description: 'Your trading account has been successfully linked.',
      });
    },
    onError: (err: Error & { isRateLimited?: boolean; isServiceUnavailable?: boolean }) => {
      if (err.isRateLimited) {
        toast({ title: 'Too many requests', description: err.message, variant: 'destructive' });
      } else if (err.isServiceUnavailable) {
        toast({ title: 'Service unavailable', description: err.message, variant: 'destructive' });
      } else {
        toast({ title: 'Connection failed', description: 'Failed to link your account. Please check credentials.', variant: 'destructive' });
      }
    },
  });

  const syncMutation = useMutation({
    mutationFn: ({ connectionId, idempotencyKey }: { connectionId: string; idempotencyKey: string }) =>
      brokerService.syncConnection(connectionId, idempotencyKey),
    onSuccess: (_data, variables) => {
      setSyncingIds(prev => { const n = new Set(prev); n.delete(variables.connectionId); return n; });
      queryClient.invalidateQueries({ queryKey: ['broker-connections'] });
      toast({
        title: 'Sync complete',
        description: `Account synced successfully. ${_data.tradesImported ?? 0} trades imported.`,
      });
    },
    onError: (err: Error & { isRateLimited?: boolean; isServiceUnavailable?: boolean; retryAfterSeconds?: number }, variables) => {
      setSyncingIds(prev => { const n = new Set(prev); n.delete(variables.connectionId); return n; });
      if (err.isRateLimited) {
        toast({
          title: 'Sync rate limited',
          description: `You are syncing too frequently. Please try again in ${err.retryAfterSeconds ?? 60} seconds.`,
          variant: 'destructive',
        });
      } else if (err.isServiceUnavailable) {
        toast({
          title: 'Broker unavailable',
          description: 'The broker service is temporarily unavailable. Please try again later.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Sync failed',
          description: err.message || 'An error occurred during sync.',
          variant: 'destructive',
        });
      }
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (connectionId: string) => brokerService.disconnectBroker(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-connections'] });
      setViewAccountOpen(false);
      toast({ title: 'Account disconnected', description: 'The broker connection has been removed.' });
    },
    onError: () => {
      toast({ title: 'Disconnect failed', description: 'Failed to disconnect the account.', variant: 'destructive' });
    },
  });

  // --- Handlers ---
  const resetLinkForm = () => {
    setNewBrokerType('');
    setNewDisplayName('');
    setNewApiKey('');
    setNewApiSecret('');
  };

  const handleLinkAccount = () => {
    if (!newBrokerType) {
      toast({ title: 'Select a broker', description: 'Please select a broker type.', variant: 'destructive' });
      return;
    }
    const credentials = JSON.stringify({ apiKey: newApiKey, apiSecret: newApiSecret });
    connectMutation.mutate({
      brokerType: newBrokerType,
      credentials,
      displayName: newDisplayName || undefined,
    });
  };

  const handleViewAccount = (accountId: string) => {
    setSelectedAccount(accountId);
    setViewAccountOpen(true);
  };

  const handleSync = (accountId: string) => {
    const idempotencyKey = crypto.randomUUID();
    setSyncingIds(prev => new Set(prev).add(accountId));
    syncMutation.mutate({ connectionId: accountId, idempotencyKey });
  };

  const handleSyncAll = () => {
    accounts.forEach(account => {
      if (account.connectionStatus === 'ACTIVE' && account.enabled) {
        handleSync(account.id);
      }
    });
  };

  const selectedAccountData = accounts.find(a => a.id === selectedAccount);
  const activeCount = accounts.filter(a => a.connectionStatus === 'ACTIVE').length;

  return (
    <DashboardLayout pageTitle="Accounts">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Trading Accounts</h1>
            <p className="text-muted-foreground">Manage your connected trading accounts</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSyncAll} disabled={syncMutation.isPending}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              Sync All
            </Button>
            <Button onClick={() => setLinkAccountOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Link Account
            </Button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Connected Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accounts.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                <span>{activeCount} active</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Broker Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(accounts.map(a => a.brokerType)).size}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                <span>Unique brokers connected</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Last Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {accounts.some(a => a.lastSyncTime) 
                  ? new Date(
                      Math.max(...accounts.filter(a => a.lastSyncTime).map(a => new Date(a.lastSyncTime!).getTime()))
                    ).toLocaleTimeString()
                  : 'Never'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Most recent sync across accounts
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {isError && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span>Failed to load accounts: {(error as Error)?.message || 'Unknown error'}. Showing cached data.</span>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Accounts List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Linked Accounts</CardTitle>
            <CardDescription>Manage your connected trading and investment accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
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
                            <Badge variant={getStatusVariant(account.connectionStatus)}>
                              {account.connectionStatus.toLowerCase()}
                            </Badge>
                            {!account.enabled && (
                              <Badge variant="secondary">disabled</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{formatBrokerName(account.brokerType)}</p>
                        </div>
                        <div className="mt-2 md:mt-0 flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSync(account.id)}
                            disabled={isSyncing || !account.enabled || account.connectionStatus !== 'ACTIVE'}
                          >
                            {isSyncing ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            {isSyncing ? 'Syncing...' : 'Sync'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewAccount(account.id)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                      <div className="bg-muted/40 p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Sync Frequency</div>
                            <div className="font-medium">{account.syncFrequency}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Last Synced</div>
                            <div className="font-medium">
                              {account.lastSyncTime 
                                ? new Date(account.lastSyncTime).toLocaleString() 
                                : 'Never'}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Connected Since</div>
                            <div className="font-medium">
                              {new Date(account.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Status</div>
                            <div className="font-medium capitalize">{account.connectionStatus.toLowerCase()}</div>
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
              Connect New Account
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Link Account Dialog */}
      <Dialog open={linkAccountOpen} onOpenChange={setLinkAccountOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Link Trading Account</DialogTitle>
            <DialogDescription>
              Connect a new trading or investment account to your dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="broker">Select Broker</Label>
              <Select value={newBrokerType} onValueChange={setNewBrokerType}>
                <SelectTrigger id="broker">
                  <SelectValue placeholder="Select broker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERACTIVE_BROKERS">Interactive Brokers</SelectItem>
                  <SelectItem value="MT5">MetaTrader 5</SelectItem>
                  <SelectItem value="OANDA">Oanda</SelectItem>
                  <SelectItem value="ALPACA">Alpaca</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="account-name">Display Name</Label>
              <Input
                id="account-name"
                placeholder="e.g., Main Trading Account"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                placeholder="Your broker API key"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="api-secret">API Secret</Label>
              <Input
                id="api-secret"
                type="password"
                placeholder="Your broker API secret"
                value={newApiSecret}
                onChange={(e) => setNewApiSecret(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setLinkAccountOpen(false); resetLinkForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleLinkAccount} disabled={connectMutation.isPending}>
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Linking...
                </>
              ) : 'Link Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Account Dialog */}
      {selectedAccountData && (
        <Dialog open={viewAccountOpen} onOpenChange={setViewAccountOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Account Details</DialogTitle>
              <DialogDescription>
                Detailed information about your trading account.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="p-4 border rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h3 className="font-medium text-lg">
                    {selectedAccountData.displayName || formatBrokerName(selectedAccountData.brokerType)}
                  </h3>
                  <Badge variant={getStatusVariant(selectedAccountData.connectionStatus)}>
                    {selectedAccountData.connectionStatus.toLowerCase()}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Broker: {formatBrokerName(selectedAccountData.brokerType)}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-md">
                  <div className="text-sm text-muted-foreground">Sync Frequency</div>
                  <div className="text-xl font-bold">{selectedAccountData.syncFrequency}</div>
                </div>
                
                <div className="p-4 border rounded-md">
                  <div className="text-sm text-muted-foreground">Last Synced</div>
                  <div className="text-xl font-bold">
                    {selectedAccountData.lastSyncTime 
                      ? new Date(selectedAccountData.lastSyncTime).toLocaleString()
                      : 'Never'}
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-md">
                <h4 className="font-medium mb-2">Account Actions</h4>
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
                    Sync Now
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
                    Disconnect
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewAccountOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
};

export default Accounts;
