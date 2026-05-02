import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, Sparkles, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useTradePlanningScore } from '@/hooks/useTradePlanningScore';
import {
  TRADE_PLANNING_WEIGHTS,
  type TradeDirection,
  type TradePlanningRequest,
  type TradePlanningResponse,
} from '@/types/tradePlanning';

interface TradePlanningModalProps {
  open: boolean;
  onClose: () => void;
  /** Called when the user accepts the plan and wants to proceed to trade creation. */
  onAccept?: (request: TradePlanningRequest) => void;
  /** Optional defaults pre-filled from the trade form. */
  defaults?: Partial<TradePlanningRequest>;
}

/**
 * Pre-trade planning score modal — Sprint 3 of the AI-first roadmap.
 *
 * <p>Two phases inside one dialog:</p>
 * <ol>
 *   <li><b>Form</b>: user fills the planned setup (symbol, direction, entry,
 *       SL, TP, position size, optional setup reason).</li>
 *   <li><b>Result</b>: the modal displays the 0-100 score, a per-factor
 *       breakdown, the recommendation, and the warnings + strengths the
 *       service surfaced. The user can either go back to tweak the inputs or
 *       proceed to trade creation.</li>
 * </ol>
 *
 * <p>The score is informational — never blocks proceeding. Frontend reflects
 * the same rule as the backend service.</p>
 */
