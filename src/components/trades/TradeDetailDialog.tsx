import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, Save, X, Loader2, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useStrategies } from '@/hooks/useStrategies';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { tradeService } from '@/services/trade.service';
import type { CreateTradeRequest } from '@/services/trade.service';
import type { Trade } from './TradesTableWrapper';
import RuleComplianceChecklist from './RuleComplianceChecklist';

interface TradeDetailDialogProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEditMode?: boolean;
  onTradeUpdated?: (updated: Trade) => void;
}

const Field = ({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) => (
  <div className={cn("flex flex-col gap-0.5", className)}>
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
    <span className="text-sm font-medium text-foreground">{value ?? '-'}</span>
  </div>
);

const EditField = ({ label, id, value, onChange, type = 'number', step = 'any', placeholder = '' }: {
  label: string; id: string; value: string; onChange: (v: string) => void;
  type?: string; step?: string; placeholder?: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <Label htmlFor={id} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {label}
    </Label>
    <Input
      id={id}
      type={type}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-8"
    />
  </div>
);

/** Converts a ZonedDateTime ISO string to datetime-local format for <input type="datetime-local" /> */
const toDatetimeLocal = (isoStr?: string): string => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
};

/** Converts a datetime-local string to ISO 8601 with timezone offset */
const toBackendDateTime = (dateStr: string): string => {
  if (!dateStr) return '';
  const hasTime = dateStr.includes('T');
  const fullStr = hasTime ? dateStr : `${dateStr}T00:00:00`;
  const d = new Date(fullStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const tzHours = pad(Math.floor(absOffset / 60));
  const tzMinutes = pad(absOffset % 60);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${tzHours}${tzMinutes}`;
};

interface EditFormState {
  entryPrice: string;
  exitPrice: string;
  quantity: string;
  entryDate: string;
  exitDate: string;
  direction: string;
  stopLoss: string;
  takeProfit: string;
  fees: string;
  notes: string;
  strategyId: string;
}

const initFormFromTrade = (trade: Trade): EditFormState => ({
  entryPrice: trade.entryPrice != null ? String(trade.entryPrice) : '',
  exitPrice: trade.exitPrice != null ? String(trade.exitPrice) : '',
  quantity: trade.quantity != null ? String(trade.quantity) : '',
  entryDate: toDatetimeLocal(trade.entryDate),
  exitDate: toDatetimeLocal(trade.exitDate),
  direction: trade.type?.toUpperCase() || trade.direction?.toUpperCase() || 'LONG',
  stopLoss: trade.stopLoss != null ? String(trade.stopLoss) : '',
  takeProfit: trade.takeProfit != null ? String(trade.takeProfit) : '',
  fees: trade.fees != null ? String(trade.fees) : '',
  notes: trade.notes ?? '',
  strategyId: trade.strategies?.[0]?.id ?? '',
});

const TradeDetailDialog: React.FC<TradeDetailDialogProps> = ({ trade, open, onOpenChange, initialEditMode = false, onTradeUpdated }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: allStrategies } = useStrategies();
  const activeStrategies = useMemo(
    () => (allStrategies ?? []).filter((s) => s.active),
    [allStrategies],
  );
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditFormState>({
    entryPrice: '', exitPrice: '', quantity: '', entryDate: '', exitDate: '',
    direction: 'LONG', stopLoss: '', takeProfit: '', fees: '', notes: '', strategyId: '',
  });

  // Sync form state when trade changes or dialog opens
  useEffect(() => {
    if (trade && open) {
      setForm(initFormFromTrade(trade));
      setEditing(initialEditMode);
    }
  }, [trade, open, initialEditMode]);

  const updateField = (field: keyof EditFormState) => (value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Full trade update via PUT /trades/{id}
  const updateMutation = useMutation({
    mutationFn: () => {
      if (!trade) throw new Error('No trade');
      const hasExit = form.exitDate && form.exitPrice;
      const request: CreateTradeRequest = {
        symbol: trade.symbol,
        direction: form.direction as 'LONG' | 'SHORT',
        entryPrice: Number(form.entryPrice),
        quantity: Number(form.quantity),
        entryDate: toBackendDateTime(form.entryDate),
        exitDate: form.exitDate ? toBackendDateTime(form.exitDate) : null,
        exitPrice: form.exitPrice ? Number(form.exitPrice) : null,
        stopLoss: form.stopLoss ? Number(form.stopLoss) : null,
        takeProfit: form.takeProfit ? Number(form.takeProfit) : null,
        fees: form.fees ? Number(form.fees) : null,
        notes: form.notes?.trim() || null,
        status: hasExit ? 'CLOSED' : 'OPEN',
        accountId: trade.accountId ?? null,
        strategyIds: form.strategyId && form.strategyId !== 'none' ? [form.strategyId] : [],
      };
      return tradeService.updateTrade(trade.id, request);
    },
    onSuccess: (updatedTrade: Trade) => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['strategies', 'stats'] });
      onTradeUpdated?.(updatedTrade);
      toast({
        title: t('trades.tradeUpdated', 'Trade updated'),
        description: t('trades.tradeUpdatedDescFull', 'Trade has been saved successfully.'),
      });
      setEditing(false);
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({
        title: t('common.error', 'Error'),
        description: err.message || 'Failed to update trade.',
        variant: 'destructive',
      });
    },
  });

  const handleCancel = () => {
    if (trade) {
      setForm(initFormFromTrade(trade));
    }
    setEditing(false);
  };

  if (!trade) return null;

  const isProfit = (trade.profit ?? 0) >= 0;
  const direction = trade.type?.toUpperCase() || trade.direction?.toUpperCase() || '-';
  const status = trade.status?.toUpperCase() || '-';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setEditing(false); } onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <span className="text-xl font-bold">{trade.symbol}</span>
              <Badge variant={direction === 'LONG' ? 'default' : 'secondary'}>
                {direction}
              </Badge>
              <Badge variant={status === 'CLOSED' ? 'outline' : 'default'}>
                {status}
              </Badge>
            </DialogTitle>
            {!editing && (
              <div className="flex items-center gap-1">
                {status === 'CLOSED' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { onOpenChange(false); navigate(`/trade-replay?tradeId=${trade.id}`); }}
                    title={t('trades.replayTrade', 'Replay Trade')}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setEditing(true)} title={t('trades.editTrade', 'Edit Trade')}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* P&L Section */}
          <div className="rounded-lg border p-4 bg-muted/30">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label={t('trades.profit', 'P&L')}
                value={
                  <span className={cn("text-lg font-bold font-mono", isProfit ? "text-green-500" : "text-red-500")}>
                    {trade.profit != null ? formatCurrency(trade.profit, trade.currency) : '-'}
                  </span>
                }
              />
              <Field
                label={t('trades.profitPercentage', 'P&L %')}
                value={
                  trade.profitPercentage != null ? (
                    <span className={cn("text-lg font-bold font-mono", isProfit ? "text-green-500" : "text-red-500")}>
                      {trade.profitPercentage >= 0 ? '+' : ''}{trade.profitPercentage.toFixed(2)}%
                    </span>
                  ) : '-'
                }
              />
            </div>
            {editing && (
              <p className="text-xs text-muted-foreground mt-2">
                {t('trades.pnlAutoCalculated', 'P&L is automatically calculated from entry/exit prices.')}
              </p>
            )}
          </div>

          <Separator />

          {/* Direction (editable) */}
          {editing && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('trades.type', 'Direction')}
                </Label>
                <Select value={form.direction} onValueChange={updateField('direction')}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LONG">{t('trades.long', 'Long')}</SelectItem>
                    <SelectItem value="SHORT">{t('trades.short', 'Short')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
            </>
          )}

          {/* Entry / Exit */}
          <div>
            <h4 className="text-sm font-semibold mb-3">{t('trades.entryExit', 'Entry & Exit')}</h4>
            <div className="grid grid-cols-2 gap-4">
              {editing ? (
                <EditField label={t('trades.entryDate', 'Entry Date')} id="edit-entry-date" value={form.entryDate} onChange={updateField('entryDate')} type="datetime-local" step="1" />
              ) : (
                <Field label={t('trades.entryDate', 'Entry Date')} value={formatDate(trade.entryDate)} />
              )}
              {editing ? (
                <EditField label={t('trades.exitDate', 'Exit Date')} id="edit-exit-date" value={form.exitDate} onChange={updateField('exitDate')} type="datetime-local" step="1" />
              ) : (
                <Field label={t('trades.exitDate', 'Exit Date')} value={formatDate(trade.exitDate)} />
              )}
              {editing ? (
                <EditField label={t('trades.entryPrice', 'Entry Price')} id="edit-entry-price" value={form.entryPrice} onChange={updateField('entryPrice')} placeholder="0.00" />
              ) : (
                <Field label={t('trades.entryPrice', 'Entry Price')} value={trade.entryPrice != null ? formatCurrency(trade.entryPrice, trade.currency) : '-'} />
              )}
              {editing ? (
                <EditField label={t('trades.exitPrice', 'Exit Price')} id="edit-exit-price" value={form.exitPrice} onChange={updateField('exitPrice')} placeholder="0.00" />
              ) : (
                <Field label={t('trades.exitPrice', 'Exit Price')} value={trade.exitPrice != null ? formatCurrency(trade.exitPrice, trade.currency) : '-'} />
              )}
            </div>
          </div>

          <Separator />

          {/* Position Details */}
          <div>
            <h4 className="text-sm font-semibold mb-3">{t('trades.positionDetails', 'Position Details')}</h4>
            <div className="grid grid-cols-2 gap-4">
              {editing ? (
                <EditField label={t('trades.quantity', 'Quantity')} id="edit-quantity" value={form.quantity} onChange={updateField('quantity')} placeholder="0" />
              ) : (
                <Field label={t('trades.quantity', 'Quantity')} value={trade.quantity} />
              )}
              <Field label={t('trades.balance', 'Balance')} value={trade.balance != null ? formatCurrency(trade.balance, trade.currency) : '-'} />
              {editing ? (
                <EditField label={t('trades.stopLoss', 'Stop Loss')} id="edit-sl" value={form.stopLoss} onChange={updateField('stopLoss')} placeholder="0.00" />
              ) : (
                <Field label={t('trades.stopLoss', 'Stop Loss')} value={trade.stopLoss != null ? formatCurrency(trade.stopLoss, trade.currency) : '-'} />
              )}
              {editing ? (
                <EditField label={t('trades.takeProfit', 'Take Profit')} id="edit-tp" value={form.takeProfit} onChange={updateField('takeProfit')} placeholder="0.00" />
              ) : (
                <Field label={t('trades.takeProfit', 'Take Profit')} value={trade.takeProfit != null ? formatCurrency(trade.takeProfit, trade.currency) : '-'} />
              )}
            </div>
          </div>

          <Separator />

          {/* Fees & Costs */}
          <div>
            <h4 className="text-sm font-semibold mb-3">{t('trades.feesCosts', 'Fees & Costs')}</h4>
            <div className="grid grid-cols-3 gap-4">
              {editing ? (
                <EditField label={t('trades.fees', 'Fees')} id="edit-fees" value={form.fees} onChange={updateField('fees')} placeholder="0.00" />
              ) : (
                <Field label={t('trades.fees', 'Fees')} value={trade.fees != null ? formatCurrency(trade.fees, trade.currency) : '-'} />
              )}
              <Field label={t('trades.commission', 'Commission')} value={trade.commission != null ? formatCurrency(trade.commission, trade.currency) : '-'} />
              <Field label={t('trades.swap', 'Swap')} value={trade.swap != null ? formatCurrency(trade.swap, trade.currency) : '-'} />
            </div>
          </div>

          {/* Strategy & Tags */}
          <Separator />
          <div>
            <h4 className="text-sm font-semibold mb-3">{t('trades.strategyTags', 'Strategy & Tags')}</h4>
            <div className="space-y-3">
              {editing ? (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('trades.strategy', 'Strategy')}
                  </Label>
                  <Select value={form.strategyId} onValueChange={updateField('strategyId')}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder={t('trades.selectStrategy', 'Select a strategy')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('trades.noStrategy', 'No strategy')}</SelectItem>
                      {activeStrategies.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Field label={t('trades.strategy', 'Strategy')} value={trade.strategy || t('trades.noStrategy', 'No strategy')} />
              )}
              {trade.tags && trade.tags.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('trades.tags', 'Tags')}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {trade.tags.map((tag, i) => (
                      <Badge key={i} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rule Compliance Checklist */}
          {(() => {
            const stratId = editing ? form.strategyId : trade.strategies?.[0]?.id;
            const selectedStrategy = stratId && stratId !== 'none'
              ? (allStrategies ?? []).find((s) => s.id === stratId)
              : null;
            if (!selectedStrategy || selectedStrategy.rules.length === 0) return null;
            const tradeStatus: 'OPEN' | 'CLOSED' = trade.status?.toUpperCase() === 'CLOSED' ? 'CLOSED' : 'OPEN';
            return (
              <>
                <Separator />
                <RuleComplianceChecklist
                  tradeId={trade.id}
                  strategyRules={selectedStrategy.rules}
                  tradeStatus={tradeStatus}
                />
              </>
            );
          })()}

          {/* Notes — editable */}
          <Separator />
          <div>
            <h4 className="text-sm font-semibold mb-2">{t('trades.notes', 'Notes')}</h4>
            {editing ? (
              <Textarea
                value={form.notes}
                onChange={(e) => updateField('notes')(e.target.value)}
                placeholder={t('trades.notesPlaceholder', 'Add your notes about this trade...')}
                rows={4}
                maxLength={500}
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {trade.notes || t('trades.noNotes', 'No notes')}
              </p>
            )}
          </div>

          {/* Metadata */}
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-xs">
            <Field label={t('trades.accountType', 'Account')} value={trade.accountType || '-'} />
            <Field label={t('trades.currency', 'Currency')} value={trade.currency || '-'} />
            <Field label={t('trades.createdAt', 'Created')} value={formatDate(trade.createdAt)} />
            <Field label={t('trades.updatedAt', 'Updated')} value={formatDate(trade.updatedAt)} />
          </div>
        </div>

        {/* Footer with Save/Cancel when editing */}
        {editing && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancel} disabled={updateMutation.isPending}>
              <X className="mr-2 h-4 w-4" />
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t('common.save', 'Save')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TradeDetailDialog;
