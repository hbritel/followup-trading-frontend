import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, type Locale } from 'date-fns';
import { enUS, fr, es } from 'date-fns/locale';
import {
  Archive as ArchiveIcon,
  Edit3,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
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
  useArchiveCoachThread,
  useArchivedCoachThreads,
  useCoachThreads,
  useCreateCoachThread,
  useDeleteCoachThreadPermanently,
  useRenameCoachThread,
  useRestoreCoachThread,
} from '@/hooks/useCoachThreads';
import type { CoachThread } from '@/types/coachThread';

const TITLE_MAX_LEN = 120;

interface ThreadSidebarProps {
  /**
   * The selected thread id, or {@code null} for the user's "current" thread.
   * The sidebar highlights the matching row; passing null keeps every row
   * un-selected, which is the legacy behaviour before multi-thread.
   */
  selectedThreadId: string | null;
  /**
   * Called when the user picks a thread (click on the row, or auto-select
   * after creating a new conversation). Pass {@code null} to drop back to
   * the legacy current-thread mode.
   */
  onSelectThread: (id: string | null) => void;
  className?: string;
}

/**
 * Left rail of the AI Coach page — shows the user's active threads and lets
 * them create / pick / rename / archive. The component owns its own UI state
 * (rename dialog, archive confirm) but delegates persistence to the
 * {@link useCoachThreads} family of hooks.
 *
 * Mounted both on desktop (always-visible rail) and on mobile (inside a
 * Sheet); the layout is identical, so the host page just controls visibility.
 */
