
import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t('watchlists.deleteWatchlistTitle')}</DialogTitle>
        <DialogDescription>
          {t('watchlists.deleteWatchlistConfirm')}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          {t('common.delete')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default DeleteWatchlistDialog;
