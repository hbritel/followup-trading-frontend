import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { mentorService } from '@/services/mentor.service';
import type { DisclaimerType } from '@/types/dto';

const isEuTimezone = (): boolean => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz.startsWith('Europe/');
  } catch {
    return false;
  }
};

interface DisclaimerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  brandName: string;
}

interface CheckState {
  riskDisclosure: boolean;
  notAdvice: boolean;
  mentorTerms: boolean;
  coolingOff: boolean;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({
  open,
  onOpenChange,
  slug,
  brandName,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const euUser = isEuTimezone();

  const [checked, setChecked] = useState<CheckState>({
    riskDisclosure: false,
    notAdvice: false,
    mentorTerms: false,
    coolingOff: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const toggle = (key: keyof CheckState) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const allRequired =
    checked.riskDisclosure &&
    checked.notAdvice &&
    checked.mentorTerms &&
    (!euUser || checked.coolingOff);

  const handleSubmit = async () => {
    if (!allRequired || submitting) return;

    const types: DisclaimerType[] = [
      'RISK_DISCLOSURE',
      'NOT_FINANCIAL_ADVICE',
      'MENTOR_TERMS',
    ];
    if (euUser) types.push('COOLING_OFF_WAIVER_EU');

    setSubmitting(true);
    try {
      const ackRes = await mentorService.acknowledgeDisclaimer(slug, types);
      const checkoutRes = await mentorService.createPublicCheckout(
        slug,
        ackRes.acknowledgmentIds
      );
      window.location.href = checkoutRes.checkoutUrl;
    } catch {
      toast({
        title: t('common.error', 'Something went wrong'),
        description: t(
          'mentor.legal.disclaimerModal.checkoutError',
          'Could not start checkout. Please try again.'
        ),
        variant: 'destructive',
      });
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t('mentor.legal.disclaimerModal.title', 'Before you subscribe')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'mentor.legal.disclaimerModal.subtitle',
              'Please read and acknowledge each statement to continue.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* RISK_DISCLOSURE */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="disclaimer-risk"
              checked={checked.riskDisclosure}
              onCheckedChange={() => toggle('riskDisclosure')}
              disabled={submitting}
            />
            <Label
              htmlFor="disclaimer-risk"
              className="cursor-pointer text-sm leading-relaxed"
            >
              <Trans i18nKey="mentor.legal.disclaimerModal.risk">
                I acknowledge the <strong>risk of loss</strong> and that past
                performance is not a guarantee of future results.
              </Trans>
            </Label>
          </div>

          {/* NOT_FINANCIAL_ADVICE */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="disclaimer-advice"
              checked={checked.notAdvice}
              onCheckedChange={() => toggle('notAdvice')}
              disabled={submitting}
            />
            <Label
              htmlFor="disclaimer-advice"
              className="cursor-pointer text-sm leading-relaxed"
            >
              <Trans i18nKey="mentor.legal.disclaimerModal.notAdvice">
                I understand the mentor is an{' '}
                <strong>independent educator</strong>, not my financial adviser,
                and FollowUp Trading provides no investment advice.
              </Trans>
            </Label>
          </div>

          {/* MENTOR_TERMS */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="disclaimer-terms"
              checked={checked.mentorTerms}
              onCheckedChange={() => toggle('mentorTerms')}
              disabled={submitting}
            />
            <Label
              htmlFor="disclaimer-terms"
              className="cursor-pointer text-sm leading-relaxed"
            >
              <Trans i18nKey="mentor.legal.disclaimerModal.mentorTerms">
                I have read the <strong>mentor&apos;s terms</strong> (including
                cancellation policy).
              </Trans>
            </Label>
          </div>

          {/* COOLING_OFF_WAIVER_EU — only for EU users */}
          {euUser && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-300/40 bg-amber-50/60 p-3 dark:border-amber-600/30 dark:bg-amber-950/20">
              <Checkbox
                id="disclaimer-cooling"
                checked={checked.coolingOff}
                onCheckedChange={() => toggle('coolingOff')}
                disabled={submitting}
              />
              <Label
                htmlFor="disclaimer-cooling"
                className="cursor-pointer text-sm leading-relaxed"
              >
                <Trans i18nKey="mentor.legal.disclaimerModal.coolingOffWaiver">
                  I expressly request that my mentorship access begin
                  immediately and I{' '}
                  <strong>waive my 14-day right of withdrawal</strong> for any
                  portion already consumed.
                </Trans>
              </Label>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t('mentor.legal.disclaimerModal.cancelButton', 'Cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!allRequired || submitting}
          >
            {submitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {t(
              'mentor.legal.disclaimerModal.subscribeButton',
              'Subscribe to {{brand}}',
              { brand: brandName }
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisclaimerModal;
