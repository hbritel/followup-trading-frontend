// src/components/security/TrustedDevicesManager.tsx
import React, { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, ShieldAlert, ShieldCheck, Smartphone, Laptop, Monitor } from 'lucide-react';
import { trustedDeviceService } from '@/services/trustedDevice.service';
import { fingerprintService } from '@/services/fingerprint.service';
import type { TrustedDeviceDto } from '@/types/dto';
import { format } from 'date-fns';

const TrustedDevicesManager: React.FC = () => {
    const { toast } = useToast();
    const [devices, setDevices] = useState<TrustedDeviceDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // États pour le dialogue d'ajout d'appareil
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [deviceName, setDeviceName] = useState('');
    const [mfaExemptDays, setMfaExemptDays] = useState('30'); // Défaut à 30 jours
    const [isAddingDevice, setIsAddingDevice] = useState(false);

    // Charger les appareils au montage
    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const devicesList = await trustedDeviceService.getAllTrustedDevices();
            setDevices(devicesList);
        } catch (error) {
            console.error("Failed to load trusted devices:", error);
            setError("Could not load trusted devices data.");
            toast({
                title: "Error",
                description: "Could not load trusted devices data.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddDevice = async () => {
        if (!deviceName.trim()) {
            toast({
                title: "Error",
                description: "Please provide a device name.",
                variant: "destructive"
            });
            return;
        }

        setIsAddingDevice(true);
        try {
            await trustedDeviceService.addTrustedDevice({
                deviceName: deviceName.trim(),
                mfaExemptDays: parseInt(mfaExemptDays, 10)
            });

            toast({
                title: "Device Added",
                description: "The device has been successfully added as trusted."
            });

            // Rafraîchir la liste des appareils
            await fetchDevices();

            // Fermer le dialogue et réinitialiser les champs
            setShowAddDialog(false);
            setDeviceName('');
            setMfaExemptDays('30');
        } catch (error) {
            console.error("Failed to add trusted device:", error);
            const errorMessage = trustedDeviceService.getErrorMessage(error);
            toast({
                title: "Error Adding Device",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setIsAddingDevice(false);
        }
    };

    const handleRevokeDevice = async (deviceId: string) => {
        if (!confirm("Are you sure you want to revoke this trusted device?")) {
            return;
        }

        try {
            await trustedDeviceService.revokeTrustedDevice(deviceId);
            toast({
                title: "Device Revoked",
                description: "The trusted device has been successfully revoked."
            });

            // Rafraîchir la liste des appareils
            await fetchDevices();
        } catch (error) {
            console.error(`Failed to revoke trusted device ${deviceId}:`, error);
            const errorMessage = trustedDeviceService.getErrorMessage(error);
            toast({
                title: "Error Revoking Device",
                description: errorMessage,
                variant: "destructive"
            });
        }
    };

    const handleRevokeAllDevices = async () => {
        if (!confirm("Are you sure you want to revoke ALL trusted devices? This will require MFA for all future logins.")) {
            return;
        }

        try {
            await trustedDeviceService.revokeAllTrustedDevices();
            toast({
                title: "All Devices Revoked",
                description: "All trusted devices have been successfully revoked."
            });

            // Rafraîchir la liste des appareils
            await fetchDevices();
        } catch (error) {
            console.error("Failed to revoke all trusted devices:", error);
            const errorMessage = trustedDeviceService.getErrorMessage(error);
            toast({
                title: "Error Revoking Devices",
                description: errorMessage,
                variant: "destructive"
            });
        }
    };

    // Helper pour deviner le type d'appareil depuis le User Agent
    const getDeviceIcon = (userAgent: string | null): React.ReactNode => {
        const ua = userAgent?.toLowerCase() || '';
        if (ua.includes('iphone') || ua.includes('android') || ua.includes('mobile')) {
            return <Smartphone className="h-5 w-5 mr-2 text-muted-foreground"/>;
        }
        if (ua.includes('macintosh') || ua.includes('mac os')) {
            return <Laptop className="h-5 w-5 mr-2 text-muted-foreground"/>;
        }
        if (ua.includes('windows') || ua.includes('linux')) {
            return <Monitor className="h-5 w-5 mr-2 text-muted-foreground"/>;
        }
        return <Monitor className="h-5 w-5 mr-2 text-muted-foreground"/>;
    };

    // Helper pour formater la date
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), "PPpp"); // Ex: Sep 21, 2023, 4:15:30 PM
        } catch {
            return dateString;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Trusted Devices</CardTitle>
                <CardDescription>
                    Manage devices you trust and want to exempt from MFA verification
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-end">
                    <Button onClick={() => setShowAddDialog(true)}>
                        Add Current Device as Trusted
                    </Button>
                </div>

                {isLoading && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>}
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

                {!isLoading && !error && devices.length === 0 && (
                    <Alert>
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>No trusted devices</AlertTitle>
                        <AlertDescription>
                            You don't have any trusted devices yet. Add this device as trusted to skip MFA verification on future logins.
                        </AlertDescription>
                    </Alert>
                )}

                {!isLoading && !error && devices.length > 0 && (
                    <div className="space-y-3">
                        {devices.map((device) => (
                            <div key={device.id} className="rounded-md border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                <div className="flex items-center">
                                    {getDeviceIcon(device.lastUserAgent)}
                                    <div>
                                        <h4 className="font-medium flex items-center">
                                            {device.name}
                                            {device.isCurrentDevice && <Badge variant="outline" className="ml-2 text-xs">Current</Badge>}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            {device.lastIpAddress || 'IP Unknown'}
                                        </p>
                                        <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                            {device.isMfaExempt ? (
                                                <>
                                                    <ShieldCheck className="h-3 w-3 mr-1 text-green-500" />
                                                    <span>MFA exempt until {formatDate(device.mfaExemptUntil)}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    <span>MFA required</span>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Last active: {formatDate(device.lastUsedAt)}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRevokeDevice(device.id)}
                                >
                                    Revoke
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && !error && devices.length > 1 && (
                    <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={handleRevokeAllDevices}
                    >
                        Revoke All Trusted Devices
                    </Button>
                )}

                {/* Dialogue d'ajout d'appareil de confiance */}
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Trusted Device</DialogTitle>
                            <DialogDescription>
                                Adding this device as trusted will allow you to skip MFA verification when logging in from this device.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="deviceName">Device Name</Label>
                                <Input
                                    id="deviceName"
                                    placeholder="e.g., My Laptop, Work Phone"
                                    value={deviceName}
                                    onChange={(e) => setDeviceName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mfaExemptDays">MFA Exemption Period</Label>
                                <Select value={mfaExemptDays} onValueChange={setMfaExemptDays}>
                                    <SelectTrigger id="mfaExemptDays">
                                        <SelectValue placeholder="Select exemption period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">7 days</SelectItem>
                                        <SelectItem value="30">30 days</SelectItem>
                                        <SelectItem value="90">90 days</SelectItem>
                                        <SelectItem value="180">180 days</SelectItem>
                                        <SelectItem value="365">1 year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                            <Button onClick={handleAddDevice} disabled={isAddingDevice || !deviceName.trim()}>
                                {isAddingDevice ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Add Device
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default TrustedDevicesManager;