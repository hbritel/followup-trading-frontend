import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Sparkles,
  Save,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  adminService,
  type AiDefaultProviderDto,
  type AiProviderTypeValue,
  type CreateSystemAiProviderRequest,
  type SystemAiProviderDto,
  type UpdateSystemAiProviderRequest,
} from '@/services/admin.service';
import { getApiErrorMessage } from '@/services/apiClient';
import { cn } from '@/lib/utils';

const DEFAULT_QUERY_KEY = ['admin', 'ai', 'default-provider'] as const;
const PROVIDERS_QUERY_KEY = ['admin', 'ai', 'providers'] as const;

const PROVIDER_DESCRIPTION: Record<string, string> = {
  auto: 'admin.ai.providerAutoDesc',
  gemini: 'admin.ai.providerGeminiDesc',
  openrouter: 'admin.ai.providerOpenRouterDesc',
  ollama: 'admin.ai.providerOllamaDesc',
};

const PROVIDER_TYPE_OPTIONS: Array<{ value: AiProviderTypeValue; label: string }> = [
  { value: 'GEMINI', label: 'Google Gemini' },
  { value: 'ANTHROPIC', label: 'Anthropic Claude' },
  { value: 'OPENAI_COMPATIBLE', label: 'OpenAI / LM Studio / llama.cpp / vLLM' },
  { value: 'OLLAMA', label: 'Ollama' },
  { value: 'OPENROUTER', label: 'OpenRouter' },
];

// ── Default provider section ─────────────────────────────────────────────────

