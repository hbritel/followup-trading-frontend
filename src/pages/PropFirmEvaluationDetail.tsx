import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Loader2,
  Link2,
  Settings2,
  CheckCircle,
  Clock,
  Trophy,
  Ban,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useEvaluationDashboard,
  useEvaluationDailySummary,
  useForceComplianceCheck,
  useRecordSimulatedTrade,
} from '@/hooks/usePropFirm';
import ComplianceGauge from '@/components/propfirm/ComplianceGauge';
import EvaluationManagementMenu from '@/components/propfirm/EvaluationManagementMenu';
import AlertsPanel from '@/components/propfirm/AlertsPanel';
import { cn } from '@/lib/utils';
import type { EvaluationStatus, DailySummary } from '@/types/propfirm';

// ---------------------------------------------------------------------------
// Status config — now includes an icon component
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<
  EvaluationStatus,
  {
    label: string;
    badgeClass: string;
    Icon: React.ElementType;
  }
> = {
  ACTIVE: {
    label: 'Active',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Icon: Clock,
  },
  PASSED: {
    label: 'Passed',
    badgeClass: 'bg-green-500/10 text-green-400 border-green-500/20',
    Icon: CheckCircle,
  },
  FAILED: {
    label: 'Failed',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
    Icon: XCircle,
  },
  EXPIRED: {
    label: 'Expired',
    badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    Icon: Ban,
  },
  FUNDED: {
    label: 'Funded',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Icon: Trophy,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (iso: string): string => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

/** Returns "X days ago" from an ISO date string. */
const daysAgo = (iso: string): string => {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  } catch {
    return '';
  }
};

/** Today's date in LOCAL timezone formatted as YYYY-MM-DD for input[type=date]. */
const todayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
const DetailSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-7 w-48" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-2xl" />
      ))}
    </div>
    <Skeleton className="h-40 rounded-2xl" />
    <Skeleton className="h-64 rounded-2xl" />
  </div>
);

// ---------------------------------------------------------------------------
// Custom rules badge helper
// ---------------------------------------------------------------------------
const hasCustomRules = (dashboard: {
  customProfitTargetPercent: number | null;
  customMaxDrawdownPercent: number | null;
  customDailyLossLimitPercent: number | null;
}): boolean =>
  dashboard.customProfitTargetPercent != null ||
  dashboard.customMaxDrawdownPercent != null ||
  dashboard.customDailyLossLimitPercent != null;

// ---------------------------------------------------------------------------
// Phase stepper sub-component
// ---------------------------------------------------------------------------
interface PhaseStepperProps {
  currentPhase: number;
  totalPhases: number;
  status: EvaluationStatus;
  /** 0-100 progress towards profit target in current phase */
  profitProgressPercent: number;
  /** Current drawdown percent (positive number) */
  currentDrawdownPercent: number;
}

