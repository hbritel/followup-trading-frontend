import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldOff,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  ScanLine,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  useActiveSuspensions,
  useAllMentors,
  useSuspendMentor,
  useSuspensionImpact,
  useLiftSuspension,
  useRescreenSanctions,
} from '@/hooks/useAdminMentor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  AdminSuspensionDto,
  MentorStrikeCategory,
  MentorSuspensionType,
} from '@/types/dto';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(
    document.documentElement.lang || navigator.language || 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  ).format(new Date(iso));
}

// ── Suspend dialog ────────────────────────────────────────────────────────────

interface SuspendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SuspendDialog({ open, onOpenChange }: SuspendDialogProps) {
  const { t } = useTranslation();
  const suspend = useSuspendMentor();
  const { data: mentors = [], isLoading: mentorsLoading } = useAllMentors();
  const { data: activeSuspensions = [] } = useActiveSuspensions();
  const [instanceId, setInstanceId] = useState('');
  const [reason, setReason] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [category, setCategory] = useState<MentorStrikeCategory>('TOS_VIOLATION');
  const [suspensionType, setSuspensionType] = useState<MentorSuspensionType>('TEMPORARY');
  const { data: impact } = useSuspensionImpact(
    instanceId || undefined,
    category,
    suspensionType,
  );

  // Cross-reference active suspensions so already-suspended mentors get a clear
  // marker in the picker (and can't be re-suspended by mistake).
  const suspendedSet = useMemo(
    () => new Set(activeSuspensions.map((s) => s.mentorInstanceId)),
    [activeSuspensions],
  );

  const sortedMentors = useMemo(
    () =>
      [...mentors].sort((a, b) =>
        (a.brandName ?? '').localeCompare(b.brandName ?? '', undefined, {
          sensitivity: 'base',
        }),
      ),
    [mentors],
  );

  const selected = sortedMentors.find((m) => m.id === instanceId);
  const selectedAlreadySuspended = selected ? suspendedSet.has(selected.id) : false;

