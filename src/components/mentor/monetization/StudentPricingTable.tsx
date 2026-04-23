import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  useMentorStudents,
  useRemoveStudentPricing,
  useSetStudentPricing,
} from '@/hooks/useMentor';
import type { MentorPricingDto } from '@/types/dto';

interface Props {
  defaultPricing: MentorPricingDto | null | undefined;
  // Optional override map: studentUserId → override data
  overrides?: Map<string, { priceCents: number | null; waived: boolean }>;
}

const StudentPricingTable: React.FC<Props> = ({ defaultPricing, overrides }) => {
  const { t } = useTranslation();
  const { data: students, isLoading } = useMentorStudents();
  const setPricing = useSetStudentPricing();
  const removePricing = useRemoveStudentPricing();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftPrice, setDraftPrice] = useState<string>('0');
  const [draftWaived, setDraftWaived] = useState<boolean>(false);

  const currency = defaultPricing?.currency ?? 'USD';
  const currencySymbol: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };
  const sym = currencySymbol[currency] ?? '';

  const startEdit = (userId: string) => {
    const override = overrides?.get(userId);
    setEditingId(userId);
    setDraftWaived(override?.waived ?? false);
    setDraftPrice(
      override?.priceCents != null ? (override.priceCents / 100).toFixed(2) : ''
    );
  };

  const saveEdit = (userId: string) => {
    const parsed = Number.parseFloat(draftPrice);
    const payload: { priceCents?: number; waived?: boolean } = {
      waived: draftWaived,
    };
    if (!draftWaived && Number.isFinite(parsed) && parsed >= 0) {
      payload.priceCents = Math.round(parsed * 100);
    }
    setPricing.mutate(
      { studentUserId: userId, data: payload },
      { onSuccess: () => setEditingId(null) }
    );
  };

  const formatEffectivePrice = (userId: string): string => {
    const override = overrides?.get(userId);
    if (override?.waived) {
      return t('mentor.monetization.waived', 'Free (waived)');
    }
    const cents =
      override?.priceCents ?? defaultPricing?.defaultPriceCents ?? null;
    if (cents == null || cents === 0) {
      return t('mentor.monetization.free', 'Free');
    }
    return `${sym}${(cents / 100).toFixed(2)} / ${t(
      'mentor.monetization.month',
      'month'
    )}`;
  };

  if (isLoading) {
    return <div className="h-20 rounded-xl bg-muted/20 animate-pulse" />;
  }

  if (!students || students.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        {t(
          'mentor.monetization.noStudentsYet',
          'No students yet. Invite students to see per-student pricing.'
        )}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {students.map((s) => {
        const isEditing = editingId === s.studentUserId;
        const hasOverride = !!overrides?.get(s.studentUserId);
        return (
          <div
            key={s.studentUserId}
            className="rounded-xl border border-border/40 bg-muted/10 p-3 flex flex-col sm:flex-row sm:items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{s.username}</p>
              <p className="text-xs text-muted-foreground">
                {formatEffectivePrice(s.studentUserId)}
                {hasOverride && (
                  <span className="ml-2 inline-flex items-center text-[10px] uppercase tracking-wide text-primary">
                    {t('mentor.monetization.override', 'override')}
                  </span>
                )}
              </p>
            </div>

            {isEditing ? (
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`waive-${s.studentUserId}`}
                    checked={draftWaived}
                    onCheckedChange={setDraftWaived}
                  />
                  <Label
                    htmlFor={`waive-${s.studentUserId}`}
                    className="cursor-pointer text-sm"
                  >
                    {t('mentor.monetization.waive', 'Waive')}
                  </Label>
                </div>
                {!draftWaived && (
                  <div className="relative w-28">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">
                      {sym}
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      value={draftPrice}
                      onChange={(e) => setDraftPrice(e.target.value)}
                      className="pl-5 h-9"
                      aria-label={t(
                        'mentor.monetization.customPrice',
                        'Custom price'
                      )}
                    />
                  </div>
                )}
                <Button
                  size="sm"
                  onClick={() => saveEdit(s.studentUserId)}
                  disabled={setPricing.isPending}
                >
                  {setPricing.isPending && (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  )}
                  {t('common.save', 'Save')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(null)}
                  aria-label={t('common.cancel', 'Cancel')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => startEdit(s.studentUserId)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {hasOverride
                    ? t('mentor.monetization.editOverride', 'Edit')
                    : t('mentor.monetization.setCustom', 'Set custom')}
                </Button>
                {hasOverride && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removePricing.mutate(s.studentUserId)}
                    disabled={removePricing.isPending}
                  >
                    {t('mentor.monetization.reset', 'Reset')}
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StudentPricingTable;
