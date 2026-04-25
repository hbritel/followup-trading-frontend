import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useMySessionOfferings,
  useCreateSessionOffering,
  useUpdateSessionOffering,
  useDeleteSessionOffering,
} from '@/hooks/useMentorRevenue';
import ErrorState from '@/components/ui/ErrorState';
import MentorCohortPicker from '@/components/mentor/cohorts/MentorCohortPicker';
import type { SessionOfferingDto, CreateSessionOfferingDto } from '@/types/dto';

const CURRENCIES = ['USD', 'EUR', 'GBP'];

const emptyForm = (): CreateSessionOfferingDto => ({
  title: '',
  description: '',
  durationMinutes: 60,
  priceCents: 5000,
  currency: 'USD',
  cancellationWindowHours: 24,
  active: true,
  targetCohortIds: [],
});

interface OfferingFormProps {
  value: CreateSessionOfferingDto;
  onChange: (v: CreateSessionOfferingDto) => void;
}

const OfferingForm: React.FC<OfferingFormProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const set = <K extends keyof CreateSessionOfferingDto>(k: K, v: CreateSessionOfferingDto[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="offering-title">{t('mentor.sessions.editor.title', 'Title')}</Label>
        <Input
          id="offering-title"
          value={value.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder={t('mentor.sessions.editor.titlePlaceholder', 'e.g. 1-on-1 trading review')}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="offering-desc">
          {t('mentor.sessions.editor.description', 'Description')}
        </Label>
        <Textarea
          id="offering-desc"
          value={value.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          placeholder={t(
            'mentor.sessions.editor.descPlaceholder',
            'Describe what students get in this session…'
          )}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="offering-duration">
            {t('mentor.sessions.editor.duration', 'Duration (min)')}
          </Label>
          <Input
            id="offering-duration"
            type="number"
            min={15}
            max={480}
            step={15}
            value={value.durationMinutes}
            onChange={(e) => set('durationMinutes', Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="offering-cancel">
            {t('mentor.sessions.editor.cancellation', 'Cancel window (hrs)')}
          </Label>
          <Input
            id="offering-cancel"
            type="number"
            min={0}
            max={168}
            step={1}
            value={value.cancellationWindowHours}
            onChange={(e) => set('cancellationWindowHours', Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="offering-price">
            {t('mentor.sessions.editor.price', 'Price')}
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              {value.currency === 'USD' ? '$' : value.currency === 'EUR' ? '€' : '£'}
            </span>
            <Input
              id="offering-price"
              type="number"
              min={0}
              step={0.01}
              value={(value.priceCents / 100).toFixed(2)}
              onChange={(e) => set('priceCents', Math.round(parseFloat(e.target.value) * 100))}
              className="pl-7"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="offering-currency">
            {t('mentor.sessions.editor.currency', 'Currency')}
          </Label>
          <Select value={value.currency} onValueChange={(v) => set('currency', v)}>
            <SelectTrigger id="offering-currency">
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

      <div className="flex items-center gap-3">
        <Switch
          id="offering-active"
          checked={value.active}
          onCheckedChange={(v) => set('active', v)}
        />
        <Label htmlFor="offering-active" className="cursor-pointer">
          {value.active
            ? t('mentor.sessions.editor.active', 'Active — visible to students')
            : t('mentor.sessions.editor.inactive', 'Draft — hidden from students')}
        </Label>
      </div>

      <MentorCohortPicker
        value={value.targetCohortIds ?? []}
        onChange={(next) => set('targetCohortIds', next)}
        label={t('mentor.sessions.editor.targetCohorts', 'Visible to')}
        hint={t(
          'mentor.sessions.editor.targetCohortsHint',
          'Select cohorts to restrict this offering, or keep "All students" for everyone on the public profile.'
        )}
      />
    </div>
  );
};

interface OfferingDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  offering?: SessionOfferingDto;
}

const OfferingDialog: React.FC<OfferingDialogProps> = ({
  open,
  onOpenChange,
  offering,
}) => {
  const { t } = useTranslation();
  const create = useCreateSessionOffering();
  const update = useUpdateSessionOffering();

  const [form, setForm] = useState<CreateSessionOfferingDto>(emptyForm());

  useEffect(() => {
    if (open) {
      setForm(
        offering
          ? {
              title: offering.title,
              description: offering.description ?? '',
              durationMinutes: offering.durationMinutes,
              priceCents: offering.priceCents,
              currency: offering.currency,
              cancellationWindowHours: offering.cancellationWindowHours,
              active: offering.active,
              targetCohortIds: offering.targetCohortIds ?? [],
            }
          : emptyForm()
      );
    }
  }, [open, offering]);

  const isPending = create.isPending || update.isPending;

  const handleSave = () => {
    if (offering) {
      update.mutate(
        { id: offering.id, data: form },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      create.mutate(form, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {offering
              ? t('mentor.sessions.editor.editTitle', 'Edit session offering')
              : t('mentor.sessions.editor.createTitle', 'New session offering')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'mentor.sessions.editor.subtitle',
              'Configure your 1-on-1 session details and pricing.'
            )}
          </DialogDescription>
        </DialogHeader>

        <OfferingForm value={form} onChange={setForm} />

        {(create.isError || update.isError) && (
          <ErrorState
            title={t('mentor.sessions.error.title', 'Could not save offering')}
            description={t(
              'mentor.sessions.error.desc',
              'Your form is still here — retry the save before closing.'
            )}
            error={create.error ?? update.error}
            onRetry={handleSave}
            isRetrying={isPending}
          />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || !form.title.trim()}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.save', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SessionOfferingEditor: React.FC = () => {
  const { t } = useTranslation();
  const { data: offerings = [], isLoading } = useMySessionOfferings();
  const deleteMutation = useDeleteSessionOffering();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SessionOfferingDto | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<string | undefined>(undefined);

  const handleEdit = (o: SessionOfferingDto) => {
    setEditing(o);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget, {
        onSuccess: () => setDeleteTarget(undefined),
      });
    }
  };

  const fmtPrice = (cents: number, currency: string) => {
    const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
    return `${sym}${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('mentor.sessions.offeringsTitle', 'Session offerings')}
        </h3>
        <Button size="sm" onClick={handleNew} className="gap-1.5">
          <Plus className="w-4 h-4" />
          {t('mentor.sessions.addOffering', 'Add offering')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : offerings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 px-6 py-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {t(
              'mentor.sessions.emptyOfferings',
              'No session offerings yet. Add one to start accepting bookings.'
            )}
          </p>
          <Button variant="outline" size="sm" onClick={handleNew} className="gap-1.5">
            <Plus className="w-4 h-4" />
            {t('mentor.sessions.addFirst', 'Create your first offering')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {offerings.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/10 px-4 py-3 hover:bg-muted/20 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{o.title}</span>
                  <span
                    className={[
                      'text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full',
                      o.active
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground',
                    ].join(' ')}
                  >
                    {o.active
                      ? t('mentor.sessions.active', 'Active')
                      : t('mentor.sessions.draft', 'Draft')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {o.durationMinutes}
                  {t('mentor.sessions.min', ' min')}
                  {' · '}
                  {fmtPrice(o.priceCents, o.currency)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEdit(o)}
                  aria-label={t('common.edit', 'Edit')}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(o.id)}
                  aria-label={t('common.delete', 'Delete')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <OfferingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        offering={editing}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(undefined); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('mentor.sessions.deleteTitle', 'Delete offering?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'mentor.sessions.deleteDesc',
                'This offering will be removed. Confirmed bookings are not affected.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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

export default SessionOfferingEditor;
