import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useStrategies, useCreateStrategy, useUpdateStrategy, useDeleteStrategy } from '@/hooks/useStrategies';
import StrategyDialog from './StrategyDialog';
import { useToast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/services/apiClient';
import type { StrategyResponseDto, StrategyRequestDto } from '@/types/dto';

const StrategiesSection: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: strategies, isLoading } = useStrategies();
  const createMutation = useCreateStrategy();
  const updateMutation = useUpdateStrategy();
  const deleteMutation = useDeleteStrategy();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<StrategyResponseDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StrategyResponseDto | null>(null);

  const handleCreate = () => {
    setEditingStrategy(null);
    setDialogOpen(true);
  };

  const handleEdit = (strategy: StrategyResponseDto) => {
    setEditingStrategy(strategy);
    setDialogOpen(true);
  };

  const handleSave = async (data: StrategyRequestDto) => {
    try {
      if (editingStrategy) {
        await updateMutation.mutateAsync({ id: editingStrategy.id, data });
        toast({ title: t('settings.strategyUpdated', 'Strategy updated') });
      } else {
        await createMutation.mutateAsync(data);
        toast({ title: t('settings.strategyCreated', 'Strategy created') });
      }
      setDialogOpen(false);
    } catch (error) {
      toast({ title: getApiErrorMessage(error), variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast({ title: t('settings.strategyDeleted', 'Strategy deleted') });
      setDeleteTarget(null);
    } catch (error) {
      toast({ title: getApiErrorMessage(error), variant: 'destructive' });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('settings.strategies', 'Strategies')}</CardTitle>
              <CardDescription>
                {t('settings.strategiesDescription', 'View and manage your trading strategies')}
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('settings.addStrategy', 'Add Strategy')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !strategies || strategies.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('settings.noStrategies', 'No strategies yet. Create one to get started.')}
            </p>
          ) : (
            <div className="space-y-3">
              {strategies.map((strategy) => (
                <div
                  key={strategy.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium">{strategy.name}</p>
                      {strategy.description && (
                        <p className="text-xs text-muted-foreground">{strategy.description}</p>
                      )}
                    </div>
                    <Badge variant={strategy.active ? 'default' : 'secondary'}>
                      {strategy.active ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(strategy)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(strategy)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <StrategyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        strategy={editingStrategy}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.deleteStrategy', 'Delete Strategy')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.deleteStrategyConfirm', 'Are you sure you want to delete "{{name}}"? This cannot be undone.', { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StrategiesSection;
