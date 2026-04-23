import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Code,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Key,
  ExternalLink,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/hooks/useDeveloperApi';
import { toast } from 'sonner';
import { config } from '@/config';
import type { ApiKeyCreatedDto } from '@/types/dto';

const AVAILABLE_SCOPES = [
  { value: 'read:trades', labelKey: 'developer.scopeReadTrades' },
  { value: 'read:metrics', labelKey: 'developer.scopeReadMetrics' },
  { value: 'read:strategies', labelKey: 'developer.scopeReadStrategies' },
  { value: 'read:account', labelKey: 'developer.scopeReadAccount' },
] as const;

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  'read:trades': 'Access trade history, open positions, and trade details',
  'read:metrics': 'Access performance metrics, analytics, and statistics',
  'read:strategies': 'Access strategy configurations and parameters',
  'read:account': 'Access account info, balances, and preferences',
};

function maskApiKey(key: string): string {
  if (key.length <= 12) return key;
  return `${key.slice(0, 8)}${'*'.repeat(8)}`;
}

const DeveloperPortal: React.FC = () => {
  const { t } = useTranslation();
  const { data: keys = [], isLoading } = useApiKeys();
  const createMutation = useCreateApiKey();
  const revokeMutation = useRevokeApiKey();

  const [createOpen, setCreateOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [createdSecret, setCreatedSecret] = useState<ApiKeyCreatedDto | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Form state
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  useEffect(() => {
    document.title = `${t('developer.title')} | FollowUp Trading`;
  }, [t]);

  const resetForm = () => {
    setKeyName('');
    setSelectedScopes([]);
  };

  const handleCreate = async () => {
    if (!keyName.trim() || selectedScopes.length === 0) return;
    try {
      const result = await createMutation.mutateAsync({
        name: keyName.trim(),
        scopes: selectedScopes.join(','),
      });
      setCreateOpen(false);
      resetForm();
      setCreatedSecret(result);
      toast.success(t('developer.createSuccess'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleRevoke = async () => {
    if (!revokeId) return;
    try {
      await revokeMutation.mutateAsync(revokeId);
      setRevokeId(null);
      toast.success(t('developer.revokeSuccess'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleCopySecret = async () => {
    if (!createdSecret) return;
    await navigator.clipboard.writeText(createdSecret.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  };

  return (
    <DashboardLayout pageTitle={t('developer.title')}>
      <PageTransition className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Code className="w-6 h-6 text-primary" />
              {t('developer.title')}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{t('developer.subtitle')}</p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('developer.createKey')}
          </Button>
        </div>

        {/* API Base URL */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ExternalLink className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-1">
                {t('developer.baseUrl')}
              </p>
              <code className="text-sm font-mono text-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border inline-block">
                {config.apiBaseUrl}
              </code>
            </div>
          </div>
        </div>

        {/* Keys table */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : keys.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Key className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{t('developer.noKeys')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('developer.noKeysDesc')}</p>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                      {t('developer.keyName')}
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                      Key
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                      {t('developer.scopes')}
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                      {t('developer.rateLimit')}
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                      Status
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                      {t('developer.created')}
                    </th>
                    <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {keys.map((key) => (
                    <tr
                      key={key.id}
                      className="border-b border-border/40 hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-5 py-4 font-medium text-foreground">{key.name}</td>
                      <td className="px-5 py-4">
                        <code className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                          {maskApiKey(key.apiKey)}
                        </code>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {key.scopes.split(',').map((scope) => (
                            <Badge
                              key={scope}
                              variant="outline"
                              className="text-[10px] bg-primary/5 text-primary/80 border-primary/20"
                            >
                              {scope.trim()}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{key.rateLimit}/min</td>
                      <td className="px-5 py-4">
                        <Badge
                          variant="outline"
                          className={
                            key.isActive
                              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              : 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20'
                          }
                        >
                          {key.isActive ? 'Active' : 'Revoked'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs">
                        {new Date(key.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {key.isActive && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 dark:text-red-400 hover:text-red-500 dark:text-red-300 hover:bg-red-500/10"
                            onClick={() => setRevokeId(key.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Scopes reference */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">{t('developer.scopes')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AVAILABLE_SCOPES.map((scope) => (
              <div
                key={scope.value}
                className="rounded-xl bg-muted/30 border border-border/50 px-4 py-3"
              >
                <code className="text-xs font-mono text-primary">{scope.value}</code>
                <p className="text-xs text-muted-foreground mt-1">
                  {SCOPE_DESCRIPTIONS[scope.value]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </PageTransition>

      {/* Create Key Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="glass-panel border border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('developer.createKey')}</DialogTitle>
            <DialogDescription>{t('developer.subtitle')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="key-name">{t('developer.keyName')}</Label>
              <Input
                id="key-name"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="My Integration"
                className="bg-muted/50 border-border"
              />
            </div>
            <div className="space-y-3">
              <Label>{t('developer.scopes')}</Label>
              {AVAILABLE_SCOPES.map((scope) => (
                <div key={scope.value} className="flex items-center gap-3">
                  <Checkbox
                    id={`scope-${scope.value}`}
                    checked={selectedScopes.includes(scope.value)}
                    onCheckedChange={() => toggleScope(scope.value)}
                  />
                  <label
                    htmlFor={`scope-${scope.value}`}
                    className="text-sm text-foreground cursor-pointer"
                  >
                    {t(scope.labelKey)}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="border-border">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!keyName.trim() || selectedScopes.length === 0 || createMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('developer.createKey')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secret Reveal Dialog */}
      <Dialog
        open={!!createdSecret}
        onOpenChange={(open) => {
          if (!open) {
            setCreatedSecret(null);
            setCopiedSecret(false);
          }
        }}
      >
        <DialogContent className="glass-panel border border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              {t('developer.createSuccess')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-300">{t('developer.secretWarning')}</p>
            </div>
            <div className="relative">
              <code className="block text-xs font-mono text-foreground bg-muted border border-border rounded-xl px-4 py-3 break-all">
                {createdSecret?.secret}
              </code>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                onClick={handleCopySecret}
              >
                {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setCreatedSecret(null);
                setCopiedSecret(false);
              }}
              className="bg-primary hover:bg-primary/90"
            >
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation */}
      <AlertDialog open={!!revokeId} onOpenChange={(open) => { if (!open) setRevokeId(null); }}>
        <AlertDialogContent className="glass-panel border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('developer.revoke')}</AlertDialogTitle>
            <AlertDialogDescription>{t('developer.revokeConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t('developer.revoke')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default DeveloperPortal;
