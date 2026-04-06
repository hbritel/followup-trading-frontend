import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  FlaskConical,
  Trophy,
  Link2,
  AlertCircle,
  Target,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStartEvaluation, useEvaluations } from '@/hooks/usePropFirm';
import { useBrokerConnections } from '@/hooks/useBrokers';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import { cn } from '@/lib/utils';
import type { PropFirmProfile, EvaluationPhase } from '@/types/propfirm';

interface StartEvaluationDialogProps {
  firms: PropFirmProfile[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** Pre-select a specific firm when opening the dialog */
  defaultFirmCode?: string;
}

// CFD challenges use larger accounts; Futures are typically smaller
const FUTURES_KEYWORDS = ['futures', 'future', 'nq', 'es ', 'mnq', 'mes', 'rty', 'ym', 'cme'];

const isFuturesType = (challengeType: string | null): boolean => {
  if (!challengeType) return false;
  const lower = challengeType.toLowerCase();
  return FUTURES_KEYWORDS.some((kw) => lower.includes(kw));
};

const PRESET_BALANCES_CFD = [10_000, 25_000, 50_000, 100_000, 200_000];
const PRESET_BALANCES_FUTURES = [25_000, 50_000, 100_000, 150_000];

const formatBalance = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

// Return phases for the selected challenge type only — returns empty if no type selected
const getPhasesForChallengeType = (
  firm: PropFirmProfile,
  challengeType: string | null,
): EvaluationPhase[] => {
  if (!challengeType) return [];
  const typed = firm.phases.filter(
    (p) => p.challengeType === challengeType,
  );
  return typed.length > 0 ? typed : [];
};

// ─── Phase stepper ────────────────────────────────────────────────────────────

interface PhaseStepperProps {
  phases: EvaluationPhase[];
}

const PhaseStepItem: React.FC<{ phase: EvaluationPhase; isLast: boolean }> = ({
  phase,
  isLast,
}) => {
  const isFunded = phase.phaseName.toLowerCase().includes('funded');

  return (
    <div className="flex gap-3">
      {/* Connector column */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold',
            isFunded
              ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
              : 'border-primary/40 bg-primary/8 text-primary',
          )}
        >
          {isFunded ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <span>{phase.phaseOrder}</span>
          )}
        </div>
        {!isLast && <div className="mt-1 h-full w-px bg-border/50 min-h-[24px]" />}
      </div>

      {/* Content */}
      <div className={cn('pb-4 min-w-0 flex-1', isLast && 'pb-0')}>
        <p className={cn('text-sm font-semibold mb-2', isFunded && 'text-amber-400')}>
          {phase.phaseName}
        </p>

