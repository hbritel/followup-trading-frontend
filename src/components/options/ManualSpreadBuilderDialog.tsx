import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
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
import { useCreateSpread } from '@/hooks/useOptionSpreads';
import { useTrades } from '@/hooks/useTrades';
import type {
  CreateSpreadLegRequestDto,
  CreateSpreadRequestDto,
  SpreadLegDto,
  SpreadType,
} from '@/types/dto';

const SPREAD_TYPES: readonly SpreadType[] = [
  'VERTICAL_CALL',
  'VERTICAL_PUT',
  'STRADDLE',
  'STRANGLE',
  'IRON_CONDOR',
  'IRON_BUTTERFLY',
  'BUTTERFLY_CALL',
  'BUTTERFLY_PUT',
  'CALENDAR',
  'DIAGONAL',
  'COVERED_CALL',
  'PROTECTIVE_PUT',
  'COLLAR',
  'CUSTOM',
] as const;

const LEG_TYPES: readonly SpreadLegDto['legType'][] = [
  'LONG_CALL',
  'SHORT_CALL',
  'LONG_PUT',
  'SHORT_PUT',
  'STOCK',
] as const;

interface LegDraft {
  readonly key: string;
  legType: SpreadLegDto['legType'];
  tradeId: string;
  strike: string;
  quantity: string;
  premium: string;
}

function emptyLeg(): LegDraft {
  return {
    key: `leg-${Math.random().toString(36).slice(2, 9)}`,
    legType: 'LONG_CALL',
    tradeId: '',
    strike: '',
    quantity: '1',
    premium: '',
  };
}

function formatSpreadType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface ManualSpreadBuilderDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

