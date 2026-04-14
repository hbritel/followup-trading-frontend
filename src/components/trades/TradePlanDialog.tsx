import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useTradePlanScore } from '@/hooks/useTradePlan';
import { useStrategies } from '@/hooks/useStrategies';
import type { TradePlanRequestDto, TradePlanScoreResponseDto } from '@/types/dto';
import {
  Dialog,
  DialogContent,
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
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Loader2, Plus } from 'lucide-react';

interface TradePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SCORE_COLORS = {
  red: '#ef4444',
  amber: '#f59e0b',
  green: '#22c55e',
  emerald: '#10b981',
} as const;

const getScoreColor = (score: number): string => {
  if (score <= 3) return SCORE_COLORS.red;
  if (score <= 6) return SCORE_COLORS.amber;
  if (score <= 8) return SCORE_COLORS.green;
  return SCORE_COLORS.emerald;
};

const getConfidenceLabel = (confidence: number): string => {
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.5) return 'Medium';
  return 'Low';
};

const FACTOR_LABEL_KEYS: Record<string, string> = {
  riskReward: 'tradePlan.riskReward',
  hourWinRate: 'tradePlan.hourWinRate',
  strategyWinRate: 'tradePlan.strategyWinRate',
  dayWinRate: 'tradePlan.dayWinRate',
  sizeCoherence: 'tradePlan.sizeCoherence',
  propFirm: 'tradePlan.propFirm',
  symbolDirection: 'tradePlan.symbolDirection',
};

/* ----- Score Arc (96x96) ----- */

interface ScoreArcProps {
  score: number;
}

const ScoreArc: React.FC<ScoreArcProps> = ({ score }) => {
  const size = 96;
  const strokeWidth = 7;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 10) / 10;
  const offset = circumference - progress * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color }}
        >
          {score.toFixed(1)}
        </span>
      </div>
    </div>
  );
};

/* ----- Factor Row ----- */

interface FactorRowProps {
  label: string;
  value: number;
  score: number;
  weight: number;
}