        {isFunded ? (
          <p className="text-xs text-muted-foreground">
            {phase.profitSplitPercent != null
              ? `Up to ${phase.profitSplitPercent}% profit split`
              : 'Funded account — trade with firm capital'}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {phase.profitTargetPercent != null && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-green-500/20 bg-green-500/8 px-2 py-1 text-[11px] font-mono text-green-400">
                <Target className="h-3 w-3" />
                {phase.profitTargetPercent}% target
              </span>
            )}
            {phase.maxDrawdownPercent != null && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/8 px-2 py-1 text-[11px] font-mono text-red-400">
                <TrendingDown className="h-3 w-3" />
                {phase.maxDrawdownPercent}% max DD
              </span>
            )}
            {phase.dailyLossLimitPercent != null && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-orange-500/20 bg-orange-500/8 px-2 py-1 text-[11px] font-mono text-orange-400">
                <AlertTriangle className="h-3 w-3" />
                {phase.dailyLossLimitPercent}% daily
              </span>
            )}
            {phase.minTradingDays > 0 && (
              <span className="text-[11px] text-muted-foreground self-center">
                Min. {phase.minTradingDays} days
                {phase.maxTradingDays ? ` · Max ${phase.maxTradingDays}` : ''}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const PhaseStepper: React.FC<PhaseStepperProps> = ({ phases }) => {
  // Sort by phaseOrder ascending
  const sorted = [...phases].sort((a, b) => a.phaseOrder - b.phaseOrder);

  return (
    <div
      className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-0 animate-in fade-in-0 duration-200"
      aria-label="Challenge phases"
    >
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Challenge Progression
      </p>
      {sorted.map((phase, idx) => (
        <PhaseStepItem key={phase.id} phase={phase} isLast={idx === sorted.length - 1} />
      ))}
    </div>
  );
};

// ─── Main dialog ──────────────────────────────────────────────────────────────

const StartEvaluationDialog: React.FC<StartEvaluationDialogProps> = ({
  firms,
  open,
  onOpenChange,
  onSuccess,
  defaultFirmCode,
}) => {
  const { toast } = useToast();
  const startEvaluation = useStartEvaluation();
  const { data: brokerConnections = [] } = useBrokerConnections();
  const { currentPlan } = useFeatureFlags();
  const { data: allEvaluations = [] } = useEvaluations();

  const [selectedFirmCode, setSelectedFirmCode] = useState<string>(defaultFirmCode ?? '');
  const [selectedChallengeType, setSelectedChallengeType] = useState<string>('');
  const [displayName, setDisplayName] = useState('');
  const [selectedBrokerConnectionId, setSelectedBrokerConnectionId] = useState<string>('');
  const [simulationMode, setSimulationMode] = useState(false);
  const [balanceInput, setBalanceInput] = useState('10000');

  // Sync state when dialog opens or defaultFirmCode changes
  useEffect(() => {
    if (open) {
      setSelectedFirmCode(defaultFirmCode ?? '');
      setSelectedChallengeType('');
      setDisplayName('');
      setSelectedBrokerConnectionId('');
      setSimulationMode(false);
      setBalanceInput('10000');
    }
  }, [open, defaultFirmCode]);

  // When the firm changes, reset challenge type selection
  useEffect(() => {
    setSelectedChallengeType('');
  }, [selectedFirmCode]);

  // When a broker connection is linked, disable simulation mode
  useEffect(() => {
    if (selectedBrokerConnectionId) {
      setSimulationMode(false);
    }
  }, [selectedBrokerConnectionId]);

  // Plan-based evaluation limits
  const PLAN_EVAL_LIMITS: Record<string, number> = {
    FREE: 0,
    STARTER: 1,
    PRO: 10,
    ELITE: Infinity,
  };

  const activeEvaluationCount = allEvaluations.filter(
    (e) => e.status === 'ACTIVE',
  ).length;

  const planLimit = PLAN_EVAL_LIMITS[currentPlan] ?? 0;
  const isAtPlanLimit = activeEvaluationCount >= planLimit;
  const isFreePlan = currentPlan === 'FREE';

  const selectedFirm = firms.find((f) => f.firmCode === selectedFirmCode) ?? null;
  const hasChallengeTypes = (selectedFirm?.challengeTypes?.length ?? 0) > 0;

  // All phases for the selected challenge type
  const relevantPhases = selectedFirm
    ? getPhasesForChallengeType(selectedFirm, selectedChallengeType || null)
    : [];

  // Contextual balance presets based on challenge type
  const isFutures = isFuturesType(selectedChallengeType || null);
  const presetBalances = isFutures ? PRESET_BALANCES_FUTURES : PRESET_BALANCES_CFD;

  const startingBalance = Number.parseFloat(balanceInput) || 10_000;
  const isChallengeTypeRequired = hasChallengeTypes;
  const isValid =
    !!selectedFirmCode &&
    startingBalance > 0 &&
    (!isChallengeTypeRequired || !!selectedChallengeType) &&
    !isAtPlanLimit;

  const activeConnections = brokerConnections.filter((c) => c.status === 'ACTIVE' || c.enabled);

  // Detect account type mismatch: warn when connecting a real (non-simulation) account
  const linkedConnection = activeConnections.find((c) => c.id === selectedBrokerConnectionId);
  const accountTypeMismatch =
    linkedConnection &&
    linkedConnection.accountType &&
    ['REAL', 'LIVE'].includes(linkedConnection.accountType.toUpperCase());

  const handleFirmChange = (code: string) => {
    setSelectedFirmCode(code);
  };

  const handleBrokerConnectionChange = (value: string) => {
    setSelectedBrokerConnectionId(value === '__none__' ? '' : value);
  };

  const handleSubmit = () => {
    if (!isValid) return;

    const payload = {
      propFirmCode: selectedFirmCode,
      simulationMode: selectedBrokerConnectionId ? false : simulationMode,
      startingBalance,
      ...(selectedChallengeType ? { challengeType: selectedChallengeType } : {}),
      ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
      ...(selectedBrokerConnectionId ? { brokerConnectionId: selectedBrokerConnectionId } : {}),
    };

    startEvaluation.mutate(payload, {
      onSuccess: () => {
        toast({
          title: 'Evaluation started',
          description: `Your ${selectedFirm?.firmName ?? ''} challenge is now being tracked.`,
        });
        onOpenChange(false);
        onSuccess?.();
      },
      onError: () => {
        toast({
          title: 'Failed to start evaluation',
          description: 'Please check your input and try again.',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Start New Evaluation
          </DialogTitle>
          <DialogDescription>
            Track your prop firm challenge. All compliance rules will be monitored automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Plan limit warning banner */}
          {isAtPlanLimit && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-3.5 flex items-start gap-3 animate-in fade-in-0 duration-200">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                {isFreePlan ? (
                  <>
                    <p className="text-sm font-medium text-amber-300">
                      Upgrade to Starter to create evaluations
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      The Free plan does not include prop firm tracking. Upgrade to Starter or
                      higher to start monitoring your challenges.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-amber-300">
                      Evaluation limit reached ({activeEvaluationCount}/{planLimit})
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your {currentPlan} plan supports up to{' '}
                      {planLimit === 1 ? '1 active evaluation' : `${planLimit} active evaluations`}.
                      Upgrade your plan or close an existing evaluation to continue.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Firm selector */}
          <div className="space-y-2">
            <Label htmlFor="firm-select">Prop Firm</Label>
            <Select value={selectedFirmCode} onValueChange={handleFirmChange}>
              <SelectTrigger id="firm-select">
                <SelectValue placeholder="Select a prop firm..." />
              </SelectTrigger>
              <SelectContent>
                {firms.map((firm) => (
                  <SelectItem key={firm.firmCode} value={firm.firmCode}>
                    <span className="flex items-center gap-2">
                      {firm.firmName}
                      <Badge variant="secondary" className="text-[10px]">
                        {(firm.challengeTypes?.length ?? 0) > 0
                          ? `${firm.challengeTypes.length} ${firm.challengeTypes.length === 1 ? 'challenge' : 'challenges'}`
                          : `${firm.phases.length} ${firm.phases.length === 1 ? 'phase' : 'phases'}`}
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Challenge type selector — shown only if the firm has multiple challenge types */}
          {selectedFirm && hasChallengeTypes && (
            <div className="space-y-2 animate-in fade-in-0 duration-200">
              <Label htmlFor="challenge-type-select">
                Challenge Type
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <Select value={selectedChallengeType} onValueChange={setSelectedChallengeType}>
                <SelectTrigger id="challenge-type-select">
                  <SelectValue placeholder="Select challenge type..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedFirm.challengeTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isChallengeTypeRequired && !selectedChallengeType && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Please select a challenge type to continue.
                </p>
              )}
            </div>
          )}

          {/* Phase stepper — all phases for the selected challenge type */}
          {relevantPhases.length > 0 && (
            <PhaseStepper phases={relevantPhases} />
          )}

          {/* Display name */}
          {selectedFirm && (
            <div className="space-y-2 animate-in fade-in-0 duration-200">
              <Label htmlFor="display-name">
                Name{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={`e.g. ${selectedFirm.firmName} 100K #2`}
                maxLength={80}
              />
              <p className="text-xs text-muted-foreground">
                Give this evaluation a memorable name to distinguish it from others.
              </p>
            </div>
          )}

          <Separator />

          {/* Starting balance */}
          <div className="space-y-2">
            <Label htmlFor="balance-input">
              Starting Balance
              {isFutures && selectedChallengeType && (
                <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                  (Futures account sizes)
                </span>
              )}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground text-sm select-none">
                $
              </span>
              <Input
                id="balance-input"
                className="pl-7 font-mono"
                type="number"
                min={1}
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                placeholder="10000"
              />
            </div>
            {/* Contextual preset balance buttons */}
            <div className="flex flex-wrap gap-1.5">
              {presetBalances.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-xs font-mono transition-colors',
                    startingBalance === preset
                      ? 'bg-primary/15 border-primary/40 text-primary font-semibold'
                      : 'bg-muted/40 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                  onClick={() => setBalanceInput(String(preset))}
                >
                  {formatBalance(preset)}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Account linking */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <Label>
                Linked Account{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
            </div>

            {activeConnections.length > 0 ? (
              <Select
                value={selectedBrokerConnectionId || '__none__'}
                onValueChange={handleBrokerConnectionChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a broker account..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-muted-foreground">No account — use simulation</span>
                  </SelectItem>
                  {activeConnections.map((conn) => (
                    <SelectItem key={conn.id} value={conn.id}>
                      <span className="flex items-center gap-2">
                        {conn.displayName ?? conn.brokerDisplayName ?? conn.brokerCode}
                        {conn.accountIdentifier && (
                          <span className="text-muted-foreground font-mono text-[10px]">
                            {conn.accountIdentifier}
                          </span>
                        )}
                        {conn.accountType && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0">
                            {conn.accountType}
                          </Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                No active broker accounts found. Connect one in Settings, or proceed in simulation
                mode.
              </div>
            )}

            {/* Account type mismatch warning */}
            {accountTypeMismatch && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 p-3 text-xs text-amber-400 flex items-start gap-2 animate-in fade-in-0 duration-200">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  You are linking a <strong>real/live</strong> account to a prop firm evaluation.
                  Prop firm challenges are typically run on demo or evaluation accounts.
                  Double-check that this is the correct account.
                </span>
              </div>
            )}

            {/* Simulation mode toggle — only if no account is linked */}
            {!selectedBrokerConnectionId && (
              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-3 animate-in fade-in-0 duration-150">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-violet-400" />
                  <div>
                    <p className="text-sm font-medium">Simulation Mode</p>
                    <p className="text-xs text-muted-foreground">
                      Practice without real account data
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={simulationMode}
                  onClick={() => setSimulationMode((v) => !v)}
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    simulationMode ? 'bg-violet-500' : 'bg-input',
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
                      simulationMode ? 'translate-x-4' : 'translate-x-0',
                    )}
                  />
                </button>
              </div>
            )}

            {/* Linked account confirmation label */}
            {linkedConnection && (
              <p className="text-xs text-primary flex items-center gap-1 animate-in fade-in-0 duration-150">
                <Link2 className="h-3 w-3" />
                Linked to{' '}
                <strong>
                  {linkedConnection.displayName ??
                    linkedConnection.brokerDisplayName ??
                    linkedConnection.brokerCode}
                </strong>
              </p>
            )}
          </div>

          {/* Bottom note */}
          <div className="flex items-start gap-2 rounded-xl border border-border/40 bg-muted/15 p-3 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>You can customize evaluation rules (profit target, drawdown limits, etc.) after creation from the evaluation detail page.</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || startEvaluation.isPending}>
            {startEvaluation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Tracking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StartEvaluationDialog;
