
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/components/ui/use-toast';

interface ConfirmLogoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConfirmLogoutDialog: React.FC<ConfirmLogoutDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();

  const handleConfirm = () => {
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Success",
        description: "You have been logged out from all other devices",
      });
      onOpenChange(false);
    }, 1000);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Log Out From All Devices</AlertDialogTitle>
          <AlertDialogDescription>
            This action will terminate all active sessions on other devices. You will remain logged in on this device.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Log Out All Devices
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmLogoutDialog;
