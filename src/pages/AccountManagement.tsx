
import { useState } from 'react';
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

  const handleChangePlan = () => {
    setChangePlanOpen(false);
    toast({
      title: "Plan changed",
      description: "Your subscription plan has been updated successfully.",
    });
  };

  const handleUpdatePayment = () => {
    setUpdatePaymentOpen(false);
    toast({
      title: "Payment method updated",
      description: "Your payment method has been updated successfully.",
    });
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    console.log(`Downloading invoice ${invoiceId}`);
    toast({
      title: "Invoice downloaded",
      description: `Invoice #${invoiceId} has been downloaded.`,
    });
  };

  return (
    <DashboardLayout pageTitle="Account Management">
      <div className="space-y-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="api">API Access</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Manage your personal account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-6 sm:flex-row">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-xl">JD</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">Change Avatar</Button>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First Name</Label>
                        <Input id="first-name" defaultValue="John" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input id="last-name" defaultValue="Doe" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" defaultValue="john.doe@example.com" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" defaultValue="+1 (555) 123-4567" />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Account Bio</h3>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Trading Bio</Label>
                    <Textarea 
                      id="bio" 
                      placeholder="Tell us about your trading style and experience..."
                      defaultValue="I'm a swing trader focused on technology and healthcare sectors. I've been actively trading for over 5 years with a focus on technical analysis."
                      className="min-h-24"
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Trading Experience</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="experience">Experience Level</Label>
                      <select 
                        id="experience" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue="intermediate"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="professional">Professional</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="years-trading">Years Trading</Label>
                      <select 
                        id="years-trading" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue="3-5"
                      >
                        <option value="<1">Less than 1 year</option>
                        <option value="1-3">1-3 years</option>
                        <option value="3-5">3-5 years</option>
                        <option value="5-10">5-10 years</option>
                        <option value=">10">More than 10 years</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>Manage your subscription plan and billing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-medium">Current Plan: <span className="text-primary">Professional</span></h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your plan renews on July 15, 2023
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setChangePlanOpen(true)}>Change Plan</Button>
                      <Button variant="outline" className="text-destructive">Cancel</Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Plan Details</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-md border p-4">
                      <div className="font-medium">Features</div>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li className="flex items-center">
                          <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Real-time market data
                        </li>
                        <li className="flex items-center">
                          <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Unlimited watchlists
                        </li>
                        <li className="flex items-center">
                          <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Advanced charting tools
                        </li>
                        <li className="flex items-center">
                          <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Portfolio analytics
                        </li>
                        <li className="flex items-center">
                          <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Trading journal
                        </li>
                      </ul>
                    </div>
                    
                    <div className="rounded-md border p-4">
                      <div className="font-medium">Billing Information</div>
                      <div className="mt-2 space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">Amount:</span> $29.99/month
                        </p>
                        <p>
                          <span className="text-muted-foreground">Payment method:</span> Visa ending in 4242
                        </p>
                        <p>
                          <span className="text-muted-foreground">Next billing date:</span> July 15, 2023
                        </p>
                      </div>
                      <div className="mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setUpdatePaymentOpen(true)}
                        >
                          Update Payment Method
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Billing History</h3>
                  <div className="rounded-md border">
                    <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-medium">Invoice #12345</div>
                        <div className="text-sm text-muted-foreground">June 15, 2023</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">$29.99</div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadInvoice('12345')}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-medium">Invoice #12344</div>
                        <div className="text-sm text-muted-foreground">May 15, 2023</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">$29.99</div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadInvoice('12344')}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-medium">Invoice #12343</div>
                        <div className="text-sm text-muted-foreground">April 15, 2023</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">$29.99</div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadInvoice('12343')}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full">View All Invoices</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Access</CardTitle>
                <CardDescription>Manage your API keys and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="font-medium">API Status</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Enable or disable API access for your account
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="h-5 w-5 rounded-full bg-green-500 mr-2"></div>
                      <span className="font-medium">Enabled</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">API Keys</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <div className="flex">
                      <Input 
                        id="api-key" 
                        type="password" 
                        value="••••••••••••••••••••••••••••••" 
                        readOnly 
                        className="rounded-r-none"
                      />
                      <Button variant="outline" className="rounded-l-none">Show</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="api-secret">API Secret</Label>
                    <div className="flex">
                      <Input 
                        id="api-secret" 
                        type="password" 
                        value="••••••••••••••••••••••••••••••" 
                        readOnly 
                        className="rounded-r-none"
                      />
                      <Button variant="outline" className="rounded-l-none">Show</Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline">Regenerate Keys</Button>
                    <Button variant="destructive">Revoke Keys</Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">API Usage</h3>
                  
                  <div className="rounded-md border p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Requests Today</div>
                        <div className="text-xl font-bold">2,458</div>
                        <div className="text-xs text-muted-foreground mt-1">Limit: 10,000</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-muted-foreground">Requests This Month</div>
                        <div className="text-xl font-bold">45,892</div>
                        <div className="text-xs text-muted-foreground mt-1">Limit: 300,000</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-muted-foreground">Average Response Time</div>
                        <div className="text-xl font-bold">124ms</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Access Restrictions</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ip-whitelist">IP Whitelist</Label>
                    <Textarea 
                      id="ip-whitelist" 
                      placeholder="Enter IP addresses, one per line"
                      defaultValue="192.168.1.1&#10;10.0.0.1"
                      className="min-h-24"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter IP addresses that are allowed to access the API, one per line. Leave empty to allow all IPs.
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button>Save Changes</Button>
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
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>
              Select a new plan that best suits your needs.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <div className="font-medium">Basic</div>
                  <div className="text-sm text-muted-foreground">$9.99/month</div>
                </div>
                <Button variant="outline" size="sm">Select</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-md bg-muted/20">
                <div>
                  <div className="font-medium">Professional</div>
                  <div className="text-sm text-muted-foreground">$29.99/month</div>
                  <div className="text-xs text-primary mt-1">Current Plan</div>
                </div>
                <Button variant="outline" size="sm" disabled>Selected</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <div className="font-medium">Enterprise</div>
                  <div className="text-sm text-muted-foreground">$99.99/month</div>
                </div>
                <Button variant="outline" size="sm">Select</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePlanOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePlan}>Confirm Change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Update Payment Method Dialog */}
      <Dialog open={updatePaymentOpen} onOpenChange={setUpdatePaymentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Payment Method</DialogTitle>
            <DialogDescription>
              Enter your new payment details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <Input id="card-number" placeholder="•••• •••• •••• ••••" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiration Date</Label>
                <Input id="expiry" placeholder="MM/YY" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" placeholder="•••" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name on Card</Label>
              <Input id="name" placeholder="John Doe" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdatePaymentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePayment}>Update Payment Method</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AccountManagement;
