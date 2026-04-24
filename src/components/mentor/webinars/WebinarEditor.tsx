import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Loader2, Video, Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useMyWebinars,
  useCreateWebinar,
  useUpdateWebinar,
  useDeleteWebinar,
} from '@/hooks/useMentorRevenue';
import type { WebinarDto, CreateWebinarDto } from '@/types/dto';

const CURRENCIES = ['USD', 'EUR', 'GBP'];

const toLocalDatetimeString = (isoStr: string): string => {
  const d = new Date(isoStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const emptyForm = (): CreateWebinarDto => ({
  title: '',
  description: '',
  startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  durationMinutes: 60,
  meetingUrl: '',
  ticketPriceCents: 0,
  currency: 'USD',
  maxAttendees: null,
});

interface WebinarFormProps {
  value: CreateWebinarDto;
  onChange: (v: CreateWebinarDto) => void;
}

const WebinarForm: React.FC<WebinarFormProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const set = <K extends keyof CreateWebinarDto>(k: K, v: CreateWebinarDto[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="webinar-title">{t('mentor.webinars.editor.title', 'Title')}</Label>
        <Input
          id="webinar-title"
          value={value.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder={t('mentor.webinars.editor.titlePlaceholder', 'e.g. Live trading session')}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="webinar-desc">
          {t('mentor.webinars.editor.description', 'Description')}
        </Label>
        <Textarea
          id="webinar-desc"
          value={value.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          placeholder={t(
            'mentor.webinars.editor.descPlaceholder',
            'What will attendees learn?'
          )}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="webinar-starts">
            {t('mentor.webinars.editor.startsAt', 'Start date & time')}
          </Label>
          <Input
            id="webinar-starts"
            type="datetime-local"
            value={toLocalDatetimeString(value.startsAt)}
            onChange={(e) =>
              set('startsAt', e.target.value ? new Date(e.target.value).toISOString() : value.startsAt)
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="webinar-duration">
            {t('mentor.webinars.editor.duration', 'Duration (min)')}
          </Label>
          <Input
            id="webinar-duration"
            type="number"
            min={15}
            max={480}
            step={15}
            value={value.durationMinutes}
            onChange={(e) => set('durationMinutes', Number(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="webinar-url">
          {t('mentor.webinars.editor.meetingUrl', 'Meeting URL')}
        </Label>
        <Input
          id="webinar-url"
          type="url"
          value={value.meetingUrl}
          onChange={(e) => set('meetingUrl', e.target.value)}
          placeholder="https://meet.google.com/..."
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="webinar-price">
            {t('mentor.webinars.editor.ticketPrice', 'Ticket price')}
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              {value.currency === 'USD' ? '$' : value.currency === 'EUR' ? '€' : '£'}
            </span>
            <Input
              id="webinar-price"
              type="number"
              min={0}
              step={0.01}
              value={(value.ticketPriceCents / 100).toFixed(2)}
              onChange={(e) =>
                set('ticketPriceCents', Math.round(parseFloat(e.target.value) * 100))
              }
              className="pl-7"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="webinar-currency">
            {t('mentor.webinars.editor.currency', 'Currency')}
          </Label>
          <Select value={value.currency} onValueChange={(v) => set('currency', v)}>
            <SelectTrigger id="webinar-currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="webinar-max">
          {t('mentor.webinars.editor.maxAttendees', 'Max attendees (leave blank for unlimited)')}
        </Label>
        <Input
          id="webinar-max"
          type="number"
          min={1}
          value={value.maxAttendees ?? ''}
          onChange={(e) =>
            set('maxAttendees', e.target.value ? Number(e.target.value) : null)
          }
          placeholder={t('mentor.webinars.editor.unlimited', 'Unlimited')}
        />
      </div>
    </div>
  );
};

interface WebinarDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  webinar?: WebinarDto;
}

const WebinarDialog: React.FC<WebinarDialogProps> = ({ open, onOpenChange, webinar }) => {
  const { t } = useTranslation();
  const create = useCreateWebinar();
  const update = useUpdateWebinar();

  const [form, setForm] = useState<CreateWebinarDto>(emptyForm());

  useEffect(() => {
    if (open) {
      setForm(
        webinar
          ? {
              title: webinar.title,
              description: webinar.description ?? '',
              startsAt: webinar.startsAt,
              durationMinutes: webinar.durationMinutes,
              meetingUrl: webinar.meetingUrl,
              ticketPriceCents: webinar.ticketPriceCents,
              currency: webinar.currency,
              maxAttendees: webinar.maxAttendees ?? null,
            }
          : emptyForm()
      );
    }
  }, [open, webinar]);

  const isPending = create.isPending || update.isPending;

  const handleSave = () => {
    if (webinar) {
      update.mutate({ id: webinar.id, data: form }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(form, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {webinar
              ? t('mentor.webinars.editor.editTitle', 'Edit webinar')
              : t('mentor.webinars.editor.createTitle', 'New webinar')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'mentor.webinars.editor.subtitle',
              'Configure your live webinar event and ticket pricing.'
            )}
          </DialogDescription>
        </DialogHeader>

        <WebinarForm value={form} onChange={setForm} />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || !form.title.trim() || !form.meetingUrl.trim()}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.save', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const WebinarEditor: React.FC = () => {
  const { t } = useTranslation();
  const { data: webinars = [], isLoading } = useMyWebinars();
  const deleteMutation = useDeleteWebinar();
  const updateMutation = useUpdateWebinar();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WebinarDto | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<string | undefined>(undefined);

  const handleEdit = (w: WebinarDto) => {
    setEditing(w);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const handlePublishToggle = (w: WebinarDto) => {
    const newStatus = w.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    updateMutation.mutate({ id: w.id, data: { status: newStatus } });
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  const fmtPrice = (cents: number, currency: string) => {
    if (cents === 0) return t('mentor.webinars.free', 'Free');
    const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
    return `${sym}${(cents / 100).toFixed(2)}`;
  };

  const STATUS_CHIPS: Record<string, string> = {
    DRAFT: 'bg-muted text-muted-foreground',
    PUBLISHED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    CANCELLED: 'bg-destructive/10 text-destructive',
    COMPLETED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('mentor.webinars.title', 'Webinars')}
        </h3>
        <Button size="sm" onClick={handleNew} className="gap-1.5">
          <Plus className="w-4 h-4" />
          {t('mentor.webinars.add', 'Add webinar')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : webinars.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 px-6 py-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {t(
              'mentor.webinars.empty',
              'No webinars yet. Schedule one to start selling tickets.'
            )}
          </p>
          <Button variant="outline" size="sm" onClick={handleNew} className="gap-1.5">
            <Plus className="w-4 h-4" />
            {t('mentor.webinars.addFirst', 'Create your first webinar')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {webinars.map((w) => (
            <div
              key={w.id}
              className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/10 p-4 hover:bg-muted/20 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Video className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <span className="font-medium text-sm">{w.title}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {fmtDate(w.startsAt)}
                      {' · '}
                      {w.durationMinutes}
                      {t('mentor.sessions.min', ' min')}
                      {' · '}
                      {fmtPrice(w.ticketPriceCents, w.currency)}
                    </p>
                  </div>
                  <span
                    className={[
                      'text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0',
                      STATUS_CHIPS[w.status] ?? 'bg-muted text-muted-foreground',
                    ].join(' ')}
                  >
                    {w.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 mt-0.5">
                {(w.status === 'DRAFT' || w.status === 'PUBLISHED') && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePublishToggle(w)}
                    aria-label={
                      w.status === 'PUBLISHED'
                        ? t('mentor.webinars.unpublish', 'Unpublish')
                        : t('mentor.webinars.publish', 'Publish')
                    }
                    title={
                      w.status === 'PUBLISHED'
                        ? t('mentor.webinars.unpublish', 'Unpublish')
                        : t('mentor.webinars.publish', 'Publish')
                    }
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEdit(w)}
                  aria-label={t('common.edit', 'Edit')}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(w.id)}
                  aria-label={t('common.delete', 'Delete')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <WebinarDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        webinar={editing}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(undefined); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('mentor.webinars.deleteTitle', 'Delete webinar?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'mentor.webinars.deleteDesc',
                'This webinar will be removed. Paid tickets may require manual refunds.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget, {
                    onSuccess: () => setDeleteTarget(undefined),
                  });
                }
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WebinarEditor;