const ThreadSidebar: React.FC<ThreadSidebarProps> = ({
  selectedThreadId,
  onSelectThread,
  className,
}) => {
  const { t, i18n } = useTranslation();
  const { data: threads, isLoading, isError } = useCoachThreads();
  const createMutation = useCreateCoachThread();
  const renameMutation = useRenameCoachThread();
  const archiveMutation = useArchiveCoachThread();
  const restoreMutation = useRestoreCoachThread();
  const deleteMutation = useDeleteCoachThreadPermanently();

  // Per-thread interaction state — kept local to avoid lifting it into the
  // page (the parent doesn't care which row is being renamed).
  const [renameTarget, setRenameTarget] = useState<CoachThread | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<CoachThread | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CoachThread | null>(null);
  const [archivedDialogOpen, setArchivedDialogOpen] = useState(false);
  const archivedQuery = useArchivedCoachThreads(archivedDialogOpen);

  const dateLocale = useMemo<Locale>(() => {
    if (i18n.language.startsWith('fr')) return fr;
    if (i18n.language.startsWith('es')) return es;
    return enUS;
  }, [i18n.language]);

  const handleCreate = useCallback(async () => {
    try {
      const created = await createMutation.mutateAsync(undefined);
      onSelectThread(created.id);
    } catch {
      toast.error(t('aiCoach.threads.errors.create', 'Failed to create conversation.'));
    }
  }, [createMutation, onSelectThread, t]);

  const handleArchive = useCallback(async () => {
    if (!archiveTarget) return;
    const target = archiveTarget;
    setArchiveTarget(null);
    try {
      await archiveMutation.mutateAsync(target.id);
      // If the archived thread was the selected one, drop back to the
      // current-thread default so the user isn't left staring at empty state.
      if (selectedThreadId === target.id) {
        onSelectThread(null);
      }
    } catch {
      toast.error(t('aiCoach.threads.errors.archive', 'Failed to archive conversation.'));
    }
  }, [archiveMutation, archiveTarget, onSelectThread, selectedThreadId, t]);

  const handleDeletePermanent = useCallback(async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteMutation.mutateAsync(target.id);
      if (selectedThreadId === target.id) {
        onSelectThread(null);
      }
    } catch {
      toast.error(t('aiCoach.threads.errors.delete', 'Failed to delete conversation.'));
    }
  }, [deleteMutation, deleteTarget, onSelectThread, selectedThreadId, t]);

  const handleRestore = useCallback(
    async (id: string) => {
      try {
        await restoreMutation.mutateAsync(id);
      } catch {
        toast.error(t('aiCoach.threads.errors.restore', 'Failed to restore conversation.'));
      }
    },
    [restoreMutation, t],
  );

  return (
    <aside
      aria-label={t('aiCoach.threads.sidebar.title', 'Conversations')}
      className={cn('flex h-full min-h-0 flex-col', className)}
    >
      {/* Header — title row, then a full-width "new conversation" button.
          Two stacked rows keep both labels readable even at the narrowest
          inline sidebar width (260px on xl) where an inline button used
          to overflow the rail. */}
      <header className="flex flex-col gap-2 border-b border-border/40 px-3 py-2.5 flex-shrink-0">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('aiCoach.threads.sidebar.title', 'Conversations')}
        </h2>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCreate}
          disabled={createMutation.isPending}
          className="h-8 w-full justify-start gap-2 text-xs"
          aria-label={t('aiCoach.threads.sidebar.new', 'New conversation')}
        >
          <Plus className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {t('aiCoach.threads.sidebar.new', 'New conversation')}
          </span>
        </Button>
      </header>

      {/* Body — list of threads or one of three states (loading / empty / error) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-1">
        {isLoading && (
          <div className="space-y-1" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <div className="px-3 py-6 text-center text-xs text-destructive">
            {t('aiCoach.threads.errors.list', 'Failed to load conversations.')}
          </div>
        )}

        {!isLoading && !isError && threads && threads.length === 0 && (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">
            {t('aiCoach.threads.sidebar.empty', 'No conversations yet. Start one!')}
          </p>
        )}

        {!isLoading && !isError && threads?.map((thread) => (
          <ThreadRow
            key={thread.id}
            thread={thread}
            selected={thread.id === selectedThreadId}
            dateLocale={dateLocale}
            onSelect={() => onSelectThread(thread.id)}
            onRename={() => setRenameTarget(thread)}
            onArchive={() => setArchiveTarget(thread)}
            onDelete={() => setDeleteTarget(thread)}
          />
        ))}
      </div>

      {/* Footer — entry point to the archived list. Hidden when the user has
          never archived anything to keep the sidebar tight. */}
      <footer className="border-t border-border/40 px-3 py-2 flex-shrink-0">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setArchivedDialogOpen(true)}
          className="h-7 w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArchiveIcon className="h-3.5 w-3.5" />
          {t('aiCoach.threads.archived.open', 'View archived conversations')}
        </Button>
      </footer>

      {/* Rename dialog — kept centralised here (not per-row) so the input
          element gets re-mounted between targets, avoiding stale state. */}
      <RenameDialog
        target={renameTarget}
        onClose={() => setRenameTarget(null)}
        onConfirm={async (id, title) => {
          try {
            await renameMutation.mutateAsync({ id, title });
            setRenameTarget(null);
          } catch {
            toast.error(t('aiCoach.threads.errors.rename', 'Failed to rename conversation.'));
          }
        }}
        isPending={renameMutation.isPending}
      />

      {/* Archive confirmation — soft hide. Reversible from the archived
          dialog. AlertDialog used (not Dialog) so the action is intentional. */}
      <AlertDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => { if (!open) setArchiveTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('aiCoach.threads.archiveConfirm.title', 'Archive this conversation?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'aiCoach.threads.archiveConfirm.description',
                'Archived conversations are hidden from your sidebar but kept on disk and can be restored at any time.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleArchive()}>
              {t('aiCoach.threads.archiveConfirm.confirm', 'Archive')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent delete — irreversible. Destructive button + extra-warning
          copy because the cascade wipes every message in the thread. */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('aiCoach.threads.deleteConfirm.title', 'Permanently delete this conversation?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'aiCoach.threads.deleteConfirm.description',
                'Every message in this conversation will be permanently removed. This action cannot be undone — prefer Archive if you might want to restore it later.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeletePermanent()}
              className={cn(buttonVariants({ variant: 'destructive' }))}
            >
              {t('aiCoach.threads.deleteConfirm.confirm', 'Delete permanently')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archived list dialog — opened from the sidebar footer. Lazy-fetches
          on open. Each row offers Restore (re-shown in active list) and
          Delete permanently (cascade). */}
      <Dialog
        open={archivedDialogOpen}
        onOpenChange={setArchivedDialogOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t('aiCoach.threads.archived.title', 'Archived conversations')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'aiCoach.threads.archived.description',
                'Restore an archived conversation to make it active again, or delete it permanently to free space.',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-1">
            {archivedQuery.isLoading && (
              <div className="space-y-1.5" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            )}
            {!archivedQuery.isLoading && archivedQuery.isError && (
              <div className="px-3 py-6 text-center text-xs text-destructive">
                {t('aiCoach.threads.errors.list', 'Failed to load conversations.')}
              </div>
            )}
            {!archivedQuery.isLoading
              && !archivedQuery.isError
              && (archivedQuery.data?.length ?? 0) === 0 && (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                {t('aiCoach.threads.archived.empty', 'You have no archived conversations.')}
              </p>
            )}
            {archivedQuery.data?.map((thread) => (
              <ArchivedRow
                key={thread.id}
                thread={thread}
                dateLocale={dateLocale}
                onRestore={() => void handleRestore(thread.id)}
                onDelete={() => setDeleteTarget(thread)}
                isPending={
                  (restoreMutation.isPending && restoreMutation.variables === thread.id)
                  || (deleteMutation.isPending && deleteMutation.variables === thread.id)
                }
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
};

// ---------------------------------------------------------------------------
// Archived list row — slimmer than ThreadRow, two inline action buttons.
// ---------------------------------------------------------------------------

interface ArchivedRowProps {
  thread: CoachThread;
  dateLocale: Locale;
  onRestore: () => void;
  onDelete: () => void;
  isPending: boolean;
}

const ArchivedRow: React.FC<ArchivedRowProps> = ({
  thread,
  dateLocale,
  onRestore,
  onDelete,
  isPending,
}) => {
  const { t } = useTranslation();
  const title = thread.title?.trim() || t('aiCoach.threads.sidebar.untitled', '(untitled)');
  const relative = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(thread.updatedAt), {
        addSuffix: true,
        locale: dateLocale,
      });
    } catch {
      return '';
    }
  }, [thread.updatedAt, dateLocale]);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-card/30 px-3 py-2">
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'truncate text-sm font-medium leading-tight',
            !thread.title?.trim() && 'italic text-muted-foreground',
          )}
          title={title}
        >
          {title}
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground/70 tabular-nums">
          {relative}
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onRestore}
        disabled={isPending}
        className="h-8 gap-1.5 text-xs"
        aria-label={t('aiCoach.threads.actions.restore', 'Restore')}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">
          {t('aiCoach.threads.actions.restore', 'Restore')}
        </span>
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={onDelete}
        disabled={isPending}
        className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
        aria-label={t('aiCoach.threads.actions.delete', 'Delete permanently')}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Single thread row — title + truncated preview + relative time + ⋯ menu.
// ---------------------------------------------------------------------------

interface ThreadRowProps {
  thread: CoachThread;
  selected: boolean;
  dateLocale: Locale;
  onSelect: () => void;
  onRename: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

const ThreadRow: React.FC<ThreadRowProps> = ({
  thread,
  selected,
  dateLocale,
  onSelect,
  onRename,
  onArchive,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const title = thread.title?.trim() || t('aiCoach.threads.sidebar.untitled', '(untitled)');
  const relative = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(thread.updatedAt), {
        addSuffix: true,
        locale: dateLocale,
      });
    } catch {
      return '';
    }
  }, [thread.updatedAt, dateLocale]);

  // Backend may return null when the thread has no messages yet — render a
  // soft placeholder rather than nothing, so the row keeps a stable height.
  const preview = thread.lastMessagePreview?.trim() ||
    t('aiCoach.threads.sidebar.noPreview', 'No messages yet');

  // Two-line dense row: title (line 1, single-line truncate), then a single
  // metadata line (line 2) — preview if present, else relative time. Avoids
  // the previous three-line stack that consumed ~78px per row.
  const hasPreview = Boolean(thread.lastMessagePreview?.trim());
  const metaLine = hasPreview ? preview : relative;

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 rounded-lg pl-3 pr-1 py-1.5 transition-colors',
        selected
          ? 'bg-primary/10'
          : 'hover:bg-muted/40',
      )}
    >
      {/* Left accent bar — only on the active row, mirrors the rail tool launchers */}
      {selected && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary"
        />
      )}
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? 'true' : undefined}
        className="flex-1 min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md"
      >
        <div
          className={cn(
            'truncate text-sm font-medium leading-tight',
            !thread.title?.trim() && 'italic text-muted-foreground',
            selected ? 'text-foreground' : 'text-foreground/90',
          )}
          title={title}
        >
          {title}
        </div>
        <div
          className={cn(
            'mt-0.5 truncate text-xs leading-tight',
            hasPreview
              ? 'text-muted-foreground'
              : 'text-muted-foreground/60 tabular-nums',
          )}
          title={hasPreview ? thread.lastMessagePreview ?? undefined : relative}
        >
          {metaLine}
        </div>
      </button>

      {/* Per-row menu — `…` button is hidden until hover (desktop) or focus
          (keyboard a11y). Always visible on the active row so users can
          act on the current conversation without hunting for it. */}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              'h-7 w-7 shrink-0 text-muted-foreground/70 hover:text-foreground',
              'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
              'data-[state=open]:opacity-100',
              selected && 'opacity-100',
            )}
            aria-label={t('aiCoach.threads.actions.more', 'More actions')}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={() => {
              setMenuOpen(false);
              onRename();
            }}
          >
            <Edit3 className="mr-2 h-3.5 w-3.5" />
            {t('aiCoach.threads.actions.rename', 'Rename')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setMenuOpen(false);
              onArchive();
            }}
          >
            <ArchiveIcon className="mr-2 h-3.5 w-3.5" />
            {t('aiCoach.threads.actions.archive', 'Archive')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setMenuOpen(false);
              onDelete();
            }}
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            {t('aiCoach.threads.actions.delete', 'Delete permanently')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Rename dialog — kept tiny, single input. Submit on Enter, cancel on Esc.
// ---------------------------------------------------------------------------

interface RenameDialogProps {
  target: CoachThread | null;
  onClose: () => void;
  onConfirm: (id: string, title: string) => void;
  isPending: boolean;
}

const RenameDialog: React.FC<RenameDialogProps> = ({
  target,
  onClose,
  onConfirm,
  isPending,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');

  // Sync the input value to the target whenever the dialog is opened on a
  // new thread. Resetting on close is handled by Radix unmounting the input.
  React.useEffect(() => {
    if (target) setTitle(target.title ?? '');
  }, [target]);

  const trimmed = title.trim();
  const valid = trimmed.length > 0 && trimmed.length <= TITLE_MAX_LEN;

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!target || !valid) return;
      onConfirm(target.id, trimmed);
    },
    [onConfirm, target, trimmed, valid],
  );

  return (
    <Dialog open={target !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('aiCoach.threads.rename.title', 'Rename conversation')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('aiCoach.threads.rename.title', 'Rename conversation')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            autoFocus
            value={title}
            maxLength={TITLE_MAX_LEN}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t(
              'aiCoach.threads.rename.placeholder',
              'Title (max 120 characters)',
            )}
            aria-label={t('aiCoach.threads.rename.title', 'Rename conversation')}
            aria-invalid={title.length > 0 && !valid ? 'true' : undefined}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={!valid || isPending}>
              {t('common.save', 'Save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ThreadSidebar;
