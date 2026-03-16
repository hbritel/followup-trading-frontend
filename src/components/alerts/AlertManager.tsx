import { useState } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  BellOff,
  Mail,
  MessageSquare,
  ChevronDown,
  ArrowDown,
  ArrowUp,
  Loader2
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAlerts, useCreateAlert, useUpdateAlert, useDeleteAlert } from '@/hooks/useAlerts';
import type {
  AlertResponseDto,
  AlertRequestDto,
  AlertType,
  AlertCondition as AlertConditionType,
  AlertStatus
} from '@/types/dto';

const AlertManager = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('active');
  const [showNewAlertDialog, setShowNewAlertDialog] = useState(false);
  const [alertType, setAlertType] = useState<AlertType>('PRICE');
  const [alertCondition, setAlertCondition] = useState<AlertConditionType | ''>('');
  const [alertSymbol, setAlertSymbol] = useState<string>('');
  const [alertThreshold, setAlertThreshold] = useState<string>('');
  const [alertName, setAlertName] = useState<string>('');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true
  });

  // API hooks
  const { data: alerts = [], isLoading } = useAlerts();
  const createAlert = useCreateAlert();
  const updateAlert = useUpdateAlert();
  const deleteAlertMutation = useDeleteAlert();

  // Toggle alert active/disabled via API
  const toggleAlertActive = (alert: AlertResponseDto) => {
    const newStatus: AlertStatus = alert.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const requestData: AlertRequestDto = {
      name: alert.name,
      type: alert.type,
      symbol: alert.symbol,
      condition: alert.condition,
      threshold: alert.threshold,
      status: newStatus,
      notifyEmail: alert.notifyEmail,
      notifyPush: alert.notifyPush,
    };

    updateAlert.mutate(
      { id: alert.id, data: requestData },
      {
        onSuccess: () => {
          toast({
            title: newStatus === 'ACTIVE' ? t('alerts.alertEnabled') : t('alerts.alertDisabled'),
            description: `${alert.name} ${newStatus === 'ACTIVE' ? t('alerts.hasBeenEnabled') : t('alerts.hasBeenDisabled')}`,
          });
        },
        onError: () => {
          toast({
            title: t('alerts.updateFailed'),
            description: t('alerts.updateFailedDescription'),
            variant: 'destructive',
          });
        },
      }
    );
  };

  // Delete alert via API
  const handleDeleteAlert = (alert: AlertResponseDto) => {
    deleteAlertMutation.mutate(alert.id, {
      onSuccess: () => {
        toast({
          title: t('alerts.alertDeleted'),
          description: `${alert.name} ${t('alerts.hasBeenDeleted')}`,
        });
      },
      onError: () => {
        toast({
          title: t('alerts.deleteFailed'),
          description: t('alerts.deleteFailedDescription'),
          variant: 'destructive',
        });
      },
    });
  };

  // Handle create new alert
  const handleCreateAlert = () => {
    if (!alertName || !alertCondition || !alertThreshold) {
      toast({
        title: t('alerts.missingFields'),
        description: t('alerts.pleaseCompleteAllFields'),
        variant: 'destructive',
      });
      return;
    }

    const thresholdNum = Number.parseFloat(alertThreshold);
    if (Number.isNaN(thresholdNum)) {
      toast({
        title: t('alerts.missingFields'),
        description: t('alerts.invalidThreshold'),
        variant: 'destructive',
      });
      return;
    }

    const requestData: AlertRequestDto = {
      name: alertName,
      type: alertType,
      symbol: alertSymbol || null,
      condition: alertCondition,
      threshold: thresholdNum,
      notifyEmail: notifications.email,
      notifyPush: notifications.push,
    };

    createAlert.mutate(requestData, {
      onSuccess: () => {
        setShowNewAlertDialog(false);
        resetForm();
        toast({
          title: t('alerts.alertCreated'),
          description: `${alertName} ${t('alerts.hasBeenCreated')}`,
        });
      },
      onError: () => {
        toast({
          title: t('alerts.createFailed'),
          description: t('alerts.createFailedDescription'),
          variant: 'destructive',
        });
      },
    });
  };

  const resetForm = () => {
    setAlertType('PRICE');
    setAlertCondition('');
    setAlertSymbol('');
    setAlertThreshold('');
    setAlertName('');
    setNotifications({ email: true, push: true });
  };

  // Get alert icon based on backend AlertType
  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'PRICE':
        return <DollarSign className="h-4 w-4" />;
      case 'DRAWDOWN':
        return <Activity className="h-4 w-4" />;
      case 'PROFIT_TARGET':
        return <ArrowUp className="h-4 w-4" />;
      case 'WIN_RATE':
        return <BarChart className="h-4 w-4" />;
      case 'CUSTOM':
        return <BellRing className="h-4 w-4" />;
      default:
        return <BellRing className="h-4 w-4" />;
    }
  };

  // Color scheme per alert type
  const getTypeColor = (type: AlertType) => {
    switch (type) {
      case 'PRICE':
        return { bar: 'bg-blue-500', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
      case 'DRAWDOWN':
        return { bar: 'bg-red-500', bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
      case 'PROFIT_TARGET':
        return { bar: 'bg-emerald-500', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
      case 'WIN_RATE':
        return { bar: 'bg-purple-500', bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' };
      case 'CUSTOM':
        return { bar: 'bg-slate-500', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400' };
      default:
        return { bar: 'bg-slate-500', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400' };
    }
  };

  // Condition direction icon
  const getConditionIcon = (condition: AlertConditionType) => {
    switch (condition) {
      case 'ABOVE':
        return <ArrowUp className="h-4 w-4 mr-1 text-green-500" />;
      case 'BELOW':
        return <ArrowDown className="h-4 w-4 mr-1 text-red-500" />;
      case 'CROSSES':
        return <ArrowUpDown className="h-4 w-4 mr-1 text-amber-500" />;
      case 'PERCENT_CHANGE':
        return <TrendingUp className="h-4 w-4 mr-1 text-blue-500" />;
      default:
        return <ArrowUpDown className="h-4 w-4 mr-1" />;
    }
  };

  // Get notification icons
  const getNotificationIcons = (alert: AlertResponseDto) => {
    return (
      <div className="flex items-center space-x-1">
        {alert.notifyEmail && <Mail className="h-3 w-3 text-muted-foreground" />}
        {alert.notifyPush && <MessageSquare className="h-3 w-3 text-muted-foreground" />}
      </div>
    );
  };

  // Status badge
  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">{t('alerts.statusActive')}</Badge>;
      case 'TRIGGERED':
        return <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">{t('alerts.statusTriggered')}</Badge>;
      case 'EXPIRED':
        return <Badge variant="secondary">{t('alerts.statusExpired')}</Badge>;
      case 'DISABLED':
        return <Badge variant="outline">{t('alerts.statusDisabled')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format condition label for display
  const getConditionLabel = (condition: AlertConditionType): string => {
    switch (condition) {
      case 'ABOVE':
        return t('alerts.conditionAbove');
      case 'BELOW':
        return t('alerts.conditionBelow');
      case 'CROSSES':
        return t('alerts.conditionCrosses');
      case 'PERCENT_CHANGE':
        return t('alerts.conditionPercentChange');
      default:
        return condition;
    }
  };

  // Format alert type label
  const getTypeLabel = (type: AlertType): string => {
    switch (type) {
      case 'PRICE':
        return t('alerts.typePrice');
      case 'DRAWDOWN':
        return t('alerts.typeDrawdown');
      case 'PROFIT_TARGET':
        return t('alerts.typeProfitTarget');
      case 'WIN_RATE':
        return t('alerts.typeWinRate');
      case 'CUSTOM':
        return t('alerts.typeCustom');
      default:
        return type;
    }
  };

  // Empty state heading based on active tab
  const getEmptyHeading = (): string => {
    if (activeTab === 'active') return t('alerts.noActiveAlerts');
    if (activeTab === 'triggered') return t('alerts.noTriggeredAlerts');
    return t('alerts.noAlerts');
  };

  // Filter alerts by tab
  const getFilteredAlerts = (): AlertResponseDto[] => {
    switch (activeTab) {
      case 'active':
        return alerts.filter(a => a.status === 'ACTIVE');
      case 'triggered':
        return alerts.filter(a => a.status === 'TRIGGERED');
      case 'all':
      default:
        return alerts;
    }
  };

  const filteredAlerts = getFilteredAlerts();
  const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const triggeredCount = alerts.filter(a => a.status === 'TRIGGERED').length;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72" />
              </div>
              <Skeleton className="h-10 w-36 mt-2 sm:mt-0" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-80 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-1 w-full" />
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-10" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-48 mt-3" />
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <Dialog open={showNewAlertDialog} onOpenChange={(open) => {
                setShowNewAlertDialog(open);
                if (!open) resetForm();
              }}>
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
                    {/* Name */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">{t('alerts.name')}</Label>
                      <Input
                        className="col-span-3"
                        value={alertName}
                        onChange={(e) => setAlertName(e.target.value)}
                        placeholder={t('alerts.alertNamePlaceholder')}
                      />
                    </div>

                    {/* Symbol (optional) */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">{t('alerts.symbol')}</Label>
                      <Input
                        className="col-span-3"
                        value={alertSymbol}
                        onChange={(e) => setAlertSymbol(e.target.value.toUpperCase())}
                        placeholder={t('alerts.symbolPlaceholder')}
                      />
                    </div>

                    {/* Type */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">{t('alerts.alertType')}</Label>
                      <Select value={alertType} onValueChange={(v) => setAlertType(v as AlertType)}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder={t('alerts.selectAlertType')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRICE">
                            <div className="flex items-center">
                              <DollarSign className="mr-2 h-4 w-4" />
                              {t('alerts.typePrice')}
                            </div>
                          </SelectItem>
                          <SelectItem value="DRAWDOWN">
                            <div className="flex items-center">
                              <Activity className="mr-2 h-4 w-4" />
                              {t('alerts.typeDrawdown')}
                            </div>
                          </SelectItem>
                          <SelectItem value="PROFIT_TARGET">
                            <div className="flex items-center">
                              <ArrowUp className="mr-2 h-4 w-4" />
                              {t('alerts.typeProfitTarget')}
                            </div>
                          </SelectItem>
                          <SelectItem value="WIN_RATE">
                            <div className="flex items-center">
                              <BarChart className="mr-2 h-4 w-4" />
                              {t('alerts.typeWinRate')}
                            </div>
                          </SelectItem>
                          <SelectItem value="CUSTOM">
                            <div className="flex items-center">
                              <BellRing className="mr-2 h-4 w-4" />
                              {t('alerts.typeCustom')}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Condition */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">{t('alerts.condition')}</Label>
                      <Select value={alertCondition} onValueChange={(v) => setAlertCondition(v as AlertConditionType)}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder={t('alerts.selectCondition')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ABOVE">{t('alerts.conditionAbove')}</SelectItem>
                          <SelectItem value="BELOW">{t('alerts.conditionBelow')}</SelectItem>
                          <SelectItem value="CROSSES">{t('alerts.conditionCrosses')}</SelectItem>
                          <SelectItem value="PERCENT_CHANGE">{t('alerts.conditionPercentChange')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Threshold */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">{t('alerts.threshold')}</Label>
                      <div className="col-span-3 relative">
                        <Input
                          type="number"
                          step="any"
                          value={alertThreshold}
                          onChange={(e) => setAlertThreshold(e.target.value)}
                          placeholder={t('alerts.thresholdPlaceholder')}
                        />
                        {alertCondition === 'PERCENT_CHANGE' && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                            %
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notifications */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">{t('alerts.notifications')}</Label>
                      <div className="col-span-3 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="notify-email"
                            checked={notifications.email}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, email: !!checked })}
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
                            onCheckedChange={(checked) => setNotifications({ ...notifications, push: !!checked })}
                          />
                          <Label htmlFor="notify-push" className="font-normal">
                            <MessageSquare className="inline-block mr-2 h-4 w-4" />
                            {t('alerts.pushNotification')}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setShowNewAlertDialog(false);
                      resetForm();
                    }}>
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={handleCreateAlert} disabled={createAlert.isPending}>
                      {createAlert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                {t('alerts.activeAlerts')} ({activeCount})
              </TabsTrigger>
              <TabsTrigger value="triggered">
                {t('alerts.triggeredAlerts')} ({triggeredCount})
              </TabsTrigger>
              <TabsTrigger value="all">
                {t('alerts.allAlerts')} ({alerts.length})
              </TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              {filteredAlerts.map((alert) => {
                const typeColor = getTypeColor(alert.type);
                const isToggleable = alert.status === 'ACTIVE' || alert.status === 'DISABLED';

                return (
                  <Card key={alert.id} className="overflow-hidden">
                    <div className={`h-1 ${typeColor.bar}`}></div>
                    <div className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-2">
                          <div className={`p-2 rounded-full ${typeColor.bg}`}>
                            {getAlertIcon(alert.type)}
                          </div>
                          <div>
                            <h3 className="font-medium">{alert.name}</h3>
                            <div className="flex items-center flex-wrap gap-1 text-xs text-muted-foreground">
                              {alert.symbol && (
                                <Badge variant="outline" className="mr-1">{alert.symbol}</Badge>
                              )}
                              <Badge variant="outline" className="mr-1">{getTypeLabel(alert.type)}</Badge>
                              {getStatusBadge(alert.status)}
                              {alert.triggeredAt && (
                                <span className="flex items-center ml-1">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {t('alerts.lastTriggered')}: {new Date(alert.triggeredAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getNotificationIcons(alert)}
                          {isToggleable && (
                            <Switch
                              checked={alert.status === 'ACTIVE'}
                              onCheckedChange={() => toggleAlertActive(alert)}
                              disabled={updateAlert.isPending}
                            />
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                toast({
                                  title: t('alerts.editAlert'),
                                  description: t('alerts.editAlertFeatureComingSoon'),
                                });
                              }}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                {t('common.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteAlert(alert)}
                                className="text-destructive focus:text-destructive"
                              >
                                <X className="mr-2 h-4 w-4" />
                                {t('common.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="inline-flex items-center font-medium">
                          {getConditionIcon(alert.condition)}
                          {getConditionLabel(alert.condition)}: {alert.threshold}
                          {alert.condition === 'PERCENT_CHANGE' ? '%' : ''}
                        </span>
                        {alert.currentValue !== null && (
                          <span className="text-muted-foreground text-xs">
                            {t('alerts.currentValue')}: {alert.currentValue}
                          </span>
                        )}
                      </div>
                      {alert.message && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          {alert.message}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}

              {filteredAlerts.length === 0 && (
                <div className="text-center py-10">
                  <BellOff className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">
                    {getEmptyHeading()}
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
