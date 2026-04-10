import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Trash2, Plug, CheckCircle, XCircle, AlertCircle, Brain, Sparkles, Power } from 'lucide-react';
import { aiSettingsService } from '@/services/ai-settings.service';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
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
  useAiProviderConfig,
  useSaveAiConfig,
  useDeleteAiConfig,
  useTestAiConfig,
} from '@/hooks/useAiProviderConfig';
import type { UserAiConfigRequestDto, AiProviderTestResultDto } from '@/types/dto';
import { cn } from '@/lib/utils';

const PROVIDER_TYPES = [
  { value: 'OPENROUTER', label: 'OpenRouter (200+ models, free tier available)' },
  { value: 'OLLAMA', label: 'Ollama (local)' },
  { value: 'OPENAI_COMPATIBLE', label: 'OpenAI Compatible' },
  { value: 'GEMINI', label: 'Google Gemini' },
  { value: 'ANTHROPIC', label: 'Anthropic Claude' },
  { value: 'OPENROUTER', label: 'OpenRouter' },
];

const NEEDS_BASE_URL = ['OLLAMA', 'OPENAI_COMPATIBLE'];
const NEEDS_API_KEY = ['OPENAI_COMPATIBLE', 'GEMINI', 'ANTHROPIC', 'OPENROUTER'];

const DEFAULT_MODELS: Record<string, string> = {
  OPENROUTER: 'google/gemma-3-1b-it:free',
  OLLAMA: 'llama3',
  OPENAI_COMPATIBLE: 'gpt-4o-mini',
  GEMINI: 'gemini-1.5-pro',
  ANTHROPIC: 'claude-3-haiku-20240307',
  OPENROUTER: 'google/gemma-3-1b-it:free',
};

