
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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const Settings = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [mobileNotifications, setMobileNotifications] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [tradeConfirmations, setTradeConfirmations] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  
  return (
    <DashboardLayout pageTitle="Settings">
      <div className="space-y-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Manage your general application preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Time & Region</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select defaultValue="America/New_York">
                        <SelectTrigger id="timezone">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="date-format">Date Format</Label>
                      <Select defaultValue="MM/DD/YYYY">
                        <SelectTrigger id="date-format">
                          <SelectValue placeholder="Select date format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select defaultValue="USD">
                        <SelectTrigger id="currency">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="JPY">JPY (¥)</SelectItem>
                          <SelectItem value="CAD">CAD (C$)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="number-format">Number Format</Label>
                      <Select defaultValue="dot">
                        <SelectTrigger id="number-format">
                          <SelectValue placeholder="Select number format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dot">1,234.56</SelectItem>
                          <SelectItem value="comma">1.234,56</SelectItem>
                          <SelectItem value="space">1 234,56</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Default View Settings</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="default-page">Default Landing Page</Label>
                      <Select defaultValue="dashboard">
                        <SelectTrigger id="default-page">
                          <SelectValue placeholder="Select default page" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dashboard">Dashboard</SelectItem>
                          <SelectItem value="trades">Trades</SelectItem>
                          <SelectItem value="performance">Performance</SelectItem>
                          <SelectItem value="watchlists">Watchlists</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="default-period">Default Time Period</Label>
                      <Select defaultValue="1m">
                        <SelectTrigger id="default-period">
                          <SelectValue placeholder="Select default period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1d">1 Day</SelectItem>
                          <SelectItem value="1w">1 Week</SelectItem>
                          <SelectItem value="1m">1 Month</SelectItem>
                          <SelectItem value="3m">3 Months</SelectItem>
                          <SelectItem value="1y">1 Year</SelectItem>
                          <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Data Refresh</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="auto-refresh">Auto-Refresh Interval</Label>
                      <Select defaultValue="5">
                        <SelectTrigger id="auto-refresh">
                          <SelectValue placeholder="Select refresh interval" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Disabled</SelectItem>
                          <SelectItem value="1">1 Minute</SelectItem>
                          <SelectItem value="5">5 Minutes</SelectItem>
                          <SelectItem value="15">15 Minutes</SelectItem>
                          <SelectItem value="30">30 Minutes</SelectItem>
                          <SelectItem value="60">1 Hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Real-time Market Data</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable real-time market data updates
                      </p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Channels</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch 
                      checked={emailNotifications} 
                      onCheckedChange={setEmailNotifications} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mobile Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications on your mobile device
                      </p>
                    </div>
                    <Switch 
                      checked={mobileNotifications} 
                      onCheckedChange={setMobileNotifications} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Browser Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications in your browser
                      </p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Types</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Price Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when price targets are hit
                      </p>
                    </div>
                    <Switch 
                      checked={alertsEnabled} 
                      onCheckedChange={setAlertsEnabled} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Trade Confirmations</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about trade executions
                      </p>
                    </div>
                    <Switch 
                      checked={tradeConfirmations} 
                      onCheckedChange={setTradeConfirmations} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>News Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about market news for watched securities
                      </p>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Earnings Announcements</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about upcoming earnings reports
                      </p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Account Activity</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about login attempts and account changes
                      </p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the look and feel of your dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Theme</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Switch between light and dark theme
                      </p>
                    </div>
                    <Switch 
                      checked={darkMode} 
                      onCheckedChange={setDarkMode} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="theme-color">Accent Color</Label>
                      <Select defaultValue="blue">
                        <SelectTrigger id="theme-color">
                          <SelectValue placeholder="Select color theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blue">Blue</SelectItem>
                          <SelectItem value="green">Green</SelectItem>
                          <SelectItem value="purple">Purple</SelectItem>
                          <SelectItem value="orange">Orange</SelectItem>
                          <SelectItem value="red">Red</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="font-size">Font Size</Label>
                      <Select defaultValue="medium">
                        <SelectTrigger id="font-size">
                          <SelectValue placeholder="Select font size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="layout-density">Layout Density</Label>
                      <Select defaultValue="comfortable">
                        <SelectTrigger id="layout-density">
                          <SelectValue placeholder="Select layout density" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compact">Compact</SelectItem>
                          <SelectItem value="comfortable">Comfortable</SelectItem>
                          <SelectItem value="spacious">Spacious</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Chart Preferences</h3>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="chart-style">Default Chart Style</Label>
                      <Select defaultValue="candle">
                        <SelectTrigger id="chart-style">
                          <SelectValue placeholder="Select chart style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="candle">Candlestick</SelectItem>
                          <SelectItem value="bar">OHLC Bars</SelectItem>
                          <SelectItem value="line">Line</SelectItem>
                          <SelectItem value="area">Area</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="chart-interval">Default Chart Interval</Label>
                      <Select defaultValue="D">
                        <SelectTrigger id="chart-interval">
                          <SelectValue placeholder="Select chart interval" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Minute</SelectItem>
                          <SelectItem value="5">5 Minutes</SelectItem>
                          <SelectItem value="15">15 Minutes</SelectItem>
                          <SelectItem value="60">1 Hour</SelectItem>
                          <SelectItem value="D">Daily</SelectItem>
                          <SelectItem value="W">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Volume</Label>
                      <p className="text-sm text-muted-foreground">
                        Display volume bars on charts
                      </p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Extended Hours</Label>
                      <p className="text-sm text-muted-foreground">
                        Display pre-market and after-hours data
                      </p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Authentication</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" value="john.doe@example.com" readOnly />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch 
                      checked={twoFactorAuth} 
                      onCheckedChange={setTwoFactorAuth} 
                    />
                  </div>
                  
                  {twoFactorAuth && (
                    <div className="rounded-md border p-4 mt-2">
                      <h4 className="font-medium">Two-Factor Authentication Setup</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Use an authenticator app to scan the QR code below:
                      </p>
                      <div className="h-40 w-40 bg-muted flex items-center justify-center mx-auto my-4">
                        <p className="text-xs text-muted-foreground">QR Code placeholder</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="verification-code">Verification Code</Label>
                        <Input id="verification-code" placeholder="Enter 6-digit code" />
                      </div>
                      <Button className="mt-4">Verify & Enable</Button>
                    </div>
                  )}
                  
                  <Button variant="outline" className="w-full">Change Password</Button>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Session Security</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Logout</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically log out after period of inactivity
                      </p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timeout">Inactivity Timeout</Label>
                    <Select defaultValue="30">
                      <SelectTrigger id="timeout">
                        <SelectValue placeholder="Select timeout period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Password for Trades</Label>
                      <p className="text-sm text-muted-foreground">
                        Require password confirmation for trade actions
                      </p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Device Management</h3>
                  
                  <div className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Current Device</h4>
                        <p className="text-sm text-muted-foreground">
                          Chrome on Windows • IP: 192.168.1.1
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Last active: Just now
                        </p>
                      </div>
                      <Badge>Current</Badge>
                    </div>
                  </div>
                  
                  <div className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">iPhone 13</h4>
                        <p className="text-sm text-muted-foreground">
                          Safari on iOS • IP: 192.168.1.2
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Last active: 2 hours ago
                        </p>
                      </div>
                      <Button variant="outline" size="sm">Revoke</Button>
                    </div>
                  </div>
                  
                  <div className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">MacBook Pro</h4>
                        <p className="text-sm text-muted-foreground">
                          Safari on macOS • IP: 192.168.1.3
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Last active: Yesterday
                        </p>
                      </div>
                      <Button variant="outline" size="sm">Revoke</Button>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full">Log Out All Other Devices</Button>
                </div>
                
                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