const PhaseStepper: React.FC<PhaseStepperProps> = ({
  currentPhase,
  totalPhases,
  status,
  profitProgressPercent,
  currentDrawdownPercent,
}) => {
  const steps: string[] = [];
  for (let i = 1; i <= totalPhases - 1; i++) {
    steps.push(`Phase ${i}`);
  }
  steps.push('Funded');

  // Clamp progress to 0-100
  const progress = Math.max(0, Math.min(100, profitProgressPercent));
  const isNegative = profitProgressPercent < 0 || currentDrawdownPercent > 3;
  const isFailed = status === 'FAILED';

  // Pre-compute step metadata
  const stepData = steps.map((label, idx) => {
    const stepNumber = idx + 1;
    const isCompleted = stepNumber < currentPhase || (stepNumber === totalPhases && status === 'FUNDED');
    const isActive = stepNumber === currentPhase && status !== 'FUNDED';
    const isFundedStep = label === 'Funded' && status === 'FUNDED';
    const connectorIsCompleted = stepNumber < currentPhase;
    const connectorIsActive = stepNumber === currentPhase && status !== 'FUNDED';
    const fillPercent = connectorIsCompleted ? 100 : connectorIsActive ? progress : 0;

    const circleClass = isCompleted || isFundedStep
      ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30'
      : isActive && isFailed
      ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30'
      : isActive && isNegative
      ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30'
      : isActive
      ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30'
      : 'bg-muted/20 border-border/50 text-muted-foreground';

    const fillColor = connectorIsCompleted
      ? 'bg-green-500'
      : connectorIsActive && isFailed ? 'bg-red-500'
      : connectorIsActive && isNegative ? 'bg-amber-500'
      : connectorIsActive ? 'bg-primary'
      : '';

    const labelClass = isActive && isFailed ? 'text-red-400'
      : isActive && isNegative ? 'text-amber-400'
      : isActive ? 'text-primary'
      : isCompleted || isFundedStep ? 'text-green-400'
      : 'text-muted-foreground/60';

    return { label, stepNumber, isCompleted, isActive, isFundedStep, connectorIsActive, fillPercent, circleClass, fillColor, labelClass };
  });

  return (
    <div className="w-full">
      {/* Row 1: Circles + connector bars — perfectly aligned */}
      <div className="flex items-center w-full">
        {stepData.map((s, idx) => (
          <React.Fragment key={s.label}>
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500 shrink-0 z-10',
                s.circleClass,
              )}
            >
              {s.isCompleted || s.isFundedStep ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : s.isActive && isFailed ? (
                <XCircle className="h-5 w-5" />
              ) : (
                s.stepNumber
              )}
            </div>
            {idx < stepData.length - 1 && (
              <div className="flex-1 h-2 rounded-full bg-border/30 overflow-hidden mx-2">
                <div
                  className={cn('h-full rounded-full transition-all duration-700 ease-out', s.fillColor || 'bg-transparent')}
                  style={{ width: `${s.fillPercent}%` }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Row 2: Labels below each circle — aligned via same flex proportions */}
      <div className="flex items-start w-full mt-2">
        {stepData.map((s, idx) => (
          <React.Fragment key={`label-${s.label}`}>
            {/* Label column — same width as the circle (w-10) */}
            <div className="flex flex-col items-center shrink-0 w-10">
              <span className={cn('text-xs font-semibold whitespace-nowrap', s.labelClass)}>
                {s.label}
              </span>
              {s.connectorIsActive && !isFailed && (
                <span className={cn('text-[10px] font-mono', isNegative ? 'text-amber-400' : 'text-primary/70')}>
                  {Math.round(progress)}%
                </span>
              )}
            </div>
            {/* Spacer matching the connector width */}
            {idx < stepData.length - 1 && <div className="flex-1 mx-2" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Simulated Trade Form sub-component
// ---------------------------------------------------------------------------
interface SimulatedTradeFormProps {
  evaluationId: string;
  onSuccess: () => void;
}

const SimulatedTradeForm: React.FC<SimulatedTradeFormProps> = ({ evaluationId, onSuccess }) => {
  const { toast } = useToast();
  const recordTrade = useRecordSimulatedTrade();

  const [pnl, setPnl] = useState('');
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pnlNum = parseFloat(pnl);
    if (isNaN(pnlNum)) {
      toast({ title: 'Invalid P&L', description: 'Enter a valid number.', variant: 'destructive' });
      return;
    }
    if (!date) {
      toast({ title: 'Date required', description: 'Select a date for this trade.', variant: 'destructive' });
      return;
    }

    recordTrade.mutate(
      { evaluationId, pnl: pnlNum, date, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast({
            title: 'Simulated trade recorded',
            description: `${formatCurrency(pnlNum)} P&L logged for ${formatDate(date)}.`,
          });
          setPnl('');
          setNote('');
          setDate(todayIso());
          onSuccess();
        },
        onError: () => {
          toast({
            title: 'Failed to record trade',
            description: 'Could not save the simulated trade. Please try again.',
            variant: 'destructive',
          });
        },
      },
    );
  };

  const pnlNum = parseFloat(pnl);
  const isPositive = !isNaN(pnlNum) && pnlNum >= 0;
  const isNegative = !isNaN(pnlNum) && pnlNum < 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* P&L field */}
        <div className="space-y-1.5">
          <Label htmlFor="sim-pnl" className="text-xs text-muted-foreground font-medium">
            P&L Amount (USD)
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              $
            </span>
            <Input
              id="sim-pnl"
              type="number"
              step="0.01"
              placeholder="e.g. 250.00 or -150.00"
              value={pnl}
              onChange={(e) => setPnl(e.target.value)}
              className={cn(
                'pl-7 font-mono',
                isPositive && 'text-green-400',
                isNegative && 'text-red-400',
              )}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Use negative values for losing trades (e.g. -250.00).
          </p>
        </div>

        {/* Date field */}
        <div className="space-y-1.5">
          <Label htmlFor="sim-date" className="text-xs text-muted-foreground font-medium">
            Trade Date
          </Label>
          <Input
            id="sim-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={todayIso()}
          />
        </div>
      </div>

      {/* Note field */}
      <div className="space-y-1.5">
        <Label htmlFor="sim-note" className="text-xs text-muted-foreground font-medium">
          Note (optional)
        </Label>
        <Textarea
          id="sim-note"
          placeholder="Brief description of this simulated trade..."
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="text-sm resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          size="sm"
          disabled={recordTrade.isPending || !pnl || !date}
          className="flex items-center gap-2"
        >
          {recordTrade.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <PlusCircle className="h-3.5 w-3.5" />
          )}
          Record Trade
        </Button>
        {!isNaN(pnlNum) && pnl !== '' && (
          <span
            className={cn(
              'text-sm font-mono font-semibold',
              isPositive ? 'text-green-400' : 'text-red-400',
            )}
          >
            {isPositive ? '+' : ''}
            {formatCurrency(pnlNum)}
          </span>
        )}
      </div>
    </form>
  );
};

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
const PropFirmEvaluationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const evaluationId = id ?? '';

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useEvaluationDashboard(evaluationId);

  const { data: dailySummaries = [], isLoading: summaryLoading } =
    useEvaluationDailySummary(evaluationId);

  const forceCheck = useForceComplianceCheck();

  // Collapsible sim-trade panel
  const [simPanelOpen, setSimPanelOpen] = useState(false);

  const handleForceCheck = () => {
    forceCheck.mutate(evaluationId, {
      onSuccess: () => {
        toast({
          title: 'Compliance check complete',
          description: 'All rules have been re-evaluated against your latest trades.',
        });
      },
      onError: () => {
        toast({
          title: 'Force check failed',
          description: 'Could not run compliance check. Please try again.',
          variant: 'destructive',
        });
      },
    });
  };

  if (dashboardLoading) {
    return (
      <DashboardLayout pageTitle="Evaluation Details">
        <DetailSkeleton />
      </DashboardLayout>
    );
  }

  if (dashboardError || !dashboard) {
    return (
      <DashboardLayout pageTitle="Evaluation Details">
        <PageTransition>
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-muted-foreground text-sm">
              {dashboardError ? 'Failed to load evaluation details.' : 'Evaluation not found.'}
            </p>
            <Button variant="outline" onClick={() => navigate('/prop-firm')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Prop Firm Hub
            </Button>
          </div>
        </PageTransition>
      </DashboardLayout>
    );
  }

  const statusCfg = STATUS_CONFIG[dashboard.status] ?? STATUS_CONFIG.ACTIVE;
  const { Icon: StatusIcon } = statusCfg;
  const pnlPositive = dashboard.totalPnl >= 0;
  const dailyPnlPositive = dashboard.dailyPnl >= 0;

  const headerTitle =
    dashboard.displayName ??
    (dashboard.challengeType
      ? `${dashboard.firmName} — ${dashboard.challengeType}`
      : dashboard.firmName);

  const pageTitle = `${dashboard.firmName} — ${dashboard.phaseName}`;

  // Profit target progress: profitProgressPercent already in [0, 100+]
  const profitProgress = Math.min(dashboard.profitProgressPercent, 100);
  const profitReached = dashboard.profitProgressPercent >= 100;

  // Prop firm logo placeholder (use first two letters of firm name as fallback)
  const firmInitials = dashboard.firmName.slice(0, 2).toUpperCase();

  // Daily summary totals
  const totalPnl = dailySummaries.reduce((acc, d) => acc + d.pnl, 0);
  const totalTrades = dailySummaries.reduce((acc, d) => acc + d.tradeCount, 0);
  const totalPnlPercent =
    dailySummaries.length > 0 ? dailySummaries[dailySummaries.length - 1].cumulativePnlPercent : 0;
  const allCompliant = dailySummaries.every((d) => d.dailyLossCompliant && d.maxDrawdownCompliant);

  return (
    <DashboardLayout pageTitle={pageTitle}>
      <PageTransition className="space-y-6">
        {/* ------------------------------------------------------------------ */}
        {/* Simulation mode banner                                              */}
        {/* ------------------------------------------------------------------ */}
        {dashboard.simulationMode && (
          <div className="flex items-start gap-3 rounded-xl border border-violet-500/30 bg-violet-500/8 px-4 py-3">
            <FlaskConical className="h-5 w-5 text-violet-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-violet-300">Simulation Mode</p>
              <p className="text-xs text-violet-400/80 mt-0.5">
                This evaluation is running in simulation mode. Trades recorded here are practice
                entries and do not affect your live broker account. Use the "Record Simulated Trade"
                panel below to log hypothetical positions and test your rule compliance.
              </p>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Header bar                                                          */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/prop-firm')}
              className="flex items-center gap-1.5 text-muted-foreground shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="h-5 w-px bg-border shrink-0" />

            {/* Firm logo / initials + title */}
            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
              {/* Logo placeholder — 24x24 rounded */}
              <div
                className="w-6 h-6 rounded bg-primary/15 flex items-center justify-center text-[9px] font-bold text-primary shrink-0"
                aria-hidden="true"
              >
                {firmInitials}
              </div>

              <h1 className="text-lg font-bold truncate">{headerTitle}</h1>

              {/* Challenge type badge */}
              {dashboard.challengeType && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-border text-muted-foreground shrink-0"
                >
                  {dashboard.challengeType}
                </Badge>
              )}

              {/* Status badge — larger, with icon */}
              <Badge
                variant="secondary"
                className={cn(
                  'text-[11px] border font-semibold flex items-center gap-1 px-2 py-0.5 shrink-0',
                  statusCfg.badgeClass,
                )}
              >
                <StatusIcon className="h-3 w-3" />
                {statusCfg.label}
              </Badge>

              {dashboard.simulationMode ? (
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-violet-500/10 text-violet-400 border-violet-500/20 flex items-center gap-0.5 shrink-0"
                >
                  <FlaskConical className="h-2.5 w-2.5" />
                  Simulation
                </Badge>
              ) : dashboard.brokerConnectionDisplayName ? (
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-primary/8 text-primary/80 border-primary/20 flex items-center gap-0.5 shrink-0"
                >
                  <Link2 className="h-2.5 w-2.5" />
                  {dashboard.brokerConnectionDisplayName}
                </Badge>
              ) : null}

              {hasCustomRules(dashboard) && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-orange-500/30 text-orange-400 flex items-center gap-0.5 shrink-0"
                >
                  <Settings2 className="h-2.5 w-2.5" />
                  Custom Rules
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">
                Phase {dashboard.currentPhase} of {dashboard.totalPhases} &middot;{' '}
                {dashboard.phaseName}
              </p>
              <p className="text-[11px] text-muted-foreground/60">
                Started {formatDate(dashboard.startDate ? dashboard.startDate : new Date().toISOString())} &middot; {daysAgo(dashboard.startDate ?? new Date().toISOString())}
              </p>
            </div>
            {dashboard.status === 'ACTIVE' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleForceCheck}
                disabled={forceCheck.isPending}
                className="flex items-center gap-2"
              >
                {forceCheck.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Force Check
              </Button>
            )}
            <EvaluationManagementMenu
              dashboard={dashboard}
              evaluationId={evaluationId}
              onCancelled={() => navigate('/prop-firm')}
              onDeleted={() => navigate('/prop-firm')}
            />
          </div>
        </div>

        {/* Phase / date subtitle on mobile */}
        <div className="sm:hidden -mt-3 flex flex-col gap-0.5">
          <p className="text-xs text-muted-foreground">
            Phase {dashboard.currentPhase} of {dashboard.totalPhases} &middot; {dashboard.phaseName}
          </p>
          <p className="text-[11px] text-muted-foreground/60">
            Started {formatDate(dashboard.startDate ?? new Date().toISOString())} &middot;{' '}
            {daysAgo(dashboard.startDate ?? new Date().toISOString())}
          </p>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Phase stepper                                                       */}
        {/* ------------------------------------------------------------------ */}
        {dashboard.totalPhases > 1 && (
          <Card className="glass-card rounded-2xl">
            <CardContent className="px-5 py-4">
              <PhaseStepper
                currentPhase={dashboard.currentPhase}
                totalPhases={dashboard.totalPhases}
                status={dashboard.status}
                profitProgressPercent={dashboard.profitProgressPercent ?? 0}
                currentDrawdownPercent={dashboard.currentDrawdownPercent ?? 0}
              />
            </CardContent>
          </Card>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Key metric cards                                                    */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Current Balance */}
          <Card className="glass-card rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Balance
                </p>
              </div>
              <p className="text-xl font-bold font-mono">
                {formatCurrency(dashboard.currentBalance)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Started: {formatCurrency(dashboard.startingBalance)}
              </p>
            </CardContent>
          </Card>

          {/* Total P&L — with up/down arrow sparkline indicator */}
          <Card className="glass-card rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {pnlPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )}
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Total P&amp;L
                  </p>
                </div>
                {pnlPositive ? (
                  <ArrowUpRight className="h-4 w-4 text-green-400" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-400" />
                )}
              </div>
              <p
                className={cn(
                  'text-xl font-bold font-mono',
                  pnlPositive ? 'text-green-400' : 'text-red-400',
                )}
              >
                {pnlPositive ? '+' : ''}
                {dashboard.totalPnlPercent.toFixed(2)}%
              </p>
              <p
                className={cn(
                  'text-xs mt-1 font-mono',
                  pnlPositive ? 'text-green-400/70' : 'text-red-400/70',
                )}
              >
                {pnlPositive ? '+' : ''}
                {formatCurrency(dashboard.totalPnl)}
              </p>
            </CardContent>
          </Card>

          {/* Drawdown — with up/down arrow sparkline indicator */}
          <Card className="glass-card rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={cn(
                      'h-4 w-4',
                      dashboard.currentDrawdownPercent > dashboard.drawdownLimitPercent * 0.8
                        ? 'text-red-400'
                        : 'text-muted-foreground',
                    )}
                  />
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Drawdown
                  </p>
                </div>
                {dashboard.currentDrawdownPercent > 0 ? (
                  <ArrowDownRight
                    className={cn(
                      'h-4 w-4',
                      dashboard.currentDrawdownPercent > dashboard.drawdownLimitPercent * 0.8
                        ? 'text-red-400'
                        : 'text-amber-400',
                    )}
                  />
                ) : null}
              </div>
              <p
                className={cn(
                  'text-xl font-bold font-mono',
                  dashboard.currentDrawdownPercent > dashboard.drawdownLimitPercent * 0.8
                    ? 'text-red-400'
                    : 'text-foreground',
                )}
              >
                {dashboard.currentDrawdownPercent.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Limit: {dashboard.drawdownLimitPercent.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          {/* Trading Days */}
          <Card className="glass-card rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Trading Days
                </p>
              </div>
              <p className="text-xl font-bold font-mono">{dashboard.tradingDaysCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Min: {dashboard.minTradingDays}
                {dashboard.maxTradingDays ? ` · Max: ${dashboard.maxTradingDays}` : ''}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Profit Target Progress — full-width prominent bar                  */}
        {/* ------------------------------------------------------------------ */}
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-semibold">Profit Target Progress</span>
              </div>
              <div className="flex items-center gap-3">
                {profitReached && (
                  <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-[10px] font-bold">
                    Target Reached!
                  </Badge>
                )}
                {/* Funded profit split info */}
                {dashboard.status === 'FUNDED' && (
                  <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">
                    Funded: 95% profit split
                  </Badge>
                )}
                <span className="text-sm font-mono font-bold tabular-nums">
                  <span className={pnlPositive ? 'text-green-400' : 'text-red-400'}>
                    {dashboard.totalPnlPercent.toFixed(2)}%
                  </span>
                  <span className="text-muted-foreground font-normal text-xs">
                    {' '}/ {dashboard.profitTargetPercent.toFixed(1)}%
                  </span>
                </span>
              </div>
            </div>

            {/* Full-width progress bar with current % marker */}
            <div className="relative">
              <div className="h-4 w-full bg-green-500/10 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    profitReached ? 'bg-green-400' : 'bg-green-500',
                  )}
                  style={{ width: `${profitProgress}%` }}
                />
              </div>
              {/* Target marker line at 100% */}
              <div
                className="absolute top-0 h-4 w-0.5 bg-green-300/60 rounded"
                style={{ right: '0%' }}
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-muted-foreground">0%</span>
              <span className="text-[11px] text-muted-foreground">
                Target: {dashboard.profitTargetPercent.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ------------------------------------------------------------------ */}
        {/* Today's P&L summary                                                */}
        {/* ------------------------------------------------------------------ */}
        <Card className="glass-card rounded-2xl">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-semibold">Today</CardTitle>
          </CardHeader>
          <CardContent className="pt-1 pb-4">
            <div className="flex items-center gap-3">
              {dailyPnlPositive ? (
                <TrendingUp className="h-5 w-5 text-green-400 shrink-0" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-400 shrink-0" />
              )}
              <p
                className={cn(
                  'text-2xl font-bold font-mono',
                  dailyPnlPositive ? 'text-green-400' : 'text-red-400',
                )}
              >
                {dailyPnlPositive ? '+' : ''}
                {dashboard.dailyPnlPercent.toFixed(2)}%
              </p>
              <span
                className={cn(
                  'text-sm font-mono',
                  dailyPnlPositive ? 'text-green-400/70' : 'text-red-400/70',
                )}
              >
                ({dailyPnlPositive ? '+' : ''}
                {formatCurrency(dashboard.dailyPnl)})
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                Daily loss limit: {dashboard.dailyLossLimitPercent.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ------------------------------------------------------------------ */}
        {/* Compliance gauges                                                   */}
        {/* ------------------------------------------------------------------ */}
        <Card className="glass-card rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Compliance Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pb-5">
            <ComplianceGauge
              label="Profit Target"
              current={dashboard.totalPnlPercent}
              limit={dashboard.profitTargetPercent}
              type="profit"
            />
            <ComplianceGauge
              label="Max Drawdown"
              current={dashboard.currentDrawdownPercent}
              limit={dashboard.drawdownLimitPercent}
              type="drawdown"
            />
            <ComplianceGauge
              label="Daily Loss Limit"
              current={Math.abs(Math.min(dashboard.dailyPnlPercent, 0))}
              limit={dashboard.dailyLossLimitPercent}
              type="daily-loss"
            />
          </CardContent>
        </Card>

        {/* ------------------------------------------------------------------ */}
        {/* Active alerts                                                       */}
        {/* ------------------------------------------------------------------ */}
        {dashboard.status === 'ACTIVE' && (
          <AlertsPanel evaluationId={evaluationId} status={dashboard.status} />
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Simulated trade panel (simulation mode only)                        */}
        {/* ------------------------------------------------------------------ */}
        {dashboard.simulationMode && (
          <Card className="glass-card rounded-2xl border-violet-500/20">
            <CardHeader className="pb-2">
              <button
                type="button"
                className="flex items-center justify-between w-full text-left"
                onClick={() => setSimPanelOpen((v) => !v)}
                aria-expanded={simPanelOpen}
              >
                <div className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 text-violet-400" />
                  <CardTitle className="text-sm font-semibold text-violet-300">
                    Record Simulated Trade
                  </CardTitle>
                </div>
                {simPanelOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CardHeader>
            {simPanelOpen && (
              <CardContent className="pb-5 border-t border-violet-500/10 pt-4">
                <SimulatedTradeForm
                  evaluationId={evaluationId}
                  onSuccess={() => {
                    // Optionally collapse after submit — keep open for repeated entries
                  }}
                />
              </CardContent>
            )}
          </Card>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Daily Summary table                                                 */}
        {/* ------------------------------------------------------------------ */}
        <Card className="glass-card rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Daily Summary</CardTitle>
              {summaryLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {dailySummaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center px-4">
                <Calendar className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">No trades recorded yet.</p>
                <p className="text-xs text-muted-foreground/60 max-w-xs">
                  {dashboard.simulationMode
                    ? 'Use the "Record Simulated Trade" panel above to log your first entry.'
                    : 'Add trades or sync your broker to see daily summaries.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40">
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs text-right">Daily P&amp;L</TableHead>
                      <TableHead className="text-xs text-right">Cumulative P&amp;L</TableHead>
                      <TableHead className="text-xs text-right">Drawdown</TableHead>
                      <TableHead className="text-xs text-center">Trades</TableHead>
                      <TableHead className="text-xs text-center">Compliant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailySummaries.map((day: DailySummary, idx: number) => {
                      const isCompliant = day.dailyLossCompliant && day.maxDrawdownCompliant;
                      const dailyPositive = day.pnl >= 0;
                      const isEven = idx % 2 === 0;

                      return (
                        <TableRow
                          key={day.date}
                          className={cn(
                            'border-border/20 hover:bg-muted/30 transition-colors',
                            isEven ? 'bg-muted/5' : 'bg-transparent',
                          )}
                        >
                          <TableCell className="text-xs font-mono py-2.5">
                            {formatDate(day.date)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-xs font-mono text-right py-2.5 font-medium',
                              dailyPositive ? 'text-green-400' : 'text-red-400',
                            )}
                          >
                            {dailyPositive ? '+' : ''}
                            {day.pnlPercent.toFixed(2)}%
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-xs font-mono text-right py-2.5',
                              day.cumulativePnl >= 0 ? 'text-green-400/80' : 'text-red-400/80',
                            )}
                          >
                            {day.cumulativePnl >= 0 ? '+' : ''}
                            {day.cumulativePnlPercent.toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-xs font-mono text-right py-2.5 text-muted-foreground">
                            {day.drawdownPercent.toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-xs text-center py-2.5">
                            <span className="font-mono font-medium">{day.tradeCount}</span>
                          </TableCell>
                          <TableCell className="text-center py-2.5">
                            {/* Colored compliance dot */}
                            <span
                              className={cn(
                                'inline-block w-2.5 h-2.5 rounded-full',
                                isCompliant ? 'bg-green-400' : 'bg-red-500',
                              )}
                              title={isCompliant ? 'Compliant' : 'Violation detected'}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  {/* Summary / total row */}
                  <TableFooter>
                    <TableRow className="border-t border-border/40 bg-muted/10 font-semibold">
                      <TableCell className="text-xs py-2.5 text-muted-foreground">
                        Total ({dailySummaries.length} days)
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-xs font-mono text-right py-2.5',
                          totalPnl >= 0 ? 'text-green-400' : 'text-red-400',
                        )}
                      >
                        {totalPnl >= 0 ? '+' : ''}
                        {totalPnlPercent.toFixed(2)}%
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-xs font-mono text-right py-2.5',
                          totalPnl >= 0 ? 'text-green-400/80' : 'text-red-400/80',
                        )}
                      >
                        {totalPnl >= 0 ? '+' : ''}
                        {formatCurrency(totalPnl)}
                      </TableCell>
                      <TableCell className="text-xs py-2.5 text-muted-foreground text-right">
                        &mdash;
                      </TableCell>
                      <TableCell className="text-xs font-mono text-center py-2.5">
                        {totalTrades}
                      </TableCell>
                      <TableCell className="text-center py-2.5">
                        <span
                          className={cn(
                            'inline-block w-2.5 h-2.5 rounded-full',
                            allCompliant ? 'bg-green-400' : 'bg-red-500',
                          )}
                          title={allCompliant ? 'All days compliant' : 'Some violations detected'}
                        />
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </PageTransition>
    </DashboardLayout>
  );
};

export default PropFirmEvaluationDetail;
