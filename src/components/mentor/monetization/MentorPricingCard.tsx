import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Loader2, Trash2 } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useDefaultPricing,
  useRemoveDefaultPricing,
  useSetDefaultPricing,
} from '@/hooks/useMentor';

interface Props {
  chargesEnabled: boolean;
}

const CURRENCIES = ['USD', 'EUR', 'GBP'] as const;

const MentorPricingCard: React.FC<Props> = ({ chargesEnabled }) => {
  const { t } = useTranslation();
  const { data: pricing, isLoading } = useDefaultPricing();
  const setPricing = useSetDefaultPricing();
  const removePricing = useRemoveDefaultPricing();

  const [currency, setCurrency] = useState<string>('USD');
  const [priceInput, setPriceInput] = useState<string>('0');
  const [confirmPaidOpen, setConfirmPaidOpen] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  useEffect(() => {
    if (pricing) {
      setCurrency(pricing.currency ?? 'USD');
      setPriceInput(
        pricing.defaultPriceCents != null
          ? (pricing.defaultPriceCents / 100).toFixed(2)
          : '0'
      );
    }
  }, [pricing]);

  const locked = !chargesEnabled;
  const parsedPrice = Number.parseFloat(priceInput);
  const validPrice = Number.isFinite(parsedPrice) && parsedPrice >= 0;
  const wasFree =
    pricing?.defaultPriceCents == null || pricing.defaultPriceCents === 0;
  const willBePaid = validPrice && parsedPrice > 0;

  const dirty =
    pricing
      ? (pricing.defaultPriceCents ?? 0) / 100 !== parsedPrice ||
        (pricing.currency ?? 'USD') !== currency
      : parsedPrice > 0;

  const handleSaveClick = () => {
    if (!validPrice) return;
    if (wasFree && willBePaid) {
      setConfirmPaidOpen(true);
      return;
    }
    doSave();
  };

  const doSave = () => {
    setPricing.mutate(
      {
        priceCents: Math.round(parsedPrice * 100),
        currency,
      },
      { onSuccess: () => setConfirmPaidOpen(false) }
    );
  };

  const doRemove = () => {
    removePricing.mutate(undefined, {
      onSuccess: () => setConfirmRemoveOpen(false),
    });
  };

  const currencySymbol: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };

  return (
    <div
      className={[
        'rounded-2xl border border-border/50 p-5 bg-muted/10',
        locked ? 'opacity-60 pointer-events-none select-none' : '',
      ].join(' ')}
      aria-disabled={locked}
    >
      <div className="flex items-center gap-2 mb-1">
        <DollarSign className="w-4 h-4 text-primary" aria-hidden="true" />
        <h3 className="text-base font-semibold">
          {t('mentor.monetization.defaultPricing', 'Default pricing')}
        </h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {t(
          'mentor.monetization.pricingHelper',
          'Charge per student per month. Set 0 for free. Platform takes a small fee (see Terms).'
        )}
      </p>

      {isLoading ? (
        <div className="h-24 bg-muted/20 rounded-xl animate-pulse" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3">
            <div className="space-y-2">
              <Label htmlFor="mentor-currency">
                {t('mentor.monetization.currency', 'Currency')}
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="mentor-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mentor-price">
                {t('mentor.monetization.monthlyPrice', 'Monthly price')}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                  {currencySymbol[currency] ?? ''}
                </span>
                <Input
                  id="mentor-price"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              onClick={handleSaveClick}
              disabled={
                !dirty ||
                !validPrice ||
                setPricing.isPending ||
                locked
              }
            >
              {setPricing.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('common.save', 'Save')}
            </Button>

            {pricing?.defaultPriceCents != null &&
              pricing.defaultPriceCents > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmRemoveOpen(true)}
                  disabled={removePricing.isPending || locked}
                  className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('mentor.monetization.removePricing', 'Remove pricing')}
                </Button>
              )}
          </div>
        </>
      )}

      <AlertDialog open={confirmPaidOpen} onOpenChange={setConfirmPaidOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                'mentor.monetization.goPaidTitle',
                'Switch to paid access?'
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'mentor.monetization.goPaidDesc',
                'Current students keep free access (grandfathered). New students must subscribe to join.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={doSave} disabled={setPricing.isPending}>
              {setPricing.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('mentor.monetization.confirmPaid', 'Enable paid access')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                'mentor.monetization.removePricingTitle',
                'Remove paid access?'
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'mentor.monetization.removePricingDesc',
                'Your space becomes free for everyone. Existing subscriptions will cancel at period end.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={doRemove}
              disabled={removePricing.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removePricing.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('mentor.monetization.removePricing', 'Remove pricing')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MentorPricingCard;
