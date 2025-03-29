
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

interface DeleteWatchlistDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteWatchlistDialog: React.FC<DeleteWatchlistDialogProps> = ({ onCancel, onConfirm }) => {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Watchlist</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this watchlist? This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirm}
        >
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default DeleteWatchlistDialog;
