import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ShieldOff, X, Scale, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  useMentorStrikeStatus,
  useAcknowledgeStrike,
  useSubmitStrikeAppeal,
} from '@/hooks/useMentor';

/**
 * Warning banner surfaced to a mentor user whenever the admin team has issued
 * a disciplinary strike. Three visual modes:
 *   - critical → account globally banned (level 3+)
 *   - warning  → unacknowledged strike with active cooldown
 *   - info     → cooldown still running but the user already acknowledged
 *
 * Renders nothing when there is nothing to show, so it can be dropped on any
 * mentor dashboard surface without conditional logic in the parent.
 */
const MentorStrikeBanner: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { data: status } = useMentorStrikeStatus();
  const ack = useAcknowledgeStrike();
  const submitAppeal = useSubmitStrikeAppeal();
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealJustification, setAppealJustification] = useState('');

  if (!status) return null;

  const banned = status.accountBanned;
  const hasUnack = !!status.unacknowledgedStrikeId;
  const cooldownActive =
    status.cooldownUntil && new Date(status.cooldownUntil).getTime() > Date.now();

  if (!banned && !hasUnack && !cooldownActive) return null;

  const fmtDate = (iso: string | null | undefined): string => {
    if (!iso) return '';
    return new Intl.DateTimeFormat(i18n.language || 'fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  };

  const tone = banned
    ? {
        wrap: 'border-destructive/40 bg-destructive/10',
        icon: 'text-destructive',
        Icon: ShieldOff,
      }
    : hasUnack
      ? {
          wrap: 'border-amber-500/40 bg-amber-500/10',
          icon: 'text-amber-500',
          Icon: AlertTriangle,
        }
      : {
          wrap: 'border-border/60 bg-muted/30',
          icon: 'text-muted-foreground',
          Icon: AlertTriangle,
        };

  const title = banned
    ? t('mentor.strike.bannedTitle', 'Compte FollowUp Trading suspendu')
    : t('mentor.strike.warningTitle', 'Mentorship suspendu');

  const description = banned
    ? t(
        'mentor.strike.bannedDescription',
        'Votre compte est désormais bloqué suite à des infractions répétées. Contactez le support pour toute contestation.',
      )
    : t(
        'mentor.strike.warningDescription',
        'Votre mentorship a été suspendu par l\'équipe administrative.',
      );

  const reasonLine = status.unacknowledgedReason
    ? `${t('mentor.strike.reasonLabel', 'Motif')} : ${status.unacknowledgedReason}`
    : null;

  const cooldownLine = cooldownActive && !banned
    ? t('mentor.strike.cooldownLine', 'Vous pourrez créer un nouveau mentorship à partir du {{date}}.', {
        date: fmtDate(status.cooldownUntil),
      })
    : null;

  const escalationWarning =
    !banned && status.unacknowledgedLevel === 2
      ? t(
          'mentor.strike.lastChance',
          'Une nouvelle infraction entraînera la suspension complète de votre compte FollowUp Trading.',
        )
      : null;

  const canDismiss = hasUnack && !banned;
  const canAppeal = !!status.unacknowledgedStrikeId;

  return (
    <>
      <div
        className={[
          'rounded-xl border px-4 py-3 flex items-start gap-3',
          tone.wrap,
        ].join(' ')}
        role="alert"
      >
        <tone.Icon
          className={['h-5 w-5 shrink-0 mt-0.5', tone.icon].join(' ')}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          {reasonLine && (
            <p className="text-xs text-muted-foreground">{reasonLine}</p>
          )}
          {cooldownLine && (
            <p className="text-xs font-medium text-foreground/80">{cooldownLine}</p>
          )}
          {escalationWarning && (
            <p className="text-xs font-semibold text-destructive">
              {escalationWarning}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canAppeal && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 gap-1"
              onClick={() => setAppealOpen(true)}
            >
              <Scale className="h-3.5 w-3.5" />
              <span className="text-xs">
                {t('mentor.strike.appeal.action', 'Faire appel')}
              </span>
            </Button>
          )}
          {canDismiss && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => {
                if (status.unacknowledgedStrikeId) {
                  ack.mutate(status.unacknowledgedStrikeId);
                }
              }}
              disabled={ack.isPending}
              aria-label={t('mentor.strike.dismiss', "J'ai compris")}
            >
              <X className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline text-xs">
                {t('mentor.strike.dismiss', "J'ai compris")}
              </span>
            </Button>
          )}
        </div>
      </div>

      <Dialog open={appealOpen} onOpenChange={setAppealOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{t('mentor.strike.appeal.title', 'Soumettre un recours')}</DialogTitle>
            <DialogDescription>
              {t(
                'mentor.strike.appeal.description',
                "Article 20 du DSA : vous avez 14 jours après la notification pour contester. Trust & Safety reviendra vers vous sous 7 jours ouvrés.",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="appeal-justification">
              {t('mentor.strike.appeal.justification', 'Justification')} *
            </Label>
            <Textarea
              id="appeal-justification"
              value={appealJustification}
              onChange={(e) => setAppealJustification(e.target.value)}
              rows={6}
              placeholder={t(
                'mentor.strike.appeal.placeholder',
                "Expliquez en détail pourquoi cette suspension est injustifiée (minimum 20 caractères).",
              )}
              required
            />
            <p className="text-[11px] text-muted-foreground">
              {appealJustification.trim().length}/20 min
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setAppealOpen(false)}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button
              size="sm"
              disabled={
                appealJustification.trim().length < 20
                || submitAppeal.isPending
              }
              onClick={() => {
                if (!status.unacknowledgedStrikeId) return;
                submitAppeal.mutate(
                  {
                    strikeId: status.unacknowledgedStrikeId,
                    justification: appealJustification.trim(),
                  },
                  {
                    onSuccess: () => {
                      setAppealOpen(false);
                      setAppealJustification('');
                    },
                  },
                );
              }}
              className="gap-1.5"
            >
              {submitAppeal.isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              {t('mentor.strike.appeal.submit', 'Soumettre')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MentorStrikeBanner;