function DefaultProviderSection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery<AiDefaultProviderDto>({
    queryKey: DEFAULT_QUERY_KEY,
    queryFn: () => adminService.getAiDefaultProvider(),
    staleTime: 60 * 1000,
  });

  const [pending, setPending] = useState<string>('');

  useEffect(() => {
    if (data?.current && !pending) {
      setPending(data.current);
    }
  }, [data?.current, pending]);

  const mutation = useMutation({
    mutationFn: (provider: string) => adminService.updateAiDefaultProvider(provider),
    onSuccess: (resp) => {
      queryClient.setQueryData(DEFAULT_QUERY_KEY, resp);
      toast.success(t('admin.ai.updateSuccess', 'Default AI provider updated'));
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> {t('common.loading', 'Loading…')}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex items-start gap-2 p-5 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{getApiErrorMessage(error) || t('admin.ai.loadError', 'Failed to load AI provider configuration.')}</span>
        </CardContent>
      </Card>
    );
  }

  const options = [{ name: 'auto', displayName: 'Auto', available: true, custom: false }, ...data.available];
  const dirty = pending && pending !== data.current;
  const selectedOption = options.find((o) => o.name === pending);
  const description = selectedOption ? PROVIDER_DESCRIPTION[selectedOption.name] : null;

  return (
    <Card className="border-border/40">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold leading-none">{t('admin.ai.defaultProvider', 'Default provider')}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('admin.ai.defaultProviderHelp', 'Applies to every user without a custom AI provider. Use “auto” to fall back to priority-based selection.')}
            </p>
          </div>
        </div>

        <div className="grid gap-2">
          <Label className="text-xs">{t('admin.ai.providerLabel', 'Provider')}</Label>
          <Select value={pending} onValueChange={setPending}>
            <SelectTrigger>
              <SelectValue placeholder={t('admin.ai.selectProvider', 'Select a provider')} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.name} value={opt.name}>
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={cn(
                        'inline-block h-1.5 w-1.5 rounded-full',
                        opt.name === 'auto' ? 'bg-primary' : opt.available ? 'bg-emerald-500' : 'bg-muted-foreground/40',
                      )}
                    />
                    <span>{opt.displayName || opt.name}</span>
                    {opt.custom && (
                      <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">
                        {t('admin.ai.customBadge', 'Custom')}
                      </Badge>
                    )}
                    {opt.name !== 'auto' && !opt.available && (
                      <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">
                        {t('admin.ai.unreachable', 'Unreachable')}
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <p className="text-xs text-muted-foreground">{t(description)}</p>}
        </div>

        {selectedOption && selectedOption.name !== 'auto' && !selectedOption.available && (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{t('admin.ai.unreachableWarning', 'This provider is currently not reachable. Saving anyway will let users fall back to the platform default until it recovers.')}</span>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t('admin.ai.currentValue', 'Current')}</span>
            <Badge variant="secondary" className="capitalize">{data.current}</Badge>
          </div>
          <Button
            size="sm"
            onClick={() => pending && mutation.mutate(pending)}
            disabled={!dirty || mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {mutation.isPending ? t('admin.ai.saving', 'Saving…') : t('admin.ai.save', 'Save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Custom providers section ─────────────────────────────────────────────────

function CustomProvidersSection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<SystemAiProviderDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SystemAiProviderDto | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const { data: providers = [], isLoading } = useQuery<SystemAiProviderDto[]>({
    queryKey: PROVIDERS_QUERY_KEY,
    queryFn: () => adminService.listSystemAiProviders(),
    staleTime: 60 * 1000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: PROVIDERS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: DEFAULT_QUERY_KEY });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteSystemAiProvider(id),
    onSuccess: () => {
      invalidate();
      toast.success(t('admin.ai.providerDeleted', 'Provider deleted'));
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => adminService.testSystemAiProvider(id),
    onSuccess: (resp) => {
      setTestingId(null);
      if (!resp.available) {
        toast.error(resp.error || t('admin.ai.testFail', 'Provider unreachable'));
      } else if (resp.modelMismatch) {
        // The endpoint is reachable but the configured modelName is not loaded
        // on the server. With LM Studio + a single loaded model, /chat/completions
        // silently uses whichever model is loaded — admin's selection is ignored.
        toast.warning(
          t('admin.ai.testMismatch', {
            defaultValue: 'Reachable, but the configured model "{{configured}}" is not loaded. Available: {{models}}',
            configured: resp.configuredModel ?? '?',
            models: resp.models.length > 0 ? resp.models.join(', ') : '—',
          }),
        );
      } else {
        toast.success(
          resp.models.length > 0
            ? t('admin.ai.testSuccessWithModels', {
                defaultValue: 'Provider reachable. Loaded models: {{models}}',
                models: resp.models.join(', '),
              })
            : t('admin.ai.testSuccess', 'Provider reachable'),
        );
      }
      // refresh availability flags
      queryClient.invalidateQueries({ queryKey: DEFAULT_QUERY_KEY });
    },
    onError: (err) => {
      setTestingId(null);
      toast.error(getApiErrorMessage(err));
    },
  });

  return (
    <>
      <Card className="border-border/40">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-none">
                  {t('admin.ai.customSectionTitle', 'Custom AI providers')}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('admin.ai.customSectionHelp', 'Plug your own AI backend (Gemini, Claude, OpenAI, LM Studio, llama.cpp, Ollama, or any OpenAI-compatible endpoint). Each entry becomes a selectable default for every user without BYOK.')}
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="mr-1 h-4 w-4" /> {t('admin.ai.addProvider', 'Add provider')}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {t('common.loading', 'Loading…')}
            </div>
          ) : providers.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t('admin.ai.noCustomProviders', 'No custom providers yet. Add one to plug your own AI backend.')}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/40">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30 text-xs">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t('admin.ai.colName', 'Name')}</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t('admin.ai.colType', 'Type')}</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t('admin.ai.colModel', 'Model')}</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t('admin.ai.colBaseUrl', 'Base URL')}</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">{t('admin.ai.colActive', 'Active')}</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">{t('admin.ai.colActions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p) => (
                    <tr key={p.id} className="border-b border-border/20 hover:bg-muted/20">
                      <td className="px-3 py-2">
                        <div className="font-medium">{p.displayName}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{p.name}</div>
                      </td>
                      <td className="px-3 py-2 text-xs">{p.providerType}</td>
                      <td className="px-3 py-2 font-mono text-xs">{p.modelName}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[200px]">
                        {p.baseUrl ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge variant={p.active ? 'default' : 'outline'} className="text-[10px]">
                          {p.active ? t('admin.ai.activeBadge', 'On') : t('admin.ai.inactiveBadge', 'Off')}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setTestingId(p.id);
                              testMutation.mutate(p.id);
                            }}
                            disabled={testMutation.isPending && testingId === p.id}
                          >
                            {testMutation.isPending && testingId === p.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              t('admin.ai.test', 'Test')
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setEditing(p)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(p)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ProviderFormDialog
        open={creating}
        onOpenChange={setCreating}
        mode="create"
        onSaved={() => {
          invalidate();
          setCreating(false);
        }}
      />
      <ProviderFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        mode="edit"
        existing={editing ?? undefined}
        onSaved={() => {
          invalidate();
          setEditing(null);
        }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.ai.deleteTitle', 'Delete this provider?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.ai.deleteDesc', 'Users currently using this provider will fall back to the auto default. The configuration cannot be recovered.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('admin.ai.confirmDelete', 'Yes, delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Create / edit dialog ─────────────────────────────────────────────────────

interface ProviderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  existing?: SystemAiProviderDto;
  onSaved: () => void;
}

function ProviderFormDialog({ open, onOpenChange, mode, existing, onSaved }: ProviderFormDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [providerType, setProviderType] = useState<AiProviderTypeValue>('OPENAI_COMPATIBLE');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [maxTokens, setMaxTokens] = useState('');
  const [temperature, setTemperature] = useState('');
  const [timeoutSeconds, setTimeoutSeconds] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (open && existing) {
      setName(existing.name);
      setDisplayName(existing.displayName);
      setProviderType(existing.providerType);
      setBaseUrl(existing.baseUrl ?? '');
      setApiKey('');
      setModelName(existing.modelName);
      setMaxTokens(existing.maxTokens != null ? String(existing.maxTokens) : '');
      setTemperature(existing.temperature != null ? String(existing.temperature) : '');
      setTimeoutSeconds(existing.timeoutSeconds != null ? String(existing.timeoutSeconds) : '');
      setActive(existing.active);
    } else if (open && !existing) {
      setName('');
      setDisplayName('');
      setProviderType('OPENAI_COMPATIBLE');
      setBaseUrl('');
      setApiKey('');
      setModelName('');
      setMaxTokens('');
      setTemperature('');
      setTimeoutSeconds('');
      setActive(true);
    }
  }, [open, existing]);

  const createMutation = useMutation({
    mutationFn: (req: CreateSystemAiProviderRequest) => adminService.createSystemAiProvider(req),
    onSuccess: () => {
      toast.success(t('admin.ai.providerCreated', 'Provider created'));
      onSaved();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
  const updateMutation = useMutation({
    mutationFn: (req: { id: string; body: UpdateSystemAiProviderRequest }) =>
      adminService.updateSystemAiProvider(req.id, req.body),
    onSuccess: () => {
      toast.success(t('admin.ai.providerUpdated', 'Provider updated'));
      onSaved();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const requiresKey = providerType !== 'OLLAMA' && providerType !== 'OPENAI_COMPATIBLE';
  const requiresBaseUrl = providerType === 'OLLAMA' || providerType === 'OPENAI_COMPATIBLE' || providerType === 'ANTHROPIC';

  const handleSubmit = () => {
    if (mode === 'create') {
      if (!name || !modelName) return;
      const req: CreateSystemAiProviderRequest = {
        name: name.toLowerCase().trim(),
        displayName: displayName || name,
        providerType,
        baseUrl: baseUrl.trim() || undefined,
        apiKey: apiKey || undefined,
        modelName,
        maxTokens: maxTokens ? Number(maxTokens) : undefined,
        temperature: temperature ? Number(temperature) : undefined,
        timeoutSeconds: timeoutSeconds ? Number(timeoutSeconds) : undefined,
        active,
      };
      createMutation.mutate(req);
    } else if (mode === 'edit' && existing) {
      const body: UpdateSystemAiProviderRequest = {
        displayName,
        providerType,
        baseUrl: baseUrl.trim() || undefined,
        apiKey: apiKey || undefined, // empty string -> undefined keeps existing key
        modelName,
        maxTokens: maxTokens ? Number(maxTokens) : undefined,
        temperature: temperature ? Number(temperature) : undefined,
        timeoutSeconds: timeoutSeconds ? Number(timeoutSeconds) : undefined,
        active,
      };
      updateMutation.mutate({ id: existing.id, body });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create'
              ? t('admin.ai.addProvider', 'Add provider')
              : t('admin.ai.editProvider', 'Edit provider')}
          </DialogTitle>
          <DialogDescription>
            {t('admin.ai.dialogDesc', 'Configure a custom AI backend that becomes selectable as the platform default.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="grid gap-2">
            <Label className="text-xs">{t('admin.ai.fieldName', 'Identifier')}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="lm-studio"
              disabled={mode === 'edit'}
              className="font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              {t('admin.ai.fieldNameHelp', 'Lowercase, alphanumeric, dash or underscore. Used as the default-provider key.')}
            </p>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">{t('admin.ai.fieldDisplayName', 'Display name')}</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="LM Studio (dev)"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">{t('admin.ai.fieldProviderType', 'Provider type')}</Label>
            <Select value={providerType} onValueChange={(v) => setProviderType(v as AiProviderTypeValue)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROVIDER_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(providerType === 'OPENAI_COMPATIBLE' || providerType === 'OLLAMA') && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="space-y-1">
                <p>{t('admin.ai.localServerNote1', 'Local servers (LM Studio, llama.cpp, vLLM) may ignore client-supplied temperature, max-tokens or model selection. Set them in the provider UI as well.')}</p>
                <p>{t('admin.ai.localServerNote2', 'Most local models do not support OpenAI tool-calling, so the AI Coach falls back to context-stuffed prompts (limited to a recent slice of trades).')}</p>
                <p>{t('admin.ai.localServerNote3', 'Use “Test” after saving to list models actually loaded on the server and confirm the identifier above matches.')}</p>
              </div>
            </div>
          )}

          {requiresBaseUrl && (
            <div className="grid gap-2">
              <Label className="text-xs">{t('admin.ai.fieldBaseUrl', 'Base URL')}</Label>
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={
                  providerType === 'OLLAMA'
                    ? 'http://localhost:11434'
                    : providerType === 'ANTHROPIC'
                      ? 'https://api.anthropic.com'
                      : 'http://localhost:1234/v1'
                }
              />
              <p className="text-[11px] text-muted-foreground">
                {providerType === 'OPENAI_COMPATIBLE'
                  ? t('admin.ai.baseUrlHelpOpenAi', 'OpenAI-compatible endpoint. Examples: LM Studio (http://host:1234/v1), llama.cpp server, vLLM, Azure OpenAI.')
                  : t('admin.ai.baseUrlHelpGeneric', 'Optional override. Leave blank to use the provider default.')}
              </p>
            </div>
          )}

          <div className="grid gap-2">
            <Label className="text-xs">
              {t('admin.ai.fieldApiKey', 'API key')}
              {!requiresKey && <span className="ml-1 text-[10px] text-muted-foreground">{t('admin.ai.optional', '(optional)')}</span>}
            </Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={mode === 'edit' && existing?.hasApiKey ? '•'.repeat(12) : ''}
            />
            <p className="text-[11px] text-muted-foreground">
              {mode === 'edit'
                ? t('admin.ai.apiKeyEditHelp', 'Leave blank to keep the existing key. Provide a new value to rotate it.')
                : t('admin.ai.apiKeyHelp', 'Stored AES-256-GCM encrypted. Only required for cloud providers (Gemini, Anthropic, OpenRouter).')}
            </p>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">{t('admin.ai.fieldModel', 'Model')}</Label>
            <Input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder={
                providerType === 'GEMINI'
                  ? 'gemini-2.0-flash'
                  : providerType === 'ANTHROPIC'
                    ? 'claude-3-haiku-20240307'
                    : providerType === 'OLLAMA'
                      ? 'llama3'
                      : 'gpt-4o-mini'
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label className="text-xs">{t('admin.ai.fieldMaxTokens', 'Max tokens')}</Label>
              <Input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(e.target.value)}
                placeholder="2048"
                min={1}
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">{t('admin.ai.fieldTemperature', 'Temperature')}</Label>
              <Input
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="0.7"
                min={0}
                max={2}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">{t('admin.ai.fieldTimeout', 'Request timeout (seconds)')}</Label>
            <Input
              type="number"
              value={timeoutSeconds}
              onChange={(e) => setTimeoutSeconds(e.target.value)}
              placeholder="300"
              min={10}
              max={3600}
            />
            <p className="text-[11px] text-muted-foreground">
              {t('admin.ai.timeoutHelp', 'Bump for slow local reasoning models (qwen3, deepseek-r1, etc.). Default is 300s. Leave blank to use the default.')}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-md border bg-muted/20 p-3">
            <Label htmlFor="provider-active" className="text-sm font-normal">
              {t('admin.ai.fieldActive', 'Active')}
            </Label>
            <Switch id="provider-active" checked={active} onCheckedChange={setActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !name || !modelName}
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {mode === 'create' ? t('admin.ai.create', 'Create') : t('admin.ai.save', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Availability section ─────────────────────────────────────────────────────

function AvailabilitySection() {
  const { t } = useTranslation();
  const { data } = useQuery<AiDefaultProviderDto>({
    queryKey: DEFAULT_QUERY_KEY,
    queryFn: () => adminService.getAiDefaultProvider(),
    staleTime: 60 * 1000,
  });
  if (!data) return null;
  return (
    <Card className="border-border/40">
      <CardContent className="space-y-3 p-5">
        <h3 className="text-sm font-semibold">{t('admin.ai.availabilityTitle', 'Provider availability')}</h3>
        <p className="text-xs text-muted-foreground">
          {t('admin.ai.availabilityHelp', 'Live status of every registered provider. Unreachable ones will not be used by auto-selection.')}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {data.available.map((p) => (
            <div key={p.name} className="flex items-center justify-between rounded-md border bg-card/40 p-2.5 text-sm">
              <span className="flex items-center gap-2">
                <span>{p.displayName || p.name}</span>
                {p.custom && <Badge variant="outline" className="h-4 px-1 text-[10px]">{t('admin.ai.customBadge', 'Custom')}</Badge>}
              </span>
              {p.available ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {t('admin.ai.reachable', 'Reachable')}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <XCircle className="h-3.5 w-3.5" /> {t('admin.ai.unreachable', 'Unreachable')}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Public tab ───────────────────────────────────────────────────────────────

export default function AdminAiTab() {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('admin.ai.sectionTitle', 'AI Configuration')}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('admin.ai.sectionDescription', 'Choose the platform-wide default AI provider used by all users that have not configured a personal BYOK provider in their settings.')}
        </p>
      </div>
      <DefaultProviderSection />
      <CustomProvidersSection />
      <AvailabilitySection />
    </div>
  );
}