const FactorRow: React.FC<FactorRowProps> = ({ label, value, score, weight }) => {
  const barWidth = Math.min(Math.max(score, 0), 10) / 10 * 100;
  const color = getScoreColor(score);

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-sm text-muted-foreground w-32 shrink-0 truncate">{label}</span>
      <span className="text-sm font-medium tabular-nums w-14 text-right shrink-0">
        {typeof value === 'number' ? value.toFixed(2) : value}
      </span>
      <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${barWidth}%`,
            backgroundColor: color,
            transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>
      <span className="text-[11px] text-muted-foreground/60 tabular-nums w-8 text-right shrink-0">
        x{weight}
      </span>
    </div>
  );
};

/* ----- Score Result Panel ----- */

interface ScoreResultProps {
  result: TradePlanScoreResponseDto;
  onClose: () => void;
}

const ScoreResult: React.FC<ScoreResultProps> = ({ result, onClose }) => {
  const { t } = useTranslation();
  const {
    score,
    insufficientData,
    sampleSize,
    confidence,
    riskRewardRatio,
    suggestedSize,
    factors,
    warnings,
  } = result;

  return (
    <div className="flex flex-col gap-5">
      {/* Score + headline stats */}
      <div className="flex items-start gap-6">
        <ScoreArc score={score} />
        <div className="flex flex-col gap-2 pt-2">
          <div className="text-sm text-muted-foreground">
            {t('tradePlan.basedOnTrades', { count: sampleSize })}
            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-muted/40 font-medium">
              {getConfidenceLabel(confidence)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold tabular-nums">
              R:R {riskRewardRatio.toFixed(2)}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-sm font-medium rounded-md bg-primary/10 text-primary px-2.5 py-1 w-fit">
            {t('tradePlan.suggestedSize')}: {suggestedSize} lots
          </div>
        </div>
      </div>

      {/* Insufficient data warning */}
      {insufficientData && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{t('tradePlan.insufficientData')}</span>
        </div>
      )}

      {/* Factor breakdown */}
      <div className="space-y-0.5">
        {Object.entries(factors).map(([key, factor]) => {
          const labelKey = FACTOR_LABEL_KEYS[key];
          const label = labelKey ? t(labelKey, factor.label) : factor.label;
          return (
            <FactorRow
              key={key}
              label={label}
              value={factor.value}
              score={factor.score}
              weight={factor.weight}
            />
          );
        })}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm text-orange-700 dark:text-orange-300"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Create trade action */}
      <Button variant="outline" className="w-full" onClick={onClose}>
        <Plus className="h-4 w-4 mr-1.5" />
        {t('tradePlan.createTrade')}
      </Button>
    </div>
  );
};

/* ----- Main Dialog ----- */

const NONE_STRATEGY = '__none__';

const TradePlanDialog: React.FC<TradePlanDialogProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const scoreMutation = useTradePlanScore();
  const { data: strategies } = useStrategies();

  const [symbol, setSymbol] = useState('');
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [strategyId, setStrategyId] = useState<string>(NONE_STRATEGY);
  const [plannedTime, setPlannedTime] = useState('');

  const resetForm = () => {
    setSymbol('');
    setDirection('LONG');
    setEntryPrice('');
    setStopLoss('');
    setTakeProfit('');
    setStrategyId(NONE_STRATEGY);
    setPlannedTime('');
    scoreMutation.reset();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const canSubmit =
    symbol.trim().length > 0 &&
    entryPrice !== '' &&
    stopLoss !== '' &&
    takeProfit !== '' &&
    !scoreMutation.isPending;

  const handleScore = () => {
    const payload: TradePlanRequestDto = {
      symbol: symbol.trim().toUpperCase(),
      direction,
      entryPrice: parseFloat(entryPrice),
      stopLoss: parseFloat(stopLoss),
      takeProfit: parseFloat(takeProfit),
      strategyId: strategyId !== NONE_STRATEGY ? strategyId : undefined,
      plannedEntryTime: plannedTime || undefined,
    };
    scoreMutation.mutate(payload);
  };

  const showResult = scoreMutation.isSuccess && scoreMutation.data;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('tradePlan.planATrade')}</DialogTitle>
        </DialogHeader>

        {showResult ? (
          <ScoreResult
            result={scoreMutation.data}
            onClose={() => handleOpenChange(false)}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {/* Symbol */}
            <div className="space-y-1.5">
              <Label htmlFor="tp-symbol">{t('trades.symbol', 'Symbol')}</Label>
              <Input
                id="tp-symbol"
                placeholder="XAUUSD, EURUSD..."
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              />
            </div>

            {/* Direction toggles */}
            <div className="space-y-1.5">
              <Label>{t('trades.direction', 'Direction')}</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('LONG')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                    direction === 'LONG'
                      ? 'border-green-500/60 bg-green-500/15 text-green-600 dark:text-green-400'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                  )}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  LONG
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('SHORT')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                    direction === 'SHORT'
                      ? 'border-red-500/60 bg-red-500/15 text-red-600 dark:text-red-400'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                  )}
                >
                  <ArrowDownRight className="h-4 w-4" />
                  SHORT
                </button>
              </div>
            </div>

            {/* Price inputs row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tp-entry">{t('trades.entryPrice', 'Entry Price')}</Label>
                <Input
                  id="tp-entry"
                  type="number"
                  step="0.0001"
                  placeholder="0.0000"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tp-sl">{t('trades.stopLoss', 'Stop Loss')}</Label>
                <Input
                  id="tp-sl"
                  type="number"
                  step="0.0001"
                  placeholder="0.0000"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tp-tp">{t('trades.takeProfit', 'Take Profit')}</Label>
                <Input
                  id="tp-tp"
                  type="number"
                  step="0.0001"
                  placeholder="0.0000"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                />
              </div>
            </div>

            {/* Strategy + Time row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('trades.strategy', 'Strategy')}</Label>
                <Select value={strategyId} onValueChange={setStrategyId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.none', 'None')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_STRATEGY}>{t('common.none', 'None')}</SelectItem>
                    {(strategies ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tp-time">{t('trades.time', 'Time')}</Label>
                <Input
                  id="tp-time"
                  placeholder="09:30"
                  value={plannedTime}
                  onChange={(e) => setPlannedTime(e.target.value)}
                />
              </div>
            </div>

            {/* Submit */}
            <Button
              onClick={handleScore}
              disabled={!canSubmit}
              className="w-full mt-1"
            >
              {scoreMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              {t('tradePlan.scoreSetup')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TradePlanDialog;
