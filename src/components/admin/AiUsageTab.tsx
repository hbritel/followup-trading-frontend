import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
  Search,
  Gift,
  Sparkles,
  Users as UsersIcon,
  AlertCircle,
  Mail,
  Hash,
  Type,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  adminAiUsageService,
  type GrantBonusRequest,
  type GrantBonusResponse,
  type InspectResponse,
} from '@/services/adminAiUsage.service';
import { getApiErrorMessage } from '@/services/apiClient';
import type { AdminUserDto } from '@/services/admin.service';
import UserPicker, { SelectedUserChip, UUID_REGEX } from './UserPicker';

// ── Constants ──────────────────────────────────────────────────────────────────

const MAX_USERS_PER_GRANT = 500;
const MAX_AMOUNT_PER_GRANT = 10_000;

// ── Helpers ────────────────────────────────────────────────────────────────────

interface ParsedUuidList {
  valid: string[];
  invalid: string[];
  overflow: number;
}

function parseUuidList(raw: string): ParsedUuidList {
  const lines = raw
    .split(/\r?\n|,|;/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const line of lines) {
    const key = line.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(line);
    }
  }

  const valid: string[] = [];
  const invalid: string[] = [];
  for (const id of unique) {
    if (UUID_REGEX.test(id)) valid.push(id);
    else invalid.push(id);
  }

  const overflow = Math.max(0, valid.length - MAX_USERS_PER_GRANT);
  return {
    valid: valid.slice(0, MAX_USERS_PER_GRANT),
    invalid,
    overflow,
  };
}

// Small clipboard helper. Shows a checkmark for 1.5s after copy.
function CopyButton({ value, label, className }: { value: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      type="button"
      onClick={handle}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        copied && 'text-emerald-500',
        className,
      )}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

const initials = (u: AdminUserDto): string => {
  const src = u.fullName?.trim() || u.username || u.email || '?';
  return src
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('') || '?';
};

// ── Inspect sub-section ────────────────────────────────────────────────────────