const ManualSpreadBuilderDialog: React.FC<ManualSpreadBuilderDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation();
  const createMutation = useCreateSpread();

  const [spreadType, setSpreadType] = useState<SpreadType>('VERTICAL_CALL');
  const [underlying, setUnderlying] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [legs, setLegs] = useState<LegDraft[]>(() => [emptyLeg(), emptyLeg()]);
  const [errors, setErrors] = useState<string[]>([]);

  const { data: trades } = useTrades({ size: 200 }, { enabled: open });
  const tradeOptions = useMemo(() => trades?.content ?? [], [trades]);

  const resetForm = () => {
    setSpreadType('VERTICAL_CALL');
    setUnderlying('');
    setExpirationDate('');
    setLegs([emptyLeg(), emptyLeg()]);
    setErrors([]);
  };

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  const updateLeg = (index: number, patch: Partial<LegDraft>) => {
    setLegs((prev) => prev.map((leg, i) => (i === index ? { ...leg, ...patch } : leg)));
  };

  const addLeg = () => setLegs((prev) => [...prev, emptyLeg()]);
  const removeLeg = (index: number) => {
    setLegs((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const validate = (): CreateSpreadRequestDto | null => {
    const issues: string[] = [];
    if (!underlying.trim()) {
      issues.push(t('options.builder.errors.underlyingRequired', 'Underlying is required'));
    }
    if (legs.length === 0) {
      issues.push(t('options.builder.errors.legRequired', 'At least one leg is required'));
    }

    const mappedLegs: CreateSpreadLegRequestDto[] = [];
    legs.forEach((leg, idx) => {
      if (!leg.tradeId) {
        issues.push(
          t('options.builder.errors.tradeIdRequired', 'Select a trade for leg {{n}}', {
            n: idx + 1,
          }),
        );
        return;
      }
      const strike = Number(leg.strike);
      const qty = Number(leg.quantity);
      const premium = leg.premium === '' ? null : Number(leg.premium);
      if (!Number.isFinite(strike) || strike <= 0) {
        issues.push(
          t('options.builder.errors.strikeInvalid', 'Invalid strike on leg {{n}}', {
            n: idx + 1,
          }),
        );
        return;
      }
      if (!Number.isInteger(qty) || qty < 1) {
        issues.push(
          t('options.builder.errors.quantityInvalid', 'Invalid quantity on leg {{n}}', {
            n: idx + 1,
          }),
        );
        return;
      }
      if (premium !== null && !Number.isFinite(premium)) {
        issues.push(
          t('options.builder.errors.premiumInvalid', 'Invalid premium on leg {{n}}', {
            n: idx + 1,
          }),
        );
        return;
      }
      mappedLegs.push({
        tradeId: leg.tradeId,
        legType: leg.legType,
        strike,
        quantity: qty,
        premium,
        sortOrder: idx,
      });
    });

    setErrors(issues);
    if (issues.length > 0) return null;

    return {
      spreadType,
      underlying: underlying.trim().toUpperCase(),
      expirationDate: expirationDate || null,
      legs: mappedLegs,
    };
  };

  const handleSubmit = async () => {
    const payload = validate();
    if (!payload) return;
    try {
      await createMutation.mutateAsync(payload);
      toast.success(t('options.builder.createSuccess', 'Spread created'));
      handleClose(false);
    } catch {
      toast.error(t('options.builder.createError', 'Failed to create spread'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('options.builder.title', 'Create spread manually')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Spread-level fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="builder-type">{t('options.builder.spreadType', 'Spread type')}</Label>
              <Select value={spreadType} onValueChange={(v) => setSpreadType(v as SpreadType)}>
                <SelectTrigger id="builder-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPREAD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatSpreadType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="builder-underlying">
                {t('options.underlying', 'Underlying')}
              </Label>
              <Input
                id="builder-underlying"
                value={underlying}
                onChange={(e) => setUnderlying(e.target.value)}
                placeholder="AAPL"
                maxLength={20}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="builder-expiry">{t('options.expiry', 'Expiry')}</Label>
              <Input
                id="builder-expiry"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </div>
          </div>

          {/* Legs */}
          <div className="flex items-center justify-between mt-2">
            <h4 className="text-sm font-semibold">{t('options.legs', 'Legs')}</h4>
            <Button variant="outline" size="sm" onClick={addLeg}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              {t('options.builder.addLeg', 'Add leg')}
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {legs.map((leg, idx) => (
              <div
                key={leg.key}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end p-3 rounded-xl border border-white/5 bg-white/[0.02]"
              >
                <div className="sm:col-span-3 flex flex-col gap-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {t('options.legType', 'Type')}
                  </Label>
                  <Select
                    value={leg.legType}
                    onValueChange={(v) =>
                      updateLeg(idx, { legType: v as SpreadLegDto['legType'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEG_TYPES.map((lt) => (
                        <SelectItem key={lt} value={lt}>
                          {lt.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-4 flex flex-col gap-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {t('options.builder.trade', 'Trade')}
                  </Label>
                  <Select
                    value={leg.tradeId}
                    onValueChange={(v) => updateLeg(idx, { tradeId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('options.builder.pickTrade', 'Pick a trade...')}
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {tradeOptions.length === 0 && (
                        <SelectItem value="__empty__" disabled>
                          {t('options.builder.noTrades', 'No trades available')}
                        </SelectItem>
                      )}
                      {tradeOptions.map((trade) => (
                        <SelectItem key={trade.id} value={trade.id}>
                          {trade.symbol} · {trade.id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {t('options.strike', 'Strike')}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={leg.strike}
                    onChange={(e) => updateLeg(idx, { strike: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-1 flex flex-col gap-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {t('options.quantity', 'Qty')}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={leg.quantity}
                    onChange={(e) => updateLeg(idx, { quantity: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-1 flex flex-col gap-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {t('options.premium', 'Prem')}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={leg.premium}
                    onChange={(e) => updateLeg(idx, { premium: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLeg(idx)}
                    disabled={legs.length <= 1}
                    aria-label={t('options.builder.removeLeg', 'Remove leg')}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <ul className="rounded-xl border border-red-500/30 bg-red-500/5 text-xs text-red-300 p-3 space-y-1">
              {errors.map((err) => (
                <li key={err}>• {err}</li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleClose(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('options.builder.creating', 'Creating...')}
              </>
            ) : (
              t('options.builder.create', 'Create spread')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualSpreadBuilderDialog;
