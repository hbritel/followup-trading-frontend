import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users2,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  Loader2,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  useMentorCohorts,
  useCreateCohort,
  useUpdateCohort,
  useDeleteCohort,
} from '@/hooks/useMentor';
import ErrorState from '@/components/ui/ErrorState';
import type { MentorCohortDto } from '@/types/dto';

const MAX_NAME = 100;
const MAX_DESC = 500;
const DEFAULT_COLOR = '#6366f1';

interface CohortFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cohort?: MentorCohortDto;
}

const CohortFormDialog: React.FC<CohortFormDialogProps> = ({
  open,
  onOpenChange,
  cohort,
}) => {
  const { t } = useTranslation();
  const createMutation = useCreateCohort();
  const updateMutation = useUpdateCohort();
  const isEdit = !!cohort;

  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      setName(cohort?.name ?? '');
      setColor(cohort?.color ?? DEFAULT_COLOR);
      setDescription(cohort?.description ?? '');
    }
  }, [open, cohort]);

  const canSubmit =
    name.trim().length > 0 &&
    name.length <= MAX_NAME &&
    description.length <= MAX_DESC;

  const pending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const payload = {
      name: name.trim(),
      color: color || undefined,
      description: description.trim() || undefined,
    };
    if (isEdit && cohort) {
      updateMutation.mutate(
        { id: cohort.id, data: payload },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t('mentor.cohorts.editTitle', 'Edit cohort')
              : t('mentor.cohorts.createTitle', 'New cohort')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'mentor.cohorts.formDesc',
              'Group students so you can filter and mentor in batches.'
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cohort-name">
              {t('mentor.cohorts.nameLabel', 'Name')}
            </Label>
            <Input
              id="cohort-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_NAME}
              required
              placeholder={t(
                'mentor.cohorts.namePlaceholder',
                'e.g. September batch'
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cohort-color">
              {t('mentor.cohorts.colorLabel', 'Color')}
            </Label>
            <div className="flex gap-2">
              <Input
                id="cohort-color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#6366f1"
                className="flex-1"
              />
              <div
                className="w-10 h-10 rounded-lg border border-border/50 shrink-0"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cohort-desc">
              {t('mentor.cohorts.descLabel', 'Description')}
            </Label>
            <Textarea
              id="cohort-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={MAX_DESC}
              rows={3}
              placeholder={t(
                'mentor.cohorts.descPlaceholder',
                'Optional — what is this cohort about?'
              )}
            />
            <p className="text-[11px] text-muted-foreground text-right tabular-nums">
              {description.length}/{MAX_DESC}
            </p>
          </div>

          {(createMutation.isError || updateMutation.isError) && (
            <ErrorState
              title={t('mentor.cohorts.error.title', 'Could not save cohort')}
              description={t(
                'mentor.cohorts.error.desc',
                'Your form is still here — retry or copy your changes before closing.'
              )}
              error={createMutation.error ?? updateMutation.error}
              onRetry={() => handleSubmit(new Event('submit') as unknown as React.FormEvent)}
              isRetrying={pending}
            />
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={!canSubmit || pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit
                ? t('common.save', 'Save')
                : t('mentor.cohorts.createButton', 'Create cohort')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const CohortRow: React.FC<{ cohort: MentorCohortDto }> = ({ cohort }) => {
  const { t } = useTranslation();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteMutation = useDeleteCohort();

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card/30 px-3 py-2.5 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: cohort.color ?? DEFAULT_COLOR }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{cohort.name}</p>
            {cohort.description && (
              <p className="text-xs text-muted-foreground truncate">
                {cohort.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs tabular-nums text-muted-foreground">
            {t('mentor.cohorts.memberCount', '{{n}} members', {
              n: cohort.memberCount,
            })}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground"
                aria-label={t('mentor.rowActions', 'Row actions')}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => setEditOpen(true)}
                className="gap-2"
              >
                <Pencil className="w-4 h-4" />
                {t('common.edit', 'Edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setDeleteOpen(true)}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                {t('common.delete', 'Delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CohortFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        cohort={cohort}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('mentor.cohorts.deleteTitle', 'Delete this cohort?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'mentor.cohorts.deleteDesc',
                'Members will remain in your space. Only the cohort grouping is removed.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteMutation.mutate(cohort.id, {
                  onSuccess: () => setDeleteOpen(false),
                })
              }
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const CohortsSection: React.FC = () => {
  const { t } = useTranslation();
  const { data: cohorts, isLoading } = useMentorCohorts();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const items = cohorts ?? [];

  return (
    <section aria-labelledby="cohorts-heading" className="glass-card rounded-2xl p-5">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CollapsibleTrigger
            className="flex items-center gap-2 text-left"
            aria-label={t('mentor.cohorts.toggle', 'Toggle cohorts')}
          >
            <Users2 className="w-4 h-4 text-primary" aria-hidden="true" />
            <h2 id="cohorts-heading" className="text-base font-semibold">
              {t('mentor.cohorts.title', 'Cohorts')}
            </h2>
            <span className="text-xs text-muted-foreground">({items.length})</span>
            <ChevronDown
              className={[
                'w-4 h-4 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none',
                open ? 'rotate-180' : '',
              ].join(' ')}
              aria-hidden="true"
            />
          </CollapsibleTrigger>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {t('mentor.cohorts.newButton', 'New cohort')}
          </Button>
        </div>

        <CollapsibleContent className="mt-4 space-y-2">
          {isLoading ? (
            <div
              className="h-16 rounded-xl bg-muted/20 animate-pulse"
              aria-busy="true"
            />
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t(
                'mentor.cohorts.empty',
                'No cohorts yet. Group students to filter and message in batches.'
              )}
            </p>
          ) : (
            items.map((c) => <CohortRow key={c.id} cohort={c} />)
          )}
        </CollapsibleContent>
      </Collapsible>

      <CohortFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </section>
  );
};

export default CohortsSection;
