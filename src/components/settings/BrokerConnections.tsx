
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCcw, 
  KeyRound, 
  ShieldAlert,
  Link,
  BarChart4,
  LucideIcon,
  FileText,
  Clock,
  Settings
} from 'lucide-react';
import { toast } from "@/hooks/use-toast";

// Define the broker integration interface
interface BrokerIntegration {
  id: string;
  name: string;
  logo: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  features: Array<{
    name: string;
    supported: boolean;
    icon: LucideIcon;
  }>;
  apiFields: Array<{
    key: string;
    label: string;
    type: 'text' | 'password';
    required: boolean;
    placeholder: string;
  }>;
}

const BrokerConnections = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('alpaca');
  const [autoSync, setAutoSync] = useState(true);
  const [syncFrequency, setSyncFrequency] = useState('15');
  
  // State for API credentials
  const [apiCredentials, setApiCredentials] = useState<Record<string, Record<string, string>>>({
    alpaca: { api_key: '', api_secret: '', is_paper: 'true' },
    tradingview: { username: '', password: '', chart_token: '' },
    tradier: { api_key: '', account_id: '' },
    interactive: { username: '', password: '', account_id: '', api_gateway: '' },
    thinkorswim: { username: '', password: '', auth_token: '' },
  });
  
  // Sample broker integrations
  const brokers: BrokerIntegration[] = [
    {
      id: 'alpaca',
      name: 'Alpaca',
      logo: 'https://alpaca.markets/favicon.ico',
      status: 'connected',
      lastSync: '2023-06-15 14:30',
      features: [
        { name: t('settings.realTimeTrades'), supported: true, icon: Clock },
        { name: t('settings.historicalData'), supported: true, icon: FileText },
        { name: t('settings.paperTrading'), supported: true, icon: FileText },
        { name: t('settings.marketData'), supported: true, icon: BarChart4 },
        { name: t('settings.orderManagement'), supported: true, icon: Settings },
      ],
      apiFields: [
        { key: 'api_key', label: t('settings.apiKey'), type: 'text', required: true, placeholder: 'ALPACA_API_KEY' },
        { key: 'api_secret', label: t('settings.apiSecret'), type: 'password', required: true, placeholder: 'ALPACA_API_SECRET' },
        { key: 'is_paper', label: t('settings.paperTrading'), type: 'text', required: false, placeholder: 'true/false' },
      ],
    },
    {
      id: 'tradingview',
      name: 'TradingView',
      logo: 'https://www.tradingview.com/favicon.ico',
      status: 'disconnected',
      features: [
        { name: t('settings.realTimeTrades'), supported: false, icon: Clock },
        { name: t('settings.historicalData'), supported: true, icon: FileText },
        { name: t('settings.paperTrading'), supported: false, icon: FileText },
        { name: t('settings.marketData'), supported: true, icon: BarChart4 },
        { name: t('settings.orderManagement'), supported: false, icon: Settings },
      ],
      apiFields: [
        { key: 'username', label: t('settings.username'), type: 'text', required: true, placeholder: 'your_username' },
        { key: 'password', label: t('settings.password'), type: 'password', required: true, placeholder: '********' },
        { key: 'chart_token', label: t('settings.chartToken'), type: 'text', required: false, placeholder: 'TRADINGVIEW_CHART_TOKEN' },
      ],
    },
    {
      id: 'tradier',
      name: 'Tradier',
      logo: 'https://tradier.com/favicon.ico',
      status: 'disconnected',
      features: [
        { name: t('settings.realTimeTrades'), supported: true, icon: Clock },
        { name: t('settings.historicalData'), supported: true, icon: FileText },
        { name: t('settings.paperTrading'), supported: false, icon: FileText },
        { name: t('settings.marketData'), supported: true, icon: BarChart4 },
        { name: t('settings.orderManagement'), supported: true, icon: Settings },
      ],
      apiFields: [
        { key: 'api_key', label: t('settings.apiKey'), type: 'text', required: true, placeholder: 'TRADIER_API_KEY' },
        { key: 'account_id', label: t('settings.accountId'), type: 'text', required: true, placeholder: 'TRADIER_ACCOUNT_ID' },
      ],
    },
    {
      id: 'interactive',
      name: 'Interactive Brokers',
      logo: 'https://www.interactivebrokers.com/favicon.ico',
      status: 'error',
      lastSync: '2023-06-14 09:15',
      features: [
        { name: t('settings.realTimeTrades'), supported: true, icon: Clock },
        { name: t('settings.historicalData'), supported: true, icon: FileText },
        { name: t('settings.paperTrading'), supported: true, icon: FileText },
        { name: t('settings.marketData'), supported: true, icon: BarChart4 },
        { name: t('settings.orderManagement'), supported: true, icon: Settings },
      ],
      apiFields: [
        { key: 'username', label: t('settings.username'), type: 'text', required: true, placeholder: 'IB_USERNAME' },
        { key: 'password', label: t('settings.password'), type: 'password', required: true, placeholder: '********' },
        { key: 'account_id', label: t('settings.accountId'), type: 'text', required: true, placeholder: 'IB_ACCOUNT_ID' },
        { key: 'api_gateway', label: t('settings.apiGateway'), type: 'text', required: false, placeholder: 'https://api.ibkr.com/v1/api' },
      ],
    },
    {
      id: 'thinkorswim',
      name: 'ThinkOrSwim',
      logo: 'https://www.tdameritrade.com/favicon.ico',
      status: 'disconnected',
      features: [
        { name: t('settings.realTimeTrades'), supported: true, icon: Clock },
        { name: t('settings.historicalData'), supported: true, icon: FileText },
        { name: t('settings.paperTrading'), supported: true, icon: FileText },
        { name: t('settings.marketData'), supported: true, icon: BarChart4 },
        { name: t('settings.orderManagement'), supported: true, icon: Settings },
      ],
      apiFields: [
        { key: 'username', label: t('settings.username'), type: 'text', required: true, placeholder: 'TOS_USERNAME' },
        { key: 'password', label: t('settings.password'), type: 'password', required: true, placeholder: '********' },
        { key: 'auth_token', label: t('settings.authToken'), type: 'password', required: true, placeholder: 'TOS_AUTH_TOKEN' },
      ],
    },
  ];
  
  // Handle form input change
  const handleInputChange = (brokerId: string, field: string, value: string) => {
    setApiCredentials(prev => ({
      ...prev,
      [brokerId]: {
        ...prev[brokerId],
        [field]: value
      }
    }));
  };
  
  // Handle connect/disconnect
  const handleToggleConnection = (brokerId: string, currentStatus: string) => {
    if (currentStatus === 'connected') {
      // Disconnect logic here
      toast({
        title: t('settings.brokerDisconnected'),
        description: `${brokers.find(b => b.id === brokerId)?.name} ${t('settings.successfullyDisconnected')}`,
      });
    } else {
      // Connect logic here
      // For this example, just show success toast
      toast({
        title: t('settings.brokerConnected'),
        description: `${brokers.find(b => b.id === brokerId)?.name} ${t('settings.successfullyConnected')}`,
      });
    }
  };
  
  // Handle sync now
  const handleSyncNow = (brokerId: string) => {
    toast({
      title: t('settings.syncStarted'),
      description: `${t('settings.synchronizing')} ${brokers.find(b => b.id === brokerId)?.name} ${t('settings.data')}...`,
    });
    
    // In a real app, this would trigger the actual sync process
    setTimeout(() => {
      toast({
        title: t('settings.syncComplete'),
        description: `${brokers.find(b => b.id === brokerId)?.name} ${t('settings.dataSynchronized')}`,
      });
    }, 2000);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t('settings.brokerConnections')}</CardTitle>
              <CardDescription>{t('settings.brokerConnectionsDescription')}</CardDescription>
            </div>
            <div className="mt-2 sm:mt-0 flex items-center space-x-2">
              <Switch
                id="auto-sync"
                checked={autoSync}
                onCheckedChange={setAutoSync}
              />
              <Label htmlFor="auto-sync">{t('settings.autoSync')}</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {autoSync && (
            <div className="bg-accent/20 p-4 rounded-md mb-6">
              <Label htmlFor="sync-frequency">{t('settings.syncFrequency')}</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="sync-frequency"
                  type="number"
                  value={syncFrequency}
                  onChange={(e) => setSyncFrequency(e.target.value)}
                  className="w-20"
                  min="1"
                  max="1440"
                />
                <span className="flex items-center">{t('settings.minutes')}</span>
              </div>
            </div>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 md:grid-cols-5 mb-4">
              {brokers.map((broker) => (
                <TabsTrigger key={broker.id} value={broker.id} className="relative">
                  {broker.name}
                  {broker.status === 'connected' && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-green-500 transform translate-x-1 -translate-y-1"></span>
                  )}
                  {broker.status === 'error' && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 transform translate-x-1 -translate-y-1"></span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {brokers.map((broker) => (
              <TabsContent key={broker.id} value={broker.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={broker.logo} alt={broker.name} className="w-6 h-6" />
                    <h3 className="text-lg font-medium">{broker.name}</h3>
                    <Badge variant={broker.status === 'connected' ? 'default' : broker.status === 'error' ? 'destructive' : 'outline'}>
                      {broker.status === 'connected' && t('settings.connected')}
                      {broker.status === 'disconnected' && t('settings.disconnected')}
                      {broker.status === 'error' && t('settings.error')}
                    </Badge>
                  </div>
                  {broker.status === 'connected' && broker.lastSync && (
                    <div className="text-sm text-muted-foreground">
                      {t('settings.lastSync')}: {broker.lastSync}
                    </div>
                  )}
                </div>
                
                {broker.status === 'error' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('settings.connectionError')}</AlertTitle>
                    <AlertDescription>
                      {t('settings.connectionErrorDescription')}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">{t('settings.supportedFeatures')}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {broker.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-1 text-xs">
                          {feature.supported ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-muted-foreground" />
                          )}
                          <feature.icon className="h-3 w-3 mr-1" />
                          <span className={feature.supported ? '' : 'text-muted-foreground'}>{feature.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">{t('settings.apiCredentials')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {broker.apiFields.map((field) => (
                        <div key={field.key} className="space-y-1">
                          <Label htmlFor={`${broker.id}-${field.key}`}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          <Input
                            id={`${broker.id}-${field.key}`}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={apiCredentials[broker.id]?.[field.key] || ''}
                            onChange={(e) => handleInputChange(broker.id, field.key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button 
                    variant={broker.status === 'connected' ? 'destructive' : 'default'}
                    onClick={() => handleToggleConnection(broker.id, broker.status)}
                  >
                    {broker.status === 'connected' ? (
                      <>
                        <Link className="mr-2 h-4 w-4" />
                        {t('settings.disconnect')}
                      </>
                    ) : (
                      <>
                        <Link className="mr-2 h-4 w-4" />
                        {t('settings.connect')}
                      </>
                    )}
                  </Button>
                  
                  {broker.status === 'connected' && (
                    <Button variant="outline" onClick={() => handleSyncNow(broker.id)}>
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      {t('settings.syncNow')}
                    </Button>
                  )}
                  
                  <Button variant="outline" onClick={() => window.open(`https://docs.${broker.id}.com/api`, '_blank')}>
                    <FileText className="mr-2 h-4 w-4" />
                    {t('settings.apiDocs')}
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <div className="flex items-center text-xs text-muted-foreground">
            <ShieldAlert className="h-4 w-4 mr-2" />
            <p>{t('settings.apiCredentialsSecurity')}</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BrokerConnections;
