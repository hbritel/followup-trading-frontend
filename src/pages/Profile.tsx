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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

const Profile = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <DashboardLayout pageTitle="Profile">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">Manage your personal profile information</p>
          </div>
        </div>
        
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Personal Info</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
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
                        <Label htmlFor="display-name">Display Name</Label>
                        <Input id="display-name" defaultValue="JohnDoe92" />
                        <p className="text-sm text-muted-foreground">
                          This is how your name will appear to other users
                        </p>
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
                    <h3 className="text-lg font-medium">About Me</h3>
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
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your recent actions and events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Logged in from new device</div>
                      <Badge variant="outline">Just now</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Chrome on Windows • IP: 192.168.1.1
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Added new trade</div>
                      <Badge variant="outline">2 hours ago</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      AAPL Buy • 150 shares at $185.45
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Updated profile information</div>
                      <Badge variant="outline">Yesterday</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Changed contact details
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Created new watchlist</div>
                      <Badge variant="outline">2 days ago</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      "Tech Stocks 2023" with 8 symbols
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Generated performance report</div>
                      <Badge variant="outline">1 week ago</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Monthly performance summary for June 2023
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Preferences</CardTitle>
                <CardDescription>Customize your user experience</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notifications</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <Switch id="email-notifications" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <Switch id="push-notifications" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="trade-alerts">Trade Alerts</Label>
                        <Switch id="trade-alerts" defaultChecked />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Trading Defaults</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="default-order-type">Default Order Type</Label>
                        <select 
                          id="default-order-type" 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          defaultValue="market"
                        >
                          <option value="market">Market</option>
                          <option value="limit">Limit</option>
                          <option value="stop">Stop</option>
                          <option value="stop-limit">Stop Limit</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="default-account">Default Trading Account</Label>
                        <select 
                          id="default-account" 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          defaultValue="main"
                        >
                          <option value="main">Trading Account (Main)</option>
                          <option value="options">Options Trading</option>
                          <option value="retirement">Retirement Account</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Display Preferences</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="compact-view">Compact View</Label>
                        <Switch id="compact-view" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-profits">Show P/L in Percentages</Label>
                        <Switch id="show-profits" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="real-time-updates">Real-time Updates</Label>
                        <Switch id="real-time-updates" defaultChecked />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit">Save Preferences</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
