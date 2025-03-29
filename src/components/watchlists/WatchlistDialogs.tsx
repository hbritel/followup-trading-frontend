
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import WatchlistForm, { WatchlistFormValues } from './WatchlistForm';
import SymbolForm, { SymbolFormValues } from './SymbolForm';
import DeleteWatchlistDialog from './DeleteWatchlistDialog';

interface WatchlistDialogsProps {
  newWatchlistOpen: boolean;
  editWatchlistOpen: boolean;
  addSymbolOpen: boolean;
  deleteWatchlistOpen: boolean;
  editingWatchlist: { id: number; name: string; description: string } | null;
  onNewWatchlistOpenChange: (open: boolean) => void;
  onEditWatchlistOpenChange: (open: boolean) => void;
  onAddSymbolOpenChange: (open: boolean) => void;
  onDeleteWatchlistOpenChange: (open: boolean) => void;
  onCreateWatchlist: (data: WatchlistFormValues) => void;
  onEditWatchlist: (data: WatchlistFormValues) => void;
  onAddSymbol: (data: SymbolFormValues) => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
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
  onConfirmDelete
}) => {
  return (
    <>
      {/* New Watchlist Dialog */}
      <Dialog open={newWatchlistOpen} onOpenChange={onNewWatchlistOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Watchlist</DialogTitle>
            <DialogDescription>
              Add a new watchlist to organize your securities
            </DialogDescription>
          </DialogHeader>
          <WatchlistForm onSubmit={onCreateWatchlist} />
        </DialogContent>
      </Dialog>
      
      {/* Edit Watchlist Dialog */}
      <Dialog open={editWatchlistOpen} onOpenChange={onEditWatchlistOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Watchlist</DialogTitle>
            <DialogDescription>
              Update your watchlist details
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
            <DialogTitle>Add Stock Symbol</DialogTitle>
            <DialogDescription>
              Add a new security to your watchlist
            </DialogDescription>
          </DialogHeader>
          <SymbolForm onSubmit={onAddSymbol} />
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
