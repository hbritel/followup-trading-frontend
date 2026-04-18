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
import { Search, Gift, Sparkles, Users as UsersIcon, AlertCircle } from 'lucide-react';
import {
  adminAiUsageService,
  type GrantBonusRequest,
  type GrantBonusResponse,
  type InspectResponse,
} from '@/services/adminAiUsage.service';
import { getApiErrorMessage } from '@/services/apiClient';

// ── Constants ──────────────────────────────────────────────────────────────────

const MAX_USERS_PER_GRANT = 500;
const MAX_AMOUNT_PER_GRANT = 10_000;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  // Dedupe while preserving order
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

// ── Inspect sub-section ────────────────────────────────────────────────────────

function InspectSection() {
  const { t } = useTranslation();
  const [userId, setUserId] = useState('');
  const [result, setResult] = useState<InspectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const trimmed = userId.trim();
  const isValidUuid = UUID_REGEX.test(trimmed);

  const handleInspect = () => {
    if (!isValidUuid) {
      setError(t('admin.aiUsage.invalidUuidMessage', 'Please enter a valid user UUID.'));
      setResult(null);
      return;
    }
    inspectMutation.mutate(trimmed);
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">
            {t('admin.aiUsage.inspectTitle', 'User lookup')}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {t(
            'admin.aiUsage.inspectDescription',
            'Paste a user UUID to see their remaining AI coach bonus messages.'
          )}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="00000000-0000-0000-0000-000000000000"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isValidUuid && !inspectMutation.isPending) {
                handleInspect();
              }
            }}
            className="font-mono"
          />
          <Button
            onClick={handleInspect}
            disabled={!isValidUuid || inspectMutation.isPending}
          >
            {inspectMutation.isPending
              ? t('admin.aiUsage.inspecting', 'Inspecting...')
              : t('admin.aiUsage.inspect', 'Inspect')}
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="rounded-md border bg-muted/30 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('admin.aiUsage.userId', 'User ID')}
            </div>
            <div className="font-mono text-sm">{result.userId}</div>
            <div className="mt-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                {t('admin.aiUsage.bonusRemaining', 'Bonus messages remaining')}:
              </span>
              <Badge variant="secondary" className="text-base">
                {result.bonusAiMessagesRemaining}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Grant sub-section ──────────────────────────────────────────────────────────

function GrantSection() {
  const { t } = useTranslation();
  const [uuidText, setUuidText] = useState('');
  const [amount, setAmount] = useState<string>('10');
  const [reason, setReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const parsed = useMemo(() => parseUuidList(uuidText), [uuidText]);
  const amountNum = Number(amount);
  const isAmountValid =
    Number.isFinite(amountNum) &&
    Number.isInteger(amountNum) &&
    amountNum >= 1 &&
    amountNum <= MAX_AMOUNT_PER_GRANT;
  const canSubmit = parsed.valid.length > 0 && isAmountValid;

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
        })
      );
      setUuidText('');
      setReason('');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err));
    },
  });

  const handleSubmit = () => {
    if (!canSubmit) return;
    grantMutation.mutate({
      userIds: parsed.valid,
      amount: amountNum,
      reason: reason.trim() || undefined,
    });
    setConfirmOpen(false);
  };

  return (
    <>
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">
              {t('admin.aiUsage.grantTitle', 'Grant bonus messages')}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {t(
              'admin.aiUsage.grantDescription',
              'Paste up to 500 user UUIDs (one per line). Skipped users are those without an active subscription.'
            )}
          </p>

          <div className="space-y-2">
            <Label htmlFor="ai-usage-uuids">
              {t('admin.aiUsage.userIdsLabel', 'User UUIDs')}
            </Label>
            <Textarea
              id="ai-usage-uuids"
              placeholder={'00000000-0000-0000-0000-000000000000\n11111111-1111-1111-1111-111111111111'}
              value={uuidText}
              onChange={(e) => setUuidText(e.target.value)}
              rows={8}
              className="font-mono text-xs"
            />
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <UsersIcon className="h-3.5 w-3.5" />
                {t('admin.aiUsage.validCount', {
                  defaultValue: '{{count}} valid',
                  count: parsed.valid.length,
                })}
                {' / '}
                {MAX_USERS_PER_GRANT}
              </span>
              {parsed.invalid.length > 0 && (
                <Badge variant="destructive" className="font-normal">
                  {t('admin.aiUsage.invalidCount', {
                    defaultValue: '{{count}} invalid ignored',
                    count: parsed.invalid.length,
                  })}
                </Badge>
              )}
              {parsed.overflow > 0 && (
                <Badge variant="destructive" className="font-normal">
                  {t('admin.aiUsage.overflowCount', {
                    defaultValue: '{{count}} over the 500 cap — dropped',
                    count: parsed.overflow,
                  })}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ai-usage-amount">
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
              <p className="text-xs text-muted-foreground">
                {t('admin.aiUsage.amountHelp', 'Between 1 and 10,000.')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-usage-reason">
                {t('admin.aiUsage.reasonLabel', 'Reason (optional)')}
              </Label>
              <Input
                id="ai-usage-reason"
                placeholder={t(
                  'admin.aiUsage.reasonPlaceholder',
                  'e.g. support credit, beta tester, friends & family'
                )}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={255}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={!canSubmit || grantMutation.isPending}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {grantMutation.isPending
                ? t('admin.aiUsage.granting', 'Granting...')
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
                count: parsed.valid.length,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('admin.aiUsage.cancel', 'Cancel')}
            </AlertDialogCancel>
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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          {t('admin.aiUsage.sectionTitle', 'AI Coach Usage')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            'admin.aiUsage.sectionDescription',
            'Inspect a user\u2019s remaining bonus AI messages or grant a bonus to one or more users.'
          )}
        </p>
      </div>
      <InspectSection />
      <GrantSection />
    </div>
  );
}
