import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, Pin, PinOff, Pencil, Trash2, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  useMentorAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
} from '@/hooks/useMentor';
import ErrorState from '@/components/ui/ErrorState';
import type { MentorAnnouncementDto } from '@/types/dto';

const MAX_BODY = 5000;
const AMBER_THRESHOLD = 4500;

const formatRelative = (iso: string): string => {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString();
};

/* ── Character counter ──────────────────────────────── */
const CharCounter: React.FC<{ count: number }> = ({ count }) => {
  const tone =
    count >= MAX_BODY
      ? 'text-destructive'
      : count >= AMBER_THRESHOLD
        ? 'text-amber-500 dark:text-amber-400'
        : 'text-muted-foreground/70';
  return (
    <span className={`text-[11px] tabular-nums ${tone}`}>
      {count}/{MAX_BODY}
    </span>
  );
};

/* ── Compose card ───────────────────────────────────── */
const ComposeCard: React.FC<{ onDone?: () => void }> = ({ onDone }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const createMutation = useCreateAnnouncement();

  const canSubmit = body.trim().length > 0 && body.length <= MAX_BODY;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    createMutation.mutate(
      {
        title: title.trim() || undefined,
        body: body.trim(),
        pinned,
      },
      {
        onSuccess: () => {
          setTitle('');
          setBody('');
          setPinned(false);
          onDone?.();
        },
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card rounded-2xl p-5 space-y-4 border border-border/50"
    >
      <div className="space-y-2">
        <Label htmlFor="announce-title">
          {t('mentor.announcements.titlePlaceholder', 'Title (optional)')}
        </Label>
        <Input
          id="announce-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t(
            'mentor.announcements.titlePlaceholder',
            'Title (optional)'
          )}
          maxLength={200}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="announce-body">
          {t('mentor.announcements.bodyPlaceholder', 'What do you want to share?')}
        </Label>
        <Textarea
          id="announce-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t(
            'mentor.announcements.bodyPlaceholder',
            'What do you want to share?'
          )}
          rows={4}
          maxLength={MAX_BODY}
          required
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={pinned}
              onCheckedChange={(v) => setPinned(!!v)}
              aria-label={t('mentor.announcements.pinLabel', 'Pin to top')}
            />
            <span className="text-sm text-muted-foreground">
              {t('mentor.announcements.pinLabel', 'Pin to top')}
            </span>
          </label>
          <CharCounter count={body.length} />
        </div>
      </div>
      {createMutation.isError && (
        <ErrorState
          title={t('mentor.announcements.error.createTitle', 'Could not post announcement')}
          description={t(
            'mentor.announcements.error.createDesc',
            "Your draft is still here — retry the post or copy the message somewhere safe before refreshing."
          )}
          error={createMutation.error}
          onRetry={() => createMutation.mutate({
            title: title.trim() || undefined,
            body: body.trim(),
            pinned,
          })}
          isRetrying={createMutation.isPending}
        />
      )}

      <div className="flex justify-end gap-2">
        {onDone && (
          <Button type="button" variant="outline" onClick={onDone}>
            {t('common.cancel', 'Cancel')}
          </Button>
        )}
        <Button
          type="submit"
          disabled={!canSubmit || createMutation.isPending}
        >
          {createMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {t('mentor.announcements.postButton', 'Post announcement')}
        </Button>
      </div>
    </form>
  );
};

/* ── Edit inline form ───────────────────────────────── */
const EditForm: React.FC<{
  announcement: MentorAnnouncementDto;
  onCancel: () => void;
}> = ({ announcement, onCancel }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(announcement.title ?? '');
  const [body, setBody] = useState(announcement.body);
  const updateMutation = useUpdateAnnouncement();

  const canSubmit = body.trim().length > 0 && body.length <= MAX_BODY;

  const handleSave = () => {
    if (!canSubmit) return;
    updateMutation.mutate(
      {
        id: announcement.id,
        data: {
          title: title.trim() || undefined,
          body: body.trim(),
        },
      },
      {
        onSuccess: () => onCancel(),
      }
    );
  };

  return (
    <div className="space-y-3">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t(
          'mentor.announcements.titlePlaceholder',
          'Title (optional)'
        )}
        maxLength={200}
        aria-label={t('mentor.announcements.titlePlaceholder', 'Title')}
      />
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={MAX_BODY}
        aria-label={t('mentor.announcements.bodyPlaceholder', 'Body')}
      />
      <div className="flex items-center justify-between">
        <CharCounter count={body.length} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            size="sm"
            disabled={!canSubmit || updateMutation.isPending}
            onClick={handleSave}
          >
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            )}
            {t('common.save', 'Save')}
          </Button>
        </div>
      </div>
      {updateMutation.isError && (
        <ErrorState
          title={t('mentor.announcements.error.updateTitle', 'Could not save changes')}
          description={t(
            'mentor.announcements.error.updateDesc',
            'Your edits are still in this form — retry the save before closing.'
          )}
          error={updateMutation.error}
          onRetry={handleSave}
          isRetrying={updateMutation.isPending}
        />
      )}
    </div>
  );
};

