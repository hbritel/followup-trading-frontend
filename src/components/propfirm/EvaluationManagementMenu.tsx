import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  MoreVertical,
  Pencil,
  Link2,
  Link2Off,
  Settings2,
  XCircle,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useCancelEvaluation,
  useDeleteEvaluation,
  useRenameEvaluation,
  useLinkAccount,
  useUnlinkAccount,
  useUpdateRules,
} from '@/hooks/usePropFirm';
import { useBrokerConnections } from '@/hooks/useBrokers';
import type { EvaluationDashboard } from '@/types/propfirm';

interface EvaluationManagementMenuProps {
  dashboard: EvaluationDashboard;
  evaluationId: string;
  onCancelled?: () => void;
  onDeleted?: () => void;
}

// ---------------------------------------------------------------------------
// Sub-dialog: Rename
// ---------------------------------------------------------------------------
const RenameDialog: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  evaluationId: string;
  currentName: string | null;
}> = ({ open, onOpenChange, evaluationId, currentName }) => {
  const { toast } = useToast();
  const rename = useRenameEvaluation();
  const [value, setValue] = useState(currentName ?? '');

  const handleSubmit = () => {
    if (!value.trim()) return;
    rename.mutate(
      { id: evaluationId, displayName: value.trim() },
      {
        onSuccess: () => {
          toast({ title: 'Evaluation renamed successfully.' });
          onOpenChange(false);
        },
        onError: () => {
          toast({ title: 'Failed to rename evaluation.', variant: 'destructive' });
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) setValue(currentName ?? '');
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Rename Evaluation</DialogTitle>
          <DialogDescription>Give this evaluation a memorable name.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <Label htmlFor="rename-input">Display Name</Label>
          <Input
            id="rename-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. FTMO 100K Attempt #2"
            maxLength={80}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!value.trim() || rename.isPending}>
            {rename.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Sub-dialog: Link Account
// ---------------------------------------------------------------------------
const LinkAccountDialog: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  evaluationId: string;
  currentConnectionId: string | null;
}> = ({ open, onOpenChange, evaluationId, currentConnectionId }) => {
  const { toast } = useToast();
  const linkAccount = useLinkAccount();
  const { data: brokerConnections = [], isLoading } = useBrokerConnections();
  const [selectedId, setSelectedId] = useState(currentConnectionId ?? '');

  const activeConnections = brokerConnections.filter((c) => c.status === 'ACTIVE' || c.enabled);

  const handleSubmit = () => {
    if (!selectedId) return;
    linkAccount.mutate(
      { id: evaluationId, brokerConnectionId: selectedId },
      {
        onSuccess: () => {
          toast({ title: 'Account linked successfully.' });
          onOpenChange(false);
        },
        onError: () => {
          toast({ title: 'Failed to link account.', variant: 'destructive' });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Link Broker Account</DialogTitle>
          <DialogDescription>
            Connect this evaluation to one of your broker accounts to import real trade data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading accounts…
            </div>
          ) : activeConnections.length === 0 ? (
            <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              No active broker accounts found. Connect one in Settings first.
            </div>
          ) : (
            <>
              <Label htmlFor="link-account-select">Broker Account</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger id="link-account-select">
                  <SelectValue placeholder="Select an account…" />
                </SelectTrigger>
                <SelectContent>
                  {activeConnections.map((conn) => (
                    <SelectItem key={conn.id} value={conn.id}>
                      <span className="flex items-center gap-2">
                        {conn.displayName ?? conn.brokerDisplayName ?? conn.brokerCode}
                        {conn.accountIdentifier && (
                          <span className="text-muted-foreground font-mono text-[10px]">
                            {conn.accountIdentifier}
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedId || linkAccount.isPending || activeConnections.length === 0}
          >
            {linkAccount.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Link Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Sub-dialog: Edit Rules
// ---------------------------------------------------------------------------
interface EditRulesDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  evaluationId: string;
  dashboard: EvaluationDashboard;
}

const EditRulesDialog: React.FC<EditRulesDialogProps> = ({
  open,
  onOpenChange,
  evaluationId,
  dashboard,
}) => {
  const { toast } = useToast();
  const updateRules = useUpdateRules();

  const [profitTarget, setProfitTarget] = useState(
    dashboard.customProfitTargetPercent?.toString() ?? '',
  );
  const [maxDrawdown, setMaxDrawdown] = useState(
    dashboard.customMaxDrawdownPercent?.toString() ?? '',
  );
  const [dailyLoss, setDailyLoss] = useState(
    dashboard.customDailyLossLimitPercent?.toString() ?? '',
  );
  const [minDays, setMinDays] = useState(dashboard.minTradingDays?.toString() ?? '');
  const [maxDays, setMaxDays] = useState(dashboard.maxTradingDays?.toString() ?? '');

  const handleSubmit = () => {
    const rules: Record<string, number> = {};
    if (profitTarget !== '') rules.profitTargetPercent = Number(profitTarget);
    if (maxDrawdown !== '') rules.maxDrawdownPercent = Number(maxDrawdown);
    if (dailyLoss !== '') rules.dailyLossLimitPercent = Number(dailyLoss);
    if (minDays !== '') rules.minTradingDays = Number(minDays);
    if (maxDays !== '') rules.maxTradingDays = Number(maxDays);

    updateRules.mutate(
      { id: evaluationId, rules },
      {
        onSuccess: () => {
          toast({ title: 'Rules updated successfully.' });
          onOpenChange(false);
        },
        onError: () => {
          toast({ title: 'Failed to update rules.', variant: 'destructive' });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Edit Evaluation Rules</DialogTitle>
          <DialogDescription>
            Override the default phase rules for this evaluation. Leave a field blank to use the
            default value.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rule-profit">Profit Target (%)</Label>
              <Input
                id="rule-profit"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={profitTarget}
                onChange={(e) => setProfitTarget(e.target.value)}
                placeholder={`Default: ${dashboard.profitTargetPercent ?? '—'}%`}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rule-drawdown">Max Drawdown (%)</Label>
              <Input
                id="rule-drawdown"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={maxDrawdown}
                onChange={(e) => setMaxDrawdown(e.target.value)}
                placeholder={`Default: ${dashboard.drawdownLimitPercent ?? '—'}%`}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rule-daily">Daily Loss Limit (%)</Label>
              <Input
                id="rule-daily"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={dailyLoss}
                onChange={(e) => setDailyLoss(e.target.value)}
                placeholder={`Default: ${dashboard.dailyLossLimitPercent ?? '—'}%`}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rule-min-days">Min Trading Days</Label>
              <Input
                id="rule-min-days"
                type="number"
                min={0}
                step={1}
                value={minDays}
                onChange={(e) => setMinDays(e.target.value)}
                placeholder={`Default: ${dashboard.minTradingDays ?? '—'}`}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rule-max-days">Max Trading Days</Label>
              <Input
                id="rule-max-days"
                type="number"
                min={0}
                step={1}
                value={maxDays}
                onChange={(e) => setMaxDays(e.target.value)}
                placeholder={dashboard.maxTradingDays ? `Default: ${dashboard.maxTradingDays}` : 'No limit'}
                className="font-mono"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Custom rules override phase defaults only for this evaluation — they do not affect the
            global prop firm profile.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateRules.isPending}>
            {updateRules.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Rules
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const EvaluationManagementMenu: React.FC<EvaluationManagementMenuProps> = ({
  dashboard,
  evaluationId,
  onCancelled,
  onDeleted,
}) => {
  const { toast } = useToast();
  const cancelEvaluation = useCancelEvaluation();
  const deleteEvaluation = useDeleteEvaluation();
  const unlinkAccount = useUnlinkAccount();

  const [renameOpen, setRenameOpen] = useState(false);
  const [linkAccountOpen, setLinkAccountOpen] = useState(false);
  const [editRulesOpen, setEditRulesOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const isLinked = !!dashboard.brokerConnectionId;
  const isActive = dashboard.status === 'ACTIVE';

  const handleUnlinkAccount = () => {
    unlinkAccount.mutate(evaluationId, {
      onSuccess: () => {
        toast({ title: 'Account unlinked successfully.' });
      },
      onError: () => {
        toast({ title: 'Failed to unlink account.', variant: 'destructive' });
      },
    });
  };

  const handleCancelConfirm = () => {
    cancelEvaluation.mutate(evaluationId, {
      onSuccess: () => {
        toast({ title: 'Evaluation ended.' });
        onCancelled?.();
      },
      onError: () => {
        toast({ title: 'Failed to end evaluation.', variant: 'destructive' });
      },
    });
  };

  const handleDeleteConfirm = () => {
    deleteEvaluation.mutate(evaluationId, {
      onSuccess: () => {
        toast({ title: 'Evaluation permanently deleted.' });
        onDeleted?.();
      },
      onError: () => {
        toast({ title: 'Failed to delete evaluation.', variant: 'destructive' });
      },
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Evaluation management options"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Manage Evaluation
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {isActive && (
            <>
              <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setLinkAccountOpen(true)}>
                <Link2 className="mr-2 h-4 w-4" />
                {isLinked ? 'Change Account' : 'Link Account'}
              </DropdownMenuItem>

              {isLinked && (
                <DropdownMenuItem
                  onClick={handleUnlinkAccount}
                  disabled={unlinkAccount.isPending}
                  className="text-muted-foreground"
                >
                  {unlinkAccount.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Link2Off className="mr-2 h-4 w-4" />
                  )}
                  Unlink Account
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={() => setEditRulesOpen(true)}>
                <Settings2 className="mr-2 h-4 w-4" />
                Edit Rules
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setCancelConfirmOpen(true)}
                disabled={cancelEvaluation.isPending}
              >
                {cancelEvaluation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                End Evaluation
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={deleteEvaluation.isPending}
          >
            {deleteEvaluation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete Evaluation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename dialog */}
      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        evaluationId={evaluationId}
        currentName={dashboard.displayName}
      />

      {/* Link account dialog */}
      <LinkAccountDialog
        open={linkAccountOpen}
        onOpenChange={setLinkAccountOpen}
        evaluationId={evaluationId}
        currentConnectionId={dashboard.brokerConnectionId}
      />

      {/* Edit rules dialog */}
      <EditRulesDialog
        open={editRulesOpen}
        onOpenChange={setEditRulesOpen}
        evaluationId={evaluationId}
        dashboard={dashboard}
      />

      {/* Cancel confirmation */}
      <AlertDialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Evaluation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently end the evaluation for{' '}
              <strong>{dashboard.displayName ?? dashboard.firmName}</strong>. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Tracking</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancelConfirm}
            >
              End Evaluation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Evaluation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the evaluation for{' '}
              <strong>{dashboard.displayName ?? dashboard.firmName}</strong> and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EvaluationManagementMenu;