const TradePlanningModal: React.FC<TradePlanningModalProps> = ({
  open,
  onClose,
  onAccept,
  defaults,
}) => {
  const { t } = useTranslation();
  const scoreMutation = useTradePlanningScore();

  const [symbol, setSymbol] = useState(defaults?.symbol ?? '');
  const [direction, setDirection] = useState<TradeDirection>(defaults?.direction ?? 'LONG');
  const [entryPrice, setEntryPrice] = useState(defaults?.entryPrice?.toString() ?? '');
  const [stopLoss, setStopLoss] = useState(defaults?.stopLoss?.toString() ?? '');
  const [takeProfit, setTakeProfit] = useState(defaults?.takeProfit?.toString() ?? '');
  const [positionSize, setPositionSize] = useState(defaults?.positionSize?.toString() ?? '');
  const [setupReason, setSetupReason] = useState(defaults?.setupReason ?? '');

  const result = scoreMutation.data;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const request: TradePlanningRequest = {
        symbol: symbol.trim(),
        direction,
        entryPrice: Number(entryPrice),
        stopLoss: Number(stopLoss),
        takeProfit: Number(takeProfit),
        positionSize: positionSize ? Number(positionSize) : undefined,
        strategyId: defaults?.strategyId,
        setupReason: setupReason.trim() || undefined,
      };
      scoreMutation.mutate(request);
    },
    [
      defaults?.strategyId,
      direction,
      entryPrice,
      positionSize,
      setupReason,
      stopLoss,
      symbol,
      takeProfit,
      scoreMutation,
    ],
  );

  const handleAccept = useCallback(() => {
    if (!result) return;
    onAccept?.({
      symbol: symbol.trim(),
      direction,
      entryPrice: Number(entryPrice),
      stopLoss: Number(stopLoss),
      takeProfit: Number(takeProfit),
      positionSize: positionSize ? Number(positionSize) : undefined,
      strategyId: defaults?.strategyId,
      setupReason: setupReason.trim() || undefined,
    });
    handleClose();
  }, [
    defaults?.strategyId,
    direction,
    entryPrice,
    onAccept,
    positionSize,
    result,
    setupReason,
    stopLoss,
    symbol,
    takeProfit,
  ]);

  const handleClose = useCallback(() => {
    scoreMutation.reset();
    onClose();
  }, [onClose, scoreMutation]);

  const handleEdit = useCallback(() => {
    scoreMutation.reset();
  }, [scoreMutation]);

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : handleClose())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            {t('tradePlanning.modalTitle', 'Plan your trade')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'tradePlanning.modalDescription',
              'Score this setup against your historical patterns before opening the position.',
            )}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <ScoreBreakdown result={result} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3" id="trade-planning-form">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="tp-symbol">{t('tradePlanning.symbol', 'Symbol')}</Label>
                <Input
                  id="tp-symbol"
                  required
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="EURUSD"
                />
              </div>
              <div>
                <Label htmlFor="tp-direction">{t('tradePlanning.direction', 'Direction')}</Label>
                <Select value={direction} onValueChange={(v) => setDirection(v as TradeDirection)}>
                  <SelectTrigger id="tp-direction">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LONG">{t('tradePlanning.long', 'Long')}</SelectItem>
                    <SelectItem value="SHORT">{t('tradePlanning.short', 'Short')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="tp-entry">{t('tradePlanning.entry', 'Entry')}</Label>
                <Input
                  id="tp-entry"
                  type="number"
                  step="any"
                  required
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tp-sl">{t('tradePlanning.stopLoss', 'Stop')}</Label>
                <Input
                  id="tp-sl"
                  type="number"
                  step="any"
                  required
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tp-tp">{t('tradePlanning.takeProfit', 'Target')}</Label>
                <Input
                  id="tp-tp"
                  type="number"
                  step="any"
                  required
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tp-size">{t('tradePlanning.positionSize', 'Position size (optional)')}</Label>
              <Input
                id="tp-size"
                type="number"
                step="any"
                value={positionSize}
                onChange={(e) => setPositionSize(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="tp-reason">{t('tradePlanning.setupReason', 'Setup reason (optional)')}</Label>
              <Textarea
                id="tp-reason"
                rows={2}
                maxLength={500}
                value={setupReason}
                onChange={(e) => setSetupReason(e.target.value)}
                placeholder={t('tradePlanning.setupReasonPlaceholder', 'Pullback EMA50 + RSI div...')}
              />
            </div>

            {scoreMutation.error && (
              <p className="text-xs text-destructive">
                {t('tradePlanning.error', 'Could not compute score — check your inputs.')}
              </p>
            )}
          </form>
        )}

        <DialogFooter>
          {result ? (
            <>
              <Button variant="ghost" onClick={handleEdit}>
                {t('tradePlanning.edit', 'Edit inputs')}
              </Button>
              <Button onClick={handleAccept}>
                {t('tradePlanning.proceed', 'Proceed to trade')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={handleClose}>
                <X className="mr-1 h-3 w-3" />
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                form="trade-planning-form"
                disabled={scoreMutation.isPending}
              >
                {scoreMutation.isPending
                  ? t('tradePlanning.scoring', 'Scoring...')
                  : t('tradePlanning.score', 'Compute score')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ScoreBreakdown: React.FC<{ result: TradePlanningResponse }> = ({ result }) => {
  const { t } = useTranslation();
  const tier = scoreTier(result.score);

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'flex items-center justify-between rounded-lg border p-3',
          tier === 'high' && 'border-emerald-500/40 bg-emerald-500/5',
          tier === 'mid' && 'border-amber-500/40 bg-amber-500/5',
          tier === 'low' && 'border-destructive/40 bg-destructive/5',
        )}
      >
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {t('tradePlanning.scoreLabel', 'Score')}
          </p>
          <p className="text-3xl font-bold tabular-nums">{result.score}<span className="text-base text-muted-foreground">/100</span></p>
        </div>
        {tier === 'high' && <CheckCircle2 className="h-8 w-8 text-emerald-500" />}
        {tier === 'mid' && <Sparkles className="h-8 w-8 text-amber-500" />}
        {tier === 'low' && <AlertTriangle className="h-8 w-8 text-destructive" />}
      </div>

      <p className="text-sm text-foreground">{result.recommendation}</p>

      <div className="space-y-1.5">
        <FactorBar
          label={t('tradePlanning.factors.playbook', 'Playbook compliance')}
          value={result.breakdown.playbookCompliance}
          max={TRADE_PLANNING_WEIGHTS.playbookCompliance}
        />
        <FactorBar
          label={t('tradePlanning.factors.tilt', 'Current tilt')}
          value={result.breakdown.currentTilt}
          max={TRADE_PLANNING_WEIGHTS.currentTilt}
        />
        <FactorBar
          label={t('tradePlanning.factors.hour', 'Favorable hour')}
          value={result.breakdown.favorableHour}
          max={TRADE_PLANNING_WEIGHTS.favorableHour}
        />
        <FactorBar
          label={t('tradePlanning.factors.symbol', 'Symbol history')}
          value={result.breakdown.symbolHistory}
          max={TRADE_PLANNING_WEIGHTS.symbolHistory}
        />
        <FactorBar
          label={t('tradePlanning.factors.rr', 'Risk / reward')}
          value={result.breakdown.rrRatio}
          max={TRADE_PLANNING_WEIGHTS.rrRatio}
        />
      </div>

      {result.strengths.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
            {t('tradePlanning.strengths', 'Strengths')}
          </p>
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex gap-1.5">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-600">
            {t('tradePlanning.warnings', 'Warnings')}
          </p>
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            {result.warnings.map((w, i) => (
              <li key={i} className="flex gap-1.5">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="pt-1 text-[10px] italic text-muted-foreground">
        {t(
          'tradePlanning.disclaimer',
          'Informational only — based on your historical data. Not investment advice.',
        )}
      </p>
    </div>
  );
};

const FactorBar: React.FC<{ label: string; value: number; max: number }> = ({
  label,
  value,
  max,
}) => {
  const pct = Math.round((Math.max(0, Math.min(value, max)) / max) * 100);
  return (
    <div className="text-xs">
      <div className="mb-0.5 flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground">
          {value}/{max}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full',
            pct >= 70 && 'bg-emerald-500',
            pct >= 40 && pct < 70 && 'bg-amber-500',
            pct < 40 && 'bg-destructive',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

function scoreTier(score: number): 'high' | 'mid' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'mid';
  return 'low';
}

export default TradePlanningModal;
