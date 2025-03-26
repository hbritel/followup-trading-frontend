
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  BellRing, 
  Plus, 
  X, 
  Edit2, 
  BarChart, 
  TrendingUp, 
  Activity,
  ArrowUpDown,
  DollarSign,
  Clock,
  AlertCircle,
  BellOff,
  Mail,
  MessageSquare,
  Smartphone,
  ChevronDown,
  ArrowDown,
  ArrowUp
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

// Interfaces
interface AlertItem {
  id: string;
  name: string;
  symbol: string;
  type: 'price' | 'technical' | 'volatility' | 'news' | 'custom';
  condition: string;
  value: string;
  active: boolean;
  createdAt: string;
  triggers: number;
  lastTriggered?: string;
  description?: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

interface AlertCondition {
  id: string;
  name: string;
  description: string;
  parameters: {
    type: 'number' | 'select' | 'multiSelect';
    options?: string[];
    placeholder?: string;
    suffix?: string;
  };
}

const AlertManager = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('active');
  const [showNewAlertDialog, setShowNewAlertDialog] = useState(false);
  const [alertType, setAlertType] = useState<string>('price');
  const [alertCondition, setAlertCondition] = useState<string>('');
  const [alertSymbol, setAlertSymbol] = useState<string>('');
  const [alertValue, setAlertValue] = useState<string>('');
  const [alertName, setAlertName] = useState<string>('');
  const [alertDescription, setAlertDescription] = useState<string>('');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false
  });
  
  // Mock data for alerts
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: '1',
      name: 'AAPL Price Alert',
      symbol: 'AAPL',
      type: 'price',
      condition: 'above',
      value: '180',
      active: true,
      createdAt: '2023-06-01',
      triggers: 2,
      lastTriggered: '2023-06-10',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
    },
    {
      id: '2',
      name: 'MSFT RSI Alert',
      symbol: 'MSFT',
      type: 'technical',
      condition: 'rsi_above',
      value: '70',
      active: true,
      createdAt: '2023-05-28',
      triggers: 0,
      notifications: {
        email: true,
        push: false,
        sms: false,
      },
    },
    {
      id: '3',
      name: 'SPY Volume Alert',
      symbol: 'SPY',
      type: 'technical',
      condition: 'volume_above',
      value: '1.5x avg',
      active: false,
      createdAt: '2023-05-15',
      triggers: 3,
      lastTriggered: '2023-06-05',
      notifications: {
        email: true,
        push: true,
        sms: true,
      },
    },
    {
      id: '4',
      name: 'TSLA News Alert',
      symbol: 'TSLA',
      type: 'news',
      condition: 'contains',
      value: 'earnings',
      active: true,
      createdAt: '2023-06-02',
      triggers: 1,
      lastTriggered: '2023-06-12',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
    },
    {
      id: '5',
      name: 'AMZN Volatility Alert',
      symbol: 'AMZN',
      type: 'volatility',
      condition: 'implied_volatility_above',
      value: '35',
      active: true,
      createdAt: '2023-05-20',
      triggers: 0,
      notifications: {
        email: false,
        push: true,
        sms: false,
      },
    },
  ]);
  
  // Alert conditions based on type
  const alertConditions: Record<string, AlertCondition[]> = {
    price: [
      { 
        id: 'above', 
        name: t('alerts.priceAbove'), 
        description: t('alerts.priceAboveDescription'), 
        parameters: { type: 'number', placeholder: '0.00', suffix: '$' } 
      },
      { 
        id: 'below', 
        name: t('alerts.priceBelow'), 
        description: t('alerts.priceBelowDescription'), 
        parameters: { type: 'number', placeholder: '0.00', suffix: '$' } 
      },
      { 
        id: 'percent_change', 
        name: t('alerts.percentChange'), 
        description: t('alerts.percentChangeDescription'), 
        parameters: { type: 'number', placeholder: '0.00', suffix: '%' } 
      },
    ],
    technical: [
      { 
        id: 'rsi_above', 
        name: t('alerts.rsiAbove'), 
        description: t('alerts.rsiAboveDescription'), 
        parameters: { type: 'number', placeholder: '70', suffix: '' } 
      },
      { 
        id: 'rsi_below', 
        name: t('alerts.rsiBelow'), 
        description: t('alerts.rsiBelowDescription'), 
        parameters: { type: 'number', placeholder: '30', suffix: '' } 
      },
      { 
        id: 'ma_cross', 
        name: t('alerts.maCross'), 
        description: t('alerts.maCrossDescription'), 
        parameters: { 
          type: 'select', 
          options: ['20/50', '50/200', '10/20', '20/200'] 
        } 
      },
      { 
        id: 'volume_above', 
        name: t('alerts.volumeAbove'), 
        description: t('alerts.volumeAboveDescription'), 
        parameters: { 
          type: 'select', 
          options: ['1.5x avg', '2x avg', '3x avg', '5x avg'] 
        } 
      },
    ],
    volatility: [
      { 
        id: 'implied_volatility_above', 
        name: t('alerts.ivAbove'), 
        description: t('alerts.ivAboveDescription'), 
        parameters: { type: 'number', placeholder: '30', suffix: '%' } 
      },
      { 
        id: 'implied_volatility_below', 
        name: t('alerts.ivBelow'), 
        description: t('alerts.ivBelowDescription'), 
        parameters: { type: 'number', placeholder: '20', suffix: '%' } 
      },
      { 
        id: 'volatility_change', 
        name: t('alerts.volChange'), 
        description: t('alerts.volChangeDescription'), 
        parameters: { type: 'number', placeholder: '20', suffix: '%' } 
      },
    ],
    news: [
      { 
        id: 'contains', 
        name: t('alerts.newsContains'), 
        description: t('alerts.newsContainsDescription'), 
        parameters: { type: 'multiSelect', options: ['earnings', 'upgrade', 'downgrade', 'merger', 'acquisition'] } 
      },
      { 
        id: 'source', 
        name: t('alerts.newsSource'), 
        description: t('alerts.newsSourceDescription'), 
        parameters: { 
          type: 'select', 
          options: ['Bloomberg', 'Reuters', 'CNBC', 'Wall Street Journal', 'SEC Filing'] 
        } 
      },
    ],
    custom: [
      { 
        id: 'custom_condition', 
        name: t('alerts.customCondition'), 
        description: t('alerts.customConditionDescription'), 
        parameters: { type: 'number', placeholder: '0', suffix: '' } 
      },
    ],
  };
  
  // Popular stocks for quick selection
  const popularStocks = [
    'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'NVDA', 'TSLA'
  ];
  
  // Toggle alert activation
  const toggleAlertActive = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, active: !alert.active } : alert
    ));
    
    const alert = alerts.find(a => a.id === id);
    if (alert) {
      toast({
        title: alert.active ? t('alerts.alertDisabled') : t('alerts.alertEnabled'),
        description: `${alert.name} ${alert.active ? t('alerts.hasBeenDisabled') : t('alerts.hasBeenEnabled')}`,
      });
    }
  };
  
  // Delete alert
  const deleteAlert = (id: string) => {
    const alertToDelete = alerts.find(a => a.id === id);
    setAlerts(alerts.filter(alert => alert.id !== id));
    
    toast({
      title: t('alerts.alertDeleted'),
      description: `${alertToDelete?.name} ${t('alerts.hasBeenDeleted')}`,
    });
  };
  
  // Handle create new alert
  const handleCreateAlert = () => {
    if (!alertSymbol || !alertCondition || !alertValue) {
      toast({
        title: t('alerts.missingFields'),
        description: t('alerts.pleaseCompleteAllFields'),
        variant: 'destructive',
      });
      return;
    }
    
    const newAlert: AlertItem = {
      id: (alerts.length + 1).toString(),
      name: alertName || `${alertSymbol} ${alertConditions[alertType].find(c => c.id === alertCondition)?.name} ${alertValue}`,
      symbol: alertSymbol,
      type: alertType as 'price' | 'technical' | 'volatility' | 'news' | 'custom',
      condition: alertCondition,
      value: alertValue,
      active: true,
      createdAt: new Date().toISOString().split('T')[0],
      triggers: 0,
      description: alertDescription,
      notifications,
    };
    
    setAlerts([...alerts, newAlert]);
    setShowNewAlertDialog(false);
    
    // Reset form
    setAlertType('price');
    setAlertCondition('');
    setAlertSymbol('');
    setAlertValue('');
    setAlertName('');
    setAlertDescription('');
    setNotifications({
      email: true,
      push: true,
      sms: false
    });
    
    toast({
      title: t('alerts.alertCreated'),
      description: `${newAlert.name} ${t('alerts.hasBeenCreated')}`,
    });
  };
  
  // Get alert icon based on type
  const getAlertIcon = (type: string) => {
    switch(type) {
      case 'price':
        return <DollarSign className="h-4 w-4" />;
      case 'technical':
        return <BarChart className="h-4 w-4" />;
      case 'volatility':
        return <Activity className="h-4 w-4" />;
      case 'news':
        return <AlertCircle className="h-4 w-4" />;
      case 'custom':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <BellRing className="h-4 w-4" />;
    }
  };
  
  // Get notification icons
  const getNotificationIcons = (notifications: {email: boolean, push: boolean, sms: boolean}) => {
    return (
      <div className="flex items-center space-x-1">
        {notifications.email && <Mail className="h-3 w-3 text-muted-foreground" />}
        {notifications.push && <MessageSquare className="h-3 w-3 text-muted-foreground" />}
        {notifications.sms && <Smartphone className="h-3 w-3 text-muted-foreground" />}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t('alerts.alertManagement')}</CardTitle>
              <CardDescription>{t('alerts.alertManagementDescription')}</CardDescription>
            </div>
            <div className="mt-2 sm:mt-0">
              <Dialog open={showNewAlertDialog} onOpenChange={setShowNewAlertDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('alerts.createAlert')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>{t('alerts.createNewAlert')}</DialogTitle>
                    <DialogDescription>
                      {t('alerts.createAlertDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">{t('alerts.symbol')}</Label>
                      <div className="col-span-3">
                        <Input 
                          value={alertSymbol} 
                          onChange={(e) => setAlertSymbol(e.target.value.toUpperCase())} 
                          placeholder="AAPL" 
                        />
                        <div className="flex flex-wrap gap-1 mt-1">
                          {popularStocks.map(stock => (
                            <Badge 
                              key={stock} 
                              variant="outline" 
                              className="cursor-pointer hover:bg-accent"
                              onClick={() => setAlertSymbol(stock)}
                            >
                              {stock}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">{t('alerts.alertType')}</Label>
                      <Select value={alertType} onValueChange={setAlertType}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder={t('alerts.selectAlertType')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="price">
                            <div className="flex items-center">
                              <DollarSign className="mr-2 h-4 w-4" />
                              {t('alerts.priceAlert')}
                            </div>
                          </SelectItem>
                          <SelectItem value="technical">
                            <div className="flex items-center">
                              <BarChart className="mr-2 h-4 w-4" />
                              {t('alerts.technicalAlert')}
                            </div>
                          </SelectItem>
                          <SelectItem value="volatility">
                            <div className="flex items-center">
                              <Activity className="mr-2 h-4 w-4" />
                              {t('alerts.volatilityAlert')}
                            </div>
                          </SelectItem>
                          <SelectItem value="news">
                            <div className="flex items-center">
                              <AlertCircle className="mr-2 h-4 w-4" />
                              {t('alerts.newsAlert')}
                            </div>
                          </SelectItem>
                          <SelectItem value="custom">
                            <div className="flex items-center">
                              <TrendingUp className="mr-2 h-4 w-4" />
                              {t('alerts.customAlert')}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">{t('alerts.condition')}</Label>
                      <Select value={alertCondition} onValueChange={setAlertCondition}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder={t('alerts.selectCondition')} />
                        </SelectTrigger>
                        <SelectContent>
                          {alertConditions[alertType]?.map((condition) => (
                            <SelectItem key={condition.id} value={condition.id}>
                              {condition.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {alertCondition && (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">{t('alerts.value')}</Label>
                        {alertConditions[alertType]?.find(c => c.id === alertCondition)?.parameters.type === 'number' && (
                          <div className="col-span-3 relative">
                            <Input 
                              value={alertValue} 
                              onChange={(e) => setAlertValue(e.target.value)} 
                              placeholder={alertConditions[alertType]?.find(c => c.id === alertCondition)?.parameters.placeholder} 
                            />
                            {alertConditions[alertType]?.find(c => c.id === alertCondition)?.parameters.suffix && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                {alertConditions[alertType]?.find(c => c.id === alertCondition)?.parameters.suffix}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {alertConditions[alertType]?.find(c => c.id === alertCondition)?.parameters.type === 'select' && (
                          <Select value={alertValue} onValueChange={setAlertValue}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder={t('alerts.selectValue')} />
                            </SelectTrigger>
                            <SelectContent>
                              {alertConditions[alertType]?.find(c => c.id === alertCondition)?.parameters.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        
                        {alertConditions[alertType]?.find(c => c.id === alertCondition)?.parameters.type === 'multiSelect' && (
                          <div className="col-span-3">
                            <Input 
                              value={alertValue} 
                              onChange={(e) => setAlertValue(e.target.value)} 
                              placeholder={t('alerts.enterKeywords')} 
                            />
                            <div className="flex flex-wrap gap-1 mt-1">
                              {alertConditions[alertType]?.find(c => c.id === alertCondition)?.parameters.options?.map((option) => (
                                <Badge 
                                  key={option} 
                                  variant="outline" 
                                  className="cursor-pointer hover:bg-accent"
                                  onClick={() => setAlertValue(option)}
                                >
                                  {option}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">{t('alerts.name')}</Label>
                      <Input 
                        className="col-span-3"
                        value={alertName} 
                        onChange={(e) => setAlertName(e.target.value)} 
                        placeholder={t('alerts.optionalCustomName')} 
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right">{t('alerts.description')}</Label>
                      <Textarea 
                        className="col-span-3 min-h-[80px]"
                        value={alertDescription} 
                        onChange={(e) => setAlertDescription(e.target.value)} 
                        placeholder={t('alerts.optionalDescription')} 
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">{t('alerts.notifications')}</Label>
                      <div className="col-span-3 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="notify-email" 
                            checked={notifications.email} 
                            onCheckedChange={(checked) => setNotifications({...notifications, email: !!checked})}
                          />
                          <Label htmlFor="notify-email" className="font-normal">
                            <Mail className="inline-block mr-2 h-4 w-4" />
                            {t('alerts.emailNotification')}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="notify-push" 
                            checked={notifications.push} 
                            onCheckedChange={(checked) => setNotifications({...notifications, push: !!checked})}
                          />
                          <Label htmlFor="notify-push" className="font-normal">
                            <MessageSquare className="inline-block mr-2 h-4 w-4" />
                            {t('alerts.pushNotification')}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="notify-sms" 
                            checked={notifications.sms} 
                            onCheckedChange={(checked) => setNotifications({...notifications, sms: !!checked})}
                          />
                          <Label htmlFor="notify-sms" className="font-normal">
                            <Smartphone className="inline-block mr-2 h-4 w-4" />
                            {t('alerts.smsNotification')}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewAlertDialog(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={handleCreateAlert}>
                      {t('alerts.createAlert')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="active">
                {t('alerts.activeAlerts')} ({alerts.filter(a => a.active).length})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                {t('alerts.inactiveAlerts')} ({alerts.filter(a => !a.active).length})
              </TabsTrigger>
              <TabsTrigger value="all">
                {t('alerts.allAlerts')} ({alerts.length})
              </TabsTrigger>
            </TabsList>
            
            <div className="space-y-4">
              {(activeTab === 'active' ? alerts.filter(a => a.active) :
                activeTab === 'inactive' ? alerts.filter(a => !a.active) : alerts).map((alert) => (
                <Card key={alert.id} className="overflow-hidden">
                  <div className={`h-1 ${
                    alert.type === 'price' ? 'bg-blue-500' :
                    alert.type === 'technical' ? 'bg-purple-500' :
                    alert.type === 'volatility' ? 'bg-amber-500' :
                    alert.type === 'news' ? 'bg-emerald-500' : 'bg-slate-500'
                  }`}></div>
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-full ${
                          alert.type === 'price' ? 'bg-blue-100 text-blue-700' :
                          alert.type === 'technical' ? 'bg-purple-100 text-purple-700' :
                          alert.type === 'volatility' ? 'bg-amber-100 text-amber-700' :
                          alert.type === 'news' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div>
                          <h3 className="font-medium">{alert.name}</h3>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Badge variant="outline" className="mr-2">{alert.symbol}</Badge>
                            {alert.lastTriggered && (
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {t('alerts.lastTriggered')}: {alert.lastTriggered}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getNotificationIcons(alert.notifications)}
                        <Switch
                          checked={alert.active}
                          onCheckedChange={() => toggleAlertActive(alert.id)}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              // Edit alert logic here
                              toast({
                                title: t('alerts.editAlert'),
                                description: t('alerts.editAlertFeatureComingSoon'),
                              });
                            }}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteAlert(alert.id)}>
                              <X className="mr-2 h-4 w-4" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {alert.description && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {alert.description}
                      </div>
                    )}
                    <div className="mt-3 text-sm font-medium">
                      <span className="inline-flex items-center">
                        {alert.condition === 'above' || alert.condition === 'rsi_above' || alert.condition === 'implied_volatility_above' ? (
                          <ArrowUp className="h-4 w-4 mr-1 text-green-500" />
                        ) : alert.condition === 'below' || alert.condition === 'rsi_below' || alert.condition === 'implied_volatility_below' ? (
                          <ArrowDown className="h-4 w-4 mr-1 text-red-500" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 mr-1" />
                        )}
                        {alertConditions[alert.type]?.find(c => c.id === alert.condition)?.name}: {alert.value}
                        {alert.condition === 'percent_change' || 
                          alert.condition === 'implied_volatility_above' || 
                          alert.condition === 'implied_volatility_below' || 
                          alert.condition === 'volatility_change' ? '%' : ''}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
              
              {((activeTab === 'active' && !alerts.some(a => a.active)) ||
                (activeTab === 'inactive' && !alerts.some(a => !a.active)) ||
                (activeTab === 'all' && alerts.length === 0)) && (
                <div className="text-center py-10">
                  <BellOff className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">
                    {activeTab === 'active' ? t('alerts.noActiveAlerts') : 
                     activeTab === 'inactive' ? t('alerts.noInactiveAlerts') : 
                     t('alerts.noAlerts')}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('alerts.createAlertToGetStarted')}
                  </p>
                  <Button className="mt-4" onClick={() => setShowNewAlertDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('alerts.createAlert')}
                  </Button>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertManager;