/* ── Announcement card ──────────────────────────────── */
const AnnouncementCard: React.FC<{ item: MentorAnnouncementDto }> = ({ item }) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const handleTogglePin = () => {
    updateMutation.mutate({
      id: item.id,
      data: { pinned: !item.pinned },
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(item.id, {
      onSuccess: () => setDeleteOpen(false),
    });
  };

  return (
    <article
      className={[
        'glass-card rounded-2xl p-5 border border-border/50 relative transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none',
        item.pinned ? 'border-primary/40' : '',
      ].join(' ')}
    >
      {editing ? (
        <EditForm announcement={item} onCancel={() => setEditing(false)} />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {item.pinned && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-full"
                    aria-label={t('mentor.announcements.pinned', 'Pinned')}
                  >
                    <Pin className="w-3 h-3" aria-hidden="true" />
                    {t('mentor.announcements.pinned', 'Pinned')}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatRelative(item.createdAt)}
                </span>
                {item.updatedAt !== item.createdAt && (
                  <span className="text-[11px] text-muted-foreground/60 italic">
                    (edited)
                  </span>
                )}
              </div>
              {item.title && (
                <h3 className="text-base font-semibold mt-1.5">{item.title}</h3>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  aria-label={t('mentor.rowActions', 'Row actions')}
                >
                  <span aria-hidden="true">⋯</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onSelect={() => setEditing(true)}
                  className="gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  {t('mentor.announcements.editAction', 'Edit')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={handleTogglePin}
                  className="gap-2"
                >
                  {item.pinned ? (
                    <>
                      <PinOff className="w-4 h-4" />
                      {t('mentor.announcements.unpin', 'Unpin')}
                    </>
                  ) : (
                    <>
                      <Pin className="w-4 h-4" />
                      {t('mentor.announcements.pin', 'Pin to top')}
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setDeleteOpen(true)}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('mentor.announcements.deleteAction', 'Delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed">
            {item.body}
          </p>
        </>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                'mentor.announcements.deleteConfirmTitle',
                'Delete this announcement?'
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'mentor.announcements.deleteConfirmDesc',
                'This announcement will be removed for all students. This action cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('mentor.announcements.deleteAction', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
};

/* ── Main section ───────────────────────────────────── */
const AnnouncementsSection: React.FC = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useMentorAnnouncements();
  const [composing, setComposing] = useState(false);

  const items = data ?? [];

  return (
    <section aria-labelledby="announcements-heading" className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" aria-hidden="true" />
          <h2 id="announcements-heading" className="text-base font-semibold">
            {t('mentor.announcements.title', 'Announcements')}
          </h2>
          {items.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({items.length})
            </span>
          )}
        </div>
        {!composing && items.length > 0 && (
          <Button
            size="sm"
            onClick={() => setComposing(true)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {t('mentor.announcements.newButton', 'New announcement')}
          </Button>
        )}
      </div>

      {composing && <ComposeCard onDone={() => setComposing(false)} />}

      {isLoading ? (
        <div
          className="glass-card rounded-2xl p-5 h-24 bg-muted/20 animate-pulse"
          aria-busy="true"
        />
      ) : items.length === 0 && !composing ? (
        <div className="glass-card rounded-2xl p-8 flex flex-col items-center text-center gap-3 border border-border/50">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Megaphone className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold">
              {t('mentor.announcements.empty', 'No announcements yet')}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {t(
                'mentor.announcements.emptyDesc',
                'Post one to keep students informed.'
              )}
            </p>
          </div>
          <Button onClick={() => setComposing(true)} className="gap-1.5 mt-1">
            <Plus className="w-4 h-4" />
            {t('mentor.announcements.newButton', 'New announcement')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <AnnouncementCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
};

export default AnnouncementsSection;
