
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const AccountManagement = () => {
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [updatePaymentOpen, setUpdatePaymentOpen] = useState(false);
  const [downloadInvoiceId, setDownloadInvoiceId] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleChangePlan = () => {
    setChangePlanOpen(false);
    toast({
      title: t('accountManagement.planChanged'),
      description: t('accountManagement.planChangedDescription'),
    });
  };

  const handleUpdatePayment = () => {
    setUpdatePaymentOpen(false);
    toast({
      title: t('accountManagement.paymentMethodUpdated'),
      description: t('accountManagement.paymentMethodUpdatedDescription'),
    });
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    console.log(`Downloading invoice ${invoiceId}`);
    toast({
      title: t('accountManagement.invoiceDownloaded'),
      description: t('accountManagement.invoiceDownloadedDescription', { invoiceId }),
    });
  };

  return (
    <DashboardLayout pageTitle={t('pages.accountManagement')}>
      <div className="space-y-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">{t('common.profile')}</TabsTrigger>
            <TabsTrigger value="subscription">{t('accountManagement.subscription')}</TabsTrigger>
            <TabsTrigger value="api">{t('accountManagement.apiAccess')}</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('accountManagement.profileInformation')}</CardTitle>
                <CardDescription>{t('accountManagement.profileInformationDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-6 sm:flex-row">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-xl">JD</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">{t('accountManagement.changeAvatar')}</Button>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">{t('common.firstName')}</Label>
                        <Input id="first-name" defaultValue="John" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">{t('common.lastName')}</Label>
                        <Input id="last-name" defaultValue="Doe" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">{t('common.email')}</Label>
                      <Input id="email" defaultValue="john.doe@example.com" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('accountManagement.phoneNumber')}</Label>
                      <Input id="phone" defaultValue="+1 (555) 123-4567" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('accountManagement.accountBio')}</h3>
                  <div className="space-y-2">
                    <Label htmlFor="bio">{t('accountManagement.tradingBio')}</Label>
                    <Textarea
                      id="bio"
                      placeholder={t('accountManagement.tradingBioPlaceholder')}
                      defaultValue="I'm a swing trader focused on technology and healthcare sectors. I've been actively trading for over 5 years with a focus on technical analysis."
                      className="min-h-24"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('accountManagement.tradingExperience')}</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="experience">{t('accountManagement.experienceLevel')}</Label>
                      <select
                        id="experience"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue="intermediate"
                      >
                        <option value="beginner">{t('accountManagement.beginner')}</option>
                        <option value="intermediate">{t('accountManagement.intermediate')}</option>
                        <option value="advanced">{t('accountManagement.advanced')}</option>
                        <option value="professional">{t('accountManagement.professional')}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="years-trading">{t('accountManagement.yearsTrading')}</Label>
                      <select
                        id="years-trading"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue="3-5"
                      >
                        <option value="<1">{t('accountManagement.lessThan1Year')}</option>
                        <option value="1-3">{t('accountManagement.oneToThreeYears')}</option>
                        <option value="3-5">{t('accountManagement.threeToFiveYears')}</option>
                        <option value="5-10">{t('accountManagement.fiveToTenYears')}</option>
                        <option value=">10">{t('accountManagement.moreThan10Years')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>{t('common.saveChanges')}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('accountManagement.subscriptionManagement')}</CardTitle>
                <CardDescription>{t('accountManagement.subscriptionManagementDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-medium">{t('accountManagement.currentPlan')}: <span className="text-primary">{t('accountManagement.planProfessional')}</span></h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('accountManagement.planRenewsOn', { date: 'July 15, 2023' })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setChangePlanOpen(true)}>{t('accountManagement.changePlan')}</Button>
                      <Button variant="outline" className="text-destructive">{t('common.cancel')}</Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('accountManagement.planDetails')}</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-md border p-4">
                      <div className="font-medium">{t('accountManagement.features')}</div>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li className="flex items-center">
                          <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {t('accountManagement.featureRealTimeData')}
                        </li>
                        <li className="flex items-center">
                          <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {t('accountManagement.featureUnlimitedWatchlists')}
                        </li>
                        <li className="flex items-center">
                          <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {t('accountManagement.featureAdvancedCharting')}
                        </li>
                        <li className="flex items-center">
                          <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {t('accountManagement.featurePortfolioAnalytics')}
                        </li>
                        <li className="flex items-center">
                          <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {t('accountManagement.featureTradingJournal')}
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-md border p-4">
                      <div className="font-medium">{t('accountManagement.billingInformation')}</div>
                      <div className="mt-2 space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">{t('accountManagement.amount')}:</span> $29.99/{t('accountManagement.month')}
                        </p>
                        <p>
                          <span className="text-muted-foreground">{t('accountManagement.paymentMethod')}:</span> Visa ending in 4242
                        </p>
                        <p>
                          <span className="text-muted-foreground">{t('accountManagement.nextBillingDate')}:</span> July 15, 2023
                        </p>
                      </div>
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUpdatePaymentOpen(true)}
                        >
                          {t('accountManagement.updatePaymentMethod')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('accountManagement.billingHistory')}</h3>
                  <div className="rounded-md border">
                    <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-medium">{t('accountManagement.invoice')} #12345</div>
                        <div className="text-sm text-muted-foreground">June 15, 2023</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">$29.99</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadInvoice('12345')}
                        >
                          {t('common.download')}
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-medium">{t('accountManagement.invoice')} #12344</div>
                        <div className="text-sm text-muted-foreground">May 15, 2023</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">$29.99</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadInvoice('12344')}
                        >
                          {t('common.download')}
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-medium">{t('accountManagement.invoice')} #12343</div>
                        <div className="text-sm text-muted-foreground">April 15, 2023</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">$29.99</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadInvoice('12343')}
                        >
                          {t('common.download')}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">{t('accountManagement.viewAllInvoices')}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('accountManagement.apiAccess')}</CardTitle>
                <CardDescription>{t('accountManagement.apiAccessDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="font-medium">{t('accountManagement.apiStatus')}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('accountManagement.apiStatusDescription')}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="h-5 w-5 rounded-full bg-green-500 mr-2"></div>
                      <span className="font-medium">{t('accountManagement.enabled')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('accountManagement.apiKeys')}</h3>

                  <div className="space-y-2">
                    <Label htmlFor="api-key">{t('accountManagement.apiKey')}</Label>
                    <div className="flex">
                      <Input
                        id="api-key"
                        type="password"
                        value="••••••••••••••••••••••••••••••"
                        readOnly
                        className="rounded-r-none"
                      />
                      <Button variant="outline" className="rounded-l-none">{t('accountManagement.show')}</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="api-secret">{t('accountManagement.apiSecret')}</Label>
                    <div className="flex">
                      <Input
                        id="api-secret"
                        type="password"
                        value="••••••••••••••••••••••••••••••"
                        readOnly
                        className="rounded-r-none"
                      />
                      <Button variant="outline" className="rounded-l-none">{t('accountManagement.show')}</Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline">{t('accountManagement.regenerateKeys')}</Button>
                    <Button variant="destructive">{t('accountManagement.revokeKeys')}</Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('accountManagement.apiUsage')}</h3>

                  <div className="rounded-md border p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">{t('accountManagement.requestsToday')}</div>
                        <div className="text-xl font-bold">2,458</div>
                        <div className="text-xs text-muted-foreground mt-1">{t('accountManagement.limit')}: 10,000</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">{t('accountManagement.requestsThisMonth')}</div>
                        <div className="text-xl font-bold">45,892</div>
                        <div className="text-xs text-muted-foreground mt-1">{t('accountManagement.limit')}: 300,000</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">{t('accountManagement.averageResponseTime')}</div>
                        <div className="text-xl font-bold">124ms</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('accountManagement.accessRestrictions')}</h3>

                  <div className="space-y-2">
                    <Label htmlFor="ip-whitelist">{t('accountManagement.ipWhitelist')}</Label>
                    <Textarea
                      id="ip-whitelist"
                      placeholder={t('accountManagement.ipWhitelistPlaceholder')}
                      defaultValue="192.168.1.1&#10;10.0.0.1"
                      className="min-h-24"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('accountManagement.ipWhitelistHelp')}
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button>{t('common.saveChanges')}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Change Plan Dialog */}
      <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('accountManagement.changeSubscriptionPlan')}</DialogTitle>
            <DialogDescription>
              {t('accountManagement.changeSubscriptionPlanDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <div className="font-medium">{t('accountManagement.planBasic')}</div>
                  <div className="text-sm text-muted-foreground">$9.99/{t('accountManagement.month')}</div>
                </div>
                <Button variant="outline" size="sm">{t('common.select')}</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-md bg-muted/20">
                <div>
                  <div className="font-medium">{t('accountManagement.planProfessional')}</div>
                  <div className="text-sm text-muted-foreground">$29.99/{t('accountManagement.month')}</div>
                  <div className="text-xs text-primary mt-1">{t('accountManagement.currentPlanLabel')}</div>
                </div>
                <Button variant="outline" size="sm" disabled>{t('common.selected')}</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <div className="font-medium">{t('accountManagement.planEnterprise')}</div>
                  <div className="text-sm text-muted-foreground">$99.99/{t('accountManagement.month')}</div>
                </div>
                <Button variant="outline" size="sm">{t('common.select')}</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePlanOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleChangePlan}>{t('accountManagement.confirmChange')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Payment Method Dialog */}
      <Dialog open={updatePaymentOpen} onOpenChange={setUpdatePaymentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('accountManagement.updatePaymentMethod')}</DialogTitle>
            <DialogDescription>
              {t('accountManagement.updatePaymentMethodDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="card-number">{t('accountManagement.cardNumber')}</Label>
              <Input id="card-number" placeholder="•••• •••• •••• ••••" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">{t('accountManagement.expirationDate')}</Label>
                <Input id="expiry" placeholder="MM/YY" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">{t('accountManagement.cvc')}</Label>
                <Input id="cvc" placeholder="•••" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t('accountManagement.nameOnCard')}</Label>
              <Input id="name" placeholder="John Doe" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdatePaymentOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdatePayment}>{t('accountManagement.updatePaymentMethod')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AccountManagement;