const AiProviderSettings: React.FC = () => {
  const { data: config, isLoading } = useAiProviderConfig();
  const { mutate: save, isPending: isSaving } = useSaveAiConfig();
  const { mutate: remove, isPending: isRemoving } = useDeleteAiConfig();
  const { mutate: test, isPending: isTesting } = useTestAiConfig();

  const queryClient = useQueryClient();

  // Fetch which provider is actually being used right now
  const { data: activeProvider } = useQuery({
    queryKey: ['ai-provider', 'active'],
    queryFn: () => aiSettingsService.getActiveProvider().then((r: any) => r.data),
    staleTime: 30_000,
  });

  // Toggle custom provider on/off
  const { mutate: toggleActive, isPending: isToggling } = useMutation({
    mutationFn: (active: boolean) => aiSettingsService.toggleActive(active).then(r => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData<UserAiConfigResponseDto | null>(['settings', 'ai-provider'], data);
      queryClient.invalidateQueries({ queryKey: ['ai-provider', 'active'] });
    },
  });

  const [providerType, setProviderType] = useState('OLLAMA');
  const [baseUrl, setBaseUrl] = useState('http://localhost:11434');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('llama3');
  const [maxTokens, setMaxTokens] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [testResult, setTestResult] = useState<AiProviderTestResultDto | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Pre-fill from existing config
  useEffect(() => {
    if (config) {
      setProviderType(config.providerType);
      setBaseUrl(config.baseUrl ?? '');
      setApiKey(''); // Never pre-fill API key — show masked version only
      setModelName(config.modelName);
      setMaxTokens(config.maxTokens !== undefined ? String(config.maxTokens) : '');
      setTemperature(config.temperature ?? 0.7);
    }
  }, [config]);

  // Auto-update model name when provider changes
  const handleProviderChange = (value: string) => {
    setProviderType(value);
    setModelName(DEFAULT_MODELS[value] ?? '');
    setTestResult(null);
    if (value === 'OLLAMA') {
      setBaseUrl('http://localhost:11434');
    } else {
      setBaseUrl('');
    }
  };

  const buildRequest = (): UserAiConfigRequestDto => ({
    providerType,
    baseUrl: NEEDS_BASE_URL.includes(providerType) ? baseUrl : undefined,
    apiKey: NEEDS_API_KEY.includes(providerType) && apiKey ? apiKey : undefined,
    modelName,
    maxTokens: maxTokens ? parseInt(maxTokens, 10) : undefined,
    temperature,
  });

  const handleSave = () => {
    save(buildRequest());
  };

  const handleTest = () => {
    setTestResult(null);
    test(buildRequest(), {
      onSuccess: (result) => setTestResult(result),
      onError: () =>
        setTestResult({ success: false, message: 'Connection failed.', latencyMs: 0 }),
    });
  };

  const handleDelete = () => {
    remove();
    setConfirmDelete(false);
  };

  const showBaseUrl = NEEDS_BASE_URL.includes(providerType);
  const showApiKey = NEEDS_API_KEY.includes(providerType);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active provider status banner */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full',
            activeProvider?.usingByok
              ? 'bg-blue-100 dark:bg-blue-900/30'
              : 'bg-primary/10'
          )}>
            {activeProvider?.usingByok ? (
              <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <Sparkles className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">
              Currently using: {activeProvider?.displayName ?? 'Loading...'}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeProvider?.usingByok
                ? 'You are using your own AI model.'
                : activeProvider?.platformProviderInfo ?? 'Platform default model'}
            </p>
          </div>
          {config && (
            <div className="flex items-center gap-2 shrink-0">
              <Label htmlFor="byok-toggle" className="text-xs text-muted-foreground">
                {config.active ? 'Custom AI active' : 'Using FollowUp Trading AI'}
              </Label>
              <Switch
                id="byok-toggle"
                checked={config.active}
                onCheckedChange={(checked) => toggleActive(checked)}
                disabled={isToggling}
              />
            </div>
          )}
        </div>
        {activeProvider?.fallbackUsed && (
          <div className="mt-3 flex gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              {activeProvider.fallbackReason}
            </p>
          </div>
        )}
      </div>

      {/* Info notice */}
      <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Configure your own AI provider below, or use the default <strong>FollowUp Trading AI</strong> (no configuration needed).
          When using your own provider, your trading data summaries are sent to the endpoint you configure.
        </p>
      </div>

      {(!config || config.active) && (
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">Custom AI Provider (Optional)</h3>
          {config?.active && (
            <span className="ml-auto text-xs bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-full px-2 py-0.5 font-medium">
              Active
            </span>
          )}
        </div>

        {/* Provider type */}
        <div className="space-y-2">
          <Label>Provider Type</Label>
          <Select value={providerType} onValueChange={handleProviderChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVIDER_TYPES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Base URL */}
        {showBaseUrl && (
          <div className="space-y-2">
            <Label htmlFor="base-url">Base URL</Label>
            <Input
              id="base-url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:11434"
            />
          </div>
        )}

        {/* API Key */}
        {showApiKey && (
          <div className="space-y-2">
            <Label htmlFor="api-key">
              API Key
              {config?.maskedApiKey && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (current: {config.maskedApiKey})
                </span>
              )}
            </Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={config?.maskedApiKey ? 'Leave empty to keep current key' : 'Enter API key'}
            />
          </div>
        )}

        {/* Model name */}
        <div className="space-y-2">
          <Label htmlFor="model-name">Model Name</Label>
          <Input
            id="model-name"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="e.g. llama3, gpt-4o-mini"
          />
        </div>

        {/* Max tokens (optional) */}
        <div className="space-y-2">
          <Label htmlFor="max-tokens">Max Tokens (optional)</Label>
          <Input
            id="max-tokens"
            type="number"
            min={1}
            max={128000}
            value={maxTokens}
            onChange={(e) => setMaxTokens(e.target.value)}
            placeholder="e.g. 4096"
          />
        </div>

        {/* Temperature slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Temperature (optional)</Label>
            <span className="text-sm text-muted-foreground tabular-nums">
              {temperature.toFixed(2)}
            </span>
          </div>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={[temperature]}
            onValueChange={([v]) => setTemperature(v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Precise</span>
            <span>Creative</span>
          </div>
        </div>

        {/* Test connection result */}
        {testResult && (
          <div
            className={cn(
              'flex items-start gap-2 p-3 rounded-lg border text-sm',
              testResult.success
                ? 'border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-950/20 text-green-800 dark:text-green-200'
                : 'border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-950/20 text-red-800 dark:text-red-200'
            )}
          >
            {testResult.success ? (
              <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-medium">{testResult.success ? 'Connection successful' : 'Connection failed'}</p>
              <p className="text-xs opacity-80">{testResult.message}</p>
              {testResult.success && testResult.latencyMs > 0 && (
                <p className="text-xs opacity-60 mt-0.5">Latency: {testResult.latencyMs}ms</p>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={isTesting || !modelName}
          >
            {isTesting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plug className="mr-2 h-4 w-4" />
            )}
            Test Connection
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !modelName}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save Configuration
          </Button>

          {config && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              disabled={isRemoving}
              className="ml-auto"
            >
              {isRemoving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Remove Configuration
            </Button>
          )}
        </div>
      </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove AI Provider Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your AI provider configuration. The AI Coach will fall back to the default
              system provider if available. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AiProviderSettings;
