
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface Device {
  id: string;
  name: string;
  browser: string;
  os: string;
  lastActive: string;
  isCurrent: boolean;
  location: string;
}

const TrustedDevices = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Mock data for demonstration
  const [devices, setDevices] = useState<Device[]>([
    {
      id: '1',
      name: 'MacBook Pro',
      browser: 'Chrome',
      os: 'macOS',
      lastActive: 'Now',
      isCurrent: true,
      location: 'San Francisco, US',
    },
    {
      id: '2',
      name: 'iPhone 14',
      browser: 'Safari',
      os: 'iOS',
      lastActive: '2 hours ago',
      isCurrent: false,
      location: 'San Francisco, US',
    },
    {
      id: '3',
      name: 'Windows PC',
      browser: 'Firefox',
      os: 'Windows 11',
      lastActive: '3 days ago',
      isCurrent: false,
      location: 'New York, US',
    },
  ]);
  
  const handleRevokeAccess = (deviceId: string) => {
    // In a real implementation, this would call your backend API
    setDevices(devices.filter(device => device.id !== deviceId));
    
    toast({
      title: 'Device removed',
      description: 'The device has been removed from your trusted devices.',
    });
  };
  
  return (
    <DashboardLayout pageTitle={t('auth.trustedDevicesTitle')}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('auth.trustedDevicesTitle')}</CardTitle>
            <CardDescription>
              {t('auth.trustedDevicesSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devices.map((device) => (
                <div 
                  key={device.id} 
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-border last:border-0"
                >
                  <div className="flex flex-col space-y-1 mb-2 sm:mb-0">
                    <div className="flex items-center">
                      <span className="font-medium">{device.name}</span>
                      {device.isCurrent && (
                        <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          {t('trustedDevices.currentDevice')}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {device.browser} • {device.os}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('trustedDevices.lastAccess')}: {device.lastActive}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('trustedDevices.location')}: {device.location}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeAccess(device.id)}
                    disabled={device.isCurrent}
                    className="min-w-[100px]"
                  >
                    {t('trustedDevices.revokeAccess')}
                  </Button>
                </div>
              ))}
              
              {devices.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No trusted devices found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TrustedDevices;