function InspectSection() {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<AdminUserDto[]>([]);
  const [result, setResult] = useState<InspectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const target = picked[0];

  const inspectMutation = useMutation({
    mutationFn: (id: string) => adminAiUsageService.inspect(id),
    onSuccess: (data) => {
      setResult(data);
      setError(null);
    },
    onError: (err: unknown) => {
      setResult(null);
      setError(getApiErrorMessage(err));
    },
  });

  const handleInspect = () => {
    if (!target) return;
    inspectMutation.mutate(target.id);
  };

  return (
    <Card className="border-border/40">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Search className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold leading-none">
              {t('admin.aiUsage.inspectTitle', 'User lookup')}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('admin.aiUsage.inspectDescription', 'Find a user by name, email or UUID to inspect bonus messages.')}
            </p>
          </div>
        </div>

        <UserPicker
          mode="single"
          selected={picked}
          onChange={(next) => {
            setPicked(next);
            setResult(null);
            setError(null);
          }}
        />

        {target && (
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                {target.profilePictureUrl && <AvatarImage src={target.profilePictureUrl} alt="" />}
                <AvatarFallback>{initials(target)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate font-medium text-sm">{target.fullName || target.username || target.id.slice(0, 8)}</span>
                  {target.plan && <Badge variant="outline" className="h-4 px-1 text-[10px]">{target.plan}</Badge>}
                </div>
                {target.email && (
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{target.email}</span>
                    <CopyButton value={target.email} label={t('admin.aiUsage.copyEmail', 'Copy email')} />
                  </div>
                )}
                <div className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                  <Hash className="h-3 w-3 shrink-0" />
                  <span className="truncate">{target.id}</span>
                  <CopyButton value={target.id} label={t('admin.aiUsage.copyUuid', 'Copy UUID')} />
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleInspect}
                disabled={inspectMutation.isPending}
              >
                {inspectMutation.isPending
                  ? t('admin.aiUsage.inspecting', 'Inspecting…')
                  : t('admin.aiUsage.inspect', 'Inspect')}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="flex items-center justify-between rounded-md border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">
                {t('admin.aiUsage.bonusRemaining', 'Bonus messages remaining')}
              </span>
            </div>
            <Badge variant="secondary" className="text-base font-bold tabular-nums">
              {result.bonusAiMessagesRemaining}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Grant sub-section ──────────────────────────────────────────────────────────

function GrantSection() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'picker' | 'paste'>('picker');
  const [pickedUsers, setPickedUsers] = useState<AdminUserDto[]>([]);
  const [uuidText, setUuidText] = useState('');
  const [amount, setAmount] = useState<string>('10');
  const [reason, setReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const parsedPaste = useMemo(() => parseUuidList(uuidText), [uuidText]);

  // Combine sources, dedupe by ID
  const combinedIds = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const u of pickedUsers) {
      if (!seen.has(u.id)) {
        seen.add(u.id);
        out.push(u.id);
      }
    }
    for (const id of parsedPaste.valid) {
      const lower = id.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        out.push(id);
      }
    }
    return out.slice(0, MAX_USERS_PER_GRANT);
  }, [pickedUsers, parsedPaste.valid]);

  const amountNum = Number(amount);
  const isAmountValid =
    Number.isFinite(amountNum) &&
    Number.isInteger(amountNum) &&
    amountNum >= 1 &&
    amountNum <= MAX_AMOUNT_PER_GRANT;
  const canSubmit = combinedIds.length > 0 && isAmountValid;
  const totalMessages = combinedIds.length * (isAmountValid ? amountNum : 0);

  const grantMutation = useMutation<GrantBonusResponse, unknown, GrantBonusRequest>({
    mutationFn: (req) => adminAiUsageService.grant(req),
    onSuccess: (data) => {
      toast.success(
        t('admin.aiUsage.grantSuccess', {
          defaultValue:
            '{{amount}} messages granted to {{granted}} users ({{skipped}} skipped — no subscription)',
          amount: data.amount,
          granted: data.usersGranted,
          skipped: data.usersSkipped,
        }),
      );
      setUuidText('');
      setPickedUsers([]);
      setReason('');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err));
    },
  });

  const handleSubmit = () => {
    if (!canSubmit) return;
    grantMutation.mutate({
      userIds: combinedIds,
      amount: amountNum,
      reason: reason.trim() || undefined,
    });
    setConfirmOpen(false);
  };

  return (
    <>
      <Card className="border-border/40">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Gift className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold leading-none">
                {t('admin.aiUsage.grantTitle', 'Grant bonus messages')}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('admin.aiUsage.grantDescription', 'Pick users with autocomplete or paste up to 500 UUIDs. Users without an active subscription are skipped.')}
              </p>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as 'picker' | 'paste')}>
            <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-flex">
              <TabsTrigger value="picker" className="gap-1.5">
                <Type className="h-3.5 w-3.5" /> {t('admin.aiUsage.tabPicker', 'Search users')}
              </TabsTrigger>
              <TabsTrigger value="paste" className="gap-1.5">
                <Hash className="h-3.5 w-3.5" /> {t('admin.aiUsage.tabPaste', 'Paste UUIDs')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="picker" className="mt-3 space-y-3">
              <UserPicker
                mode="multi"
                selected={pickedUsers}
                onChange={setPickedUsers}
                placeholder={t('admin.aiUsage.pickerPlaceholder', 'Username, email or UUID…')}
              />
              {pickedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 rounded-md border bg-muted/20 p-2">
                  {pickedUsers.map((u) => (
                    <SelectedUserChip
                      key={u.id}
                      user={u}
                      onRemove={() => setPickedUsers(pickedUsers.filter((p) => p.id !== u.id))}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setPickedUsers([])}
                    className="ml-auto text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {t('admin.aiUsage.clearAll', 'Clear all')}
                  </button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="paste" className="mt-3 space-y-2">
              <Label htmlFor="ai-usage-uuids" className="text-xs">
                {t('admin.aiUsage.userIdsLabel', 'User UUIDs')}
              </Label>
              <Textarea
                id="ai-usage-uuids"
                placeholder={'00000000-0000-0000-0000-000000000000\n11111111-1111-1111-1111-111111111111'}
                value={uuidText}
                onChange={(e) => setUuidText(e.target.value)}
                rows={6}
                className="font-mono text-xs"
              />
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <UsersIcon className="h-3.5 w-3.5" />
                  {t('admin.aiUsage.validCount', { defaultValue: '{{count}} valid', count: parsedPaste.valid.length })}
                  {' / '}
                  {MAX_USERS_PER_GRANT}
                </span>
                {parsedPaste.invalid.length > 0 && (
                  <Badge variant="destructive" className="font-normal">
                    {t('admin.aiUsage.invalidCount', { defaultValue: '{{count}} invalid ignored', count: parsedPaste.invalid.length })}
                  </Badge>
                )}
                {parsedPaste.overflow > 0 && (
                  <Badge variant="destructive" className="font-normal">
                    {t('admin.aiUsage.overflowCount', { defaultValue: '{{count}} over the 500 cap — dropped', count: parsedPaste.overflow })}
                  </Badge>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ai-usage-amount" className="text-xs">
                {t('admin.aiUsage.amountLabel', 'Amount per user')}
              </Label>
              <Input
                id="ai-usage-amount"
                type="number"
                min={1}
                max={MAX_AMOUNT_PER_GRANT}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                {t('admin.aiUsage.amountHelp', 'Between 1 and 10,000.')}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ai-usage-reason" className="text-xs">
                {t('admin.aiUsage.reasonLabel', 'Reason (optional)')}
              </Label>
              <Input
                id="ai-usage-reason"
                placeholder={t('admin.aiUsage.reasonPlaceholder', 'e.g. support credit, beta tester, friends & family')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={255}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border bg-gradient-to-r from-primary/5 to-amber-500/5 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <UsersIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <strong className="font-semibold tabular-nums">{combinedIds.length}</strong>
                <span className="text-muted-foreground">{t('admin.aiUsage.recipients', 'recipients')}</span>
              </span>
              <span className="text-muted-foreground">×</span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                <strong className="font-semibold tabular-nums">{isAmountValid ? amountNum : 0}</strong>
                <span className="text-muted-foreground">{t('admin.aiUsage.eachLabel', 'each')}</span>
              </span>
              <span className="text-muted-foreground">=</span>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 font-bold text-primary tabular-nums">
                {totalMessages.toLocaleString()} {t('admin.aiUsage.messages', 'messages')}
              </span>
            </div>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={!canSubmit || grantMutation.isPending}
              size="sm"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {grantMutation.isPending
                ? t('admin.aiUsage.granting', 'Granting…')
                : t('admin.aiUsage.grantButton', 'Grant bonus')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('admin.aiUsage.confirmTitle', 'Confirm bonus grant')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.aiUsage.confirmMessage', {
                defaultValue:
                  'Grant {{amount}} bonus AI messages to {{count}} users? This action is logged and cannot be undone.',
                amount: amountNum,
                count: combinedIds.length,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.aiUsage.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              {t('admin.aiUsage.confirm', 'Confirm grant')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Public tab ─────────────────────────────────────────────────────────────────

export default function AiUsageTab() {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            {t('admin.aiUsage.sectionTitle', 'AI Coach Usage')}
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('admin.aiUsage.sectionDescription', 'Inspect a user’s remaining bonus AI messages or grant a bonus to one or more users.')}
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-5"><InspectSection /></div>
        <div className="lg:col-span-7"><GrantSection /></div>
      </div>
    </div>
  );
}
