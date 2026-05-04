import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, type Locale } from 'date-fns';
import { enUS, fr, es } from 'date-fns/locale';
import {
  Edit3,
  MessageSquare,
  MoreHorizontal,
  Plus,
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
  useCoachThreads,
  useCreateCoachThread,
  useRenameCoachThread,
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

  // Per-thread interaction state — kept local to avoid lifting it into the
  // page (the parent doesn't care which row is being renamed).
  const [renameTarget, setRenameTarget] = useState<CoachThread | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<CoachThread | null>(null);

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

  return (
    <aside
      aria-label={t('aiCoach.threads.sidebar.title', 'Conversations')}
      className={cn('flex h-full min-h-0 flex-col', className)}
    >
      {/* Header — title + new conversation button. The button is the page's
          single most important action in this rail, so it's always visible. */}
      <header className="flex items-center justify-between border-b border-border/40 px-3 py-2.5 flex-shrink-0">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('aiCoach.threads.sidebar.title', 'Conversations')}
        </h2>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleCreate}
          disabled={createMutation.isPending}
          className="h-7 gap-1.5 text-xs"
          aria-label={t('aiCoach.threads.sidebar.new', 'New conversation')}
          title={t('aiCoach.threads.sidebar.new', 'New conversation')}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {t('aiCoach.threads.sidebar.new', 'New conversation')}
          </span>
        </Button>
      </header>

      {/* Body — list of threads or one of three states (loading / empty / error) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-1">
        {isLoading && (
          <div className="space-y-1.5" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <div className="px-3 py-6 text-center text-xs text-destructive">
            {t('aiCoach.threads.errors.list', 'Failed to load conversations.')}
          </div>
        )}

        {!isLoading && !isError && threads && threads.length === 0 && (
          <div className="px-3 py-8 text-center space-y-3">
            <p className="text-xs text-muted-foreground">
              {t('aiCoach.threads.sidebar.empty', 'No conversations yet. Start one!')}
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('aiCoach.threads.sidebar.new', 'New conversation')}
            </Button>
          </div>
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
          />
        ))}
      </div>

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

      {/* Archive confirmation — destructive variant per the design rules,
          AlertDialog instead of Dialog because the action is non-reversible
          from the user's point of view (archived threads are hidden but kept). */}
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
                'Archived conversations are hidden from your sidebar but not deleted.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleArchive()}
              className={cn(buttonVariants({ variant: 'destructive' }))}
            >
              {t('aiCoach.threads.archiveConfirm.confirm', 'Archive')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
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
}

const ThreadRow: React.FC<ThreadRowProps> = ({
  thread,
  selected,
  dateLocale,
  onSelect,
  onRename,
  onArchive,
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

  return (
    <div
      className={cn(
        'group relative flex items-start gap-2 rounded-lg px-2.5 py-2 transition-colors',
        selected
          ? 'bg-primary/10 ring-1 ring-primary/30'
          : 'hover:bg-muted/40',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? 'true' : undefined}
        className="flex-1 min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md"
      >
        <div className="flex items-center gap-2">
          <MessageSquare
            className={cn(
              'h-3.5 w-3.5 shrink-0',
              selected ? 'text-primary' : 'text-muted-foreground',
            )}
            aria-hidden="true"
          />
          <span
            className={cn(
              'truncate text-xs font-semibold',
              selected ? 'text-foreground' : 'text-foreground/90',
            )}
            title={title}
          >
            {title}
          </span>
        </div>
        <p
          className={cn(
            'mt-0.5 truncate text-[11px]',
            thread.lastMessagePreview
              ? 'text-muted-foreground'
              : 'italic text-muted-foreground/60',
          )}
          title={thread.lastMessagePreview ?? undefined}
        >
          {preview}
        </p>
        {relative && (
          <p className="mt-0.5 text-[10px] text-muted-foreground/70 tabular-nums">
            {relative}
          </p>
        )}
      </button>

      {/* Per-row menu — appears on hover (desktop) and on focus / always-on
          (mobile). The button stays focusable so keyboard users can reach
          rename/archive without depending on hover state. */}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              'h-6 w-6 shrink-0 text-muted-foreground/70 hover:text-foreground',
              'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
              'data-[state=open]:opacity-100',
            )}
            aria-label={t('aiCoach.threads.actions.more', 'More actions')}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
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
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            {t('aiCoach.threads.actions.archive', 'Archive')}
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
