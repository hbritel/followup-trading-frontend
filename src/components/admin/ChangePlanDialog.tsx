import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export const ADMIN_PLAN_OPTIONS: { value: string; label: string }[] = [
  { value: 'FREE', label: 'Free' },
  { value: 'STARTER', label: 'Starter' },
  { value: 'PRO', label: 'Pro' },
  { value: 'ELITE', label: 'Elite' },
  { value: 'TEAM', label: 'Team' },
];

export interface ChangePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetLabel: string;
  isPending?: boolean;
  onConfirm: (plan: string, durationDays: number | null) => void;
  /** Override confirm button label (e.g. "Apply to Selected" for batch). */
  confirmLabel?: string;
}

function resolveDurationDays(duration: string, custom: string): number | null {
  if (duration === 'permanent') return null;
  if (duration === 'custom') {
    const n = parseInt(custom, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return parseInt(duration, 10);
}

export function ChangePlanDialog({
  open,
  onOpenChange,
  targetLabel,
  isPending = false,
  onConfirm,
  confirmLabel,
}: ChangePlanDialogProps) {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('permanent');
  const [customDays, setCustomDays] = useState('');

  // Reset state when dialog closes so reopening starts clean
  useEffect(() => {
    if (!open) {
      setSelectedPlan('');
      setSelectedDuration('permanent');
      setCustomDays('');
    }
  }, [open]);

  const customInvalid = selectedDuration === 'custom' && !customDays;
  const disabled = !selectedPlan || isPending || customInvalid;

  const handleConfirm = () => {
    if (disabled) return;
    const durationDays = resolveDurationDays(selectedDuration, customDays);
    onConfirm(selectedPlan, durationDays);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.changePlan', 'Change Plan')}</DialogTitle>
          <DialogDescription>
            {t('admin.changePlanDescription', 'Change subscription plan for {{name}}', { name: targetLabel })}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <Label>{t('admin.plan', 'Plan')}</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={t('admin.selectPlan', 'Select plan')} />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_PLAN_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('admin.duration', 'Duration')}</Label>
            <Select
              value={selectedDuration}
              onValueChange={(v) => {
                setSelectedDuration(v);
                setCustomDays('');
              }}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="permanent">{t('admin.durationPermanent', 'Permanent')}</SelectItem>
                <SelectItem value="7">{t('admin.duration7days', '7 days')}</SelectItem>
                <SelectItem value="14">{t('admin.duration14days', '14 days')}</SelectItem>
                <SelectItem value="30">{t('admin.duration30days', '30 days')}</SelectItem>
                <SelectItem value="60">{t('admin.duration60days', '60 days')}</SelectItem>
                <SelectItem value="90">{t('admin.duration90days', '90 days')}</SelectItem>
                <SelectItem value="custom">{t('admin.durationCustom', 'Custom')}</SelectItem>
              </SelectContent>
            </Select>

            {selectedDuration === 'custom' && (
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  placeholder={t('admin.customDaysPlaceholder', 'e.g. 45')}
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">{t('admin.days', 'days')}</span>
              </div>
            )}

            {selectedDuration !== 'permanent' && (
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {t('admin.durationHint', 'Plan will revert to FREE after the period expires.')}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={disabled}>
            {isPending
              ? t('common.saving', 'Saving...')
              : confirmLabel ?? t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ChangePlanDialog;
