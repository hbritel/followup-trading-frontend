
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import WatchlistForm, { WatchlistFormValues } from './WatchlistForm';
import SymbolForm, { SymbolFormValues } from './SymbolForm';
import DeleteWatchlistDialog from './DeleteWatchlistDialog';

interface WatchlistDialogsProps {
  newWatchlistOpen: boolean;
  editWatchlistOpen: boolean;
  addSymbolOpen: boolean;
  deleteWatchlistOpen: boolean;
  editingWatchlist: { id: string; name: string; description: string; icon: string } | null;
  onNewWatchlistOpenChange: (open: boolean) => void;
  onEditWatchlistOpenChange: (open: boolean) => void;
  onAddSymbolOpenChange: (open: boolean) => void;
  onDeleteWatchlistOpenChange: (open: boolean) => void;
  onCreateWatchlist: (data: WatchlistFormValues) => void;
  onEditWatchlist: (data: WatchlistFormValues) => void;
  onAddSymbol: (data: SymbolFormValues) => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  isPendingAddSymbol?: boolean;
}

const WatchlistDialogs: React.FC<WatchlistDialogsProps> = ({
  newWatchlistOpen,
  editWatchlistOpen,
  addSymbolOpen,
  deleteWatchlistOpen,
  editingWatchlist,
  onNewWatchlistOpenChange,
  onEditWatchlistOpenChange,
  onAddSymbolOpenChange,
  onDeleteWatchlistOpenChange,
  onCreateWatchlist,
  onEditWatchlist,
  onAddSymbol,
  onCancelDelete,
  onConfirmDelete,
  isPendingAddSymbol = false,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* New Watchlist Dialog */}
      <Dialog open={newWatchlistOpen} onOpenChange={onNewWatchlistOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('watchlists.createNewWatchlist')}</DialogTitle>
            <DialogDescription>
              {t('watchlists.createNewWatchlistDescription')}
            </DialogDescription>
          </DialogHeader>
          <WatchlistForm onSubmit={onCreateWatchlist} />
        </DialogContent>
      </Dialog>

      {/* Edit Watchlist Dialog */}
      <Dialog open={editWatchlistOpen} onOpenChange={onEditWatchlistOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('watchlists.editWatchlist')}</DialogTitle>
            <DialogDescription>
              {t('watchlists.editWatchlistDescription')}
            </DialogDescription>
          </DialogHeader>
          {editingWatchlist && (
            <WatchlistForm
              defaultValues={editingWatchlist}
              onSubmit={onEditWatchlist}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Symbol Dialog */}
      <Dialog open={addSymbolOpen} onOpenChange={onAddSymbolOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('watchlists.addSymbolTitle')}</DialogTitle>
            <DialogDescription>
              {t('watchlists.addSymbolDescription')}
            </DialogDescription>
          </DialogHeader>
          <SymbolForm onSubmit={onAddSymbol} isPending={isPendingAddSymbol} />
        </DialogContent>
      </Dialog>

      {/* Delete Watchlist Dialog */}
      <Dialog open={deleteWatchlistOpen} onOpenChange={onDeleteWatchlistOpenChange}>
        <DeleteWatchlistDialog
          onCancel={onCancelDelete}
          onConfirm={onConfirmDelete}
        />
      </Dialog>
    </>
  );
};

export default WatchlistDialogs;
