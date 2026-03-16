
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// Import components
import WatchlistsSidebar from '@/components/watchlists/WatchlistsSidebar';
import WatchlistContent from '@/components/watchlists/WatchlistContent';
import WatchlistDialogs from '@/components/watchlists/WatchlistDialogs';
import { WatchlistFormValues } from '@/components/watchlists/WatchlistForm';
import { SymbolFormValues } from '@/components/watchlists/SymbolForm';

// Import hooks
import {
  useWatchlists,
  useCreateWatchlist,
  useUpdateWatchlist,
  useDeleteWatchlist,
  useAddWatchlistItem,
  useRemoveWatchlistItem,
} from '@/hooks/useWatchlists';

import type { WatchlistResponseDto } from '@/types/dto';

const Watchlists = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // API hooks
  const { data: watchlists = [], isLoading } = useWatchlists();
  const createMutation = useCreateWatchlist();
  const updateMutation = useUpdateWatchlist();
  const deleteMutation = useDeleteWatchlist();
  const addItemMutation = useAddWatchlistItem();
  const removeItemMutation = useRemoveWatchlistItem();

  // Local UI state
  const [activeWatchlist, setActiveWatchlist] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingWatchlist, setEditingWatchlist] = useState<{ id: string; name: string; description: string } | null>(null);
  const [watchlistToDelete, setWatchlistToDelete] = useState<string | null>(null);

  // Dialog open states
  const [openNewWatchlistDialog, setOpenNewWatchlistDialog] = useState(false);
  const [openEditWatchlistDialog, setOpenEditWatchlistDialog] = useState(false);
  const [openAddSymbolDialog, setOpenAddSymbolDialog] = useState(false);
  const [openDeleteWatchlistDialog, setOpenDeleteWatchlistDialog] = useState(false);

  // Resolve active watchlist: use selected or fall back to first
  const effectiveActiveId = activeWatchlist || (watchlists.length > 0 ? watchlists[0].id : '');

  const activeWatchlistData = watchlists.find(
    (watchlist) => watchlist.id === effectiveActiveId
  );

  const activeItems = activeWatchlistData?.items ?? [];

  const handleCreateWatchlist = (data: WatchlistFormValues) => {
    createMutation.mutate(
      { name: data.name, description: data.description || null },
      {
        onSuccess: (created) => {
          setActiveWatchlist(created.id);
          setOpenNewWatchlistDialog(false);
          toast({
            title: t('watchlists.watchlistCreated'),
            description: t('watchlists.watchlistHasBeenCreated', { name: data.name }),
          });
        },
      }
    );
  };

  const handleEditWatchlist = (data: WatchlistFormValues) => {
    if (!editingWatchlist) return;

    updateMutation.mutate(
      { id: editingWatchlist.id, data: { name: data.name, description: data.description || null } },
      {
        onSuccess: () => {
          setOpenEditWatchlistDialog(false);
          setEditingWatchlist(null);
          toast({
            title: t('watchlists.watchlistUpdated'),
            description: t('watchlists.watchlistHasBeenUpdated', { name: data.name }),
          });
        },
      }
    );
  };

  const handleDeleteWatchlist = () => {
    if (!watchlistToDelete) return;

    deleteMutation.mutate(watchlistToDelete, {
      onSuccess: () => {
        // If deleting the active watchlist, reset selection
        if (effectiveActiveId === watchlistToDelete) {
          const remaining = watchlists.filter((w) => w.id !== watchlistToDelete);
          setActiveWatchlist(remaining.length > 0 ? remaining[0].id : '');
        }

        setOpenDeleteWatchlistDialog(false);
        setWatchlistToDelete(null);
        toast({
          title: t('watchlists.watchlistDeleted'),
          description: t('watchlists.watchlistHasBeenRemoved'),
        });
      },
    });
  };

  const handleAddSymbol = (data: SymbolFormValues) => {
    if (!effectiveActiveId) return;

    addItemMutation.mutate(
      {
        watchlistId: effectiveActiveId,
        data: {
          symbol: data.symbol.toUpperCase(),
          notes: data.notes || null,
          alertPrice: data.alertPrice ? Number.parseFloat(data.alertPrice) : null,
        },
      },
      {
        onSuccess: () => {
          setOpenAddSymbolDialog(false);
          toast({
            title: t('watchlists.symbolAdded'),
            description: t('watchlists.symbolHasBeenAdded', { symbol: data.symbol.toUpperCase() }),
          });
        },
      }
    );
  };

  const handleRemoveItem = (itemId: string) => {
    if (!effectiveActiveId) return;

    removeItemMutation.mutate(
      { watchlistId: effectiveActiveId, itemId },
      {
        onSuccess: () => {
          toast({
            title: t('watchlists.symbolRemoved'),
            description: t('watchlists.symbolHasBeenRemoved', { symbol: '' }),
          });
        },
      }
    );
  };

  const openEditDialog = (watchlist: WatchlistResponseDto) => {
    setEditingWatchlist({
      id: watchlist.id,
      name: watchlist.name,
      description: watchlist.description || '',
    });
    setOpenEditWatchlistDialog(true);
  };

  const openDeleteDialog = (id: string) => {
    setWatchlistToDelete(id);
    setOpenDeleteWatchlistDialog(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout pageTitle={t('pages.watchlists')}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72 mt-2" />
            </div>
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Skeleton className="h-64 lg:col-span-1" />
            <Skeleton className="h-96 lg:col-span-3" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle={t('pages.watchlists')}>
      <PageTransition className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('watchlists.title')}</h1>
            <p className="text-muted-foreground">{t('watchlists.description')}</p>
          </div>
          <Button onClick={() => setOpenNewWatchlistDialog(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {t('watchlists.newWatchlist')}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <WatchlistsSidebar
            watchlists={watchlists}
            activeWatchlist={effectiveActiveId}
            onSelectWatchlist={setActiveWatchlist}
            onAddWatchlist={() => setOpenNewWatchlistDialog(true)}
            onEditWatchlist={openEditDialog}
            onDeleteWatchlist={openDeleteDialog}
          />

          <WatchlistContent
            title={activeWatchlistData?.name || t('watchlists.title')}
            description={activeWatchlistData?.description || t('watchlists.description')}
            items={activeItems}
            searchQuery={searchQuery}
            onEditClick={() => {
              if (activeWatchlistData) {
                openEditDialog(activeWatchlistData);
              }
            }}
            onAddSymbolClick={() => setOpenAddSymbolDialog(true)}
            onSearchChange={setSearchQuery}
            onRemoveItem={handleRemoveItem}
          />
        </div>
      </PageTransition>

      <WatchlistDialogs
        newWatchlistOpen={openNewWatchlistDialog}
        editWatchlistOpen={openEditWatchlistDialog}
        addSymbolOpen={openAddSymbolDialog}
        deleteWatchlistOpen={openDeleteWatchlistDialog}
        editingWatchlist={editingWatchlist}
        onNewWatchlistOpenChange={setOpenNewWatchlistDialog}
        onEditWatchlistOpenChange={setOpenEditWatchlistDialog}
        onAddSymbolOpenChange={setOpenAddSymbolDialog}
        onDeleteWatchlistOpenChange={setOpenDeleteWatchlistDialog}
        onCreateWatchlist={handleCreateWatchlist}
        onEditWatchlist={handleEditWatchlist}
        onAddSymbol={handleAddSymbol}
        onCancelDelete={() => setOpenDeleteWatchlistDialog(false)}
        onConfirmDelete={handleDeleteWatchlist}
      />
    </DashboardLayout>
  );
};

export default Watchlists;
