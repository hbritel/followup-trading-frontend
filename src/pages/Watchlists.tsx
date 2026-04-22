
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, AlertCircle, Loader2, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import UsageLimitIndicator from '@/components/subscription/UsageLimitIndicator';

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
  useCreateAlertFromItem,
} from '@/hooks/useWatchlists';

import type { WatchlistResponseDto } from '@/types/dto';

const WATCHLIST_LIMITS: Record<string, number> = { FREE: 1, STARTER: 3, PRO: 10, ELITE: 2147483647, TEAM: 2147483647 };

const Watchlists = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { currentPlan } = useFeatureFlags();
  const maxWatchlists = WATCHLIST_LIMITS[currentPlan] ?? 1;

  // API hooks
  const { data: watchlists = [], isLoading, isError, refetch } = useWatchlists();
  const createMutation = useCreateWatchlist();
  const updateMutation = useUpdateWatchlist();
  const deleteMutation = useDeleteWatchlist();
  const addItemMutation = useAddWatchlistItem();
  const removeItemMutation = useRemoveWatchlistItem();
  const createAlertMutation = useCreateAlertFromItem();

  // Local UI state
  const [activeWatchlist, setActiveWatchlist] = useState<string>('');
  const [editingWatchlist, setEditingWatchlist] = useState<{ id: string; name: string; description: string; icon: string } | null>(null);
  const [watchlistToDelete, setWatchlistToDelete] = useState<string | null>(null);

  // Dialog open states
  const [openNewWatchlistDialog, setOpenNewWatchlistDialog] = useState(false);
  const [openEditWatchlistDialog, setOpenEditWatchlistDialog] = useState(false);
  const [openAddSymbolDialog, setOpenAddSymbolDialog] = useState(false);
  const [openDeleteWatchlistDialog, setOpenDeleteWatchlistDialog] = useState(false);

  // Resolve active watchlist: use selected or fall back to first non-suspended watchlist
  const firstNonSuspendedId = watchlists.find((w) => !w.suspendedByPlan)?.id ?? (watchlists.length > 0 ? watchlists[0].id : '');
  const effectiveActiveId = activeWatchlist || firstNonSuspendedId;

  const activeWatchlistData = watchlists.find(
    (watchlist) => watchlist.id === effectiveActiveId
  );

  const activeItems = activeWatchlistData?.items ?? [];

  const handleCreateWatchlist = (data: WatchlistFormValues) => {
    setOpenNewWatchlistDialog(false);
    createMutation.mutate(
      { name: data.name, description: data.description || null, icon: data.icon || null },
      {
        onSuccess: (created) => {
          setActiveWatchlist(created.id);
          toast({
            title: t('watchlists.watchlistCreated'),
            description: t('watchlists.watchlistHasBeenCreated', { name: data.name }),
          });
        },
        onError: (err) => {
          const isDuplicate = err instanceof AxiosError && err.response?.status === 409;
          toast({
            title: t('common.error'),
            description: isDuplicate
              ? t('watchlists.errorDuplicateName', { name: data.name })
              : t('watchlists.errorCreating'),
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleEditWatchlist = (data: WatchlistFormValues) => {
    if (!editingWatchlist) return;

    setOpenEditWatchlistDialog(false);
    setEditingWatchlist(null);
    updateMutation.mutate(
      { id: editingWatchlist.id, data: { name: data.name, description: data.description || null, icon: data.icon || null } },
      {
        onSuccess: () => {
          toast({
            title: t('watchlists.watchlistUpdated'),
            description: t('watchlists.watchlistHasBeenUpdated', { name: data.name }),
          });
        },
        onError: () => {
          toast({ title: t('common.error'), description: t('watchlists.errorUpdating'), variant: 'destructive' });
        },
      }
    );
  };

  const handleDeleteWatchlist = () => {
    if (!watchlistToDelete) return;

    const idToDelete = watchlistToDelete;
    setOpenDeleteWatchlistDialog(false);
    setWatchlistToDelete(null);

    if (effectiveActiveId === idToDelete) {
      const remaining = watchlists.filter((w) => w.id !== idToDelete);
      setActiveWatchlist(remaining.length > 0 ? remaining[0].id : '');
    }

    deleteMutation.mutate(idToDelete, {
      onSuccess: () => {
        toast({
          title: t('watchlists.watchlistDeleted'),
          description: t('watchlists.watchlistHasBeenRemoved'),
        });
      },
      onError: () => {
        toast({ title: t('common.error'), description: t('watchlists.errorDeleting'), variant: 'destructive' });
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
          alertCondition: data.alertPrice ? (data.alertCondition as 'ABOVE' | 'BELOW' | 'CROSSES') || 'CROSSES' : null,
          alertName: data.alertPrice ? (data.alertName || null) : null,
          notifyEmail: data.alertPrice ? data.notifyEmail : null,
          notifyPush: data.alertPrice ? data.notifyPush : null,
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
        onError: () => {
          toast({ title: t('common.error'), description: t('watchlists.errorAddingSymbol'), variant: 'destructive' });
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
            description: t('watchlists.symbolHasBeenRemoved'),
          });
        },
        onError: () => {
          toast({ title: t('common.error'), description: t('watchlists.errorRemovingSymbol'), variant: 'destructive' });
        },
      }
    );
  };

  const handleCreateAlertFromItem = (itemId: string) => {
    if (!effectiveActiveId) return;

    createAlertMutation.mutate(
      { watchlistId: effectiveActiveId, itemId },
      {
        onSuccess: () => {
          toast({
            title: t('watchlists.alertCreated'),
            description: t('watchlists.alertCreatedFromWatchlist'),
          });
        },
        onError: () => {
          toast({ title: t('common.error'), description: t('watchlists.errorCreatingAlert'), variant: 'destructive' });
        },
      }
    );
  };

  const openEditDialog = (watchlist: WatchlistResponseDto) => {
    setEditingWatchlist({
      id: watchlist.id,
      name: watchlist.name,
      description: watchlist.description || '',
      icon: watchlist.icon || '',
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
            <Skeleton className="h-64 lg:col-span-1 rounded-2xl" />
            <Skeleton className="h-96 lg:col-span-3 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout pageTitle={t('pages.watchlists')}>
        <Card className="glass-card rounded-2xl">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div>
              <p className="font-medium">{t('common.errorLoading')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('common.tryAgain')}</p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle={t('pages.watchlists')}>
      <PageTransition className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('watchlists.title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('watchlists.description')}</p>
          </div>
          <div className="flex items-center gap-3">
            <UsageLimitIndicator
              used={watchlists.length}
              max={maxWatchlists}
              label={t('watchlists.watchlistsUsed', 'Watchlists')}
              showBar
            />
            <Button
              onClick={() => setOpenNewWatchlistDialog(true)}
              disabled={watchlists.length >= maxWatchlists}
              className="gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              {t('watchlists.newWatchlist')}
            </Button>
          </div>
        </div>

        {watchlists.length === 0 ? (
          <Card className="glass-card rounded-2xl">
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <PlusCircle className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{t('watchlists.emptyTitle')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('watchlists.emptyDesc')}</p>
              </div>
              <Button onClick={() => setOpenNewWatchlistDialog(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                {t('watchlists.newWatchlist')}
              </Button>
            </CardContent>
          </Card>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <WatchlistsSidebar
            watchlists={watchlists}
            activeWatchlist={effectiveActiveId}
            onSelectWatchlist={setActiveWatchlist}
            onAddWatchlist={() => setOpenNewWatchlistDialog(true)}
            onEditWatchlist={openEditDialog}
            onDeleteWatchlist={openDeleteDialog}
          />

          <div className="relative lg:col-span-3">
            <WatchlistContent
              title={activeWatchlistData?.name || t('watchlists.title')}
              description={activeWatchlistData?.description || t('watchlists.description')}
              items={activeItems}
              onEditClick={() => {
                if (activeWatchlistData) {
                  openEditDialog(activeWatchlistData);
                }
              }}
              onAddSymbolClick={() => setOpenAddSymbolDialog(true)}
              onRemoveItem={handleRemoveItem}
              onCreateAlert={handleCreateAlertFromItem}
              isAdding={addItemMutation.isPending}
              isCreatingAlert={createAlertMutation.isPending}
            />
            {activeWatchlistData?.suspendedByPlan && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2 text-center px-4">
                  <Lock className="h-5 w-5 text-amber-400" />
                  <p className="text-sm font-medium text-amber-400">{t('watchlists.suspendedTitle', 'Watchlist suspended')}</p>
                  <p className="text-xs text-muted-foreground">{t('watchlists.suspendedDesc', 'Upgrade your plan to access this watchlist')}</p>
                  <Link to="/pricing">
                    <Button variant="outline" size="sm">{t('subscription.viewPlans', 'View plans')}</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
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
        isPendingAddSymbol={addItemMutation.isPending}
      />
    </DashboardLayout>
  );
};

export default Watchlists;
