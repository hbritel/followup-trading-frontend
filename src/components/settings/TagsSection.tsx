import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/hooks/useTags';
import TagDialog from './TagDialog';
import { useToast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/services/apiClient';
import type { TagResponseDto, TagRequestDto } from '@/types/dto';
import UsageLimitIndicator from '@/components/subscription/UsageLimitIndicator';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import { useSubscription } from '@/hooks/useSubscription';

const TagsSection: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: tags, isLoading } = useTags();
  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();
  const { currentPlan } = useFeatureFlags();
  const { data: subscription } = useSubscription();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagResponseDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TagResponseDto | null>(null);

  const tagsUsed = tags?.length ?? 0;
  const tagsMax = subscription?.usage?.tagsMax ?? (currentPlan === 'FREE' ? 5 : currentPlan === 'STARTER' ? 20 : -1);
  const isUnlimited = tagsMax < 0 || tagsMax >= 2147483647;
  const atTagLimit = !isUnlimited && tagsUsed >= tagsMax;

  const handleCreate = () => {
    setEditingTag(null);
    setDialogOpen(true);
  };

  const handleEdit = (tag: TagResponseDto) => {
    setEditingTag(tag);
    setDialogOpen(true);
  };

  const handleSave = async (data: TagRequestDto) => {
    try {
      if (editingTag) {
        await updateMutation.mutateAsync({ id: editingTag.id, data });
        toast({ title: t('settings.tagUpdated', 'Tag updated') });
      } else {
        await createMutation.mutateAsync(data);
        toast({ title: t('settings.tagCreated', 'Tag created') });
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
      toast({ title: t('settings.tagDeleted', 'Tag deleted') });
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
              <CardTitle>{t('settings.tags', 'Tags')}</CardTitle>
              <CardDescription>
                {t('settings.tagsDescription', 'Create and manage tags to categorize your trades')}
              </CardDescription>
              {!isUnlimited && (
                <div className="mt-2">
                  <UsageLimitIndicator
                    used={tagsUsed}
                    max={tagsMax}
                    label={t('settings.tagsUsage', 'Tags used')}
                    showBar
                  />
                </div>
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button size="sm" onClick={handleCreate} disabled={atTagLimit}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('settings.addTag', 'Add Tag')}
                    </Button>
                  </span>
                </TooltipTrigger>
                {atTagLimit && (
                  <TooltipContent>
                    <p>{t('settings.tagsLimitReached', 'Tag limit reached. Upgrade your plan to create more tags.')}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !tags || tags.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('settings.noTags', 'No tags yet. Create one to categorize your trades.')}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 p-2 px-3 rounded-lg border group"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm">{tag.name}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(tag)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteTarget(tag)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TagDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tag={editingTag}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.deleteTag', 'Delete Tag')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.deleteTagConfirm', 'Are you sure you want to delete "{{name}}"? This cannot be undone.', { name: deleteTarget?.name })}
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

export default TagsSection;