  const canSubmit =
    instanceId.trim().length > 0
    && reason.trim().length > 0
    && !selectedAlreadySuspended;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    suspend.mutate(
      {
        instanceId: instanceId.trim(),
        reason: reason.trim(),
        category,
        type: suspensionType,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setInstanceId('');
          setReason('');
          setCategory('TOS_VIOLATION');
          setSuspensionType('TEMPORARY');
        },
      },
    );
  };

  const fmtMoney = (cents: number, currency: string): string => {
    if (!cents) return '0';
    const sym = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';
    return `${sym}${(cents / 100).toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('admin.suspensions.suspendTitle', 'Suspend mentor')}</DialogTitle>
          <DialogDescription>
            {t(
              'admin.suspensions.suspendDescription',
              'The mentor will be prevented from accepting new students. Existing sessions continue.'
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="suspend-mentor">
              {t('admin.suspensions.mentorLabel', 'Mentor')}
            </Label>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="suspend-mentor"
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={pickerOpen}
                  className="w-full justify-between font-normal"
                  disabled={mentorsLoading}
                >
                  {selected ? (
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{selected.brandName}</span>
                      {selected.slug && (
                        <span className="text-xs text-muted-foreground truncate">
                          /{selected.slug}
                        </span>
                      )}
                      {!selected.active && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          {t('admin.suspensions.inactive', 'Inactive')}
                        </Badge>
                      )}
                      {selectedAlreadySuspended && (
                        <Badge variant="destructive" className="text-[10px] px-1 py-0">
                          {t('admin.suspensions.alreadySuspended', 'Suspendu')}
                        </Badge>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {mentorsLoading
                        ? t('common.loading', 'Loading…')
                        : t(
                            'admin.suspensions.mentorPlaceholder',
                            'Select a mentor by name, slug, or ID',
                          )}
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command
                  filter={(value, search) => {
                    const q = search.trim().toLowerCase();
                    if (!q) return 1;
                    return value.toLowerCase().includes(q) ? 1 : 0;
                  }}
                >
                  <CommandInput
                    placeholder={t(
                      'admin.suspensions.mentorSearchPlaceholder',
                      'Search by name, slug, or ID…',
                    )}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {t('admin.suspensions.mentorNoResult', 'No mentor found.')}
                    </CommandEmpty>
                    <CommandGroup>
                      {sortedMentors.map((m) => {
                        const tokens = [m.brandName, m.slug ?? '', m.id]
                          .filter(Boolean)
                          .join(' ');
                        return (
                          <CommandItem
                            key={m.id}
                            value={tokens}
                            onSelect={() => {
                              setInstanceId(m.id);
                              setPickerOpen(false);
                            }}
                            className="gap-2"
                          >
                            <Check
                              className={cn(
                                'h-4 w-4 shrink-0',
                                instanceId === m.id ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{m.brandName}</span>
                                {m.verified && (
                                  <ShieldCheck
                                    className="h-3.5 w-3.5 text-emerald-500 shrink-0"
                                    aria-label={t('admin.suspensions.verified', 'Verified')}
                                  />
                                )}
                                {!m.active && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] px-1 py-0"
                                  >
                                    {t('admin.suspensions.inactive', 'Inactive')}
                                  </Badge>
                                )}
                                {suspendedSet.has(m.id) && (
                                  <Badge
                                    variant="destructive"
                                    className="text-[10px] px-1 py-0"
                                  >
                                    {t('admin.suspensions.alreadySuspended', 'Suspendu')}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono truncate">
                                {m.slug ? `/${m.slug}` : m.id}
                              </div>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selected && (
              <p className="text-[10px] text-muted-foreground font-mono">
                {selected.id}
              </p>
            )}
            {selectedAlreadySuspended && (
              <p className="text-xs text-destructive">
                {t(
                  'admin.suspensions.alreadySuspendedHint',
                  'Ce mentor est déjà suspendu — levez la suspension actuelle avant d\'en émettre une nouvelle.',
                )}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="suspend-category">
                {t('admin.suspensions.categoryLabel', 'Catégorie')}
              </Label>
              <Select value={category} onValueChange={(v) => setCategory(v as MentorStrikeCategory)}>
                <SelectTrigger id="suspend-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TOS_VIOLATION">{t('admin.suspensions.cat.TOS_VIOLATION', 'Violation TOS')}</SelectItem>
                  <SelectItem value="QUALITY_COMPLAINT">{t('admin.suspensions.cat.QUALITY_COMPLAINT', 'Plainte qualité')}</SelectItem>
                  <SelectItem value="FRAUD">{t('admin.suspensions.cat.FRAUD', 'Fraude')}</SelectItem>
                  <SelectItem value="ILLEGAL_CONTENT">{t('admin.suspensions.cat.ILLEGAL_CONTENT', 'Contenu illégal')}</SelectItem>
                  <SelectItem value="SANCTIONS_HIT">{t('admin.suspensions.cat.SANCTIONS_HIT', 'Sanctions')}</SelectItem>
                  <SelectItem value="TEMPORARY_HOLD">{t('admin.suspensions.cat.TEMPORARY_HOLD', 'Investigation')}</SelectItem>
                  <SelectItem value="MENTOR_INCAPACITATED">{t('admin.suspensions.cat.MENTOR_INCAPACITATED', 'Mentor incapacité')}</SelectItem>
                  <SelectItem value="PLATFORM_ERROR">{t('admin.suspensions.cat.PLATFORM_ERROR', 'Erreur plateforme')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="suspend-type">
                {t('admin.suspensions.typeLabel', 'Type')}
              </Label>
              <Select value={suspensionType} onValueChange={(v) => setSuspensionType(v as MentorSuspensionType)}>
                <SelectTrigger id="suspend-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEMPORARY">{t('admin.suspensions.type.TEMPORARY', 'Temporaire')}</SelectItem>
                  <SelectItem value="PRECAUTIONARY">{t('admin.suspensions.type.PRECAUTIONARY', 'Précautionnel')}</SelectItem>
                  <SelectItem value="PERMANENT_BAN">{t('admin.suspensions.type.PERMANENT_BAN', 'Bannissement définitif')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="suspend-reason">
              {t('admin.suspensions.reasonLabel', 'Reason')} *
            </Label>
            <Textarea
              id="suspend-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
              placeholder={t(
                'admin.suspensions.reasonPlaceholder',
                'Policy violation, sanctions hit, etc.'
              )}
              required
            />
          </div>
          {selected && impact && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5 text-xs">
              <p className="font-semibold text-amber-600 dark:text-amber-400">
                {t('admin.suspensions.impactTitle', 'Impact estimé')}
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>
                  · {t('admin.suspensions.impact.subs', '{{n}} abonnement(s) annulé(s)', { n: impact.subscriptionsAffected })}
                </li>
                <li>
                  · {t('admin.suspensions.impact.bookings', '{{n}} réservation(s) remboursée(s) — {{amount}}', {
                    n: impact.bookingsRefundable,
                    amount: fmtMoney(impact.bookingsRefundCents, impact.currency),
                  })}
                </li>
                <li>
                  · {t('admin.suspensions.impact.tickets', '{{n}} billet(s) webinaire remboursé(s)', { n: impact.ticketsRefundable })}
                </li>
              </ul>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="destructive"
              disabled={!canSubmit || suspend.isPending}
              className="gap-1.5"
            >
              {suspend.isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              )}
              {t('admin.suspensions.suspendAction', 'Suspend')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Lift confirmation dialog ──────────────────────────────────────────────────

interface LiftDialogProps {
  suspension: AdminSuspensionDto | null;
  onClose: () => void;
}

function LiftDialog({ suspension, onClose }: LiftDialogProps) {
  const { t } = useTranslation();
  const lift = useLiftSuspension();

  if (!suspension) return null;

  return (
    <AlertDialog
      open={!!suspension}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('admin.suspensions.liftTitle', 'Lift suspension?')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              'admin.suspensions.liftDescription',
              'This mentor will be able to accept new students again.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              lift.mutate(suspension.mentorInstanceId, { onSuccess: onClose })
            }
            disabled={lift.isPending}
          >
            {lift.isPending && (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            )}
            {t('admin.suspensions.liftAction', 'Lift suspension')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Suspension row ────────────────────────────────────────────────────────────

interface SuspensionRowProps {
  suspension: AdminSuspensionDto;
  onLift: (s: AdminSuspensionDto) => void;
}

function SuspensionRow({ suspension, onLift }: SuspensionRowProps) {
  const { t } = useTranslation();
  const rescreen = useRescreenSanctions();

  const isActive = !suspension.liftedAt;

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <span className="font-mono text-xs text-muted-foreground">
          {suspension.mentorInstanceId.slice(0, 8)}…
        </span>
      </td>
      <td className="px-4 py-3 text-sm max-w-[220px]">
        <span className="truncate block">{suspension.reason}</span>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {fmtDate(suspension.suspendedAt)}
      </td>
      <td className="px-4 py-3">
        <Badge
          variant={isActive ? 'destructive' : 'secondary'}
          className={cn('text-[10px]', !isActive && 'opacity-70')}
        >
          {isActive
            ? t('admin.suspensions.statusActive', 'Active')
            : t('admin.suspensions.statusLifted', 'Lifted')}
        </Badge>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {fmtDate(suspension.liftedAt)}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => rescreen.mutate(suspension.mentorInstanceId)}
            disabled={rescreen.isPending}
          >
            {rescreen.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            ) : (
              <ScanLine className="h-3 w-3" aria-hidden="true" />
            )}
            {t('admin.sanctions.rescreen', 'Re-screen')}
          </Button>
          {isActive && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-500"
              onClick={() => onLift(suspension)}
            >
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              {t('admin.suspensions.liftAction', 'Lift')}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const AdminMentorSuspensionsTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: suspensions, isLoading, isError } = useActiveSuspensions();
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [liftTarget, setLiftTarget] = useState<AdminSuspensionDto | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldOff className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-sm font-semibold">
            {t('admin.suspensions.title', 'Suspended mentors')}
          </h3>
        </div>
        <Button
          size="sm"
          variant="destructive"
          className="h-8 text-xs gap-1.5"
          onClick={() => setSuspendDialogOpen(true)}
        >
          <ShieldOff className="h-3.5 w-3.5" aria-hidden="true" />
          {t('admin.suspensions.suspendNew', 'Suspend mentor')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">
          {t('common.errorLoadingData', 'Error loading data')}
        </p>
      ) : !suspensions || suspensions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground border border-dashed border-border/50 rounded-xl">
          <AlertTriangle className="w-8 h-8 opacity-30" aria-hidden="true" />
          <p className="text-sm">
            {t('admin.suspensions.empty', 'No suspensions on record.')}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b bg-muted/50">
                {[
                  t('admin.suspensions.colInstanceId', 'Instance ID'),
                  t('admin.suspensions.colReason', 'Reason'),
                  t('admin.suspensions.colSuspendedAt', 'Suspended at'),
                  t('admin.suspensions.colStatus', 'Status'),
                  t('admin.suspensions.colLiftedAt', 'Lifted at'),
                  t('admin.actions', 'Actions'),
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider last:text-right"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suspensions.map((s) => (
                <SuspensionRow
                  key={s.id}
                  suspension={s}
                  onLift={setLiftTarget}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SuspendDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen} />
      <LiftDialog suspension={liftTarget} onClose={() => setLiftTarget(null)} />
    </div>
  );
};

export default AdminMentorSuspensionsTab;
