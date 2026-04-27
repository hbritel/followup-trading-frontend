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
  Send,
  Eye,
  ShieldCheck,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  useCohortMembers,
  useBroadcastCohortNote,
} from '@/hooks/useMentor';
import ErrorState from '@/components/ui/ErrorState';
import type { MentorCohortDto } from '@/types/dto';

const MAX_BROADCAST_BODY = 5000;

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

interface CohortDetailDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cohort: MentorCohortDto;
}

const CohortDetailDialog: React.FC<CohortDetailDialogProps> = ({
  open,
  onOpenChange,
  cohort,
}) => {
  const { t } = useTranslation();
  const { data: members = [], isLoading } = useCohortMembers(open ? cohort.id : null);
  const broadcast = useBroadcastCohortNote();
  const [tab, setTab] = useState<'members' | 'specs' | 'broadcast'>('members');
  const [body, setBody] = useState('');
  const [visibleToStudent, setVisibleToStudent] = useState(true);

  useEffect(() => {
    if (!open) {
      setTab('members');
      setBody('');
      setVisibleToStudent(true);
    }
  }, [open]);

  const trimmed = body.trim();
  const canSend = trimmed.length > 0 && trimmed.length <= MAX_BROADCAST_BODY && members.length > 0;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    broadcast.mutate(
      { cohortId: cohort.id, body: trimmed, visibleToStudent },
      {
        onSuccess: () => {
          setBody('');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: cohort.color ?? DEFAULT_COLOR }}
              aria-hidden="true"
            />
            {cohort.name}
          </DialogTitle>
          {cohort.description && (
            <DialogDescription>{cohort.description}</DialogDescription>
          )}
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="space-y-4">
          <TabsList>
            <TabsTrigger value="members" className="gap-1.5">
              <Users2 className="w-3.5 h-3.5" aria-hidden="true" />
              {t('mentor.cohorts.detail.tabMembers', 'Members')}
              <span className="text-[11px] tabular-nums text-muted-foreground">
                ({cohort.memberCount})
              </span>
            </TabsTrigger>
            <TabsTrigger value="specs" className="gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              {t('mentor.cohorts.detail.tabSpecs', 'Details')}
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="gap-1.5">
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              {t('mentor.cohorts.detail.tabBroadcast', 'Broadcast')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-2 max-h-[50vh] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-muted/20 animate-pulse" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {t(
                  'mentor.cohorts.detail.emptyMembers',
                  'No active members in this cohort yet.',
                )}
              </p>
            ) : (
              members.map((m) => (
                <div
                  key={m.studentUserId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-card/30 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.username}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {t('mentor.cohorts.detail.joinedAt', 'Joined {{date}}', {
                        date: new Date(m.joinedAt).toLocaleDateString(),
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold">
                    {m.shareMetrics && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        {t('mentor.cohorts.detail.shareMetricsShort', 'M')}
                      </span>
                    )}
                    {m.shareTrades && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        {t('mentor.cohorts.detail.shareTradesShort', 'T')}
                      </span>
                    )}
                    {m.sharePsychology && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        {t('mentor.cohorts.detail.sharePsyShort', 'P')}
                      </span>
                    )}
                    {!m.shareMetrics && !m.shareTrades && !m.sharePsychology && (
                      <span className="text-muted-foreground">
                        {t('mentor.cohorts.detail.noShare', 'No share')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="specs" className="space-y-3">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-border/40 bg-card/30 p-3">
                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t('mentor.cohorts.nameLabel', 'Name')}
                </dt>
                <dd className="font-medium mt-0.5">{cohort.name}</dd>
              </div>
              <div className="rounded-xl border border-border/40 bg-card/30 p-3">
                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t('mentor.cohorts.detail.colorLabel', 'Color')}
                </dt>
                <dd className="mt-0.5 flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border border-border/40"
                    style={{ backgroundColor: cohort.color ?? DEFAULT_COLOR }}
                    aria-hidden="true"
                  />
                  <span className="font-mono text-xs">
                    {cohort.color ?? DEFAULT_COLOR}
                  </span>
                </dd>
              </div>
              <div className="rounded-xl border border-border/40 bg-card/30 p-3 sm:col-span-2">
                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t('mentor.cohorts.descLabel', 'Description')}
                </dt>
                <dd className="mt-0.5 text-sm whitespace-pre-wrap">
                  {cohort.description || (
                    <span className="text-muted-foreground italic">
                      {t('mentor.cohorts.detail.noDescription', 'No description.')}
                    </span>
                  )}
                </dd>
              </div>
              <div className="rounded-xl border border-border/40 bg-card/30 p-3">
                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t('mentor.cohorts.detail.memberCount', 'Members')}
                </dt>
                <dd className="font-medium mt-0.5 tabular-nums">
                  {cohort.memberCount}
                </dd>
              </div>
            </dl>
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-3">
            <form onSubmit={handleSend} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="broadcast-body" className="text-sm font-medium">
                  {t(
                    'mentor.cohorts.detail.broadcastLabel',
                    'Message to all cohort members',
                  )}
                </Label>
                <Textarea
                  id="broadcast-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  maxLength={MAX_BROADCAST_BODY}
                  placeholder={t(
                    'mentor.cohorts.detail.broadcastPlaceholder',
                    'Write a message that will be delivered to every active student in this cohort…',
                  )}
                  required
                />
                <p className="text-[11px] text-muted-foreground text-right tabular-nums">
                  {body.length}/{MAX_BROADCAST_BODY}
                </p>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-xl bg-muted/30 px-3 py-2.5 border border-border/30">
                <div className="min-w-0">
                  <Label
                    htmlFor="broadcast-visible"
                    className="text-sm font-medium cursor-pointer"
                  >
                    {t(
                      'mentor.cohorts.detail.visibleLabel',
                      'Show this message to the students',
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {visibleToStudent
                      ? t(
                          'mentor.cohorts.detail.visibleHint',
                          'Members will see this in their "Mon Mentor" feed and receive a notification.',
                        )
                      : t(
                          'mentor.cohorts.detail.privateHint',
                          'Saved as a private mentor-side note per member.',
                        )}
                  </p>
                </div>
                <Switch
                  id="broadcast-visible"
                  checked={visibleToStudent}
                  onCheckedChange={setVisibleToStudent}
                  className="mt-0.5 shrink-0"
                />
              </div>

              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  {visibleToStudent ? (
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  {t(
                    'mentor.cohorts.detail.recipientHint',
                    '{{n}} active recipients',
                    { n: members.length },
                  )}
                </span>
                <Button type="submit" disabled={!canSend || broadcast.isPending} className="gap-1.5">
                  {broadcast.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {t('mentor.cohorts.detail.sendButton', 'Send to cohort')}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const CohortRow: React.FC<{ cohort: MentorCohortDto }> = ({ cohort }) => {
  const { t } = useTranslation();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const deleteMutation = useDeleteCohort();

  return (
    <>
      <div
        className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card/30 px-3 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={() => setDetailOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setDetailOpen(true);
          }
        }}
      >
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
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
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
                onSelect={() => setDetailOpen(true)}
                className="gap-2"
              >
                <Users2 className="w-4 h-4" />
                {t('mentor.cohorts.detail.openDetails', 'Open details')}
              </DropdownMenuItem>
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

      <CohortDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        cohort={cohort}
      />

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
