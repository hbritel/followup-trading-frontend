import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTradePlanScore, useCreatePlannedTrade } from '@/hooks/useTradePlan';
import { useStrategies } from '@/hooks/useStrategies';
import { useSymbolSpecifications } from '@/hooks/useSymbolSpecifications';
import { brokerService } from '@/services/broker.service';
import apiClient from '@/services/apiClient';
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
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react';

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

interface DraftData {
  accountId?: string;
  symbol: string;
  direction: string;
  entryPrice?: string;
  stopLoss?: string;
  takeProfit?: string;
  strategyId?: string;
  plannedTime?: string;
}

/** Translate backend factor label keys to i18n-friendly labels */
const translateFactorLabel = (label: string, t: (key: string, opts?: Record<string, string>) => string): string => {
  // Keys with parameters: "symbolDirectionWinRate:XAUUSD:LONG", "hourWinRate:14", "dayOfWeekWinRate:WEDNESDAY"
  if (label.startsWith('symbolDirectionWinRate:')) {
    const [, symbol, dir] = label.split(':');
    return t('tradePlan.symbolDirectionWinRate', { symbol: symbol ?? '', direction: dir ?? '' });
  }
  if (label.startsWith('hourWinRate:')) {
    const hour = label.split(':')[1] ?? '';
    return t('tradePlan.hourWinRate', { hour });
  }
  if (label.startsWith('dayOfWeekWinRate:')) {
    const day = label.split(':')[1] ?? '';
    return t(`tradePlan.days.${day}`, day);
  }
  // Suffixed with "(insufficient data)"
  const base = label.replace(' (insufficient data)', '');
  if (base !== label) {
    return translateFactorLabel(base, t) + ` (${t('tradePlan.insufficientDataShort')})`;
  }
  // Simple keys
  const simpleKeys: Record<string, string> = {
    riskReward: 'tradePlan.riskReward',
    strategyWinRate: 'tradePlan.strategyWinRate',
    noStrategy: 'tradePlan.noStrategy',
    sizeCoherence: 'tradePlan.sizeCoherence',
    noHistoricalRisk: 'tradePlan.noHistoricalRisk',
    avgRiskZero: 'tradePlan.avgRiskZero',
    propFirmDrawdown: 'tradePlan.propFirmDrawdown',
    noActiveEvaluation: 'tradePlan.noActiveEvaluation',
    noPropFirmModule: 'tradePlan.noPropFirmModule',
    noDrawdownLimit: 'tradePlan.noDrawdownLimit',
    propFirmError: 'tradePlan.propFirmError',
  };
  const key = simpleKeys[label];
  return key ? t(key) : label;
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
    <div className="py-1.5 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-medium tabular-nums">
            {typeof value === 'number' ? value.toFixed(2) : value}
          </span>
          <span className="text-[11px] text-muted-foreground/60 tabular-nums">
            x{weight}
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${barWidth}%`,
            backgroundColor: color,
            transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>
    </div>
  );
};

/* ----- Score Result Panel ----- */

interface ScoreResultProps {
  result: TradePlanScoreResponseDto;
  onClose: () => void;
  onCreateTrade: () => void;
  isCreating: boolean;
}

const ScoreResult: React.FC<ScoreResultProps> = ({ result, onClose, onCreateTrade, isCreating }) => {
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
          {suggestedSize != null && Number(suggestedSize) > 0 && (
            <div className="inline-flex items-center gap-1.5 text-sm font-medium rounded-md bg-primary/10 text-primary px-2.5 py-1 w-fit">
              {t('tradePlan.suggestedSize')}: {suggestedSize}{' '}
              {t('tradePlan.lotsUnit', 'lots')}
            </div>
          )}
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
        {Object.entries(factors).map(([key, factor]) => (
          <FactorRow
            key={key}
            label={translateFactorLabel(factor.label, t)}
            value={factor.value}
            score={factor.score}
            weight={factor.weight}
          />
        ))}
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
      <Button className="w-full" onClick={onCreateTrade} disabled={isCreating}>
        {isCreating ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        ) : (
          <Plus className="h-4 w-4 mr-1.5" />
        )}
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
  const createPlannedMutation = useCreatePlannedTrade();
  const { data: strategies } = useStrategies();
  const { data: symbolSpecs } = useSymbolSpecifications();
  const queryClient = useQueryClient();
  const { data: connections } = useQuery({
    queryKey: ['broker-connections'],
    queryFn: brokerService.getConnections,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch draft from backend
  const { data: serverDraft } = useQuery<DraftData | null>({
    queryKey: ['trade-plan-draft'],
    queryFn: async () => {
      const res = await apiClient.get('/ai/trade-plan/draft');
      return res.status === 204 ? null : res.data;
    },
    staleTime: Infinity,
    enabled: open,
  });

  const saveDraftMutation = useMutation({
    mutationFn: (payload: TradePlanRequestDto) =>
      apiClient.put('/ai/trade-plan/draft', payload),
  });

  const deleteDraftMutation = useMutation({
    mutationFn: () => apiClient.delete('/ai/trade-plan/draft'),
    onSuccess: () => queryClient.setQueryData(['trade-plan-draft'], null),
  });

  const [accountId, setAccountId] = useState<string>('none');
  const [symbol, setSymbol] = useState('');
  const [symbolPopoverOpen, setSymbolPopoverOpen] = useState(false);
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [quantity, setQuantity] = useState('');
  const [strategyId, setStrategyId] = useState<string>(NONE_STRATEGY);
  const [plannedTime, setPlannedTime] = useState('');
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Restore form fields from server draft when it arrives
  useEffect(() => {
    if (serverDraft && !draftLoaded) {
      setAccountId(serverDraft.accountId ?? 'none');
      setSymbol(serverDraft.symbol ?? '');
      setDirection((serverDraft.direction as 'LONG' | 'SHORT') ?? 'LONG');
      setEntryPrice(serverDraft.entryPrice ?? '');
      setStopLoss(serverDraft.stopLoss ?? '');
      setTakeProfit(serverDraft.takeProfit ?? '');
      setStrategyId(serverDraft.strategyId ?? NONE_STRATEGY);
      setPlannedTime(serverDraft.plannedTime ?? '');
      setDraftLoaded(true);
    }
  }, [serverDraft, draftLoaded]);

  /** Auto-format HH:MM — only digits allowed, ":" inserted after 2nd digit */
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
    if (raw.length <= 2) {
      setPlannedTime(raw);
    } else {
      const hh = raw.slice(0, 2);
      const mm = raw.slice(2);
      setPlannedTime(`${hh}:${mm}`);
    }
  };

  const isValidTime = (v: string): boolean => {
    if (!v) return true; // optional
    const match = v.match(/^(\d{2}):(\d{2})$/);
    if (!match) return false;
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  };

  const buildDraftPayload = (): TradePlanRequestDto => ({
    symbol: symbol.trim().toUpperCase() || 'DRAFT',
    direction,
    entryPrice: entryPrice ? parseFloat(entryPrice) : 0,
    stopLoss: stopLoss ? parseFloat(stopLoss) : 0,
    takeProfit: takeProfit ? parseFloat(takeProfit) : 0,
    quantity: quantity ? parseFloat(quantity) : undefined,
    strategyId: strategyId !== NONE_STRATEGY ? strategyId : undefined,
    plannedEntryTime: plannedTime || undefined,
    accountId: accountId !== 'none' ? accountId : undefined,
  });

  const resetForm = () => {
    setAccountId('none');
    setSymbol('');
    setSymbolPopoverOpen(false);
    setDirection('LONG');
    setEntryPrice('');
    setStopLoss('');
    setTakeProfit('');
    setStrategyId(NONE_STRATEGY);
    setPlannedTime('');
    setDraftLoaded(false);
    scoreMutation.reset();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    // Auto-save draft to server when closing (if form has data)
    if (!nextOpen && symbol.trim()) {
      saveDraftMutation.mutate(buildDraftPayload());
    }
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const canSubmit =
    symbol.trim().length > 0 &&
    entryPrice !== '' &&
    stopLoss !== '' &&
    takeProfit !== '' &&
    isValidTime(plannedTime) &&
    !scoreMutation.isPending;

  const handleScore = () => {
    const payload: TradePlanRequestDto = {
      symbol: symbol.trim().toUpperCase(),
      direction,
      entryPrice: parseFloat(entryPrice),
      stopLoss: parseFloat(stopLoss),
      takeProfit: parseFloat(takeProfit),
      quantity: quantity ? parseFloat(quantity) : undefined,
      strategyId: strategyId !== NONE_STRATEGY ? strategyId : undefined,
      plannedEntryTime: plannedTime || undefined,
      accountId: accountId !== 'none' ? accountId : undefined,
    };
    deleteDraftMutation.mutate();
    scoreMutation.mutate(payload);
  };

  const handleCreateTrade = () => {
    const payload: TradePlanRequestDto = {
      symbol: symbol.trim().toUpperCase(),
      direction,
      entryPrice: parseFloat(entryPrice),
      stopLoss: parseFloat(stopLoss),
      takeProfit: parseFloat(takeProfit),
      quantity: quantity ? parseFloat(quantity) : undefined,
      strategyId: strategyId !== NONE_STRATEGY ? strategyId : undefined,
      plannedEntryTime: plannedTime || undefined,
      accountId: accountId !== 'none' ? accountId : undefined,
    };
    createPlannedMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(t('tradePlan.tradeCreatedSuccess', 'Trade planned successfully'));
        deleteDraftMutation.mutate();
        handleOpenChange(false);
      },
    });
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
            onCreateTrade={handleCreateTrade}
            isCreating={createPlannedMutation.isPending}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {/* Account selector */}
            <div className="space-y-1.5">
              <Label>{t('trades.account', 'Account')}</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('trades.selectAccount', 'Select account')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('trades.noAccount', 'No account')}</SelectItem>
                  {connections?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.displayName || c.brokerDisplayName || c.brokerCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Symbol — Combobox with autocomplete */}
            <div className="space-y-1.5">
              <Label>{t('trades.symbol', 'Symbol')}</Label>
              <Popover open={symbolPopoverOpen} onOpenChange={setSymbolPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={symbolPopoverOpen}
                    className={cn(
                      "w-full justify-between font-normal",
                      !symbol && "text-muted-foreground"
                    )}
                  >
                    {symbol
                      ? (() => {
                          const matched = symbolSpecs?.find(s => s.symbol === symbol.toUpperCase());
                          return matched ? `${symbol.toUpperCase()} — ${matched.displayName}` : symbol.toUpperCase();
                        })()
                      : t('symbols.searchSymbol', 'Search symbol...')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder={t('symbols.searchSymbol', 'Search symbol...')}
                      onValueChange={(search) => {
                        if (search) setSymbol(search.toUpperCase().trim());
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>{t('symbols.noResults', 'No symbols found')}</CommandEmpty>
                      <CommandGroup>
                        {symbolSpecs?.map((spec) => (
                          <CommandItem
                            key={spec.symbol}
                            value={spec.symbol}
                            onSelect={() => {
                              setSymbol(spec.symbol);
                              setSymbolPopoverOpen(false);
                            }}
                          >
                            <Check className={cn(
                              "mr-2 h-4 w-4",
                              symbol.toUpperCase() === spec.symbol ? "opacity-100" : "opacity-0"
                            )} />
                            <span className="font-medium">{spec.symbol}</span>
                            <span className="ml-2 text-muted-foreground text-xs">{spec.displayName}</span>
                            <span className="ml-auto text-muted-foreground text-xs font-mono">{spec.assetType}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {symbol && (() => {
                const matched = symbolSpecs?.find(s => s.symbol === symbol.toUpperCase());
                return matched ? (
                  <Badge variant="secondary" className="text-xs font-mono">
                    {t('symbols.contractSize', 'Contract size')}: {matched.contractSize.toLocaleString()}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    {t('symbols.unknownSymbol', 'Unknown symbol')} — {t('symbols.contractSize', 'Contract size')}: 1
                  </Badge>
                );
              })()}
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

            {/* Lot Size */}
            <div className="space-y-1.5">
              <Label htmlFor="tp-quantity">{t('trades.lotSize', 'Lot Size')}</Label>
              <Input
                id="tp-quantity"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="1.00"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
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
                <Label htmlFor="tp-time">{t('trades.time', 'Planned Time')}</Label>
                <Input
                  id="tp-time"
                  placeholder="09:30"
                  value={plannedTime}
                  onChange={handleTimeChange}
                  maxLength={5}
                  inputMode="numeric"
                />
                {plannedTime && !isValidTime(plannedTime) && (
                  <p className="text-xs text-red-400">{t('tradePlan.invalidTime', 'Invalid time (HH:MM)')}</p>
                )}
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
