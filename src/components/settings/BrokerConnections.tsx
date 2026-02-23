import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCcw,
  Link as LinkIcon,
  ShieldAlert,
  Loader2,
  Wifi,
  WifiOff,
  Unplug,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  useBrokers,
  useBrokerConnections,
  useCredentialSchema,
  useConnectBroker,
  useDisconnectBroker,
  useSyncConnection,
  useTestConnection,
} from '@/hooks/useBrokers';
import type { BrokerResponse, BrokerConnectionResponse, CredentialField } from '@/services/broker.service';

// -- Status badge helper --
const statusConfig: Record<string, { variant: 'default' | 'destructive' | 'outline' | 'secondary'; label: string }> = {
  CONNECTED: { variant: 'default', label: 'Connected' },
  DISCONNECTED: { variant: 'outline', label: 'Disconnected' },
  ERROR: { variant: 'destructive', label: 'Error' },
  PENDING: { variant: 'secondary', label: 'Pending' },
};

function ConnectionStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { variant: 'outline' as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// -- Broker logo with fallback --
function BrokerLogo({ broker }: { broker: BrokerResponse }) {
  const [imgError, setImgError] = useState(false);

  if (!broker.logoUrl || imgError) {
    return (
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
        {broker.displayName.substring(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={broker.logoUrl}
      alt={broker.displayName}
      className="w-10 h-10 rounded-lg object-contain"
      onError={() => setImgError(true)}
    />
  );
}

// -- Connect broker dialog --
interface ConnectDialogProps {
  broker: BrokerResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ConnectBrokerDialog({ broker, open, onOpenChange }: ConnectDialogProps) {
  const { t } = useTranslation();
  const [selectedProtocol, setSelectedProtocol] = useState<string | undefined>(undefined);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [displayName, setDisplayName] = useState('');

  const effectiveProtocol = selectedProtocol || broker?.defaultProtocol;

  const { data: schema, isLoading: schemaLoading } = useCredentialSchema(
    broker?.code || null,
    effectiveProtocol,
  );

  const connectMutation = useConnectBroker();

  // Reset form when broker changes
  React.useEffect(() => {
    if (broker) {
      setSelectedProtocol(undefined);
      setFormValues({});
      setDisplayName('');
    }
  }, [broker?.code]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broker || !schema) return;

    // Validate required fields
    const missingFields = schema.fields
      .filter(f => f.required && !formValues[f.name]?.trim())
      .map(f => f.label);

    if (missingFields.length > 0) {
      toast({
        title: t('settings.validationError', 'Validation Error'),
        description: `${t('settings.requiredFieldsMissing', 'Please fill in')}: ${missingFields.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await connectMutation.mutateAsync({
        brokerCode: broker.code,
        protocol: effectiveProtocol,
        credentials: JSON.stringify(formValues),
        displayName: displayName.trim() || undefined,
        syncFrequency: 'HOURLY',
      });

      toast({
        title: t('settings.brokerConnected', 'Broker Connected'),
        description: `${broker.displayName} ${t('settings.successfullyConnected', 'has been successfully connected.')}`,
      });
      onOpenChange(false);
    } catch (error: any) {
      const message = error?.response?.data?.message
        || error?.message
        || t('settings.connectionFailed', 'Connection failed. Please check your credentials.');
      toast({
        title: t('settings.connectionError', 'Connection Error'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {broker && <BrokerLogo broker={broker} />}
            {t('settings.connectTo', 'Connect to')} {broker?.displayName}
          </DialogTitle>
          <DialogDescription>
            {t('settings.enterCredentials', 'Enter your credentials to connect your account.')}
            {broker?.propFirm && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {t('settings.propFirm', 'Prop Firm')}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Protocol selector (only if broker supports more than one) */}
          {broker && broker.supportedProtocols.length > 1 && (
            <div className="space-y-2">
              <Label>{t('settings.connectionProtocol', 'Connection Protocol')}</Label>
              <Select
                value={effectiveProtocol}
                onValueChange={setSelectedProtocol}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {broker.supportedProtocols.map(p => (
                    <SelectItem key={p.protocol} value={p.protocol}>
                      {p.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Display name (optional) */}
          <div className="space-y-2">
            <Label htmlFor="connect-display-name">
              {t('settings.connectionDisplayName', 'Display Name')}
              <span className="text-muted-foreground text-xs ml-1">
                ({t('settings.optional', 'optional')})
              </span>
            </Label>
            <Input
              id="connect-display-name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={`${t('settings.myAccount', 'My')} ${broker?.displayName || ''} ${t('settings.account', 'Account')}`}
            />
          </div>

          {/* Dynamic credential fields */}
          {schemaLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : schema?.fields ? (
            schema.fields.map((field: CredentialField) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={`field-${field.name}`}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  id={`field-${field.name}`}
                  type={field.type === 'password' ? 'password' : 'text'}
                  placeholder={field.placeholder || undefined}
                  value={formValues[field.name] || ''}
                  onChange={e => handleFieldChange(field.name, e.target.value)}
                  required={field.required}
                />
                {field.helpText && (
                  <p className="text-xs text-muted-foreground">{field.helpText}</p>
                )}
              </div>
            ))
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={connectMutation.isPending}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={connectMutation.isPending || schemaLoading}>
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('settings.connecting', 'Connecting...')}
                </>
              ) : (
                <>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  {t('settings.connect', 'Connect')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// -- Broker card for each available broker --
interface BrokerCardProps {
  broker: BrokerResponse;
  connection: BrokerConnectionResponse | undefined;
  onConnect: (broker: BrokerResponse) => void;
  onDisconnect: (connectionId: string) => void;
  onSync: (connectionId: string) => void;
  onTest: (connectionId: string) => void;
  isSyncing: boolean;
  isTesting: boolean;
  isDisconnecting: boolean;
}

function BrokerCard({
  broker,
  connection,
  onConnect,
  onDisconnect,
  onSync,
  onTest,
  isSyncing,
  isTesting,
  isDisconnecting,
}: BrokerCardProps) {
  const { t } = useTranslation();
  const isConnected = connection?.status === 'CONNECTED';
  const hasConnection = !!connection;

  return (
    <Card className="relative overflow-hidden">
      {/* Subtle top border for connected brokers */}
      {isConnected && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />
      )}
      {connection?.status === 'ERROR' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <BrokerLogo broker={broker} />
            <div>
              <CardTitle className="text-base">{broker.displayName}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {broker.supportedProtocols.map(p => p.displayName).join(', ')}
                {broker.propFirm && (
                  <Badge variant="secondary" className="ml-2 text-[10px] py-0">
                    {t('settings.propFirm', 'Prop Firm')}
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
          {hasConnection && <ConnectionStatusBadge status={connection.status} />}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {connection?.status === 'ERROR' && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('settings.connectionError', 'Connection Error')}</AlertTitle>
            <AlertDescription className="text-xs">
              {t('settings.connectionErrorDescription', 'There was a problem with this connection. Try reconnecting or check your credentials.')}
            </AlertDescription>
          </Alert>
        )}

        {hasConnection && (
          <div className="text-xs text-muted-foreground space-y-1">
            {connection.displayName && (
              <p>
                <span className="font-medium">{t('settings.displayName', 'Name')}:</span>{' '}
                {connection.displayName}
              </p>
            )}
            <p>
              <span className="font-medium">{t('settings.syncFrequency', 'Sync')}:</span>{' '}
              {connection.syncFrequency}
            </p>
            {connection.lastSyncTime && (
              <p>
                <span className="font-medium">{t('settings.lastSync', 'Last sync')}:</span>{' '}
                {new Date(connection.lastSyncTime).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {!hasConnection && (
          <p className="text-xs text-muted-foreground">
            {t('settings.notConnectedYet', 'Not connected yet. Click Connect to link your account.')}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 pt-0 pb-4">
        {!hasConnection ? (
          <Button size="sm" onClick={() => onConnect(broker)}>
            <LinkIcon className="mr-2 h-3.5 w-3.5" />
            {t('settings.connect', 'Connect')}
          </Button>
        ) : (
          <>
            {isConnected && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSync(connection.id)}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCcw className="mr-2 h-3.5 w-3.5" />
                  )}
                  {t('settings.syncNow', 'Sync Now')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onTest(connection.id)}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Wifi className="mr-2 h-3.5 w-3.5" />
                  )}
                  {t('settings.testConnection', 'Test')}
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDisconnect(connection.id)}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Unplug className="mr-2 h-3.5 w-3.5" />
              )}
              {t('settings.disconnect', 'Disconnect')}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

// -- Loading skeleton for the broker grid --
function BrokerGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4 mt-2" />
          </CardContent>
          <CardFooter className="pt-0 pb-4">
            <Skeleton className="h-8 w-24" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

// -- Main component --
const BrokerConnections = () => {
  const { t } = useTranslation();
  const [connectDialogBroker, setConnectDialogBroker] = useState<BrokerResponse | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const { data: brokers, isLoading: brokersLoading, error: brokersError } = useBrokers();
  const { data: connections, isLoading: connectionsLoading, error: connectionsError } = useBrokerConnections();

  const disconnectMutation = useDisconnectBroker();
  const syncMutation = useSyncConnection();
  const testMutation = useTestConnection();

  const isLoading = brokersLoading || connectionsLoading;
  const error = brokersError || connectionsError;

  // Build a lookup: brokerCode -> connection
  const connectionsByBrokerCode = React.useMemo(() => {
    const map = new Map<string, BrokerConnectionResponse>();
    if (connections) {
      for (const conn of connections) {
        const code = conn.brokerCode || conn.brokerType;
        if (code) {
          map.set(code, conn);
        }
      }
    }
    return map;
  }, [connections]);

  const handleConnect = (broker: BrokerResponse) => {
    setConnectDialogBroker(broker);
  };

  const handleDisconnect = async (connectionId: string) => {
    setDisconnectingId(connectionId);
    try {
      await disconnectMutation.mutateAsync(connectionId);
      toast({
        title: t('settings.brokerDisconnected', 'Broker Disconnected'),
        description: t('settings.successfullyDisconnected', 'The broker has been disconnected.'),
      });
    } catch (err: any) {
      toast({
        title: t('settings.error', 'Error'),
        description: err?.message || t('settings.disconnectFailed', 'Failed to disconnect.'),
        variant: 'destructive',
      });
    } finally {
      setDisconnectingId(null);
    }
  };

  const handleSync = async (connectionId: string) => {
    setSyncingId(connectionId);
    try {
      const result = await syncMutation.mutateAsync(connectionId);
      toast({
        title: t('settings.syncComplete', 'Sync Complete'),
        description: `${t('settings.imported', 'Imported')}: ${result.tradesImported}, ${t('settings.skipped', 'Skipped')}: ${result.tradesSkipped}`,
      });
    } catch (err: any) {
      toast({
        title: t('settings.syncFailed', 'Sync Failed'),
        description: err?.message || t('settings.syncError', 'An error occurred during sync.'),
        variant: 'destructive',
      });
    } finally {
      setSyncingId(null);
    }
  };

  const handleTest = async (connectionId: string) => {
    setTestingId(connectionId);
    try {
      const result = await testMutation.mutateAsync(connectionId);
      toast({
        title: result.success
          ? t('settings.testSuccess', 'Connection OK')
          : t('settings.testFailed', 'Connection Failed'),
        description: result.message,
        variant: result.success ? undefined : 'destructive',
      });
    } catch (err: any) {
      toast({
        title: t('settings.testFailed', 'Connection Failed'),
        description: err?.message || t('settings.testError', 'Could not test connection.'),
        variant: 'destructive',
      });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t('settings.brokerConnections', 'Broker Connections')}</CardTitle>
              <CardDescription>
                {t('settings.brokerConnectionsDescription', 'Connect your brokerage accounts to automatically sync trades.')}
              </CardDescription>
            </div>
            {connections && connections.length > 0 && (
              <div className="mt-2 sm:mt-0 flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {connections.filter(c => c.status === 'CONNECTED').length}{' '}
                {t('settings.activeConnections', 'active')}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Error state */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('settings.loadError', 'Failed to load brokers')}</AlertTitle>
              <AlertDescription>
                {(error as Error).message || t('settings.loadErrorDescription', 'Please try refreshing the page.')}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading state */}
          {isLoading && <BrokerGridSkeleton />}

          {/* Broker grid */}
          {!isLoading && !error && brokers && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* Show connected brokers first, then unconnected */}
              {[...brokers]
                .sort((a, b) => {
                  const aConn = connectionsByBrokerCode.has(a.code) ? 0 : 1;
                  const bConn = connectionsByBrokerCode.has(b.code) ? 0 : 1;
                  return aConn - bConn;
                })
                .map(broker => (
                  <BrokerCard
                    key={broker.code}
                    broker={broker}
                    connection={connectionsByBrokerCode.get(broker.code)}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    onSync={handleSync}
                    onTest={handleTest}
                    isSyncing={syncingId === connectionsByBrokerCode.get(broker.code)?.id}
                    isTesting={testingId === connectionsByBrokerCode.get(broker.code)?.id}
                    isDisconnecting={disconnectingId === connectionsByBrokerCode.get(broker.code)?.id}
                  />
                ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && brokers && brokers.length === 0 && (
            <div className="text-center py-12">
              <WifiOff className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                {t('settings.noBrokersAvailable', 'No brokers available at the moment.')}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t px-6 py-4">
          <div className="flex items-center text-xs text-muted-foreground">
            <ShieldAlert className="h-4 w-4 mr-2 flex-shrink-0" />
            <p>
              {t(
                'settings.apiCredentialsSecurity',
                'Your credentials are encrypted using AES-256-GCM and stored securely. We never store plaintext passwords.'
              )}
            </p>
          </div>
        </CardFooter>
      </Card>

      {/* Connect dialog */}
      <ConnectBrokerDialog
        broker={connectDialogBroker}
        open={!!connectDialogBroker}
        onOpenChange={open => {
          if (!open) setConnectDialogBroker(null);
        }}
      />
    </div>
  );
};

export default BrokerConnections;
